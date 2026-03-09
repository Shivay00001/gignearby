-- ============================================
-- GigNearby Platform - Database Functions
-- Run this AFTER schema.sql
-- ============================================

-- ==========================================
-- 1. AUTO-CREATE PROFILE ON SIGNUP
-- ==========================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, role, full_name, email, phone)
    VALUES (
        NEW.id,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NEW.email,
        NEW.phone
    );
    
    -- If worker, also create worker_profiles entry
    IF (NEW.raw_user_meta_data->>'role') = 'worker' THEN
        INSERT INTO worker_profiles (id)
        VALUES (NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- 2. GENERATE BOOKING NUMBER
-- ==========================================

CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
DECLARE
    today_count INT;
    date_str TEXT;
BEGIN
    date_str := to_char(NOW(), 'YYYYMMDD');
    SELECT COUNT(*) + 1 INTO today_count
    FROM bookings
    WHERE DATE(created_at) = CURRENT_DATE;
    
    NEW.booking_number := 'GN-' || date_str || '-' || LPAD(today_count::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_booking_number
    BEFORE INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION generate_booking_number();

-- ==========================================
-- 3. CALCULATE BOOKING AMOUNTS
-- ==========================================

CREATE OR REPLACE FUNCTION calculate_booking_amounts()
RETURNS TRIGGER AS $$
DECLARE
    cat_commission DECIMAL(5,2);
BEGIN
    -- Get commission rate from category
    SELECT commission_rate INTO cat_commission
    FROM categories WHERE id = NEW.category_id;
    
    -- Calculate subtotal
    IF NEW.booking_type = 'hourly' THEN
        NEW.subtotal := NEW.rate_per_unit * COALESCE(NEW.duration_hours, 1);
    ELSE
        NEW.subtotal := NEW.rate_per_unit * COALESCE(NEW.duration_months, 1);
    END IF;
    
    -- Commission
    NEW.commission_rate := cat_commission;
    NEW.commission_amount := ROUND(NEW.subtotal * (cat_commission / 100), 2);
    NEW.total_amount := NEW.subtotal;
    NEW.worker_payout := NEW.subtotal - NEW.commission_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_booking_calc
    BEFORE INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION calculate_booking_amounts();

-- ==========================================
-- 4. UPDATE WORKER STATS ON BOOKING COMPLETE
-- ==========================================

CREATE OR REPLACE FUNCTION update_worker_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Update completed_at
        NEW.completed_at := now();
        
        -- Update worker stats
        UPDATE worker_profiles
        SET 
            total_jobs = total_jobs + 1,
            total_earnings = total_earnings + NEW.worker_payout,
            last_active_at = now()
        WHERE id = NEW.worker_id;
        
        -- Auto-create payout record
        INSERT INTO payouts (worker_id, booking_id, amount, commission_deducted, net_amount)
        VALUES (
            NEW.worker_id,
            NEW.id,
            NEW.subtotal,
            NEW.commission_amount,
            NEW.worker_payout
        );
    END IF;
    
    -- Track status timestamps
    IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
        NEW.confirmed_at := now();
    ELSIF NEW.status = 'in_progress' AND OLD.status = 'confirmed' THEN
        NEW.started_at := now();
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        NEW.cancelled_at := now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_booking_status_change
    BEFORE UPDATE OF status ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_worker_stats();

-- ==========================================
-- 5. UPDATE WORKER RATING ON NEW REVIEW
-- ==========================================

CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_from_customer = true THEN
        UPDATE worker_profiles
        SET 
            avg_rating = (
                SELECT ROUND(AVG(rating)::numeric, 2)
                FROM reviews
                WHERE reviewee_id = NEW.reviewee_id AND is_from_customer = true
            ),
            total_reviews = (
                SELECT COUNT(*)
                FROM reviews
                WHERE reviewee_id = NEW.reviewee_id AND is_from_customer = true
            )
        WHERE id = NEW.reviewee_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_review_rating_update
    AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_worker_rating();

-- ==========================================
-- 6. CREATE NOTIFICATION HELPER
-- ==========================================

CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_title_hi TEXT,
    p_message TEXT,
    p_message_hi TEXT,
    p_type TEXT,
    p_reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notif_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, title_hi, message, message_hi, type, reference_id)
    VALUES (p_user_id, p_title, p_title_hi, p_message, p_message_hi, p_type, p_reference_id)
    RETURNING id INTO notif_id;
    
    RETURN notif_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 7. AUTO-NOTIFY ON BOOKING STATUS CHANGE
-- ==========================================

CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify customer on status change
    IF NEW.status = 'confirmed' THEN
        PERFORM create_notification(
            NEW.customer_id,
            'Booking Confirmed!',
            'बुकिंग कन्फर्म हो गई!',
            'Your booking #' || NEW.booking_number || ' has been confirmed.',
            'आपकी बुकिंग #' || NEW.booking_number || ' कन्फर्म हो गई है।',
            'booking_confirmed',
            NEW.id
        );
    ELSIF NEW.status = 'in_progress' THEN
        PERFORM create_notification(
            NEW.customer_id,
            'Work Started',
            'काम शुरू हो गया',
            'Worker has started work on booking #' || NEW.booking_number,
            'बुकिंग #' || NEW.booking_number || ' पर काम शुरू हो गया है',
            'booking_started',
            NEW.id
        );
    ELSIF NEW.status = 'completed' THEN
        PERFORM create_notification(
            NEW.customer_id,
            'Work Completed!',
            'काम पूरा हो गया!',
            'Booking #' || NEW.booking_number || ' is completed. Please rate the worker.',
            'बुकिंग #' || NEW.booking_number || ' पूरी हो गई। कृपया वर्कर को रेट करें।',
            'booking_completed',
            NEW.id
        );
    END IF;
    
    -- Notify worker on new booking
    IF TG_OP = 'INSERT' THEN
        PERFORM create_notification(
            NEW.worker_id,
            'New Booking Request!',
            'नई बुकिंग अनुरोध!',
            'You have a new booking request #' || NEW.booking_number,
            'आपको एक नई बुकिंग #' || NEW.booking_number || ' मिली है',
            'booking_new',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_booking_notify
    AFTER INSERT OR UPDATE OF status ON bookings
    FOR EACH ROW EXECUTE FUNCTION notify_booking_status_change();

-- ==========================================
-- 8. NEARBY WORKERS SEARCH FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION get_nearby_workers(
    p_lat DECIMAL,
    p_lng DECIMAL,
    p_radius_km INT DEFAULT 10,
    p_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
    worker_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    hourly_rate DECIMAL,
    monthly_rate DECIMAL,
    avg_rating DECIMAL,
    total_reviews INT,
    total_jobs INT,
    availability availability_status,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS worker_id,
        p.full_name,
        p.avatar_url,
        wp.bio,
        wp.hourly_rate,
        wp.monthly_rate,
        wp.avg_rating,
        wp.total_reviews,
        wp.total_jobs,
        wp.availability,
        ROUND(
            (6371 * acos(
                cos(radians(p_lat)) * cos(radians(p.latitude)) *
                cos(radians(p.longitude) - radians(p_lng)) +
                sin(radians(p_lat)) * sin(radians(p.latitude))
            ))::numeric, 2
        ) AS distance_km
    FROM profiles p
    JOIN worker_profiles wp ON p.id = wp.id
    WHERE p.role = 'worker'
        AND p.is_banned = false
        AND wp.availability != 'offline'
        AND (p_category_id IS NULL OR EXISTS (
            SELECT 1 FROM worker_categories wc WHERE wc.worker_id = p.id AND wc.category_id = p_category_id
        ))
    HAVING 
        ROUND(
            (6371 * acos(
                cos(radians(p_lat)) * cos(radians(p.latitude)) *
                cos(radians(p.longitude) - radians(p_lng)) +
                sin(radians(p_lat)) * sin(radians(p.latitude))
            ))::numeric, 2
        ) <= p_radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 9. PLATFORM ANALYTICS (Admin)
-- ==========================================

CREATE OR REPLACE FUNCTION get_platform_analytics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_workers', (SELECT COUNT(*) FROM profiles WHERE role = 'worker'),
        'total_customers', (SELECT COUNT(*) FROM profiles WHERE role = 'customer'),
        'total_bookings', (SELECT COUNT(*) FROM bookings),
        'active_bookings', (SELECT COUNT(*) FROM bookings WHERE status IN ('pending', 'confirmed', 'in_progress')),
        'completed_bookings', (SELECT COUNT(*) FROM bookings WHERE status = 'completed'),
        'total_revenue', (SELECT COALESCE(SUM(commission_amount), 0) FROM bookings WHERE status = 'completed'),
        'total_gmv', (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status = 'completed'),
        'avg_rating', (SELECT ROUND(AVG(avg_rating)::numeric, 2) FROM worker_profiles WHERE total_reviews > 0),
        'today_bookings', (SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = CURRENT_DATE),
        'today_revenue', (SELECT COALESCE(SUM(commission_amount), 0) FROM bookings WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed'),
        'this_month_revenue', (SELECT COALESCE(SUM(commission_amount), 0) FROM bookings WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) AND status = 'completed')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
