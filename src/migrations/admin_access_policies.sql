-- Aktifkan Row Level Security pada tabel profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan yang mungkin sudah ada untuk menghindari konflik
DROP POLICY IF EXISTS "Profiles dibatasi untuk pemilik akun" ON profiles;
DROP POLICY IF EXISTS "Admin dapat melihat semua profil" ON profiles;

-- Kebijakan untuk pengguna biasa: hanya dapat melihat profil mereka sendiri
CREATE POLICY "Pengguna hanya dapat melihat profil mereka sendiri"
ON profiles FOR SELECT
USING (auth.uid() = id OR is_admin_check());

-- Kebijakan untuk pengguna biasa: hanya dapat mengupdate profil mereka sendiri
CREATE POLICY "Pengguna hanya dapat mengupdate profil mereka sendiri"
ON profiles FOR UPDATE
USING (auth.uid() = id OR is_admin_check())
WITH CHECK (auth.uid() = id OR is_admin_check());

-- Kebijakan untuk admin: dapat melihat semua profil
CREATE POLICY "Admin dapat melihat semua profil"
ON profiles FOR SELECT
USING (is_admin_check());

-- Kebijakan untuk admin: dapat memperbarui semua profil 
CREATE POLICY "Admin dapat mengupdate semua profil"
ON profiles FOR UPDATE
USING (is_admin_check());

-- Kebijakan untuk admin: dapat menyisipkan profil baru
CREATE POLICY "Admin dapat menyisipkan profil baru"
ON profiles FOR INSERT
WITH CHECK (is_admin_check());

-- Kebijakan untuk admin: dapat menghapus profil
CREATE POLICY "Admin dapat menghapus profil"
ON profiles FOR DELETE
USING (is_admin_check());

-- Fungsi untuk memeriksa apakah pengguna saat ini adalah admin
CREATE OR REPLACE FUNCTION is_admin_check()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT p.is_admin INTO is_admin
  FROM profiles p
  WHERE p.id = auth.uid();
  
  -- Return false jika pengguna tidak ditemukan atau bukan admin
  RETURN COALESCE(is_admin, false);
END;
$$;

-- Fungsi untuk memperbarui status langganan pengguna (hanya admin yang dapat mengakses)
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
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Periksa apakah pengguna saat ini adalah admin
  SELECT p.is_admin INTO is_admin
  FROM profiles p
  WHERE p.id = auth.uid();
  
  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Hanya admin yang dapat mengupdate langganan pengguna';
  END IF;
  
  -- Update status langganan pengguna
  UPDATE profiles
  SET 
    subscription_type = update_user_subscription.subscription_type,
    trial_start = COALESCE(update_user_subscription.trial_start, profiles.trial_start),
    trial_end = COALESCE(update_user_subscription.trial_end, profiles.trial_end),
    updated_at = now()
  WHERE id = user_id;
END;
$$;

-- Fungsi untuk menyinkronkan email dari auth.users ke profiles ketika diperbarui
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

-- Trigger untuk menyinkronkan perubahan email di auth.users ke tabel profiles
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email <> NEW.email)
  EXECUTE FUNCTION sync_email_to_profile(); 