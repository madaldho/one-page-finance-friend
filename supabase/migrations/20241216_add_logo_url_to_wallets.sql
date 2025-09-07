-- Add logo_url column to wallets table
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.wallets.logo_url IS 'URL to the wallet logo/icon image stored in Supabase storage';