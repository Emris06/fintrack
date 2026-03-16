-- ============================================================
-- Demo Account Seed Data
-- Login: demo@fintrack.com / demo123
-- ============================================================

-- Demo user (password: demo123, BCrypt hash)
INSERT INTO users (id, email, password_hash, full_name, phone, default_currency) VALUES
(1000, 'demo@fintrack.com', '$2a$10$OViVO6Ma3fS2hA1EEPpxhuyKO1w0yxRzFrLEAxWt/b8OPyPG182s.', 'Demo User', '+1234567890', 'USD');

-- ==================== ACCOUNTS ====================
-- Account IDs: 1001=Main Card, 1002=Cash Wallet, 1003=Savings, 1004=UZS Account
INSERT INTO accounts (id, user_id, name, type, currency, balance, initial_balance) VALUES
(1001, 1000, 'Main Card',      'CARD',     'USD', 4250.0000, 5000.0000),
(1002, 1000, 'Cash Wallet',    'CASH',     'USD', 820.0000,  1000.0000),
(1003, 1000, 'Savings Account','SAVINGS',  'USD', 12500.0000, 10000.0000),
(1004, 1000, 'UZS Account',    'ACCOUNT',  'UZS', 15000000.0000, 10000000.0000),
(1005, 1000, 'Investment',     'INVESTMENT','USD', 3200.0000, 2000.0000);

-- ==================== TRANSACTIONS ====================
-- Using system category IDs from V2: 1=Salary, 2=Freelance, 3=Investment, 6=Food, 7=Transport,
-- 8=Shopping, 9=Entertainment, 10=Bills, 11=Healthcare, 12=Education, 14=Groceries, 15=Rent, 17=Subscriptions

-- === FEBRUARY 2026 Transactions ===
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, transaction_date) VALUES
-- Income
(1000, 1001, 1, 'INCOME', 4500.0000, 'Monthly salary',           '2026-02-01'),
(1000, 1001, 2, 'INCOME', 800.0000,  'Freelance web project',    '2026-02-10'),
(1000, 1003, 3, 'INCOME', 150.0000,  'Stock dividends',          '2026-02-15'),
-- Expenses
(1000, 1001, 15, 'EXPENSE', 1200.0000, 'Rent payment',            '2026-02-01'),
(1000, 1001, 10, 'EXPENSE', 85.0000,   'Electric bill',           '2026-02-03'),
(1000, 1001, 10, 'EXPENSE', 55.0000,   'Internet bill',           '2026-02-03'),
(1000, 1001, 14, 'EXPENSE', 320.0000,  'Costco groceries',        '2026-02-05'),
(1000, 1002, 6,  'EXPENSE', 45.0000,   'Lunch at restaurant',     '2026-02-06'),
(1000, 1001, 17, 'EXPENSE', 15.99,     'Netflix subscription',    '2026-02-07'),
(1000, 1001, 17, 'EXPENSE', 9.99,      'Spotify premium',         '2026-02-07'),
(1000, 1002, 7,  'EXPENSE', 40.0000,   'Uber rides',              '2026-02-08'),
(1000, 1001, 8,  'EXPENSE', 180.0000,  'Amazon order - headphones','2026-02-09'),
(1000, 1002, 6,  'EXPENSE', 32.0000,   'Coffee shop',             '2026-02-11'),
(1000, 1001, 14, 'EXPENSE', 210.0000,  'Weekly groceries',        '2026-02-12'),
(1000, 1002, 9,  'EXPENSE', 28.0000,   'Cinema tickets',          '2026-02-14'),
(1000, 1001, 11, 'EXPENSE', 120.0000,  'Dentist checkup',         '2026-02-16'),
(1000, 1001, 7,  'EXPENSE', 65.0000,   'Gas station',             '2026-02-18'),
(1000, 1002, 6,  'EXPENSE', 55.0000,   'Dinner with friends',     '2026-02-20'),
(1000, 1001, 14, 'EXPENSE', 190.0000,  'Groceries',               '2026-02-22'),
(1000, 1001, 12, 'EXPENSE', 49.99,     'Udemy course',            '2026-02-24'),
(1000, 1002, 8,  'EXPENSE', 95.0000,   'Clothing store',          '2026-02-26'),
(1000, 1001, 10, 'EXPENSE', 45.0000,   'Phone bill',              '2026-02-28');

-- === MARCH 2026 Transactions ===
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, transaction_date) VALUES
-- Income
(1000, 1001, 1, 'INCOME', 4500.0000, 'Monthly salary',           '2026-03-01'),
(1000, 1001, 2, 'INCOME', 1200.0000, 'Freelance mobile app',     '2026-03-05'),
(1000, 1005, 3, 'INCOME', 280.0000,  'Investment returns',        '2026-03-06'),
-- Expenses
(1000, 1001, 15, 'EXPENSE', 1200.0000, 'Rent payment',            '2026-03-01'),
(1000, 1001, 10, 'EXPENSE', 92.0000,   'Electric bill',           '2026-03-02'),
(1000, 1001, 10, 'EXPENSE', 55.0000,   'Internet bill',           '2026-03-02'),
(1000, 1001, 14, 'EXPENSE', 280.0000,  'Costco groceries',        '2026-03-03'),
(1000, 1002, 6,  'EXPENSE', 38.0000,   'Sushi restaurant',        '2026-03-03'),
(1000, 1001, 17, 'EXPENSE', 15.99,     'Netflix subscription',    '2026-03-04'),
(1000, 1001, 17, 'EXPENSE', 9.99,      'Spotify premium',         '2026-03-04'),
(1000, 1002, 7,  'EXPENSE', 52.0000,   'Uber rides',              '2026-03-05'),
(1000, 1001, 8,  'EXPENSE', 250.0000,  'New shoes online',        '2026-03-06'),
(1000, 1002, 6,  'EXPENSE', 28.0000,   'Starbucks',               '2026-03-07');

-- ==================== TRANSFER RECORDS ====================
-- Transfer 1: Main Card -> Savings (March)
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, transaction_date) VALUES
(1000, 1001, 19, 'TRANSFER_OUT', 500.0000, 'Monthly savings',     '2026-03-01'),
(1000, 1003, 19, 'TRANSFER_IN',  500.0000, 'Monthly savings',     '2026-03-01');

INSERT INTO transfer_records (user_id, source_account_id, target_account_id, source_amount, target_amount, exchange_rate, source_currency, target_currency, description, idempotency_key, transfer_date) VALUES
(1000, 1001, 1003, 500.0000, 500.0000, 1.000000, 'USD', 'USD', 'Monthly savings', 'demo-transfer-001', '2026-03-01');

-- Transfer 2: Main Card -> UZS Account (cross-currency, Feb)
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, transaction_date) VALUES
(1000, 1001, 19, 'TRANSFER_OUT', 200.0000,      'USD to UZS conversion', '2026-02-15'),
(1000, 1004, 19, 'TRANSFER_IN',  2570000.0000,  'USD to UZS conversion', '2026-02-15');

INSERT INTO transfer_records (user_id, source_account_id, target_account_id, source_amount, target_amount, exchange_rate, source_currency, target_currency, description, idempotency_key, transfer_date) VALUES
(1000, 1001, 1004, 200.0000, 2570000.0000, 12850.000000, 'USD', 'UZS', 'USD to UZS conversion', 'demo-transfer-002', '2026-02-15');

-- Transfer 3: Cash -> Main Card (Feb)
INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, transaction_date) VALUES
(1000, 1002, 19, 'TRANSFER_OUT', 100.0000, 'Cash deposit to card', '2026-02-20'),
(1000, 1001, 19, 'TRANSFER_IN',  100.0000, 'Cash deposit to card', '2026-02-20');

INSERT INTO transfer_records (user_id, source_account_id, target_account_id, source_amount, target_amount, exchange_rate, source_currency, target_currency, description, idempotency_key, transfer_date) VALUES
(1000, 1002, 1001, 100.0000, 100.0000, 1.000000, 'USD', 'USD', 'Cash deposit to card', 'demo-transfer-003', '2026-02-20');

-- ==================== BUDGETS ====================
INSERT INTO budgets (user_id, category_id, name, amount_limit, currency, period_type, start_date) VALUES
(1000, 6,  'Dining Out',      300.0000,  'USD', 'MONTHLY', '2026-03-01'),
(1000, 14, 'Groceries',       600.0000,  'USD', 'MONTHLY', '2026-03-01'),
(1000, 8,  'Shopping',        400.0000,  'USD', 'MONTHLY', '2026-03-01'),
(1000, 9,  'Entertainment',   150.0000,  'USD', 'MONTHLY', '2026-03-01'),
(1000, 7,  'Transportation',  200.0000,  'USD', 'MONTHLY', '2026-03-01'),
(1000, 17, 'Subscriptions',   50.0000,   'USD', 'MONTHLY', '2026-03-01');

-- ==================== DEBTS ====================
INSERT INTO debts (user_id, type, person_name, amount, currency, description, due_date, status) VALUES
(1000, 'DEBT',       'John Smith',    500.0000,  'USD', 'Borrowed for car repair',      '2026-04-15', 'OPEN'),
(1000, 'RECEIVABLE', 'Sarah Johnson', 200.0000,  'USD', 'Lent for concert tickets',     '2026-03-20', 'OPEN'),
(1000, 'DEBT',       'Mike Brown',    150.0000,  'USD', 'Split dinner bill',            '2026-03-10', 'OPEN'),
(1000, 'RECEIVABLE', 'Emma Wilson',   1000.0000, 'USD', 'Freelance project payment',    '2026-03-30', 'OPEN'),
(1000, 'DEBT',       'Alex Lee',      75.0000,   'USD', 'Movie tickets and snacks',     '2026-02-28', 'CLOSED');

-- ==================== REMINDERS ====================
INSERT INTO reminders (user_id, description, amount, currency, reminder_date) VALUES
(1000, 'Pay rent',                   1200.0000, 'USD', '2026-04-01'),
(1000, 'Car insurance due',          450.0000,  'USD', '2026-03-15'),
(1000, 'Dentist appointment',        NULL,      NULL,  '2026-03-20'),
(1000, 'Pay back Mike',              150.0000,  'USD', '2026-03-10'),
(1000, 'Collect payment from Emma',  1000.0000, 'USD', '2026-03-30'),
(1000, 'Annual gym membership',      600.0000,  'USD', '2026-04-05'),
(1000, 'Tax filing deadline',        NULL,      NULL,  '2026-04-15');

-- ==================== NOTIFICATIONS ====================
INSERT INTO notifications (user_id, type, title, message, is_read) VALUES
(1000, 'BUDGET_WARNING',  'Dining budget at 80%',     'You have spent $240 of your $300 dining budget this month.',     FALSE),
(1000, 'BILL_REMINDER',   'Car insurance due soon',   'Your car insurance payment of $450 is due on March 15.',         FALSE),
(1000, 'SYSTEM',          'Welcome to FinTrack!',     'Start by adding your accounts and tracking your expenses.',       TRUE);
