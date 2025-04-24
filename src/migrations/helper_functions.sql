-- Fungsi-fungsi pembantu untuk manajemen pengguna dan admin

-- 1. Menetapkan admin berdasarkan UUID
CREATE OR REPLACE FUNCTION set_user_as_admin(user_id UUID, set_admin BOOLEAN DEFAULT true)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    is_current_admin BOOLEAN;
    profile_exists BOOLEAN;
BEGIN
    -- Periksa apakah pengguna yang menjalankan fungsi ini adalah admin
    SELECT is_admin_check() INTO is_current_admin;
    
    IF NOT is_current_admin THEN
        RAISE EXCEPTION 'Hanya admin yang dapat menetapkan admin baru';
        RETURN false;
    END IF;
    
    -- Periksa apakah profil target ada
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id) INTO profile_exists;
    IF NOT profile_exists THEN
        RAISE EXCEPTION 'Profil pengguna dengan ID % tidak ditemukan', user_id;
        RETURN false;
    END IF;
    
    -- Set status admin pengguna
    UPDATE profiles
    SET 
        is_admin = set_admin,
        updated_at = now()
    WHERE id = user_id;
    
    RETURN true;
END;
$$;

-- 2. Menetapkan admin berdasarkan email
CREATE OR REPLACE FUNCTION set_admin_by_email(user_email TEXT, set_admin BOOLEAN DEFAULT true)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    target_user_id UUID;
    is_current_admin BOOLEAN;
BEGIN
    -- Periksa apakah pengguna yang menjalankan fungsi ini adalah admin
    SELECT is_admin_check() INTO is_current_admin;
    
    IF NOT is_current_admin THEN
        RAISE EXCEPTION 'Hanya admin yang dapat menetapkan admin baru';
        RETURN false;
    END IF;
    
    -- Dapatkan UUID dari email
    SELECT id INTO target_user_id
    FROM profiles
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Pengguna dengan email % tidak ditemukan', user_email;
        RETURN false;
    END IF;
    
    -- Tetapkan user sebagai admin
    RETURN set_user_as_admin(target_user_id, set_admin);
END;
$$;

-- 3. Mendapatkan daftar semua admin
CREATE OR REPLACE FUNCTION get_all_admins()
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    is_current_admin BOOLEAN;
BEGIN
    -- Periksa apakah pengguna yang menjalankan fungsi ini adalah admin
    SELECT is_admin_check() INTO is_current_admin;
    
    IF NOT is_current_admin THEN
        RAISE EXCEPTION 'Hanya admin yang dapat melihat daftar admin';
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT p.id, p.email, p.name, p.created_at, p.updated_at
    FROM profiles p
    WHERE p.is_admin = true
    ORDER BY p.created_at ASC;
END;
$$;

-- 4. Mendapatkan detail pengguna berdasarkan email
CREATE OR REPLACE FUNCTION get_user_by_email(user_email TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    is_admin BOOLEAN,
    subscription_type TEXT,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    is_current_admin BOOLEAN;
BEGIN
    -- Periksa apakah pengguna yang menjalankan fungsi ini adalah admin
    SELECT is_admin_check() INTO is_current_admin;
    
    -- Jika bukan admin, hanya bisa mendapatkan data diri sendiri
    IF NOT is_current_admin THEN
        RETURN QUERY
        SELECT p.id, p.email, p.name, p.is_admin, p.subscription_type, p.trial_start, p.trial_end, p.created_at, p.updated_at
        FROM profiles p
        WHERE p.email = user_email AND p.id = auth.uid();
    ELSE
        -- Admin dapat melihat data semua pengguna
        RETURN QUERY
        SELECT p.id, p.email, p.name, p.is_admin, p.subscription_type, p.trial_start, p.trial_end, p.created_at, p.updated_at
        FROM profiles p
        WHERE p.email = user_email;
    END IF;
END;
$$;

-- 5. Mendapatkan status langganan pengguna
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    is_admin BOOLEAN,
    subscription_type TEXT,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    days_remaining INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    is_current_admin BOOLEAN;
    target_id UUID;
BEGIN
    -- Jika user_id tidak disediakan, gunakan id pengguna saat ini
    target_id := COALESCE(user_id, auth.uid());
    
    -- Periksa apakah pengguna yang menjalankan fungsi ini adalah admin
    SELECT is_admin_check() INTO is_current_admin;
    
    -- Jika bukan admin dan mencoba melihat data pengguna lain, kembalikan error
    IF NOT is_current_admin AND target_id != auth.uid() THEN
        RAISE EXCEPTION 'Anda hanya dapat melihat status langganan Anda sendiri';
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id, 
        p.email, 
        p.name, 
        p.is_admin, 
        p.subscription_type, 
        p.trial_start, 
        p.trial_end,
        CASE 
            WHEN p.trial_end IS NULL THEN NULL
            WHEN p.trial_end < now() THEN 0
            ELSE EXTRACT(DAY FROM p.trial_end - now())::INTEGER
        END AS days_remaining
    FROM profiles p
    WHERE p.id = target_id;
END;
$$;

-- 6. Fungsi untuk membuat kebijakan RLS (untuk keadaan darurat)
CREATE OR REPLACE FUNCTION create_rls_policy(
    tabel_name TEXT,
    policy_name TEXT,
    command TEXT, -- ALL, SELECT, INSERT, UPDATE, DELETE
    using_expr TEXT,
    with_check_expr TEXT DEFAULT NULL
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    is_current_admin BOOLEAN;
    sql_command TEXT;
BEGIN
    -- Periksa apakah pengguna yang menjalankan fungsi ini adalah admin
    SELECT is_admin_check() INTO is_current_admin;
    
    IF NOT is_current_admin THEN
        RAISE EXCEPTION 'Hanya admin yang dapat membuat kebijakan RLS';
        RETURN;
    END IF;
    
    -- Buat SQL command
    sql_command := format('CREATE POLICY %I ON %I FOR %s USING (%s)', 
                          policy_name, tabel_name, command, using_expr);
    
    -- Tambahkan WITH CHECK jika ada
    IF with_check_expr IS NOT NULL THEN
        sql_command := sql_command || format(' WITH CHECK (%s)', with_check_expr);
    END IF;
    
    -- Jalankan command
    EXECUTE sql_command;
    
    RAISE NOTICE 'Kebijakan RLS % berhasil dibuat pada tabel %', policy_name, tabel_name;
END;
$$;

-- CONTOH PENGGUNAAN:
/*
-- Set user sebagai admin berdasarkan UUID
SELECT set_user_as_admin('00000000-0000-0000-0000-000000000000'::uuid, true);

-- Set user sebagai admin berdasarkan email
SELECT set_admin_by_email('admin@example.com', true);

-- Dapatkan daftar semua admin
SELECT * FROM get_all_admins();

-- Dapatkan detail pengguna berdasarkan email
SELECT * FROM get_user_by_email('user@example.com');

-- Dapatkan status langganan pengguna saat ini
SELECT * FROM get_user_subscription_status();

-- Dapatkan status langganan pengguna tertentu (hanya admin)
SELECT * FROM get_user_subscription_status('00000000-0000-0000-0000-000000000000'::uuid);

-- Buat kebijakan RLS baru (hanya admin)
SELECT create_rls_policy('profiles', 'Kebijakan khusus', 'SELECT', 'true');
*/ 