-- Create savings_transactions table
DROP TABLE IF EXISTS public.savings_transactions;

CREATE TABLE IF NOT EXISTS public.savings_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    savings_id UUID NOT NULL REFERENCES public.savings(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw')),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on savings_transactions
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own savings_transactions
CREATE POLICY select_own_savings_transactions ON public.savings_transactions
    FOR SELECT USING (auth.uid()::uuid = user_id);

-- Create policy to allow users to insert their own savings_transactions
CREATE POLICY insert_own_savings_transactions ON public.savings_transactions
    FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

-- Create policy to allow users to update their own savings_transactions
CREATE POLICY update_own_savings_transactions ON public.savings_transactions
    FOR UPDATE USING (auth.uid()::uuid = user_id);

-- Create policy to allow users to delete their own savings_transactions
CREATE POLICY delete_own_savings_transactions ON public.savings_transactions
    FOR DELETE USING (auth.uid()::uuid = user_id);

-- Add wallet relationship to savings table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'savings' 
        AND column_name = 'savings_category'
    ) THEN
        ALTER TABLE public.savings ADD COLUMN savings_category VARCHAR(50) DEFAULT 'digital' CHECK (savings_category IN ('digital', 'fisik'));
    END IF;
END $$; 