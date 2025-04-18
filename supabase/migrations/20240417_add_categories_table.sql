-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    color VARCHAR(7),
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own categories
CREATE POLICY "Users can manage their own categories"
    ON public.categories
    FOR ALL
    USING (auth.uid() = user_id);

-- Insert default categories
INSERT INTO public.categories (user_id, name, type, color, icon, sort_order) 
VALUES 
    -- Income categories
    ('00000000-0000-0000-0000-000000000000', 'Gaji', 'income', '#4CAF50', 'wallet', 1),
    ('00000000-0000-0000-0000-000000000000', 'Bonus', 'income', '#2196F3', 'gift', 2),
    ('00000000-0000-0000-0000-000000000000', 'Investasi', 'income', '#9C27B0', 'trending-up', 3),
    ('00000000-0000-0000-0000-000000000000', 'Penjualan', 'income', '#3F51B5', 'shopping-bag', 4),
    ('00000000-0000-0000-0000-000000000000', 'Hadiah', 'income', '#E91E63', 'gift', 5),
    
    -- Expense categories
    ('00000000-0000-0000-0000-000000000000', 'Makanan & Minuman', 'expense', '#FF9800', 'utensils', 1),
    ('00000000-0000-0000-0000-000000000000', 'Transportasi', 'expense', '#795548', 'car', 2),
    ('00000000-0000-0000-0000-000000000000', 'Belanja', 'expense', '#607D8B', 'shopping-cart', 3),
    ('00000000-0000-0000-0000-000000000000', 'Tagihan', 'expense', '#F44336', 'file-text', 4),
    ('00000000-0000-0000-0000-000000000000', 'Hiburan', 'expense', '#673AB7', 'film', 5),
    ('00000000-0000-0000-0000-000000000000', 'Kesehatan', 'expense', '#00BCD4', 'heart', 6),
    ('00000000-0000-0000-0000-000000000000', 'Pendidikan', 'expense', '#009688', 'book', 7);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 