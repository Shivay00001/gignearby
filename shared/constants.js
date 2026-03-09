// ============================================
// GigNearby - Constants & i18n
// Shared across all 3 apps
// ============================================

const CATEGORIES = [
    { name: 'Plumber', name_hi: 'प्लम्बर', icon: '🔧', commission_rate: 5, description: 'Fix leaks, pipes, taps', description_hi: 'लीक, पाइप, नल ठीक करें' },
    { name: 'Electrician', name_hi: 'इलेक्ट्रीशियन', icon: '⚡', commission_rate: 5, description: 'Wiring, fuse, switchboard', description_hi: 'वायरिंग, फ्यूज, स्विचबोर्ड' },
    { name: 'Carpenter', name_hi: 'बढ़ई', icon: '🪚', commission_rate: 5, description: 'Furniture repair, wood work', description_hi: 'फर्नीचर मरम्मत, लकड़ी का काम' },
    { name: 'Painter', name_hi: 'पेंटर', icon: '🎨', commission_rate: 6, description: 'Home painting, textures', description_hi: 'घर पेंटिंग, टेक्सचर' },
    { name: 'Cleaner', name_hi: 'सफाईकर्मी', icon: '🧹', commission_rate: 6, description: 'Deep cleaning, sanitization', description_hi: 'गहरी सफाई, सैनिटाइजेशन' },
    { name: 'Gardener', name_hi: 'माली', icon: '🌱', commission_rate: 6, description: 'Garden care, landscaping', description_hi: 'बगीचे की देखभाल' },
    { name: 'Elder Care', name_hi: 'बुज़ुर्गों की देखभाल', icon: '👴', commission_rate: 4, description: 'Companionship, daily help', description_hi: 'साथ, दैनिक मदद' },
    { name: 'Line Standing', name_hi: 'लाइन में खड़ा होना', icon: '🧍', commission_rate: 3, description: 'Stand in queues for you', description_hi: 'आपकी जगह लाइन में' },
    { name: 'Shopping Helper', name_hi: 'शॉपिंग हेल्पर', icon: '🛍️', commission_rate: 3, description: 'Grocery, market visits', description_hi: 'किराना, बाजार जाना' },
    { name: 'Companion', name_hi: 'साथी', icon: '🤝', commission_rate: 3, description: 'Walks, outings, conversations', description_hi: 'सैर, बाहर जाना, बातचीत' },
    { name: 'Cook', name_hi: 'रसोइया', icon: '👨‍🍳', commission_rate: 8, description: 'Home cooking, catering', description_hi: 'घर का खाना, केटरिंग' },
    { name: 'Driver', name_hi: 'ड्राइवर', icon: '🚗', commission_rate: 8, description: 'Personal driver, pickup/drop', description_hi: 'पर्सनल ड्राइवर' },
    { name: 'Tutor', name_hi: 'ट्यूटर', icon: '📚', commission_rate: 8, description: 'Home tuition, coaching', description_hi: 'होम ट्यूशन, कोचिंग' },
    { name: 'Tailor', name_hi: 'दर्ज़ी', icon: '🧵', commission_rate: 6, description: 'Stitching, alterations', description_hi: 'सिलाई, अल्टरेशन' },
    { name: 'AC Repair', name_hi: 'एसी मरम्मत', icon: '❄️', commission_rate: 5, description: 'AC servicing, gas refill', description_hi: 'एसी सर्विसिंग, गैस रिफिल' },
    { name: 'Pest Control', name_hi: 'पेस्ट कंट्रोल', icon: '🪳', commission_rate: 6, description: 'Termite, cockroach treatment', description_hi: 'दीमक, कॉकरोच उपचार' },
    { name: 'Packers & Movers', name_hi: 'पैकर्स एंड मूवर्स', icon: '📦', commission_rate: 10, description: 'Packing, transport, moving', description_hi: 'पैकिंग, ट्रांसपोर्ट' },
    { name: 'Appliance Repair', name_hi: 'उपकरण मरम्मत', icon: '🔌', commission_rate: 5, description: 'TV, fridge, washing machine', description_hi: 'टीवी, फ्रिज, वॉशिंग मशीन' }
];

const BOOKING_STATUSES = {
    pending: { label: 'Pending', label_hi: 'लंबित', color: '#f59e0b', icon: '⏳' },
    confirmed: { label: 'Confirmed', label_hi: 'कन्फर्म', color: '#3b82f6', icon: '✅' },
    in_progress: { label: 'In Progress', label_hi: 'चल रहा है', color: '#8b5cf6', icon: '🔄' },
    completed: { label: 'Completed', label_hi: 'पूरा हो गया', color: '#10b981', icon: '🎉' },
    cancelled: { label: 'Cancelled', label_hi: 'रद्द', color: '#ef4444', icon: '❌' },
    disputed: { label: 'Disputed', label_hi: 'विवादित', color: '#f97316', icon: '⚠️' }
};

const AVAILABILITY_STATUSES = {
    available: { label: 'Available', label_hi: 'उपलब्ध', color: '#10b981' },
    busy: { label: 'Busy', label_hi: 'व्यस्त', color: '#f59e0b' },
    offline: { label: 'Offline', label_hi: 'ऑफलाइन', color: '#6b7280' }
};

// ============================================
// i18n labels
// ============================================

const LANG = {
    en: {
        platform_name: 'GigNearby',
        tagline: 'Hire Trusted Workers Near You',
        search_placeholder: 'Search for plumber, electrician, cook...',
        browse_workers: 'Browse Workers',
        register_worker: 'Join as Worker',
        my_bookings: 'My Bookings',
        dashboard: 'Dashboard',
        how_it_works: 'How It Works',
        step1_title: 'Choose Service',
        step1_desc: 'Browse 18+ service categories',
        step2_title: 'Select Worker',
        step2_desc: 'Compare ratings, prices & reviews',
        step3_title: 'Book & Pay',
        step3_desc: 'Schedule hourly or monthly. We handle the rest!',
        categories: 'Service Categories',
        featured_workers: 'Featured Workers Nearby',
        per_hour: '/hr',
        per_month: '/mo',
        book_now: 'Book Now',
        view_profile: 'View Profile',
        reviews: 'reviews',
        jobs_done: 'jobs done',
        experience: 'experience',
        years: 'years',
        hourly_rate: 'Hourly Rate',
        monthly_rate: 'Monthly Rate',
        skills: 'Skills',
        about: 'About',
        schedule_booking: 'Schedule Booking',
        booking_date: 'Date',
        booking_time: 'Time',
        duration: 'Duration',
        hours: 'hours',
        months: 'months',
        address: 'Service Address',
        notes: 'Special Notes',
        confirm_booking: 'Confirm Booking',
        subtotal: 'Subtotal',
        platform_fee: 'Platform Fee',
        total: 'Total',
        you_pay: 'You Pay',
        worker_gets: 'Worker Gets',
        commission: 'Commission',
        booking_success: 'Booking Confirmed!',
        no_results: 'No workers found',
        filters: 'Filters',
        sort_by: 'Sort By',
        category: 'Category',
        all_categories: 'All Categories',
        price_range: 'Price Range',
        min_rating: 'Min Rating',
        distance: 'Distance',
        km: 'km',
        rating: 'Rating',
        price: 'Price',
        verified: 'Verified',
        featured: 'Featured',
        available: 'Available',
        login: 'Login',
        signup: 'Sign Up',
        logout: 'Logout',
        email: 'Email',
        password: 'Password',
        full_name: 'Full Name',
        phone: 'Phone Number',
        city: 'City',
        profile: 'Profile',
        settings: 'Settings',
        notifications: 'Notifications',
        earnings: 'Earnings',
        total_bookings: 'Total Bookings',
        active_bookings: 'Active Bookings',
        completed_jobs: 'Completed Jobs',
        total_revenue: 'Total Revenue',
        total_workers: 'Total Workers',
        total_customers: 'Total Customers',
        today_bookings: 'Today\'s Bookings',
        this_month: 'This Month',
        status: 'Status',
        actions: 'Actions',
        accept: 'Accept',
        reject: 'Reject',
        start_work: 'Start Work',
        complete: 'Complete',
        cancel: 'Cancel',
        rate_worker: 'Rate Worker',
        submit_review: 'Submit Review',
        your_rating: 'Your Rating',
        your_review: 'Your Review',
        switch_language: 'हिंदी',
        home: 'Home',
        back: 'Back',
    },
    hi: {
        platform_name: 'गिगनियरबाई',
        tagline: 'अपने पास के भरोसेमंद वर्कर को हायर करें',
        search_placeholder: 'प्लम्बर, इलेक्ट्रीशियन, कुक खोजें...',
        browse_workers: 'वर्कर देखें',
        register_worker: 'वर्कर बनें',
        my_bookings: 'मेरी बुकिंग',
        dashboard: 'डैशबोर्ड',
        how_it_works: 'कैसे काम करता है',
        step1_title: 'सेवा चुनें',
        step1_desc: '18+ सेवा कैटेगरी में से चुनें',
        step2_title: 'वर्कर चुनें',
        step2_desc: 'रेटिंग, कीमत और रिव्यू तुलना करें',
        step3_title: 'बुक करें और पे करें',
        step3_desc: 'घंटे या महीने के हिसाब से बुक करें!',
        categories: 'सेवा कैटेगरी',
        featured_workers: 'पास के फीचर्ड वर्कर',
        per_hour: '/घंटा',
        per_month: '/महीना',
        book_now: 'अभी बुक करें',
        view_profile: 'प्रोफ़ाइल देखें',
        reviews: 'रिव्यू',
        jobs_done: 'काम किए',
        experience: 'अनुभव',
        years: 'साल',
        hourly_rate: 'प्रति घंटा',
        monthly_rate: 'प्रति माह',
        skills: 'कौशल',
        about: 'बारे में',
        schedule_booking: 'बुकिंग शेड्यूल करें',
        booking_date: 'तारीख',
        booking_time: 'समय',
        duration: 'अवधि',
        hours: 'घंटे',
        months: 'महीने',
        address: 'सेवा का पता',
        notes: 'विशेष नोट',
        confirm_booking: 'बुकिंग कन्फर्म करें',
        subtotal: 'उपकुल',
        platform_fee: 'प्लेटफॉर्म शुल्क',
        total: 'कुल',
        you_pay: 'आप भुगतान करें',
        worker_gets: 'वर्कर को मिलेगा',
        commission: 'कमीशन',
        booking_success: 'बुकिंग कन्फर्म!',
        no_results: 'कोई वर्कर नहीं मिला',
        filters: 'फ़िल्टर',
        sort_by: 'क्रमबद्ध करें',
        category: 'कैटेगरी',
        all_categories: 'सभी कैटेगरी',
        price_range: 'कीमत सीमा',
        min_rating: 'न्यूनतम रेटिंग',
        distance: 'दूरी',
        km: 'किमी',
        rating: 'रेटिंग',
        price: 'कीमत',
        verified: 'सत्यापित',
        featured: 'फीचर्ड',
        available: 'उपलब्ध',
        login: 'लॉगिन',
        signup: 'साइन अप',
        logout: 'लॉगआउट',
        email: 'ईमेल',
        password: 'पासवर्ड',
        full_name: 'पूरा नाम',
        phone: 'फ़ोन नंबर',
        city: 'शहर',
        profile: 'प्रोफाइल',
        settings: 'सेटिंग्स',
        notifications: 'सूचनाएं',
        earnings: 'कमाई',
        total_bookings: 'कुल बुकिंग',
        active_bookings: 'सक्रिय बुकिंग',
        completed_jobs: 'पूरे हुए काम',
        total_revenue: 'कुल राजस्व',
        total_workers: 'कुल वर्कर',
        total_customers: 'कुल ग्राहक',
        today_bookings: 'आज की बुकिंग',
        this_month: 'इस महीने',
        status: 'स्थिति',
        actions: 'कार्रवाई',
        accept: 'स्वीकार',
        reject: 'अस्वीकार',
        start_work: 'काम शुरू करें',
        complete: 'पूरा करें',
        cancel: 'रद्द करें',
        rate_worker: 'वर्कर को रेट करें',
        submit_review: 'रिव्यू दें',
        your_rating: 'आपकी रेटिंग',
        your_review: 'आपका रिव्यू',
        switch_language: 'English',
        home: 'होम',
        back: 'वापस',
    }
};

// Current language helper
let currentLang = localStorage.getItem('gn_lang') || 'en';

function t(key) {
    return LANG[currentLang]?.[key] || LANG.en[key] || key;
}

function tCat(category, field = 'name') {
    if (currentLang === 'hi' && category[`${field}_hi`]) return category[`${field}_hi`];
    return category[field];
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('gn_lang', lang);
}

function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN');
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString(currentLang === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
}

function getStarRating(rating, size = 16) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return currentLang === 'hi' ? 'अभी' : 'just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d`;
    return formatDate(dateStr);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
