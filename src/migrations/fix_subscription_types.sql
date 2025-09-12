-- Fix subscription_type column constraint and add support for new subscription types
-- This migration fixes the VARCHAR length and adds check constraint for valid subscription types

-- Step 1: Remove any existing check constraint on subscription_type
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_type_check;

-- Step 2: Modify subscription_type column to allow longer values
ALTER TABLE profiles ALTER COLUMN subscription_type TYPE VARCHAR(20);

-- Step 3: Add new check constraint with all valid subscription types
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_type_check 
CHECK (subscription_type IN (
    'free', 
    'pro_1m', 
    'pro_6m', 
    'pro_12m', 
    'pro_lifetime'
));

-- Step 4: Update any existing invalid subscription types
UPDATE profiles 
SET subscription_type = 'free' 
WHERE subscription_type NOT IN ('free', 'pro_1m', 'pro_6m', 'pro_12m', 'pro_lifetime');

-- Step 5: Set trial_end to NULL for lifetime subscribers
UPDATE profiles 
SET trial_end = NULL 
WHERE subscription_type = 'pro_lifetime';

-- Step 6: Ensure all non-lifetime users have proper trial_end dates
UPDATE profiles 
SET trial_end = CASE 
    WHEN subscription_type = 'pro_1m' THEN trial_start + INTERVAL '1 month'
    WHEN subscription_type = 'pro_6m' THEN trial_start + INTERVAL '6 months'
    WHEN subscription_type = 'pro_12m' THEN trial_start + INTERVAL '12 months'
    WHEN subscription_type = 'free' THEN trial_start + INTERVAL '7 days'
    ELSE trial_end
END
WHERE subscription_type != 'pro_lifetime' AND trial_end IS NOT NULL;

-- Step 7: Add index for better performance on subscription_type queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_type ON profiles(subscription_type);

-- Step 8: Add index for trial_end queries (for admin dashboard)
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end ON profiles(trial_end) WHERE trial_end IS NOT NULL;

-- Optional: Add timezone column for future use
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Jakarta';