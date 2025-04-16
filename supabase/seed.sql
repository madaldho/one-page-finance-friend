-- Insert default categories
INSERT INTO public.categories (user_id, name, type, icon, color)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'Gaji', 'income', 'briefcase', '#4CAF50'),
    ('00000000-0000-0000-0000-000000000000', 'Investasi', 'income', 'trending-up', '#2196F3'),
    ('00000000-0000-0000-0000-000000000000', 'Makanan', 'expense', 'utensils', '#FF9800'),
    ('00000000-0000-0000-0000-000000000000', 'Transportasi', 'expense', 'car', '#9C27B0'),
    ('00000000-0000-0000-0000-000000000000', 'Hiburan', 'expense', 'film', '#E91E63'),
    ('00000000-0000-0000-0000-000000000000', 'Kesehatan', 'expense', 'heart', '#F44336'),
    ('00000000-0000-0000-0000-000000000000', 'Pendidikan', 'expense', 'book', '#3F51B5'),
    ('00000000-0000-0000-0000-000000000000', 'Tabungan', 'transfer', 'piggy-bank', '#FFC107');

-- Insert dummy wallets
INSERT INTO public.wallets (user_id, name, balance, type, color, is_default)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'Dompet Utama', 5000000, 'cash', '#4CAF50', true),
    ('00000000-0000-0000-0000-000000000000', 'Rekening Bank', 10000000, 'bank', '#2196F3', false),
    ('00000000-0000-0000-0000-000000000000', 'Tabungan', 2000000, 'savings', '#FFC107', false),
    ('00000000-0000-0000-0000-000000000000', 'Investasi', 3000000, 'investment', '#9C27B0', false);

-- Insert dummy transactions
INSERT INTO public.transactions (user_id, title, amount, type, date, category_id, wallet_id, description)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'Gaji Bulanan', 10000000, 'income', '2024-04-01', 
     (SELECT id FROM public.categories WHERE name = 'Gaji'), 
     (SELECT id FROM public.wallets WHERE name = 'Rekening Bank'),
     'Gaji bulan April 2024'),
    
    ('00000000-0000-0000-0000-000000000000', 'Belanja Bulanan', 2000000, 'expense', '2024-04-02',
     (SELECT id FROM public.categories WHERE name = 'Makanan'),
     (SELECT id FROM public.wallets WHERE name = 'Dompet Utama'),
     'Belanja kebutuhan bulanan'),
    
    ('00000000-0000-0000-0000-000000000000', 'Bensin', 300000, 'expense', '2024-04-03',
     (SELECT id FROM public.categories WHERE name = 'Transportasi'),
     (SELECT id FROM public.wallets WHERE name = 'Dompet Utama'),
     'Isi bensin mobil'),
    
    ('00000000-0000-0000-0000-000000000000', 'Transfer ke Tabungan', 1000000, 'transfer', '2024-04-04',
     (SELECT id FROM public.categories WHERE name = 'Tabungan'),
     (SELECT id FROM public.wallets WHERE name = 'Rekening Bank'),
     'Tabungan rutin bulanan');

-- Insert dummy budgets
INSERT INTO public.budgets (user_id, category_id, amount, period, spent, start_date, end_date)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 
     (SELECT id FROM public.categories WHERE name = 'Makanan'),
     2000000, 'monthly', 500000, '2024-04-01', '2024-04-30'),
    
    ('00000000-0000-0000-0000-000000000000',
     (SELECT id FROM public.categories WHERE name = 'Transportasi'),
     1000000, 'monthly', 300000, '2024-04-01', '2024-04-30'),
    
    ('00000000-0000-0000-0000-000000000000',
     (SELECT id FROM public.categories WHERE name = 'Hiburan'),
     500000, 'monthly', 200000, '2024-04-01', '2024-04-30');

-- Insert dummy savings
INSERT INTO public.savings (user_id, name, target_amount, current_amount, target_date, wallet_id)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'Dana Darurat', 10000000, 2000000, '2024-12-31',
     (SELECT id FROM public.wallets WHERE name = 'Tabungan')),
    
    ('00000000-0000-0000-0000-000000000000', 'Liburan', 5000000, 1000000, '2024-08-01',
     (SELECT id FROM public.wallets WHERE name = 'Tabungan'));

-- Insert dummy loans
INSERT INTO public.loans (user_id, description, amount, type, status, borrower, due_date, paid_amount, interest_rate, wallet_id)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'Pinjaman ke Teman', 500000, 'receivable', 'unpaid', 'Budi', '2024-05-01', NULL, 0,
     (SELECT id FROM public.wallets WHERE name = 'Dompet Utama')),
    
    ('00000000-0000-0000-0000-000000000000', 'Pinjaman Bank', 2000000, 'payable', 'partial', 'Bank ABC', '2024-06-01', 1000000, 5.5,
     (SELECT id FROM public.wallets WHERE name = 'Rekening Bank'));

-- Insert dummy recurring transactions
INSERT INTO public.recurring_transactions (user_id, title, amount, type, category_id, wallet_id, frequency, start_date, end_date, next_occurrence)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'Gaji Bulanan', 10000000, 'income',
     (SELECT id FROM public.categories WHERE name = 'Gaji'),
     (SELECT id FROM public.wallets WHERE name = 'Rekening Bank'),
     'monthly', '2024-01-01', NULL, '2024-05-01'),
    
    ('00000000-0000-0000-0000-000000000000', 'Tagihan Listrik', 500000, 'expense',
     (SELECT id FROM public.categories WHERE name = 'Kesehatan'),
     (SELECT id FROM public.wallets WHERE name = 'Rekening Bank'),
     'monthly', '2024-01-01', NULL, '2024-05-01');

-- Insert dummy goals
INSERT INTO public.goals (user_id, name, target_amount, current_amount, target_date, category, priority, status)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'DP Rumah', 50000000, 10000000, '2025-12-31', 'property', 'high', 'active'),
    ('00000000-0000-0000-0000-000000000000', 'Kursus Bahasa', 5000000, 2000000, '2024-08-01', 'education', 'medium', 'active');

-- Insert dummy reports
INSERT INTO public.reports (user_id, type, start_date, end_date, income_total, expense_total, savings_total, data)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'monthly', '2024-04-01', '2024-04-30', 10000000, 3000000, 1000000,
     '{"categories": {"Makanan": 2000000, "Transportasi": 1000000}, "trends": {"income": [10000000], "expense": [3000000]}}');

-- Insert user settings
INSERT INTO public.user_settings (user_id, currency, language, theme, show_budgeting, show_savings, show_loans, show_goals, show_reports, notification_enabled)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'IDR', 'id', 'light', true, true, true, true, true, true); 