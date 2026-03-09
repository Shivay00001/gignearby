// ============================================
// GigNearby - Supabase Configuration
// Shared across all 3 apps
// ============================================

const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
};

// Demo mode: set to false when Supabase is configured
const DEMO_MODE = SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL';

let supabaseClient = null;

function getSupabase() {
    if (DEMO_MODE) return null;
    if (!supabaseClient && window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    }
    return supabaseClient;
}

// ============================================
// DEMO MODE - localStorage mock database
// ============================================

class DemoDB {
    constructor() {
        this.initIfNeeded();
    }

    initIfNeeded() {
        if (!localStorage.getItem('gn_initialized')) {
            this.seedData();
            localStorage.setItem('gn_initialized', 'true');
        }
    }

    get(key) {
        try {
            return JSON.parse(localStorage.getItem(`gn_${key}`)) || [];
        } catch { return []; }
    }

    set(key, data) {
        localStorage.setItem(`gn_${key}`, JSON.stringify(data));
    }

    addItem(key, item) {
        const items = this.get(key);
        item.id = item.id || crypto.randomUUID();
        item.created_at = item.created_at || new Date().toISOString();
        items.push(item);
        this.set(key, items);
        return item;
    }

    updateItem(key, id, updates) {
        const items = this.get(key);
        const idx = items.findIndex(i => i.id === id);
        if (idx !== -1) {
            items[idx] = { ...items[idx], ...updates, updated_at: new Date().toISOString() };
            this.set(key, items);
            return items[idx];
        }
        return null;
    }

    deleteItem(key, id) {
        const items = this.get(key).filter(i => i.id !== id);
        this.set(key, items);
    }

    query(key, filters = {}) {
        let items = this.get(key);
        Object.entries(filters).forEach(([field, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                items = items.filter(i => {
                    if (typeof value === 'string') return String(i[field]).toLowerCase().includes(value.toLowerCase());
                    return i[field] === value;
                });
            }
        });
        return items;
    }

    seedData() {
        // Seed categories
        this.set('categories', CATEGORIES.map((c, i) => ({
            id: `cat-${i + 1}`,
            ...c,
            is_active: true,
            sort_order: i + 1,
            created_at: new Date().toISOString()
        })));

        // Seed demo workers
        const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Jaipur', 'Lucknow', 'Chennai'];
        const demoWorkers = [
            { full_name: 'Rajesh Kumar', phone: '9876543201', city: 'Delhi', latitude: 28.6139, longitude: 77.2090, bio: 'Experienced plumber with 10+ years', bio_hi: '10+ साल का अनुभवी प्लम्बर', hourly_rate: 300, monthly_rate: 15000, categories: ['cat-1'], skills: ['Pipe Fitting', 'Leak Repair', 'Water Tank'], avg_rating: 4.8, total_reviews: 45, total_jobs: 120 },
            { full_name: 'Amit Sharma', phone: '9876543202', city: 'Delhi', latitude: 28.6200, longitude: 77.2150, bio: 'Certified electrician, handles all wiring work', bio_hi: 'प्रमाणित इलेक्ट्रीशियन, सभी वायरिंग काम', hourly_rate: 350, monthly_rate: 18000, categories: ['cat-2'], skills: ['Wiring', 'Switchboard', 'MCB'], avg_rating: 4.7, total_reviews: 38, total_jobs: 95 },
            { full_name: 'Priya Verma', phone: '9876543203', city: 'Delhi', latitude: 28.6300, longitude: 77.2200, bio: 'Caring companion for elderly people', bio_hi: 'बुजुर्गों के लिए देखभाल करने वाली साथी', hourly_rate: 200, monthly_rate: 12000, categories: ['cat-7', 'cat-10'], skills: ['Elder Care', 'Medical Aid', 'Companionship'], avg_rating: 4.9, total_reviews: 28, total_jobs: 65 },
            { full_name: 'Suresh Yadav', phone: '9876543204', city: 'Mumbai', latitude: 19.0760, longitude: 72.8777, bio: 'Professional painter and wall artist', bio_hi: 'पेशेवर पेंटर और वॉल आर्टिस्ट', hourly_rate: 400, monthly_rate: 20000, categories: ['cat-4'], skills: ['Wall Painting', 'Texture', 'Waterproofing'], avg_rating: 4.6, total_reviews: 52, total_jobs: 130 },
            { full_name: 'Neha Singh', phone: '9876543205', city: 'Mumbai', latitude: 19.0800, longitude: 72.8850, bio: 'Home & office deep cleaning expert', bio_hi: 'घर और ऑफिस की गहरी सफाई विशेषज्ञ', hourly_rate: 250, monthly_rate: 10000, categories: ['cat-5'], skills: ['Deep Cleaning', 'Sanitization', 'Carpet Cleaning'], avg_rating: 4.5, total_reviews: 33, total_jobs: 88 },
            { full_name: 'Mohammad Irfan', phone: '9876543206', city: 'Bangalore', latitude: 12.9716, longitude: 77.5946, bio: 'Expert carpenter, custom furniture maker', bio_hi: 'विशेषज्ञ बढ़ई, कस्टम फर्नीचर बनाने वाले', hourly_rate: 450, monthly_rate: 22000, categories: ['cat-3'], skills: ['Furniture', 'Wood Polish', 'Cabinet Making'], avg_rating: 4.8, total_reviews: 41, total_jobs: 110 },
            { full_name: 'Ravi Tiwari', phone: '9876543207', city: 'Bangalore', latitude: 12.9750, longitude: 77.6000, bio: 'I can stand in any queue for you!', bio_hi: 'मैं आपकी जगह किसी भी लाइन में खड़ा हो सकता हूँ!', hourly_rate: 150, monthly_rate: 8000, categories: ['cat-8', 'cat-9'], skills: ['Queue Standing', 'Document Collection', 'Shopping'], avg_rating: 4.4, total_reviews: 22, total_jobs: 55 },
            { full_name: 'Anita Devi', phone: '9876543208', city: 'Hyderabad', latitude: 17.3850, longitude: 78.4867, bio: 'Professional cook, both North & South Indian', bio_hi: 'पेशेवर रसोइया, उत्तर और दक्षिण भारतीय', hourly_rate: 350, monthly_rate: 15000, categories: ['cat-11'], skills: ['North Indian', 'South Indian', 'Party Catering'], avg_rating: 4.9, total_reviews: 60, total_jobs: 150 },
            { full_name: 'Vikram Chauhan', phone: '9876543209', city: 'Pune', latitude: 18.5204, longitude: 73.8567, bio: 'Safe and experienced driver at your service', bio_hi: 'सुरक्षित और अनुभवी ड्राइवर आपकी सेवा में', hourly_rate: 200, monthly_rate: 18000, categories: ['cat-12'], skills: ['City Driving', 'Highway', 'Night Driving'], avg_rating: 4.7, total_reviews: 35, total_jobs: 200 },
            { full_name: 'Sunita Kumari', phone: '9876543210', city: 'Jaipur', latitude: 26.9124, longitude: 75.7873, bio: 'Expert tutor for classes 1-12, Math & Science', bio_hi: 'कक्षा 1-12 के लिए गणित और विज्ञान ट्यूटर', hourly_rate: 500, monthly_rate: 8000, categories: ['cat-13'], skills: ['Mathematics', 'Science', 'English'], avg_rating: 4.8, total_reviews: 25, total_jobs: 40 },
            { full_name: 'Deepak Meena', phone: '9876543211', city: 'Lucknow', latitude: 26.8467, longitude: 80.9462, bio: 'AC & refrigerator repair specialist', bio_hi: 'एसी और फ्रिज मरम्मत विशेषज्ञ', hourly_rate: 400, monthly_rate: 20000, categories: ['cat-15', 'cat-18'], skills: ['AC Repair', 'Fridge Repair', 'Gas Refill'], avg_rating: 4.6, total_reviews: 30, total_jobs: 85 },
            { full_name: 'Kavita Patel', phone: '9876543212', city: 'Chennai', latitude: 13.0827, longitude: 80.2707, bio: 'Expert tailor, designer blouses and kurtis', bio_hi: 'विशेषज्ञ दर्ज़ी, डिजाइनर ब्लाउज और कुर्ती', hourly_rate: 300, monthly_rate: 12000, categories: ['cat-14'], skills: ['Blouse', 'Kurti', 'Alterations'], avg_rating: 4.7, total_reviews: 42, total_jobs: 95 },
            { full_name: 'Ramesh Gupta', phone: '9876543213', city: 'Delhi', latitude: 28.6350, longitude: 77.2250, bio: 'Professional gardener and landscaping expert', bio_hi: 'पेशेवर माली और लैंडस्केपिंग विशेषज्ञ', hourly_rate: 250, monthly_rate: 10000, categories: ['cat-6'], skills: ['Landscaping', 'Plant Care', 'Lawn Maintenance'], avg_rating: 4.5, total_reviews: 20, total_jobs: 60 },
            { full_name: 'Pooja Mehra', phone: '9876543214', city: 'Mumbai', latitude: 19.0850, longitude: 72.8900, bio: 'Shopping assistant, love helping with fashion!', bio_hi: 'शॉपिंग असिस्टेंट, फैशन में मदद करना पसंद!', hourly_rate: 200, monthly_rate: 10000, categories: ['cat-9', 'cat-10'], skills: ['Fashion', 'Grocery', 'Market Visits'], avg_rating: 4.6, total_reviews: 18, total_jobs: 42 },
            { full_name: 'Arun Pest Solutions', phone: '9876543215', city: 'Pune', latitude: 18.5250, longitude: 73.8600, bio: 'Licensed pest control expert', bio_hi: 'लाइसेंस प्राप्त पेस्ट कंट्रोल विशेषज्ञ', hourly_rate: 500, monthly_rate: 5000, categories: ['cat-16'], skills: ['Termite', 'Cockroach', 'Mosquito'], avg_rating: 4.4, total_reviews: 15, total_jobs: 35 },
        ];

        const workers = demoWorkers.map((w, i) => ({
            id: `worker-${i + 1}`,
            role: 'worker',
            full_name: w.full_name,
            phone: w.phone,
            email: `${w.full_name.toLowerCase().replace(/\s+/g, '.')}@demo.com`,
            city: w.city,
            latitude: w.latitude,
            longitude: w.longitude,
            is_verified: Math.random() > 0.3,
            is_banned: false,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${w.full_name.replace(/\s+/g, '')}`,
            preferred_language: Math.random() > 0.5 ? 'hi' : 'en',
            created_at: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString()
        }));
        this.set('profiles', workers);

        const workerProfiles = demoWorkers.map((w, i) => ({
            id: `worker-${i + 1}`,
            bio: w.bio,
            bio_hi: w.bio_hi,
            experience_years: Math.floor(Math.random() * 15) + 1,
            hourly_rate: w.hourly_rate,
            monthly_rate: w.monthly_rate,
            availability: ['available', 'available', 'available', 'busy'][Math.floor(Math.random() * 4)],
            service_radius_km: Math.floor(Math.random() * 15) + 5,
            total_jobs: w.total_jobs,
            total_earnings: w.total_jobs * w.hourly_rate * 2,
            avg_rating: w.avg_rating,
            total_reviews: w.total_reviews,
            id_verified: Math.random() > 0.3,
            is_featured: Math.random() > 0.7,
            last_active_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
            created_at: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString()
        }));
        this.set('worker_profiles', workerProfiles);

        const workerCats = [];
        demoWorkers.forEach((w, i) => {
            w.categories.forEach(catId => {
                workerCats.push({
                    id: crypto.randomUUID(),
                    worker_id: `worker-${i + 1}`,
                    category_id: catId
                });
            });
        });
        this.set('worker_categories', workerCats);

        const workerSkills = [];
        demoWorkers.forEach((w, i) => {
            w.skills.forEach(skill => {
                workerSkills.push({
                    id: crypto.randomUUID(),
                    worker_id: `worker-${i + 1}`,
                    skill_name: skill,
                    skill_name_hi: skill
                });
            });
        });
        this.set('worker_skills', workerSkills);

        // Demo bookings
        const statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'completed', 'completed'];
        const demoBookings = [];
        for (let i = 0; i < 12; i++) {
            const workerIdx = Math.floor(Math.random() * demoWorkers.length);
            const worker = demoWorkers[workerIdx];
            const catId = worker.categories[0];
            const cat = CATEGORIES[parseInt(catId.split('-')[1]) - 1];
            const rate = worker.hourly_rate;
            const hours = Math.floor(Math.random() * 6) + 1;
            const subtotal = rate * hours;
            const commRate = cat.commission_rate;
            const commission = Math.round(subtotal * commRate / 100);
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            demoBookings.push({
                id: `booking-${i + 1}`,
                booking_number: `GN-20260309-${String(i + 1).padStart(4, '0')}`,
                customer_id: 'demo-customer',
                worker_id: `worker-${workerIdx + 1}`,
                category_id: catId,
                status: status,
                booking_type: 'hourly',
                scheduled_date: new Date(Date.now() + (i - 5) * 86400000).toISOString().split('T')[0],
                scheduled_time: `${9 + Math.floor(Math.random() * 8)}:00`,
                duration_hours: hours,
                rate_per_unit: rate,
                subtotal: subtotal,
                commission_rate: commRate,
                commission_amount: commission,
                total_amount: subtotal,
                worker_payout: subtotal - commission,
                service_address: `${Math.floor(Math.random() * 200) + 1}, Sector ${Math.floor(Math.random() * 50) + 1}`,
                service_city: worker.city,
                notes: '',
                created_at: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString()
            });
        }
        this.set('bookings', demoBookings);

        // Demo reviews
        const demoReviews = [];
        demoBookings.filter(b => b.status === 'completed').forEach((b, i) => {
            demoReviews.push({
                id: `review-${i + 1}`,
                booking_id: b.id,
                reviewer_id: 'demo-customer',
                reviewee_id: b.worker_id,
                rating: Math.floor(Math.random() * 2) + 4,
                comment: ['Great work!', 'Very professional', 'Highly recommended', 'On time and efficient', 'Excellent service'][Math.floor(Math.random() * 5)],
                is_from_customer: true,
                created_at: new Date(Date.now() - Math.random() * 15 * 86400000).toISOString()
            });
        });
        this.set('reviews', demoReviews);

        this.set('messages', []);
        this.set('notifications', []);
        this.set('payouts', []);

        // Demo current user (customer)
        localStorage.setItem('gn_current_user', JSON.stringify({
            id: 'demo-customer',
            role: 'customer',
            full_name: 'Demo Customer',
            email: 'customer@demo.com',
            phone: '9999999999',
            city: 'Delhi',
            latitude: 28.6139,
            longitude: 77.2090,
            preferred_language: 'en',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoCustomer'
        }));
    }

    resetData() {
        Object.keys(localStorage)
            .filter(k => k.startsWith('gn_'))
            .forEach(k => localStorage.removeItem(k));
        this.seedData();
        localStorage.setItem('gn_initialized', 'true');
    }
}

const demoDB = new DemoDB();

// Export for use in apps
window.GigNearby = {
    getSupabase,
    demoDB,
    DEMO_MODE,
    SUPABASE_CONFIG
};
