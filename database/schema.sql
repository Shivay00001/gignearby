-- ============================================
-- GigNearby Platform - Database Schema
-- Run this FIRST in Supabase SQL Editor
-- ============================================

-- ==========================================
-- 1. ENUMS
-- ==========================================

CREATE TYPE user_role AS ENUM ('customer', 'worker', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed');
CREATE TYPE booking_type AS ENUM ('hourly', 'monthly');
CREATE TYPE availability_status AS ENUM ('available', 'busy', 'offline');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ==========================================
-- 2. SERVICE CATEGORIES
-- ==========================================

CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    name_hi TEXT NOT NULL,              -- Hindi name
    icon TEXT NOT NULL,                 -- emoji icon
    description TEXT,
    description_hi TEXT,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (commission_rate >= 2 AND commission_rate <= 10),
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. USER PROFILES
-- ==========================================

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'customer',
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi')),
    is_verified BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 4. WORKER PROFILES (extended info)
-- ==========================================

CREATE TABLE worker_profiles (
    id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    bio TEXT,
    bio_hi TEXT,
    experience_years INT DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    monthly_rate DECIMAL(10,2),
    availability availability_status DEFAULT 'available',
    service_radius_km INT DEFAULT 10,
    total_jobs INT DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    id_proof_url TEXT,
    id_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    last_active_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 5. WORKER ↔ CATEGORY JUNCTION
-- ==========================================

CREATE TABLE worker_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    custom_rate DECIMAL(10,2),           -- optional override per category
    UNIQUE(worker_id, category_id)
);

-- ==========================================
-- 6. WORKER SKILLS (tags)
-- ==========================================

CREATE TABLE worker_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    skill_name_hi TEXT,
    UNIQUE(worker_id, skill_name)
);

-- ==========================================
-- 7. BOOKINGS
-- ==========================================

CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_number TEXT UNIQUE NOT NULL,  -- human-readable: GN-20260309-001
    customer_id UUID REFERENCES profiles(id) NOT NULL,
    worker_id UUID REFERENCES profiles(id) NOT NULL,
    category_id UUID REFERENCES categories(id) NOT NULL,
    status booking_status DEFAULT 'pending',
    booking_type booking_type NOT NULL,
    
    -- Schedule
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    duration_hours INT,                   -- for hourly bookings
    duration_months INT,                  -- for monthly bookings
    
    -- Location
    service_address TEXT,
    service_city TEXT,
    service_latitude DECIMAL(10,7),
    service_longitude DECIMAL(10,7),
    
    -- Pricing
    rate_per_unit DECIMAL(10,2) NOT NULL, -- per hour or per month
    subtotal DECIMAL(12,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,  -- subtotal (customer pays this)
    worker_payout DECIMAL(12,2) NOT NULL, -- subtotal - commission
    
    -- Details
    notes TEXT,
    customer_phone TEXT,
    
    -- Timestamps
    confirmed_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES profiles(id),
    cancellation_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 8. REVIEWS
-- ==========================================

CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id) NOT NULL,
    reviewee_id UUID REFERENCES profiles(id) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_from_customer BOOLEAN NOT NULL,    -- true = customer reviewed worker
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(booking_id, reviewer_id)       -- one review per person per booking
);

-- ==========================================
-- 9. MESSAGES (real-time chat)
-- ==========================================

CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 10. NOTIFICATIONS
-- ==========================================

CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    title_hi TEXT,
    message TEXT NOT NULL,
    message_hi TEXT,
    type TEXT NOT NULL,                   -- booking_new, booking_confirmed, booking_completed, message, review, system
    reference_id UUID,                   -- booking_id or other entity
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 11. PAYOUTS (commission tracking)
-- ==========================================

CREATE TABLE payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID REFERENCES profiles(id) NOT NULL,
    booking_id UUID REFERENCES bookings(id),
    amount DECIMAL(12,2) NOT NULL,
    commission_deducted DECIMAL(12,2) NOT NULL,
    net_amount DECIMAL(12,2) NOT NULL,
    status payout_status DEFAULT 'pending',
    payment_method TEXT,
    transaction_id TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 12. PLATFORM SETTINGS (admin config)
-- ==========================================

CREATE TABLE platform_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 13. INDEXES for performance
-- ==========================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_city ON profiles(city);
CREATE INDEX idx_profiles_location ON profiles(latitude, longitude);
CREATE INDEX idx_worker_profiles_availability ON worker_profiles(availability);
CREATE INDEX idx_worker_profiles_rating ON worker_profiles(avg_rating DESC);
CREATE INDEX idx_worker_categories_worker ON worker_categories(worker_id);
CREATE INDEX idx_worker_categories_category ON worker_categories(category_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_worker ON bookings(worker_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX idx_messages_booking ON messages(booking_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_payouts_worker ON payouts(worker_id);

-- ==========================================
-- 14. UPDATED_AT TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_worker_profiles_updated_at
    BEFORE UPDATE ON worker_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_bookings_updated_at
    BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
