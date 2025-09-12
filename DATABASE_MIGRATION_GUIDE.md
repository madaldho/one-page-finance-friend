# 🛠️ Database Migration Required

Untuk memperbaiki masalah subscription types yang tidak bisa di-update, Anda perlu menjalankan migration berikut di **Supabase Dashboard**.

## ⚠️ Masalah yang Diperbaiki:
- Column `subscription_type` terlalu pendek (VARCHAR(10)) untuk nilai `pro_lifetime`
- Constraint yang menghalangi update ke subscription types baru
- Missing support untuk lifetime subscriptions

## 📋 Langkah-langkah:

### 1. Buka Supabase Dashboard
- Login ke [supabase.com](https://supabase.com)
- Pilih project: **one-page-finance-friend**
- Masuk ke tab **SQL Editor**

### 2. Jalankan Migration SQL
Copy dan paste script berikut ke SQL Editor, lalu klik **Run**:

```sql
-- Migration: Fix subscription types support
-- Date: 2025-09-12

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

-- Step 7: Handle lifetime subscriptions (set trial_end to NULL)
UPDATE profiles 
SET trial_end = NULL 
WHERE subscription_type = 'pro_lifetime';

-- Step 8: Verify the changes
SELECT 
    subscription_type,
    COUNT(*) as user_count,
    AVG(EXTRACT(days FROM (trial_end - NOW()))) as avg_days_remaining
FROM profiles 
WHERE subscription_type IS NOT NULL
GROUP BY subscription_type
ORDER BY subscription_type;
```

### 3. Verifikasi Hasil
Setelah menjalankan migration, Anda akan melihat output seperti:

```
subscription_type | user_count | avg_days_remaining
------------------|------------|-------------------
free              | 5          | 7.2
pro_1m            | 0          | null
pro_6m            | 2          | 180.5
pro_12m           | 1          | 365.0
pro_lifetime      | 0          | null
```

### 4. Test Admin Panel
- Buka `/admin/users`
- Coba ubah subscription type user
- Seharusnya tidak ada error lagi!

## ✅ Hasil yang Diharapkan:
- ✅ Admin dapat mengubah subscription ke semua tipe (1m, 6m, 12m, lifetime)
- ✅ Lifetime users akan menampilkan "∞" untuk days remaining
- ✅ Database akan tersinkronisasi dengan perubahan UI
- ✅ Revenue calculation di dashboard akan akurat
- ✅ Console error akan hilang

## 🚨 Troubleshooting:
Jika masih ada error setelah migration:

1. **Restart development server**:
   ```bash
   npm run dev
   # atau
   bun run dev
   ```

2. **Clear browser cache** dan refresh halaman admin

3. **Check console logs** untuk error detail

4. **Verify di Supabase** bahwa table structure sudah berubah:
   ```sql
   SELECT column_name, data_type, character_maximum_length 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name = 'subscription_type';
   ```

## 📞 Support:
Jika masih ada masalah, screenshot error console dan table structure untuk debugging lebih lanjut.