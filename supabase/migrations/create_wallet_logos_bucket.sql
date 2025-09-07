-- Create wallet-logos bucket in Supabase Storage
-- This should be run in the Supabase Dashboard SQL editor

-- Create the wallet-logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('wallet-logos', 'wallet-logos', true, 5242880) -- 5MB limit
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for wallet-logos bucket
CREATE POLICY "Users can upload wallet logos"
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'wallet-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view wallet logos"
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'wallet-logos');

CREATE POLICY "Users can update their wallet logos"
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'wallet-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their wallet logos"
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'wallet-logos' AND auth.uid()::text = (storage.foldername(name))[1]);