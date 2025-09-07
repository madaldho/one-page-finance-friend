# Wallet Logo Upload Feature - Setup Instructions

## Overview
This implementation adds logo upload functionality to wallets with modern UI improvements.

## Supabase Storage Setup

To enable logo uploads, you need to create a storage bucket in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create a new bucket named `wallet-logos`
4. Set the bucket to be public (for logo access)
5. Configure RLS policies as needed

### Bucket Configuration
```sql
-- Create bucket (run in Supabase SQL editor if needed)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wallet-logos', 'wallet-logos', true);

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'wallet-logos');

-- Allow public read access
CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'wallet-logos');

-- Allow users to update their own files
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'wallet-logos');

-- Allow users to delete their own files
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'wallet-logos');
```

## Database Migration

Run the migration file in your Supabase project:
- `supabase/migrations/20241216_add_logo_url_to_wallets.sql`

This adds the `logo_url` field to the wallets table.

## Features Implemented

1. **Logo Upload Component** (`src/components/ui/LogoUpload.tsx`)
   - File selection with preview
   - Drag & drop support
   - File validation (type, size)
   - Progress indication
   - Error handling

2. **Updated Wallet Form** (`src/components/WalletForm.tsx`)
   - Integrated logo upload field
   - Real-time preview in wallet card
   - Form validation including logo

3. **Enhanced Wallet Card** (`src/components/WalletCard.tsx`)
   - Logo display when available
   - Fallback to type icons
   - Modern styling with hover effects

4. **Modern UI Improvements**
   - Enhanced card designs with gradients and shadows
   - Improved button styling with hover effects
   - Better spacing and typography
   - Responsive design optimizations
   - Smooth animations and transitions

## Usage

1. Navigate to wallet creation/edit form
2. Upload a logo using the logo upload section
3. Preview appears in the wallet card preview
4. Submit form to save wallet with logo
5. Logo appears in wallet cards throughout the app

## File Requirements

- Supported formats: PNG, JPG, JPEG
- Maximum file size: 2MB
- Recommended size: 64x64px (square aspect ratio)
- Files are stored in Supabase storage with unique names