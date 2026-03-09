// ============================================
// GigNearby - Worker App Logic
// ============================================

const app = {
    auth: new GigAuth('worker'),
    realtime: new GigRealtime(),
    currentView: 'dashboard',

    async init() {
        this.auth.onAuthChange = (user) => this.handleAuthChange(user);
        this.applyTranslations();

        window.addEventListener('hashchange', () => this.handleRoute());

        // Wait for auth to settle
        setTimeout(() => {
            if (!this.auth.isLoggedIn()) {
                this.showLogin();
            } else {
                this.handleRoute();
            }
        }, 100);
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        if (!this.auth.isLoggedIn()) {
            this.showLogin();
            return;
        }
        this.navigate(hash, false);
    },

    navigate(view, changeHash = true) {
        if (changeHash) window.location.hash = view;
        this.currentView = view;
        const container = document.getElementById('app-container');

        container.innerHTML = '';
        container.className = 'container animate-fade-in';

        if (view === 'dashboard') this.renderDashboard(container);
        else if (view === 'gigs') this.renderGigs(container);
        else if (view === 'profile') this.renderProfile(container);

        // Subscriptions
        this.realtime.unsubscribeAll();
        if (view === 'dashboard' || view === 'gigs') {
            this.realtime.subscribe('bookings', `worker_id=eq.${this.auth.getUser().id}`, () => {
                this.navigate(this.currentView, false); // re-render on new bookings
            });
        }
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
            if (this.currentView === 'login') this.navigate('dashboard');
        } else {
            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');
            authLinks.forEach(el => el.classList.add('hidden'));
            this.showLogin();
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
        if (this.auth.isLoggedIn()) this.navigate(this.currentView, false);
    },

    // ============================================
    // VIEWS
    // ============================================

    renderDashboard(container) {
        const user = this.auth.getUser();
        const wp = demoDB.get('worker_profiles').find(w => w.id === user.id) || {};
        const bookings = demoDB.get('bookings').filter(b => b.worker_id === user.id);

        const active = bookings.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status)).length;
        const totalEarnings = wp.total_earnings || 0;
        const rating = wp.avg_rating || 0;

        container.innerHTML = `
            <div class="flex justify-between items-center mb-8">
                <h2>${t('dashboard')}</h2>
                <div class="glass-panel" style="padding: 0.5rem 1rem; display:flex; align-items:center; gap:1rem">
                    <span>${t('available')}</span>
                    <label class="switch">
                        <input type="checkbox" id="avail-toggle" ${wp.availability === 'available' ? 'checked' : ''} onchange="app.toggleAvailability()">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>

            <div class="grid-cols-3 mb-8">
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-info">
                        <h3>${formatCurrency(totalEarnings)}</h3>
                        <p>${t('earnings')}</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📋</div>
                    <div class="stat-info">
                        <h3>${active}</h3>
                        <p>${t('active_bookings')}</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-info">
                        <h3>${rating.toFixed(1)}</h3>
                        <p>${t('rating')} (${wp.total_reviews})</p>
                    </div>
                </div>
            </div>

            <h3 class="mb-4">Recent Requests</h3>
            ${this.renderJobList(bookings.filter(b => b.status === 'pending').slice(0, 5))}
        `;
    },

    renderGigs(container) {
        const user = this.auth.getUser();
        let bookings = demoDB.get('bookings').filter(b => b.worker_id === user.id);
        bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        container.innerHTML = `
            <h2>${t('my_bookings')}</h2>
            <div class="mt-6">
                ${this.renderJobList(bookings)}
            </div>
        `;
    },

    renderJobList(bookings) {
        if (bookings.length === 0) return `<div class="glass-panel text-center py-8 text-muted">${t('no_results')}</div>`;

        const cats = demoDB.get('categories');
        const profiles = demoDB.get('profiles');

        return bookings.map(b => {
            const customer = profiles.find(p => p.id === b.customer_id) || { full_name: 'Customer' };
            const cat = cats.find(c => c.id === b.category_id) || {};
            const statusObj = BOOKING_STATUSES[b.status];

            return `
                <div class="glass-panel job-request status-${b.status} mb-4">
                    <div class="flex justify-between items-start flex-wrap gap-4">
                        <div>
                            <div class="flex items-center gap-2 mb-2">
                                <span class="status-badge" style="background: ${statusObj.color}20; color: ${statusObj.color}">
                                    ${statusObj.icon} ${currentLang === 'hi' ? statusObj.label_hi : statusObj.label}
                                </span>
                                <span class="text-muted text-sm">#${b.booking_number}</span>
                            </div>
                            <h3>${tCat(cat)} <span class="text-muted" style="font-weight:normal; font-size:1rem">- for ${customer.full_name}</span></h3>
                            <div class="text-muted mt-2" style="font-size: 0.95rem">
                                📅 ${formatDate(b.scheduled_date)} at ${formatTime(b.scheduled_time)} (${b.duration_hours} ${t('hours')})
                                <br>📍 ${b.service_address}, ${b.service_city}
                            </div>
                            ${b.notes ? `<div class="mt-2" style="font-size:0.9rem; background:var(--surface-2); padding:0.5rem; border-radius:var(--radius-sm)"><strong>Note:</strong> ${b.notes}</div>` : ''}
                        </div>
                        
                        <div class="text-right min-w-[150px]">
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--success)">
                                +${formatCurrency(b.worker_payout)}
                            </div>
                            <div class="text-muted text-sm">
                                ${t('total')}: ${formatCurrency(b.total_amount)}
                            </div>
                            
                            <div class="action-buttons justify-end">
                                ${b.status === 'pending' ? `
                                    <button class="btn btn-outline btn-sm" onclick="app.updateBookingStatus('${b.id}', 'cancelled')">${t('reject')}</button>
                                    <button class="btn btn-primary btn-sm" onclick="app.updateBookingStatus('${b.id}', 'confirmed')">${t('accept')}</button>
                                ` : b.status === 'confirmed' ? `
                                    <button class="btn btn-primary btn-sm" onclick="app.updateBookingStatus('${b.id}', 'in_progress')">${t('start_work')}</button>
                                ` : b.status === 'in_progress' ? `
                                    <button class="btn btn-primary btn-sm" style="background:var(--success)" onclick="app.updateBookingStatus('${b.id}', 'completed')">${t('complete')}</button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderProfile(container) {
        const user = this.auth.getUser();
        const wp = demoDB.get('worker_profiles').find(w => w.id === user.id) || {};

        container.innerHTML = `
            <h2>${t('profile')} & ${t('settings')}</h2>
            <div class="grid-cols-3 mt-6">
                <div class="glass-panel" style="grid-column: span 2">
                    <div class="form-group">
                        <label class="form-label">${t('full_name')}</label>
                        <input type="text" id="prof-name" class="form-control" value="${user.full_name}">
                    </div>
                    <div class="flex gap-4">
                        <div class="form-group flex-1">
                            <label class="form-label">${t('hourly_rate')} (₹)</label>
                            <input type="number" id="prof-hr-rate" class="form-control" value="${wp.hourly_rate}">
                        </div>
                        <div class="form-group flex-1">
                            <label class="form-label">${t('monthly_rate')} (₹)</label>
                            <input type="number" id="prof-mo-rate" class="form-control" value="${wp.monthly_rate}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t('about')} (English)</label>
                        <textarea id="prof-bio" class="form-control" rows="3">${wp.bio || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t('about')} (Hindi)</label>
                        <textarea id="prof-bio-hi" class="form-control" rows="3">${wp.bio_hi || ''}</textarea>
                    </div>
                    <button class="btn btn-primary mt-4" onclick="app.saveProfile()">${t('settings')}</button>
                </div>
                
                <div class="glass-panel">
                    <h3 class="mb-4">Profile Photo</h3>
                    <img src="${user.avatar_url}" style="width:100%; max-width:200px; border-radius:var(--radius-md); display:block; margin:0 auto 1rem">
                    <button class="btn btn-outline w-full" disabled>Change Photo</button>
                    <p class="text-sm text-muted text-center mt-2">Coming soon in production</p>
                </div>
            </div>
        `;
    },

    // ============================================
    // ACTIONS
    // ============================================

    updateBookingStatus(id, status) {
        demoDB.updateItem('bookings', id, { status });

        // If completed, update worker stats
        if (status === 'completed') {
            const b = demoDB.get('bookings').find(x => x.id === id);
            const user = this.auth.getUser();
            const wp = demoDB.get('worker_profiles').find(w => w.id === user.id);
            wp.total_jobs += 1;
            wp.total_earnings += b.worker_payout;
            demoDB.updateItem('worker_profiles', user.id, wp);
        }

        this.navigate(this.currentView, false);
    },

    toggleAvailability() {
        const isAvail = document.getElementById('avail-toggle').checked;
        const user = this.auth.getUser();
        demoDB.updateItem('worker_profiles', user.id, {
            availability: isAvail ? 'available' : 'busy'
        });
    },

    saveProfile() {
        const user = this.auth.getUser();
        demoDB.updateItem('profiles', user.id, {
            full_name: document.getElementById('prof-name').value
        });
        demoDB.updateItem('worker_profiles', user.id, {
            hourly_rate: parseFloat(document.getElementById('prof-hr-rate').value),
            monthly_rate: parseFloat(document.getElementById('prof-mo-rate').value),
            bio: document.getElementById('prof-bio').value,
            bio_hi: document.getElementById('prof-bio-hi').value
        });
        user.full_name = document.getElementById('prof-name').value;
        localStorage.setItem('gn_current_user', JSON.stringify(user));
        this.updateHeader();
        alert('Profile updated');
    },

    openModal(id) { document.getElementById(id).classList.add('active'); },
    closeModal(id) { document.getElementById(id).classList.remove('active'); },

    showLogin() {
        const body = document.getElementById('auth-modal-body');
        body.innerHTML = `
            <h2 class="text-center mb-6">${t('login')} (Worker)</h2>
            <div class="form-group">
                <label class="form-label">${t('email')}</label>
                <input type="email" id="login-email" class="form-control" value="rajesh.kumar@demo.com">
                <small class="text-muted">(Demo accounts: rajesh.kumar@demo.com, amit.sharma@demo.com)</small>
            </div>
            <div class="form-group mb-6">
                <label class="form-label">${t('password')}</label>
                <input type="password" id="login-pass" class="form-control" value="password123">
            </div>
            <button class="btn btn-primary w-full" onclick="app.doLogin()">${t('login')}</button>
            <p class="text-center mt-4 text-muted" style="font-size:0.9rem">
                ${t('signup')} as worker? <a href="#" onclick="app.showSignup(); return false;" style="color:var(--primary)">${t('register_worker')}</a>
            </p>
        `;
        this.openModal('auth-modal');
    },

    showSignup() {
        const body = document.getElementById('auth-modal-body');
        body.innerHTML = `
            <h2 class="text-center mb-6">${t('register_worker')}</h2>
            <div class="form-group">
                <input type="text" id="reg-name" class="form-control" placeholder="${t('full_name')}">
            </div>
            <div class="form-group">
                <input type="email" id="reg-email" class="form-control" placeholder="${t('email')}">
            </div>
            <div class="form-group">
                <input type="text" id="reg-phone" class="form-control" placeholder="${t('phone')}">
            </div>
            <div class="form-group mb-6">
                <input type="password" id="reg-pass" class="form-control" placeholder="${t('password')}">
            </div>
            <button class="btn btn-secondary w-full" onclick="app.doSignup()">${t('signup')}</button>
            <p class="text-center mt-4 text-muted" style="font-size:0.9rem">
                Already registered? <a href="#" onclick="app.showLogin(); return false;" style="color:var(--primary)">${t('login')}</a>
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
            alert("Account created! Please update your services in Profile.");
        } catch (e) { alert(e.message); }
    },

    logout() { this.auth.logout(); },
    updateHeader() { document.getElementById('user-name').textContent = this.auth.getUser()?.full_name.split(' ')[0] || 'Worker'; }
};

window.onload = () => app.init();
