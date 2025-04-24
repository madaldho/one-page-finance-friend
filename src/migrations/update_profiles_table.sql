-- Tambahkan kolom-kolom baru ke tabel profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(10) DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days');
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Set admin untuk email cupsip01@gmail.com
UPDATE profiles SET is_admin = TRUE 
FROM auth.users 
WHERE profiles.id = auth.users.id AND auth.users.email = 'cupsip01@gmail.com';

-- Set email pada profile berdasarkan auth.users
UPDATE profiles SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id AND profiles.email IS NULL;

-- Pastikan semua user memiliki tanggal trial yang terisi
UPDATE profiles 
SET trial_start = COALESCE(trial_start, NOW()),
    trial_end = COALESCE(trial_end, NOW() + INTERVAL '7 days')
WHERE trial_start IS NULL OR trial_end IS NULL; 