-- Migration: Fix subscription types support
-- File: 20240912_fix_subscription_types.sql
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing constraint if any
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_type_check;

-- Step 2: Modify subscription_type column to allow longer values
ALTER TABLE profiles ALTER COLUMN subscription_type TYPE VARCHAR(20);

-- Step 3: Add check constraint for valid subscription types
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_type_check 
CHECK (subscription_type IN (
    'free', 
    'pro_1m', 
    'pro_6m', 
    'pro_12m', 
    'pro_lifetime'
));

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_type ON profiles(subscription_type);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end ON profiles(trial_end) WHERE trial_end IS NOT NULL;

-- Step 5: Add timezone column if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Jakarta';

-- Step 6: Update existing data to ensure consistency
UPDATE profiles 
SET subscription_type = 'free' 
WHERE subscription_type NOT IN ('free', 'pro_1m', 'pro_6m', 'pro_12m', 'pro_lifetime');

-- Step 7: Handle lifetime subscriptions
UPDATE profiles 
SET trial_end = NULL 
WHERE subscription_type = 'pro_lifetime';

-- Verify the changes
SELECT 
    subscription_type,
    COUNT(*) as user_count,
    AVG(EXTRACT(days FROM (trial_end - NOW()))) as avg_days_remaining
FROM profiles 
GROUP BY subscription_type
ORDER BY subscription_type;