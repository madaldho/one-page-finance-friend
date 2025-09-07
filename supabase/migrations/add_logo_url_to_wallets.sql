-- Add logo_url column to wallets table
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Update the updated_at timestamp when logo_url is modified
CREATE OR REPLACE FUNCTION update_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_wallets_updated_at' 
        AND tgrelid = 'public.wallets'::regclass
    ) THEN
        CREATE TRIGGER update_wallets_updated_at
        BEFORE UPDATE ON public.wallets
        FOR EACH ROW
        EXECUTE FUNCTION update_wallet_updated_at();
    END IF;
END $$;