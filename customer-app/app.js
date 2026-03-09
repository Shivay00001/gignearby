// ============================================
// GigNearby - Customer App Logic
// ============================================

const app = {
    auth: new GigAuth('customer'),
    realtime: new GigRealtime(),
    currentView: 'home',
    workers: [],
    categories: [...CATEGORIES],

    async init() {
        this.auth.onAuthChange = (user) => this.handleAuthChange(user);
        this.updateHeader();
        this.applyTranslations();

        // Handle hash routing
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();

        // Load data if available
        if (DEMO_MODE) {
            this.workers = demoDB.query('profiles', { role: 'worker', is_banned: false });
        } else {
            // Load from Supabase in real app
            const sb = getSupabase();
            if (sb) {
                const { data } = await sb.from('profiles').select('*, worker_profiles(*)').eq('role', 'worker');
                if (data) this.workers = data;
            }
        }
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        this.navigate(hash, false);
    },

    navigate(view, changeHash = true) {
        if (changeHash) window.location.hash = view;
        this.currentView = view;
        const container = document.getElementById('app-container');

        // Check auth for protected routes
        if (view === 'bookings' && !this.auth.isLoggedIn()) {
            this.showLogin();
            return;
        }

        container.innerHTML = '';
        container.className = 'container animate-fade-in';

        if (view === 'home') this.renderHome(container);
        else if (view === 'browse') this.renderBrowse(container);
        else if (view === 'bookings') this.renderBookings(container);
    },

    handleAuthChange(user) {
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const authLinks = document.querySelectorAll('.auth-only');

        if (user) {
            authButtons.classList.add('hidden');
            userMenu.classList.remove('hidden');
            authLinks.forEach(el => el.classList.remove('hidden'));
            document.getElementById('user-name').textContent = user.full_name.split(' ')[0];
            document.getElementById('user-avatar').src = user.avatar_url || 'https://via.placeholder.com/150';
            this.closeModal('auth-modal');
        } else {
            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');
            authLinks.forEach(el => el.classList.add('hidden'));
            if (this.currentView === 'bookings') this.navigate('home');
        }
    },

    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (LANG[currentLang] && LANG[currentLang][key]) {
                if (el.tagName === 'INPUT' && el.type === 'text') {
                    el.placeholder = LANG[currentLang][key];
                } else {
                    el.textContent = LANG[currentLang][key];
                }
            }
        });
    },

    toggleLanguage() {
        setLanguage(currentLang === 'en' ? 'hi' : 'en');
        this.applyTranslations();
        this.navigate(this.currentView, false); // re-render current view
    },

    // ============================================
    // VIEWS
    // ============================================

    renderHome(container) {
        container.classList.remove('container'); // Hero is full width
        container.innerHTML = `
            <section class="hero">
                <h1>${t('platform_name')}</h1>
                <p>${t('tagline')}</p>
                <div class="search-box">
                    <input type="text" id="home-search" placeholder="${t('search_placeholder')}" onkeypress="if(event.key === 'Enter') app.doSearch(this.value)">
                    <button class="btn btn-primary" onclick="app.doSearch(document.getElementById('home-search').value)">🔍</button>
                </div>

                <h3 class="mt-8">${t('categories')}</h3>
                <div class="category-grid container">
                    ${this.categories.slice(0, 12).map((c, i) => `
                        <a href="#browse" class="category-card" onclick="app.setCategoryFilter('cat-${i + 1}')">
                            <span class="cat-icon">${c.icon}</span>
                            <span class="cat-name">${tCat(c)}</span>
                        </a>
                    `).join('')}
                </div>
            </section>

            <section class="container mt-8">
                <h2 class="text-center mb-8">${t('how_it_works')}</h2>
                <div class="grid-cols-3">
                    <div class="glass-panel text-center">
                        <div class="cat-icon">📱</div>
                        <h3>1. ${t('step1_title')}</h3>
                        <p>${t('step1_desc')}</p>
                    </div>
                    <div class="glass-panel text-center">
                        <div class="cat-icon">🤝</div>
                        <h3>2. ${t('step2_title')}</h3>
                        <p>${t('step2_desc')}</p>
                    </div>
                    <div class="glass-panel text-center">
                        <div class="cat-icon">💳</div>
                        <h3>3. ${t('step3_title')}</h3>
                        <p>${t('step3_desc')}</p>
                    </div>
                </div>
            </section>
        `;
    },

    activeCategoryFilter: null,
    searchQuery: '',

    setCategoryFilter(id) {
        this.activeCategoryFilter = id;
    },

    doSearch(query) {
        this.searchQuery = query;
        this.navigate('browse');
    },

    renderBrowse(container) {
        // Fetch worker profiles
        let wpData = demoDB.get('worker_profiles');
        let profiles = demoDB.query('profiles', { role: 'worker', is_banned: false });
        let cats = demoDB.get('worker_categories');
        let skills = demoDB.get('worker_skills');

        // Merge data
        let displayWorkers = profiles.map(p => {
            const wp = wpData.find(w => w.id === p.id) || {};
            const workerCats = cats.filter(c => c.worker_id === p.id).map(c => c.category_id);
            const workerSkills = skills.filter(s => s.worker_id === p.id).map(s => s.skill_name);
            return { ...p, ...wp, categories: workerCats, skills: workerSkills };
        });

        // Apply filters
        if (this.activeCategoryFilter) {
            displayWorkers = displayWorkers.filter(w => w.categories.includes(this.activeCategoryFilter));
        }
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            displayWorkers = displayWorkers.filter(w =>
                w.full_name.toLowerCase().includes(q) ||
                w.skills.some(s => s.toLowerCase().includes(q)) ||
                w.bio?.toLowerCase().includes(q)
            );
        }

        // Calculate distance if customer logged in
        if (this.auth.isLoggedIn()) {
            const user = this.auth.getUser();
            displayWorkers.forEach(w => {
                w.distance_km = calculateDistance(user.latitude, user.longitude, w.latitude, w.longitude);
            });
            displayWorkers.sort((a, b) => a.distance_km - b.distance_km);
        }

        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2>${t('browse_workers')}</h2>
                <div class="flex gap-4">
                    <select class="form-control" style="width: 200px" onchange="app.setCategoryFilter(this.value); app.renderBrowse(document.getElementById('app-container'))">
                        <option value="">${t('all_categories')}</option>
                        ${this.categories.map((c, i) => `
                            <option value="cat-${i + 1}" ${this.activeCategoryFilter === `cat-${i + 1}` ? 'selected' : ''}>
                                ${c.icon} ${tCat(c)}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>

            ${displayWorkers.length === 0 ? `<div class="glass-panel text-center py-12"><h3>${t('no_results')}</h3></div>` : ''}

            <div class="grid-cols-3">
                ${displayWorkers.map(w => `
                    <div class="glass-panel worker-card">
                        <div class="worker-header">
                            <img src="${w.avatar_url}" class="worker-avatar" alt="${w.full_name}">
                            <div class="worker-info flex-1">
                                <div class="worker-name">${w.full_name}</div>
                                <div class="worker-rating">
                                    ${getStarRating(w.avg_rating || 0)} (${w.total_reviews} ${t('reviews')})
                                </div>
                                ${w.distance_km ? `<div class="text-muted" style="font-size: 0.8rem">📍 ${w.distance_km.toFixed(1)} ${t('km')} away</div>` : ''}
                            </div>
                        </div>
                        <p style="font-size: 0.9rem; flex: 1">${currentLang === 'hi' && w.bio_hi ? w.bio_hi : (w.bio || '')}</p>
                        <div class="worker-skills">
                            ${w.skills.slice(0, 3).map(s => `<span class="badge">${s}</span>`).join('')}
                            ${w.skills.length > 3 ? `<span class="badge">+${w.skills.length - 3}</span>` : ''}
                        </div>
                        <div class="worker-price">
                            <div>
                                <span class="price-tag">${formatCurrency(w.hourly_rate)}</span><span class="text-muted">${t('per_hour')}</span>
                            </div>
                            <button class="btn btn-primary btn-sm" onclick="app.openWorkerProfile('${w.id}')">${t('view_profile')}</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderBookings(container) {
        const user = this.auth.getUser();
        let bookings = demoDB.get('bookings').filter(b => b.customer_id === user.id);
        const profiles = demoDB.get('profiles');
        const cats = demoDB.get('categories');

        // Sort by date desc
        bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        container.innerHTML = `
            <h2>${t('my_bookings')}</h2>
            <div class="mt-6" style="display: flex; flex-direction: column; gap: 1.5rem">
                ${bookings.length === 0 ? `<div class="glass-panel text-center">${t('no_results')}</div>` : ''}
                
                ${bookings.map(b => {
            const worker = profiles.find(p => p.id === b.worker_id) || {};
            const cat = cats.find(c => c.id === b.category_id) || {};
            const statusObj = BOOKING_STATUSES[b.status];

            return `
                        <div class="glass-panel" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem">
                            <div style="flex: 1; min-width: 250px">
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="status-badge" style="background: ${statusObj.color}20; color: ${statusObj.color}">
                                        ${statusObj.icon} ${currentLang === 'hi' ? statusObj.label_hi : statusObj.label}
                                    </span>
                                    <span class="text-muted text-sm">#${b.booking_number}</span>
                                </div>
                                <h3 style="margin-bottom: 0.2rem">${worker.full_name} <span class="text-muted" style="font-size:1rem; font-weight:normal">- ${tCat(cat)}</span></h3>
                                <div class="text-muted" style="font-size: 0.9rem">
                                    📅 ${formatDate(b.scheduled_date)} at ${formatTime(b.scheduled_time)}
                                    <br>📍 ${b.service_address}, ${b.service_city}
                                </div>
                            </div>
                            <div class="text-right">
                                <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent); margin-bottom: 0.5rem">
                                    ${formatCurrency(b.total_amount)}
                                </div>
                                ${b.status === 'completed' ? `
                                    <button class="btn btn-outline btn-sm" onclick="app.rateWorker('${b.id}')">${t('rate_worker')}</button>
                                ` : b.status === 'pending' ? `
                                    <button class="btn btn-outline btn-sm" style="color: var(--error); border-color: var(--error)" onclick="app.cancelBooking('${b.id}')">${t('cancel')}</button>
                                ` : ''}
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    // ============================================
    // MODALS & ACTIONS
    // ============================================

    openModal(id) {
        document.getElementById(id).classList.add('active');
    },

    closeModal(id) {
        document.getElementById(id).classList.remove('active');
    },

    showLogin() {
        const body = document.getElementById('auth-modal-body');
        body.innerHTML = `
            <h2 class="text-center mb-6">${t('login')}</h2>
            <div class="form-group">
                <label class="form-label">${t('email')}</label>
                <input type="email" id="login-email" class="form-control" value="customer@demo.com">
            </div>
            <div class="form-group mb-6">
                <label class="form-label">${t('password')}</label>
                <input type="password" id="login-pass" class="form-control" value="password123">
            </div>
            <button class="btn btn-primary w-full" onclick="app.doLogin()">${t('login')}</button>
            <p class="text-center mt-4 text-muted" style="font-size:0.9rem">
                Don't have an account? <a href="#" onclick="app.showSignup(); return false;" style="color:var(--primary)">${t('signup')}</a>
            </p>
        `;
        this.openModal('auth-modal');
    },

    showSignup() {
        const body = document.getElementById('auth-modal-body');
        body.innerHTML = `
            <h2 class="text-center mb-6">${t('signup')}</h2>
            <div class="form-group">
                <label class="form-label">${t('full_name')}</label>
                <input type="text" id="reg-name" class="form-control">
            </div>
            <div class="form-group">
                <label class="form-label">${t('email')}</label>
                <input type="email" id="reg-email" class="form-control">
            </div>
            <div class="form-group">
                <label class="form-label">${t('phone')}</label>
                <input type="text" id="reg-phone" class="form-control">
            </div>
            <div class="form-group mb-6">
                <label class="form-label">${t('password')}</label>
                <input type="password" id="reg-pass" class="form-control">
            </div>
            <button class="btn btn-primary w-full" onclick="app.doSignup()">${t('signup')}</button>
            <p class="text-center mt-4 text-muted" style="font-size:0.9rem">
                Already have an account? <a href="#" onclick="app.showLogin(); return false;" style="color:var(--primary)">${t('login')}</a>
            </p>
        `;
        this.openModal('auth-modal');
    },

    async doLogin() {
        try {
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;
            await this.auth.login(email, pass);
        } catch (e) { alert(e.message); }
    },

    async doSignup() {
        try {
            await this.auth.signup({
                full_name: document.getElementById('reg-name').value,
                email: document.getElementById('reg-email').value,
                phone: document.getElementById('reg-phone').value,
                password: document.getElementById('reg-pass').value
            });
        } catch (e) { alert(e.message); }
    },

    logout() {
        this.auth.logout();
    },

    openWorkerProfile(workerId) {
        const p = demoDB.get('profiles').find(u => u.id === workerId);
        const wp = demoDB.get('worker_profiles').find(u => u.id === workerId);
        const cats = demoDB.get('worker_categories').filter(c => c.worker_id === workerId);
        const skills = demoDB.get('worker_skills').filter(s => s.worker_id === workerId);

        let primaryCat = cats[0] ? CATEGORIES[parseInt(cats[0].category_id.split('-')[1]) - 1] : null;

        const body = document.getElementById('worker-modal-body');
        body.innerHTML = `
            <div style="display:flex; gap: 2rem; flex-wrap: wrap">
                <div style="flex: 1; min-width: 250px">
                    <div style="text-align:center; margin-bottom: 2rem">
                        <img src="${p.avatar_url}" style="width:120px; height:120px; border-radius:50%; border:3px solid var(--primary); margin-bottom:1rem">
                        <h2>${p.full_name}</h2>
                        <div style="color:var(--warning); font-size:1.2rem">${getStarRating(wp.avg_rating)} (${wp.total_reviews})</div>
                        <div class="text-muted mt-2">📍 ${p.city}</div>
                    </div>
                    
                    <div class="glass-panel mb-4">
                        <h4>${t('about')}</h4>
                        <p>${currentLang === 'hi' && wp.bio_hi ? wp.bio_hi : wp.bio}</p>
                        <div class="mt-4">
                            <strong>${t('experience')}:</strong> ${wp.experience_years} ${t('years')} <br>
                            <strong>${t('jobs_done')}:</strong> ${wp.total_jobs}
                        </div>
                    </div>

                    <div class="glass-panel">
                        <h4>${t('skills')}</h4>
                        <div class="worker-skills">
                            ${skills.map(s => `<span class="badge">${s.skill_name}</span>`).join('')}
                        </div>
                    </div>
                </div>

                <div style="flex: 1; min-width: 300px">
                    <div class="glass-panel" style="background: var(--surface-2)">
                        <h3 class="mb-4 text-gradient">${t('schedule_booking')}</h3>
                        
                        <div class="form-group">
                            <label class="form-label">${t('category')}</label>
                            <select id="book-cat" class="form-control" onchange="app.updateBookingCalc(${wp.hourly_rate}, ${wp.monthly_rate})">
                                ${cats.map(c => {
            const catDetails = CATEGORIES[parseInt(c.category_id.split('-')[1]) - 1];
            return `<option value="${c.category_id}" data-comm="${catDetails.commission_rate}">${tCat(catDetails)}</option>`;
        }).join('')}
                            </select>
                        </div>

                        <div style="display:flex; gap:1rem">
                            <div class="form-group" style="flex:1">
                                <label class="form-label">${t('booking_date')}</label>
                                <input type="date" id="book-date" class="form-control" min="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group" style="flex:1">
                                <label class="form-label">${t('booking_time')}</label>
                                <input type="time" id="book-time" class="form-control">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">${t('duration')} (${t('hours')})</label>
                            <input type="number" id="book-duration" class="form-control" value="2" min="1" onchange="app.updateBookingCalc(${wp.hourly_rate}, ${wp.monthly_rate})">
                        </div>

                        <div class="form-group">
                            <label class="form-label">${t('address')}</label>
                            <input type="text" id="book-address" class="form-control" value="${this.auth.isLoggedIn() ? this.auth.getUser().city : ''}">
                        </div>

                        <div class="form-group">
                            <label class="form-label">${t('notes')}</label>
                            <textarea id="book-notes" class="form-control" rows="2"></textarea>
                        </div>

                        <div style="background:var(--surface-1); padding:1rem; border-radius:var(--radius-md); margin: 1.5rem 0">
                            <div class="flex justify-between mb-2">
                                <span>${t('rate_worker')}</span>
                                <span>${formatCurrency(wp.hourly_rate)}/hr</span>
                            </div>
                            <div class="flex justify-between font-weight:bold" style="font-size:1.2rem; color:var(--accent); border-top:1px solid var(--border); padding-top:0.5rem">
                                <span>${t('total')}</span>
                                <span id="book-total">${formatCurrency(wp.hourly_rate * 2)}</span>
                            </div>
                        </div>

                        <button class="btn btn-primary w-full btn-lg" onclick="app.submitBooking('${workerId}', ${wp.hourly_rate})">${t('confirm_booking')}</button>
                    </div>
                </div>
            </div>
        `;
        this.openModal('worker-modal');
        // timeout to set defaults
        setTimeout(() => {
            if (document.getElementById('book-date')) {
                document.getElementById('book-date').valueAsDate = new Date();
                document.getElementById('book-time').value = "10:00";
                this.updateBookingCalc(wp.hourly_rate, wp.monthly_rate);
            }
        }, 100);
    },

    updateBookingCalc(hourlyRate) {
        const duration = parseInt(document.getElementById('book-duration').value) || 0;
        const total = hourlyRate * duration;
        document.getElementById('book-total').textContent = formatCurrency(total);
    },

    submitBooking(workerId, hourlyRate) {
        if (!this.auth.isLoggedIn()) {
            this.closeModal('worker-modal');
            this.showLogin();
            return;
        }

        const catSelect = document.getElementById('book-cat');
        const catId = catSelect.value;
        const commRate = parseFloat(catSelect.options[catSelect.selectedIndex].getAttribute('data-comm'));
        const date = document.getElementById('book-date').value;
        const time = document.getElementById('book-time').value;
        const hours = parseInt(document.getElementById('book-duration').value);
        const subtotal = hourlyRate * hours;
        const commission = Math.round(subtotal * (commRate / 100));

        if (!date || !time || !hours) {
            alert("Please fill all booking details"); return;
        }

        const booking = {
            id: `booking-${crypto.randomUUID()}`,
            booking_number: `GN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000) + 1000}`,
            customer_id: this.auth.getUser().id,
            worker_id: workerId,
            category_id: catId,
            status: 'pending',
            booking_type: 'hourly',
            scheduled_date: date,
            scheduled_time: time,
            duration_hours: hours,
            rate_per_unit: hourlyRate,
            subtotal: subtotal,
            commission_rate: commRate,
            commission_amount: commission,
            total_amount: subtotal,
            worker_payout: subtotal - commission,
            service_address: document.getElementById('book-address').value,
            service_city: this.auth.getUser().city,
            notes: document.getElementById('book-notes').value,
            created_at: new Date().toISOString()
        };

        const bookings = demoDB.get('bookings');
        bookings.push(booking);
        demoDB.set('bookings', bookings);

        this.closeModal('worker-modal');
        alert(t('booking_success'));
        this.navigate('bookings');
    },

    cancelBooking(id) {
        if (confirm("Are you sure you want to cancel this booking?")) {
            demoDB.updateItem('bookings', id, { status: 'cancelled' });
            this.renderBookings(document.getElementById('app-container'));
        }
    },

    rateWorker(bookingId) {
        alert("Rating system will open here. (Implemented in backend SQL already)");
    },

    updateHeader() {
        document.getElementById('nav-brand-text').textContent = t('platform_name');
    }
};

window.onload = () => app.init();
