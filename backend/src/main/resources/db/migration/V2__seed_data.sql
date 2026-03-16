-- ============================================================
-- Seed Data: Default Categories & AI Rules
-- ============================================================

-- System categories (user_id = NULL means system-wide)
INSERT INTO categories (user_id, name, icon, color, type, is_system) VALUES
(NULL, 'Salary',           'briefcase',    '#22C55E', 'INCOME',  TRUE),
(NULL, 'Freelance',        'laptop',       '#3B82F6', 'INCOME',  TRUE),
(NULL, 'Investment',       'trending-up',  '#8B5CF6', 'INCOME',  TRUE),
(NULL, 'Gift Received',    'gift',         '#EC4899', 'INCOME',  TRUE),
(NULL, 'Other Income',     'plus-circle',  '#6B7280', 'INCOME',  TRUE),
(NULL, 'Food & Dining',    'utensils',     '#F59E0B', 'EXPENSE', TRUE),
(NULL, 'Transportation',   'car',          '#3B82F6', 'EXPENSE', TRUE),
(NULL, 'Shopping',         'shopping-bag', '#EC4899', 'EXPENSE', TRUE),
(NULL, 'Entertainment',    'film',         '#8B5CF6', 'EXPENSE', TRUE),
(NULL, 'Bills & Utilities','zap',          '#EF4444', 'EXPENSE', TRUE),
(NULL, 'Healthcare',       'heart',        '#10B981', 'EXPENSE', TRUE),
(NULL, 'Education',        'book',         '#6366F1', 'EXPENSE', TRUE),
(NULL, 'Travel',           'plane',        '#06B6D4', 'EXPENSE', TRUE),
(NULL, 'Groceries',        'shopping-cart','#84CC16', 'EXPENSE', TRUE),
(NULL, 'Rent & Housing',   'home',         '#F97316', 'EXPENSE', TRUE),
(NULL, 'Insurance',        'shield',       '#14B8A6', 'EXPENSE', TRUE),
(NULL, 'Subscriptions',    'repeat',       '#A855F7', 'EXPENSE', TRUE),
(NULL, 'Personal Care',    'scissors',     '#F472B6', 'EXPENSE', TRUE),
(NULL, 'Transfer',         'arrow-right',  '#6B7280', 'BOTH',    TRUE),
(NULL, 'Other',            'more-horizontal','#9CA3AF','BOTH',   TRUE);

-- AI Category Rules (keyword → category mapping)
-- Food & Dining (category_id = 6)
INSERT INTO ai_category_rules (user_id, keyword, category_id, confidence, is_system) VALUES
(NULL, 'restaurant',   6, 0.95, TRUE),
(NULL, 'cafe',         6, 0.90, TRUE),
(NULL, 'coffee',       6, 0.85, TRUE),
(NULL, 'pizza',        6, 0.90, TRUE),
(NULL, 'burger',       6, 0.90, TRUE),
(NULL, 'sushi',        6, 0.90, TRUE),
(NULL, 'lunch',        6, 0.85, TRUE),
(NULL, 'dinner',       6, 0.85, TRUE),
(NULL, 'breakfast',    6, 0.85, TRUE),
(NULL, 'mcdonalds',    6, 0.95, TRUE),
(NULL, 'starbucks',    6, 0.95, TRUE),
(NULL, 'food',         6, 0.80, TRUE);

-- Transportation (category_id = 7)
INSERT INTO ai_category_rules (user_id, keyword, category_id, confidence, is_system) VALUES
(NULL, 'uber',         7, 0.95, TRUE),
(NULL, 'lyft',         7, 0.95, TRUE),
(NULL, 'taxi',         7, 0.90, TRUE),
(NULL, 'gas',          7, 0.80, TRUE),
(NULL, 'fuel',         7, 0.85, TRUE),
(NULL, 'parking',      7, 0.85, TRUE),
(NULL, 'metro',        7, 0.90, TRUE),
(NULL, 'bus',          7, 0.80, TRUE),
(NULL, 'train',        7, 0.80, TRUE);

-- Shopping (category_id = 8)
INSERT INTO ai_category_rules (user_id, keyword, category_id, confidence, is_system) VALUES
(NULL, 'amazon',       8, 0.85, TRUE),
(NULL, 'walmart',      8, 0.85, TRUE),
(NULL, 'target',       8, 0.80, TRUE),
(NULL, 'mall',         8, 0.80, TRUE),
(NULL, 'clothing',     8, 0.85, TRUE),
(NULL, 'shoes',        8, 0.85, TRUE);

-- Entertainment (category_id = 9)
INSERT INTO ai_category_rules (user_id, keyword, category_id, confidence, is_system) VALUES
(NULL, 'netflix',      9, 0.95, TRUE),
(NULL, 'spotify',      9, 0.95, TRUE),
(NULL, 'cinema',       9, 0.90, TRUE),
(NULL, 'movie',        9, 0.85, TRUE),
(NULL, 'game',         9, 0.75, TRUE),
(NULL, 'concert',      9, 0.90, TRUE);

-- Bills & Utilities (category_id = 10)
INSERT INTO ai_category_rules (user_id, keyword, category_id, confidence, is_system) VALUES
(NULL, 'electric',     10, 0.90, TRUE),
(NULL, 'water bill',   10, 0.90, TRUE),
(NULL, 'internet',     10, 0.85, TRUE),
(NULL, 'phone bill',   10, 0.85, TRUE),
(NULL, 'utility',      10, 0.85, TRUE);

-- Groceries (category_id = 14)
INSERT INTO ai_category_rules (user_id, keyword, category_id, confidence, is_system) VALUES
(NULL, 'grocery',      14, 0.90, TRUE),
(NULL, 'supermarket',  14, 0.90, TRUE),
(NULL, 'market',       14, 0.75, TRUE),
(NULL, 'costco',       14, 0.90, TRUE),
(NULL, 'whole foods',  14, 0.90, TRUE);

-- Rent & Housing (category_id = 15)
INSERT INTO ai_category_rules (user_id, keyword, category_id, confidence, is_system) VALUES
(NULL, 'rent',         15, 0.90, TRUE),
(NULL, 'mortgage',     15, 0.95, TRUE),
(NULL, 'lease',        15, 0.80, TRUE);

-- Subscriptions (category_id = 17)
INSERT INTO ai_category_rules (user_id, keyword, category_id, confidence, is_system) VALUES
(NULL, 'subscription', 17, 0.90, TRUE),
(NULL, 'membership',   17, 0.85, TRUE),
(NULL, 'premium',      17, 0.70, TRUE);

-- Default exchange rates
INSERT INTO exchange_rates (source_currency, target_currency, rate) VALUES
('USD', 'EUR', 0.920000),
('EUR', 'USD', 1.087000),
('USD', 'GBP', 0.790000),
('GBP', 'USD', 1.266000),
('USD', 'UZS', 12850.000000),
('UZS', 'USD', 0.000078),
('EUR', 'GBP', 0.858000),
('GBP', 'EUR', 1.165000);
