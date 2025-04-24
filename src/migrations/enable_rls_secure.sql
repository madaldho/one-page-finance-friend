-- 1. Pastikan kolom is_admin sudah diset dengan benar
-- PERIKSA admin pertama (ganti dengan ID yang sesuai jika perlu)
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE is_admin = true;
  
  IF admin_count = 0 THEN
    RAISE EXCEPTION 'Tidak ada admin yang ditentukan! Jalankan query berikut terlebih dahulu:
    UPDATE profiles SET is_admin = true WHERE id = '''::text || (SELECT id FROM profiles ORDER BY created_at LIMIT 1)::text || ''';';
  END IF;
END $$;

-- 2. Hapus kebijakan akses terbuka sementara yang berbahaya
DROP POLICY IF EXISTS "Akses terbuka sementara" ON profiles;

-- 3. Hapus semua kebijakan lama untuk menghindari konflik
DROP POLICY IF EXISTS "Pengguna hanya dapat melihat profil mereka sendiri" ON profiles;
DROP POLICY IF EXISTS "Pengguna hanya dapat mengupdate profil mereka sendiri" ON profiles;
DROP POLICY IF EXISTS "Admin dapat melihat semua profil" ON profiles;
DROP POLICY IF EXISTS "Admin dapat mengupdate semua profil" ON profiles;
DROP POLICY IF EXISTS "Admin dapat menyisipkan profil baru" ON profiles;
DROP POLICY IF EXISTS "Admin dapat menghapus profil" ON profiles;
DROP POLICY IF EXISTS "Pengguna dapat melihat profil mereka sendiri" ON profiles;
DROP POLICY IF EXISTS "Pengguna dapat mengupdate profil mereka sendiri" ON profiles;
DROP POLICY IF EXISTS "Pengguna dapat menyisipkan profil mereka sendiri" ON profiles;
DROP POLICY IF EXISTS "Pengguna yang terotentikasi dapat melihat profil mereka" ON profiles;
DROP POLICY IF EXISTS "Admin dapat melakukan semua operasi" ON profiles;

-- 4. Periksa fungsi is_admin_check() sudah tepat
CREATE OR REPLACE FUNCTION is_admin_check()
RETURNS BOOLEAN
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
  
  -- Jika null atau false, kembalikan false
  RETURN COALESCE(is_admin, false);
EXCEPTION
  WHEN OTHERS THEN
    -- Jika terjadi error, return false
    RETURN false;
END;
$$;

-- 5. Buat kebijakan yang tepat
-- Kebijakan untuk Admin (dapat melakukan semua operasi)
CREATE POLICY "Admin dapat melakukan semua operasi"
ON profiles
FOR ALL
USING (is_admin_check());

-- Kebijakan untuk pengguna biasa (hanya dapat melihat profil mereka sendiri)
CREATE POLICY "Pengguna dapat melihat profil mereka sendiri"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Kebijakan untuk pengguna biasa (dapat memperbarui profil mereka sendiri)
CREATE POLICY "Pengguna dapat mengupdate profil mereka sendiri"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Kebijakan untuk pengguna biasa (dapat menyisipkan profil mereka sendiri)
CREATE POLICY "Pengguna dapat menyisipkan profil mereka sendiri"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 6. AKTIFKAN RLS kembali dengan aman
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. Tampilkan informasi admin saat ini untuk verifikasi
DO $$
DECLARE
  admin_info RECORD;
BEGIN
  SELECT id, email, name, is_admin INTO admin_info 
  FROM profiles 
  WHERE is_admin = true 
  LIMIT 1;
  
  RAISE NOTICE 'Admin aktif: ID=%, Email=%, Nama=%, Is Admin=%', 
    admin_info.id, 
    admin_info.email, 
    admin_info.name, 
    admin_info.is_admin;
END $$; 