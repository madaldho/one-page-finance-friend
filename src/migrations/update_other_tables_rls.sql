-- Menambahkan kebijakan RLS untuk tabel lain agar admin dapat mengakses semua data

-----------------------------------------------
-- 1. WALLETS
-----------------------------------------------

-- Aktifkan RLS pada tabel wallets jika belum
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan yang mungkin sudah ada untuk menghindari konflik
DROP POLICY IF EXISTS "Pengguna dapat melihat dompet mereka sendiri" ON wallets;
DROP POLICY IF EXISTS "Pengguna dapat mengupdate dompet mereka sendiri" ON wallets;
DROP POLICY IF EXISTS "Pengguna dapat menyisipkan dompet mereka sendiri" ON wallets;
DROP POLICY IF EXISTS "Pengguna dapat menghapus dompet mereka sendiri" ON wallets;
DROP POLICY IF EXISTS "Admin dapat melakukan semua operasi pada wallets" ON wallets;

-- Kebijakan untuk Admin
CREATE POLICY "Admin dapat melakukan semua operasi pada wallets"
ON wallets
FOR ALL
USING (is_admin_check());

-- Kebijakan untuk pengguna biasa 
CREATE POLICY "Pengguna dapat melihat dompet mereka sendiri"
ON wallets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat mengupdate dompet mereka sendiri"
ON wallets
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat menyisipkan dompet mereka sendiri"
ON wallets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat menghapus dompet mereka sendiri"
ON wallets
FOR DELETE
USING (auth.uid() = user_id);

-----------------------------------------------
-- 2. TRANSACTIONS
-----------------------------------------------

-- Aktifkan RLS pada tabel transactions jika belum
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan yang mungkin sudah ada untuk menghindari konflik
DROP POLICY IF EXISTS "Pengguna dapat melihat transaksi mereka sendiri" ON transactions;
DROP POLICY IF EXISTS "Pengguna dapat mengupdate transaksi mereka sendiri" ON transactions;
DROP POLICY IF EXISTS "Pengguna dapat menyisipkan transaksi mereka sendiri" ON transactions;
DROP POLICY IF EXISTS "Pengguna dapat menghapus transaksi mereka sendiri" ON transactions;
DROP POLICY IF EXISTS "Admin dapat melakukan semua operasi pada transactions" ON transactions;

-- Kebijakan untuk Admin
CREATE POLICY "Admin dapat melakukan semua operasi pada transactions"
ON transactions
FOR ALL
USING (is_admin_check());

-- Kebijakan untuk pengguna biasa
CREATE POLICY "Pengguna dapat melihat transaksi mereka sendiri"
ON transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat mengupdate transaksi mereka sendiri"
ON transactions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat menyisipkan transaksi mereka sendiri"
ON transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat menghapus transaksi mereka sendiri"
ON transactions
FOR DELETE
USING (auth.uid() = user_id);

-----------------------------------------------
-- 3. CATEGORIES
-----------------------------------------------

-- Aktifkan RLS pada tabel categories jika belum
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan yang mungkin sudah ada untuk menghindari konflik
DROP POLICY IF EXISTS "Pengguna dapat melihat kategori mereka sendiri" ON categories;
DROP POLICY IF EXISTS "Pengguna dapat mengupdate kategori mereka sendiri" ON categories;
DROP POLICY IF EXISTS "Pengguna dapat menyisipkan kategori mereka sendiri" ON categories;
DROP POLICY IF EXISTS "Pengguna dapat menghapus kategori mereka sendiri" ON categories;
DROP POLICY IF EXISTS "Admin dapat melakukan semua operasi pada categories" ON categories;

-- Kebijakan untuk Admin
CREATE POLICY "Admin dapat melakukan semua operasi pada categories"
ON categories
FOR ALL
USING (is_admin_check());

-- Kebijakan untuk pengguna biasa
CREATE POLICY "Pengguna dapat melihat kategori mereka sendiri"
ON categories
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat mengupdate kategori mereka sendiri"
ON categories
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat menyisipkan kategori mereka sendiri"
ON categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat menghapus kategori mereka sendiri"
ON categories
FOR DELETE
USING (auth.uid() = user_id);

-----------------------------------------------
-- 4. ASSETS (jika digunakan)
-----------------------------------------------

-- Aktifkan RLS pada tabel assets jika belum dan jika tabel ada
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assets') THEN
        EXECUTE 'ALTER TABLE assets ENABLE ROW LEVEL SECURITY';
        
        -- Hapus kebijakan yang mungkin sudah ada
        EXECUTE 'DROP POLICY IF EXISTS "Pengguna dapat melihat aset mereka sendiri" ON assets';
        EXECUTE 'DROP POLICY IF EXISTS "Pengguna dapat mengupdate aset mereka sendiri" ON assets';
        EXECUTE 'DROP POLICY IF EXISTS "Pengguna dapat menyisipkan aset mereka sendiri" ON assets';
        EXECUTE 'DROP POLICY IF EXISTS "Pengguna dapat menghapus aset mereka sendiri" ON assets';
        EXECUTE 'DROP POLICY IF EXISTS "Admin dapat melakukan semua operasi pada assets" ON assets';
        
        -- Kebijakan untuk Admin
        EXECUTE 'CREATE POLICY "Admin dapat melakukan semua operasi pada assets"
                ON assets
                FOR ALL
                USING (is_admin_check())';
        
        -- Kebijakan untuk pengguna biasa
        EXECUTE 'CREATE POLICY "Pengguna dapat melihat aset mereka sendiri"
                ON assets
                FOR SELECT
                USING (auth.uid() = user_id)';
        
        EXECUTE 'CREATE POLICY "Pengguna dapat mengupdate aset mereka sendiri"
                ON assets
                FOR UPDATE
                USING (auth.uid() = user_id)
                WITH CHECK (auth.uid() = user_id)';
        
        EXECUTE 'CREATE POLICY "Pengguna dapat menyisipkan aset mereka sendiri"
                ON assets
                FOR INSERT
                WITH CHECK (auth.uid() = user_id)';
        
        EXECUTE 'CREATE POLICY "Pengguna dapat menghapus aset mereka sendiri"
                ON assets
                FOR DELETE
                USING (auth.uid() = user_id)';
    END IF;
END
$$;

-- Notifikasi berhasil
DO $$
BEGIN
    RAISE NOTICE 'Kebijakan RLS berhasil diterapkan pada semua tabel. Admin sekarang dapat mengakses semua data.';
END
$$; 