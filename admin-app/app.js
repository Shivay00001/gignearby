// ============================================
// GigNearby - Admin App Logic
// ============================================

const app = {
    auth: new GigAuth('admin'),
    realtime: new GigRealtime(),
    currentView: 'dashboard',

    async init() {
        this.auth.onAuthChange = (user) => this.handleAuthChange(user);

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
        else if (view === 'bookings') this.renderBookings(container);
        else if (view === 'users') this.renderUsers(container);
        else if (view === 'settings') this.renderSettings(container);

        // Subscriptions
        this.realtime.unsubscribeAll();
        if (view === 'dashboard' || view === 'bookings') {
            this.realtime.subscribe('bookings', null, () => {
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
            document.getElementById('user-name').textContent = user.full_name;
            document.getElementById('user-avatar').src = user.avatar_url;
            this.closeModal('auth-modal');
            if (this.currentView === 'login') this.navigate('dashboard');
        } else {
            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');
            authLinks.forEach(el => el.classList.add('hidden'));
            this.showLogin();
        }
    },

    // ============================================
    // VIEWS
    // ============================================

    renderDashboard(container) {
        const bookings = demoDB.get('bookings');
        const profiles = demoDB.get('profiles');

        const workers = profiles.filter(p => p.role === 'worker').length;
        const customers = profiles.filter(p => p.role === 'customer').length;
        const activeBookings = bookings.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status)).length;

        const totalRevenue = bookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (b.commission_amount || 0), 0);

        const totalGmv = bookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (b.total_amount || 0), 0);

        container.innerHTML = `
            <div class="flex justify-between items-center mb-8">
                <h2>Platform Dashboard</h2>
                <div class="text-muted">Live Update 🟢</div>
            </div>

            <div class="grid-cols-3 mb-8">
                <div class="stat-card" style="border-color: var(--secondary)">
                    <div class="stat-icon">💎</div>
                    <div class="stat-info">
                        <h3 class="text-secondary">${formatCurrency(totalRevenue)}</h3>
                        <p>Total Revenue (Commission)</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📈</div>
                    <div class="stat-info">
                        <h3>${formatCurrency(totalGmv)}</h3>
                        <p>Gross Merchandise Value</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📋</div>
                    <div class="stat-info">
                        <h3>${activeBookings}</h3>
                        <p>Active Bookings</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-info">
                        <h3>${customers}</h3>
                        <p>Total Customers</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🔧</div>
                    <div class="stat-info">
                        <h3>${workers}</h3>
                        <p>Total Workers</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">✅</div>
                    <div class="stat-info">
                        <h3>${bookings.filter(b => b.status === 'completed').length}</h3>
                        <p>Completed Jobs</p>
                    </div>
                </div>
            </div>

            <h3 class="mb-4">Recent Bookings Feed</h3>
            ${this.renderBookingsTable(bookings.slice(-8).reverse())}
        `;
    },

    renderBookings(container) {
        const bookings = demoDB.get('bookings').reverse();
        container.innerHTML = `
            <h2>All Bookings</h2>
            <div class="mt-6">
                ${this.renderBookingsTable(bookings)}
            </div>
        `;
    },

    renderBookingsTable(bookings) {
        if (bookings.length === 0) return `<div class="glass-panel text-center py-8 text-muted">No bookings yet</div>`;

        const profiles = demoDB.get('profiles');

        return `
            <div class="glass-panel" style="overflow-x: auto; padding: 0.5rem">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Booking ID</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Worker</th>
                            <th>Amount</th>
                            <th>Commission</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bookings.map(b => {
            const customer = profiles.find(p => p.id === b.customer_id) || { full_name: 'Unknown' };
            const worker = profiles.find(p => p.id === b.worker_id) || { full_name: 'Unknown' };
            const status = BOOKING_STATUSES[b.status];

            return `
                                <tr>
                                    <td style="font-family: monospace">${b.booking_number}</td>
                                    <td>${formatDate(b.created_at)}</td>
                                    <td>${customer.full_name}</td>
                                    <td>${worker.full_name}</td>
                                    <td>${formatCurrency(b.total_amount)}</td>
                                    <td class="text-secondary">${formatCurrency(b.commission_amount)} (${b.commission_rate}%)</td>
                                    <td>
                                        <span class="status-badge" style="background: ${status.color}20; color: ${status.color}; padding: 0.2rem 0.6rem">
                                            ${status.label}
                                        </span>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderUsers(container) {
        const profiles = demoDB.get('profiles').reverse();

        container.innerHTML = `
            <h2>User Management</h2>
            <div class="mt-6 glass-panel" style="overflow-x: auto; padding: 0.5rem">
                <table class="table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>City</th>
                            <th>Joined</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${profiles.map(p => `
                            <tr>
                                <td>
                                    <div class="flex items-center gap-2">
                                        <img src="${p.avatar_url}" style="width:30px; border-radius:50%">
                                        <div>
                                            <div>${p.full_name}</div>
                                            <div class="text-sm text-muted">${p.phone || p.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge" style="background: ${p.role === 'admin' ? 'var(--secondary)' : p.role === 'worker' ? 'var(--primary)' : 'var(--surface-2)'}; color:white">
                                        ${p.role.toUpperCase()}
                                    </span>
                                </td>
                                <td>${p.city || '-'}</td>
                                <td>${formatDate(p.created_at)}</td>
                                <td>
                                    ${p.is_banned ?
                '<span style="color:var(--error)">Banned</span>' :
                '<span style="color:var(--success)">Active</span>'
            }
                                </td>
                                <td>
                                    ${p.role !== 'admin' ?
                `<button class="btn btn-outline btn-sm" onclick="app.toggleBan('${p.id}', ${!p.is_banned})">
                                            ${p.is_banned ? 'Unban' : 'Ban'}
                                        </button>` : '-'
            }
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderSettings(container) {
        container.innerHTML = `
            <h2>Platform Settings</h2>
            <div class="grid-cols-3 mt-6">
                <div class="glass-panel" style="grid-column: span 2">
                    <h3 class="mb-4">Commission Rates (%)</h3>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem">
                        ${CATEGORIES.map((c, i) => `
                            <div class="form-group flex items-center justify-between" style="background:var(--surface-2); padding: 0.5rem 1rem; border-radius:var(--radius-sm)">
                                <label style="margin:0">${c.icon} ${c.name}</label>
                                <input type="number" class="form-control" style="width:80px; text-align:right" value="${c.commission_rate}" disabled>
                            </div>
                        `).join('');
    }
                    </div >
    <div class="mt-4 text-muted text-sm">* Commission rates are currently hardcoded in constants.js for demo.</div>
                </div >

    <div class="glass-panel">
        <h3 class="mb-4">Database Tools</h3>
        <button class="btn btn-outline w-full mb-4" onclick="app.resetDemoData()" style="color:var(--error); border-color:var(--error)">
            ⚠️ Reset Demo Database
        </button>
        <p class="text-sm text-muted">This will erase all current local changes and re-seed the mock database with initial data.</p>
    </div>
            </div >
    `;
    },

    // ============================================
    // ACTIONS
    // ============================================

    toggleBan(userId, banStatus) {
        demoDB.updateItem('profiles', userId, { is_banned: banStatus });
        this.renderUsers(document.getElementById('app-container'));
    },

    resetDemoData() {
        if (confirm("Are you sure? This will delete all mock bookings and users!")) {
            demoDB.resetData();
            window.location.reload();
        }
    },

    openModal(id) { document.getElementById(id).classList.add('active'); },
    closeModal(id) { document.getElementById(id).classList.remove('active'); },

    showLogin() {
        const body = document.getElementById('auth-modal-body');
        body.innerHTML = `
    < h2 class="text-center mb-6 text-secondary" > Admin Login</h2 >
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="login-email" class="form-control" value="admin@gignearby.com">
            </div>
            <div class="form-group mb-6">
                <label class="form-label">Password</label>
                <input type="password" id="login-pass" class="form-control" value="admin123">
            </div>
            <button class="btn btn-secondary w-full" onclick="app.doLogin()">Dashboard Login</button>
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

    logout() { this.auth.logout(); }
};

window.onload = () => app.init();
