-- Tambahkan kolom timezone ke tabel profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Jakarta';

-- Update timezone yang kosong dengan default
UPDATE profiles SET timezone = 'Asia/Jakarta' WHERE timezone IS NULL;