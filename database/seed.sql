-- ============================================
-- GigNearby Platform - Seed Data
-- Run this AFTER schema.sql and functions.sql
-- ============================================

-- ==========================================
-- 1. SERVICE CATEGORIES
-- ==========================================

INSERT INTO categories (name, name_hi, icon, description, description_hi, commission_rate, sort_order) VALUES
('Plumber',         'प्लम्बर',          '🔧', 'Fix leaks, pipes, taps, and water-related issues',                'लीक, पाइप, नल और पानी से जुड़ी समस्याओं को ठीक करें',           5.00, 1),
('Electrician',     'इलेक्ट्रीशियन',     '⚡', 'Wiring, fuse, switchboard, appliance repair',                     'वायरिंग, फ्यूज, स्विचबोर्ड, उपकरण मरम्मत',                   5.00, 2),
('Carpenter',       'बढ़ई',              '🪚', 'Furniture repair, wood work, fitting',                             'फर्नीचर मरम्मत, लकड़ी का काम, फिटिंग',                       5.00, 3),
('Painter',         'पेंटर',             '🎨', 'Home and office painting, wall textures',                         'घर और ऑफिस पेंटिंग, वॉल टेक्सचर',                           6.00, 4),
('Cleaner',         'सफाईकर्मी',         '🧹', 'Home deep cleaning, office cleaning, sanitization',               'घर की गहरी सफाई, ऑफिस सफाई, सैनिटाइजेशन',                   6.00, 5),
('Gardener',        'माली',              '🌱', 'Garden maintenance, plant care, landscaping',                      'बगीचे की देखभाल, पौधों की देखभाल, लैंडस्केपिंग',              6.00, 6),
('Elder Care',      'बुज़ुर्गों की देखभाल', '👴', 'Companionship, medical assistance, daily help for elderly',       'साथ, चिकित्सा सहायता, बुजुर्गों के लिए दैनिक मदद',           4.00, 7),
('Line Standing',   'लाइन में खड़ा होना',  '🧍', 'Stand in queues at offices, banks, hospitals on your behalf',     'ऑफिस, बैंक, अस्पताल में आपकी जगह लाइन में खड़े होना',         3.00, 8),
('Shopping Helper', 'शॉपिंग हेल्पर',     '🛍️', 'Help with grocery shopping, market visits, carrying bags',        'किराना खरीदारी, बाजार जाना, सामान उठाने में मदद',             3.00, 9),
('Companion',       'साथी',              '🤝', 'Companionship for walks, outings, travel, or just conversations', 'सैर, बाहर जाना, यात्रा, या बातचीत के लिए साथी',              3.00, 10),
('Cook',            'रसोइया',            '👨‍🍳', 'Home cooking, party catering, meal preparation',                  'घर का खाना, पार्टी केटरिंग, भोजन तैयार करना',                8.00, 11),
('Driver',          'ड्राइवर',            '🚗', 'Personal driver, car pickup/drop, long distance driving',         'पर्सनल ड्राइवर, कार पिकअप/ड्रॉप, लंबी दूरी की ड्राइविंग',    8.00, 12),
('Tutor',           'ट्यूटर',             '📚', 'Home tuition, exam preparation, skill coaching',                  'होम ट्यूशन, परीक्षा की तैयारी, स्किल कोचिंग',                8.00, 13),
('Tailor',          'दर्ज़ी',              '🧵', 'Stitching, alterations, blouse fitting, kurta making',            'सिलाई, अल्टरेशन, ब्लाउज फिटिंग, कुर्ता बनाना',              6.00, 14),
('AC Repair',       'एसी मरम्मत',        '❄️', 'AC servicing, gas refill, installation',                           'एसी सर्विसिंग, गैस रिफिल, इंस्टॉलेशन',                      5.00, 15),
('Pest Control',    'पेस्ट कंट्रोल',     '🪳', 'Termite, cockroach, mosquito treatment',                           'दीमक, कॉकरोच, मच्छर उपचार',                                6.00, 16),
('Packers & Movers','पैकर्स एंड मूवर्स',  '📦', 'Packing, loading, transportation, unpacking',                     'पैकिंग, लोडिंग, ट्रांसपोर्ट, अनपैकिंग',                    10.00, 17),
('Appliance Repair','उपकरण मरम्मत',      '🔌', 'TV, fridge, washing machine, microwave repair',                   'टीवी, फ्रिज, वॉशिंग मशीन, माइक्रोवेव मरम्मत',              5.00, 18);

-- ==========================================
-- 2. PLATFORM SETTINGS
-- ==========================================

INSERT INTO platform_settings (key, value, description) VALUES
('platform_name',       'GigNearby',                    'Platform display name'),
('platform_name_hi',    'गिगनियरबाई',                    'Platform name in Hindi'),
('default_commission',  '5',                             'Default commission rate (%)'),
('min_commission',      '2',                             'Minimum commission rate (%)'),
('max_commission',      '10',                            'Maximum commission rate (%)'),
('default_radius_km',   '10',                            'Default search radius in KM'),
('currency',            'INR',                           'Currency code'),
('currency_symbol',     '₹',                             'Currency symbol'),
('min_hourly_rate',     '100',                           'Minimum hourly rate'),
('min_monthly_rate',    '5000',                          'Minimum monthly rate'),
('support_phone',       '+91-9876543210',                'Support phone number'),
('support_email',       'support@gignearby.com',         'Support email');
