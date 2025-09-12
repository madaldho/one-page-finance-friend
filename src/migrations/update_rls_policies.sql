-- Update RLS policies to support new subscription types
-- This ensures admin access and proper user permissions

-- Step 1: Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies to recreate them
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

-- Step 3: Create new policies that support all subscription types

-- Allow users to see their own profile
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        (SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE
    );

-- Allow users to update their own profile, admins can update any profile
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (
        auth.uid() = id OR 
        (SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE
    );

-- Allow users to insert their own profile
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 4: Grant necessary permissions for admin operations
-- Ensure admin users can query all profiles
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Step 5: Create helper function for admin checks
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE((
        SELECT is_admin 
        FROM profiles 
        WHERE id = user_id
    ), FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create function to check subscription status
CREATE OR REPLACE FUNCTION get_subscription_status(user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
    subscription_type TEXT,
    is_active BOOLEAN,
    days_remaining INTEGER,
    is_lifetime BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.subscription_type::TEXT,
        CASE 
            WHEN p.subscription_type = 'pro_lifetime' THEN TRUE
            WHEN p.trial_end IS NULL THEN FALSE
            WHEN p.trial_end > NOW() THEN TRUE
            ELSE FALSE
        END as is_active,
        CASE 
            WHEN p.subscription_type = 'pro_lifetime' THEN NULL
            WHEN p.trial_end IS NULL THEN 0
            ELSE EXTRACT(days FROM (p.trial_end - NOW()))::INTEGER
        END as days_remaining,
        (p.subscription_type = 'pro_lifetime') as is_lifetime
    FROM profiles p
    WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;