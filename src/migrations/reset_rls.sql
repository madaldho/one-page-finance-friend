-- Gunakan untuk reset akses dalam keadaan darurat ketika terkunci dari tabel profiles

-- 1. Nonaktifkan RLS pada tabel profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Pastikan kolom is_admin ada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Jadikan satu atau beberapa pengguna sebagai admin (ganti UUID dengan ID pengguna yang akan dijadikan admin)
UPDATE profiles
SET is_admin = true
WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;  -- Ganti dengan ID pengguna admin

-- ATAU: Jadikan pengguna pertama sebagai admin
-- UPDATE profiles
-- SET is_admin = true
-- WHERE id IN (
--     SELECT id FROM profiles
--     ORDER BY created_at ASC
--     LIMIT 1
-- );

-- 4. Hapus semua kebijakan terkait tabel profiles
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

-- 5. Buat kebijakan akses terbuka sementara (HANYA GUNAKAN UNTUK PERBAIKAN, MATIKAN SEGERA SETELAH SELESAI)
CREATE POLICY "Akses terbuka sementara"
ON profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Setelah perbaikan selesai, gunakan ini untuk mengaktifkan kembali RLS
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- CATATAN: Jangan lupa untuk menerapkan kebijakan RLS yang tepat setelah melakukan perbaikan
-- dan hapus kebijakan "Akses terbuka sementara" yang berbahaya itu. 