-- 1. Pastikan kolom is_admin ada di tabel profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Nonaktifkan sementara RLS untuk memperbarui data
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Jadikan pengguna pertama sebagai admin (opsional, sesuaikan dengan email admin Anda)
UPDATE profiles
SET is_admin = true
WHERE id IN (
    SELECT id FROM profiles
    ORDER BY created_at ASC
    LIMIT 1
);

-- 4. Pastikan kolom lain yang diperlukan juga ada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'subscription_type'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_type TEXT DEFAULT 'free';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'trial_start'
    ) THEN
        ALTER TABLE profiles ADD COLUMN trial_start TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'trial_end'
    ) THEN
        ALTER TABLE profiles ADD COLUMN trial_end TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- 5. Pastikan admin sudah ada sebelum mengaktifkan RLS
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM profiles WHERE is_admin = true;
    
    IF admin_count = 0 THEN
        RAISE EXCEPTION 'Tidak ada admin yang ditentukan! Jadikan minimal satu pengguna sebagai admin terlebih dahulu.';
    END IF;
END $$;

-- 6. Aktifkan kembali RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. Hapus kebijakan lama
DROP POLICY IF EXISTS "Pengguna hanya dapat melihat profil mereka sendiri" ON profiles;
DROP POLICY IF EXISTS "Pengguna hanya dapat mengupdate profil mereka sendiri" ON profiles;
DROP POLICY IF EXISTS "Admin dapat melihat semua profil" ON profiles;
DROP POLICY IF EXISTS "Admin dapat mengupdate semua profil" ON profiles;
DROP POLICY IF EXISTS "Admin dapat menyisipkan profil baru" ON profiles;
DROP POLICY IF EXISTS "Admin dapat menghapus profil" ON profiles;

-- 8. Fungsi is_admin_check yang lebih aman
CREATE OR REPLACE FUNCTION is_admin_check()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Periksa apakah kolom is_admin ada di tabel profiles
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_admin'
    ) THEN
        RETURN false;
    END IF;

    -- Periksa status admin
    SELECT p.is_admin INTO is_admin
    FROM profiles p
    WHERE p.id = auth.uid();
    
    RETURN COALESCE(is_admin, false);
EXCEPTION
    WHEN OTHERS THEN
        -- Jika terjadi error, return false
        RETURN false;
END;
$$;

-- 9. Kebijakan paling permisif untuk admin
CREATE POLICY "Admin dapat melakukan semua operasi"
ON profiles
FOR ALL
USING (is_admin_check());

-- 10. Kebijakan untuk pengguna biasa melihat profil mereka sendiri
CREATE POLICY "Pengguna dapat melihat profil mereka sendiri"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- 11. Kebijakan untuk pengguna biasa update profil mereka sendiri
CREATE POLICY "Pengguna dapat mengupdate profil mereka sendiri"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 12. Pengguna dapat memasukkan profil mereka sendiri
CREATE POLICY "Pengguna dapat menyisipkan profil mereka sendiri"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 13. Buat kebijakan fallback untuk memastikan setidaknya ada akses
CREATE POLICY "Pengguna yang terotentikasi dapat melihat profil mereka"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- 14. Terapkan fungsi pembaruan langganan (lebih sederhana)
CREATE OR REPLACE FUNCTION update_user_subscription(
    user_id UUID,
    subscription_type TEXT,
    trial_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    trial_end TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Tidak perlu cek admin, fungsi ini sudah SECURITY DEFINER
    UPDATE profiles
    SET 
        subscription_type = update_user_subscription.subscription_type,
        trial_start = COALESCE(update_user_subscription.trial_start, profiles.trial_start),
        trial_end = COALESCE(update_user_subscription.trial_end, profiles.trial_end),
        updated_at = now()
    WHERE id = user_id;
END;
$$;

-- 15. Fungsi sync email ke profil
CREATE OR REPLACE FUNCTION sync_email_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE profiles
    SET email = NEW.email,
        updated_at = now()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- 16. Trigger untuk sinkronisasi email
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION sync_email_to_profile(); 