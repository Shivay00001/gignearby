// ============================================
// GigNearby - Auth Module (Demo + Supabase)
// ============================================

class GigAuth {
    constructor(appType) {
        this.appType = appType; // 'customer', 'worker', 'admin'
        this.currentUser = null;
        this.onAuthChange = null;
        this.init();
    }

    init() {
        if (DEMO_MODE) {
            const stored = localStorage.getItem('gn_current_user');
            if (stored) {
                const user = JSON.parse(stored);
                if (this.appType === 'admin' && user.role !== 'admin') {
                    this.currentUser = null;
                } else if (this.appType !== 'admin' && user.role === this.appType) {
                    this.currentUser = user;
                } else if (this.appType === 'customer' && user.role === 'customer') {
                    this.currentUser = user;
                }
            }
        } else {
            const sb = getSupabase();
            if (sb) {
                sb.auth.onAuthStateChange((event, session) => {
                    if (session?.user) {
                        this.loadProfile(session.user.id);
                    } else {
                        this.currentUser = null;
                        if (this.onAuthChange) this.onAuthChange(null);
                    }
                });
            }
        }
    }

    async loadProfile(userId) {
        if (DEMO_MODE) return;
        const sb = getSupabase();
        const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
        if (data && data.role === this.appType) {
            this.currentUser = data;
            if (this.onAuthChange) this.onAuthChange(data);
        }
    }

    async login(email, password) {
        if (DEMO_MODE) {
            return this.demoLogin(email, password);
        }
        const sb = getSupabase();
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await this.loadProfile(data.user.id);
        return this.currentUser;
    }

    async signup(userData) {
        if (DEMO_MODE) {
            return this.demoSignup(userData);
        }
        const sb = getSupabase();
        const { data, error } = await sb.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    full_name: userData.full_name,
                    role: this.appType,
                    phone: userData.phone
                }
            }
        });
        if (error) throw error;
        return data;
    }

    async logout() {
        if (DEMO_MODE) {
            localStorage.removeItem('gn_current_user');
            this.currentUser = null;
            if (this.onAuthChange) this.onAuthChange(null);
            return;
        }
        const sb = getSupabase();
        await sb.auth.signOut();
        this.currentUser = null;
    }

    // Demo mode auth
    demoLogin(email, password) {
        const profiles = demoDB.get('profiles');

        if (this.appType === 'admin') {
            if (email === 'admin@gignearby.com' && password === 'admin123') {
                this.currentUser = {
                    id: 'demo-admin',
                    role: 'admin',
                    full_name: 'Platform Admin',
                    email: 'admin@gignearby.com',
                    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
                    preferred_language: 'en'
                };
                localStorage.setItem('gn_current_user', JSON.stringify(this.currentUser));
                if (this.onAuthChange) this.onAuthChange(this.currentUser);
                return this.currentUser;
            }
            throw new Error(currentLang === 'hi' ? 'गलत एडमिन क्रेडेंशियल' : 'Invalid admin credentials');
        }

        if (this.appType === 'worker') {
            const worker = profiles.find(p => p.email === email && p.role === 'worker');
            if (worker) {
                this.currentUser = worker;
                localStorage.setItem('gn_current_user', JSON.stringify(worker));
                if (this.onAuthChange) this.onAuthChange(worker);
                return worker;
            }
            // Auto-login demo worker
            if (email && password) {
                this.currentUser = {
                    ...profiles.find(p => p.role === 'worker'),
                    email: email
                };
                localStorage.setItem('gn_current_user', JSON.stringify(this.currentUser));
                if (this.onAuthChange) this.onAuthChange(this.currentUser);
                return this.currentUser;
            }
            throw new Error(currentLang === 'hi' ? 'वर्कर नहीं मिला' : 'Worker not found');
        }

        // Customer login
        this.currentUser = {
            id: 'demo-customer',
            role: 'customer',
            full_name: 'Demo Customer',
            email: email || 'customer@demo.com',
            phone: '9999999999',
            city: 'Delhi',
            latitude: 28.6139,
            longitude: 77.2090,
            preferred_language: currentLang,
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoCustomer'
        };
        localStorage.setItem('gn_current_user', JSON.stringify(this.currentUser));
        if (this.onAuthChange) this.onAuthChange(this.currentUser);
        return this.currentUser;
    }

    demoSignup(userData) {
        const newUser = {
            id: `${this.appType}-${crypto.randomUUID().slice(0, 8)}`,
            role: this.appType,
            full_name: userData.full_name,
            email: userData.email,
            phone: userData.phone,
            city: userData.city || 'Delhi',
            latitude: 28.6139 + (Math.random() - 0.5) * 0.1,
            longitude: 77.2090 + (Math.random() - 0.5) * 0.1,
            is_verified: false,
            is_banned: false,
            preferred_language: currentLang,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.full_name.replace(/\s+/g, '')}`,
            created_at: new Date().toISOString()
        };

        const profiles = demoDB.get('profiles');
        profiles.push(newUser);
        demoDB.set('profiles', profiles);

        if (this.appType === 'worker') {
            const wp = {
                id: newUser.id,
                bio: '',
                bio_hi: '',
                experience_years: 0,
                hourly_rate: userData.hourly_rate || 200,
                monthly_rate: userData.monthly_rate || 10000,
                availability: 'available',
                service_radius_km: 10,
                total_jobs: 0,
                total_earnings: 0,
                avg_rating: 0,
                total_reviews: 0,
                created_at: new Date().toISOString()
            };
            const workerProfiles = demoDB.get('worker_profiles');
            workerProfiles.push(wp);
            demoDB.set('worker_profiles', workerProfiles);
        }

        this.currentUser = newUser;
        localStorage.setItem('gn_current_user', JSON.stringify(newUser));
        if (this.onAuthChange) this.onAuthChange(newUser);
        return newUser;
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    getUser() {
        return this.currentUser;
    }
}

// Real-time helpers
class GigRealtime {
    constructor() {
        this.subscriptions = [];
        this.listeners = {};
    }

    subscribe(table, filter, callback) {
        if (DEMO_MODE) {
            // Poll-based for demo
            const key = `${table}_${filter || 'all'}`;
            this.listeners[key] = { table, filter, callback };
            const interval = setInterval(() => {
                const data = demoDB.get(table);
                callback({ type: 'UPDATE', data });
            }, 3000);
            this.subscriptions.push({ key, interval });
            return key;
        }

        const sb = getSupabase();
        if (!sb) return;

        const channel = sb
            .channel(`${table}_changes`)
            .on('postgres_changes', { event: '*', schema: 'public', table, filter }, callback)
            .subscribe();

        this.subscriptions.push(channel);
        return channel;
    }

    unsubscribeAll() {
        if (DEMO_MODE) {
            this.subscriptions.forEach(s => clearInterval(s.interval));
        } else {
            this.subscriptions.forEach(s => s.unsubscribe?.());
        }
        this.subscriptions = [];
        this.listeners = {};
    }
}
