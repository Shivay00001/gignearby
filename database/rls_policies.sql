-- ============================================
-- GigNearby Platform - Row Level Security
-- Run this AFTER schema.sql
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- HELPER: Check user role
-- ==========================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==========================================
-- CATEGORIES (public read, admin write)
-- ==========================================

CREATE POLICY "categories_select_all"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "categories_admin_insert"
    ON categories FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "categories_admin_update"
    ON categories FOR UPDATE
    USING (is_admin());

CREATE POLICY "categories_admin_delete"
    ON categories FOR DELETE
    USING (is_admin());

-- ==========================================
-- PROFILES
-- ==========================================

-- Everyone can read basic profiles
CREATE POLICY "profiles_select_public"
    ON profiles FOR SELECT
    USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- Users can insert their own profile on signup
CREATE POLICY "profiles_insert_own"
    ON profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Admin can update any profile (ban, verify)
CREATE POLICY "profiles_admin_update"
    ON profiles FOR UPDATE
    USING (is_admin());

-- ==========================================
-- WORKER PROFILES
-- ==========================================

-- Everyone can view worker profiles (for browsing)
CREATE POLICY "worker_profiles_select_all"
    ON worker_profiles FOR SELECT
    USING (true);

-- Workers can insert their own profile
CREATE POLICY "worker_profiles_insert_own"
    ON worker_profiles FOR INSERT
    WITH CHECK (id = auth.uid() AND get_user_role() = 'worker');

-- Workers can update only their own profile
CREATE POLICY "worker_profiles_update_own"
    ON worker_profiles FOR UPDATE
    USING (id = auth.uid());

-- Admin can update any worker profile
CREATE POLICY "worker_profiles_admin_update"
    ON worker_profiles FOR UPDATE
    USING (is_admin());

-- ==========================================
-- WORKER CATEGORIES
-- ==========================================

CREATE POLICY "worker_categories_select_all"
    ON worker_categories FOR SELECT
    USING (true);

CREATE POLICY "worker_categories_insert_own"
    ON worker_categories FOR INSERT
    WITH CHECK (worker_id = auth.uid());

CREATE POLICY "worker_categories_update_own"
    ON worker_categories FOR UPDATE
    USING (worker_id = auth.uid());

CREATE POLICY "worker_categories_delete_own"
    ON worker_categories FOR DELETE
    USING (worker_id = auth.uid());

-- ==========================================
-- WORKER SKILLS
-- ==========================================

CREATE POLICY "worker_skills_select_all"
    ON worker_skills FOR SELECT
    USING (true);

CREATE POLICY "worker_skills_insert_own"
    ON worker_skills FOR INSERT
    WITH CHECK (worker_id = auth.uid());

CREATE POLICY "worker_skills_delete_own"
    ON worker_skills FOR DELETE
    USING (worker_id = auth.uid());

-- ==========================================
-- BOOKINGS
-- ==========================================

-- Customers can see their own bookings
CREATE POLICY "bookings_select_customer"
    ON bookings FOR SELECT
    USING (customer_id = auth.uid());

-- Workers can see bookings assigned to them
CREATE POLICY "bookings_select_worker"
    ON bookings FOR SELECT
    USING (worker_id = auth.uid());

-- Admin can see all bookings
CREATE POLICY "bookings_select_admin"
    ON bookings FOR SELECT
    USING (is_admin());

-- Only customers can create bookings
CREATE POLICY "bookings_insert_customer"
    ON bookings FOR INSERT
    WITH CHECK (customer_id = auth.uid() AND get_user_role() = 'customer');

-- Workers can update booking status (accept, start, complete)
CREATE POLICY "bookings_update_worker"
    ON bookings FOR UPDATE
    USING (worker_id = auth.uid());

-- Customers can update booking (cancel)
CREATE POLICY "bookings_update_customer"
    ON bookings FOR UPDATE
    USING (customer_id = auth.uid());

-- Admin can update any booking
CREATE POLICY "bookings_update_admin"
    ON bookings FOR UPDATE
    USING (is_admin());

-- ==========================================
-- REVIEWS
-- ==========================================

-- Public read on reviews
CREATE POLICY "reviews_select_all"
    ON reviews FOR SELECT
    USING (true);

-- Only booking participants can write reviews
CREATE POLICY "reviews_insert_participant"
    ON reviews FOR INSERT
    WITH CHECK (
        reviewer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_id
            AND bookings.status = 'completed'
            AND (bookings.customer_id = auth.uid() OR bookings.worker_id = auth.uid())
        )
    );

-- ==========================================
-- MESSAGES (scoped to booking participants)
-- ==========================================

-- Only booking participants can read messages
CREATE POLICY "messages_select_participant"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_id
            AND (bookings.customer_id = auth.uid() OR bookings.worker_id = auth.uid())
        )
    );

-- Admin can read all messages (for disputes)
CREATE POLICY "messages_select_admin"
    ON messages FOR SELECT
    USING (is_admin());

-- Only booking participants can send messages
CREATE POLICY "messages_insert_participant"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_id
            AND (bookings.customer_id = auth.uid() OR bookings.worker_id = auth.uid())
        )
    );

-- ==========================================
-- NOTIFICATIONS
-- ==========================================

-- Users can only see their own notifications
CREATE POLICY "notifications_select_own"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

-- System/Admin can insert notifications (via service role or function)
CREATE POLICY "notifications_insert_admin"
    ON notifications FOR INSERT
    WITH CHECK (is_admin());

-- Users can update (mark as read) their own
CREATE POLICY "notifications_update_own"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- ==========================================
-- PAYOUTS
-- ==========================================

-- Workers can see their own payouts
CREATE POLICY "payouts_select_worker"
    ON payouts FOR SELECT
    USING (worker_id = auth.uid());

-- Admin can see all payouts
CREATE POLICY "payouts_select_admin"
    ON payouts FOR SELECT
    USING (is_admin());

-- Admin can insert/update payouts
CREATE POLICY "payouts_insert_admin"
    ON payouts FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "payouts_update_admin"
    ON payouts FOR UPDATE
    USING (is_admin());

-- ==========================================
-- PLATFORM SETTINGS
-- ==========================================

-- Public read for settings
CREATE POLICY "settings_select_all"
    ON platform_settings FOR SELECT
    USING (true);

-- Admin can manage settings
CREATE POLICY "settings_insert_admin"
    ON platform_settings FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "settings_update_admin"
    ON platform_settings FOR UPDATE
    USING (is_admin());
