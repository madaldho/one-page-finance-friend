# Implementasi Perubahan Database untuk Manajemen Hutang/Piutang

Dokumen ini berisi panduan untuk menerapkan perubahan skema database dan database triggers yang diperlukan untuk memperbaiki masalah pada fitur Hutang & Piutang di aplikasi keuangan.

## Tujuan Perubahan

1. Menambahkan kolom `wallet_id` dan `wallet_name` pada tabel `loans` dan `payments`
2. Membuat database triggers untuk menghandle:
   - Otomatis memperbarui saldo wallet saat hutang/piutang dihapus
   - Otomatis mensinkronkan nama wallet ke hutang/piutang saat perubahan wallet_id

## Cara Implementasi di Supabase

### 1. Buka Supabase Dashboard

Login ke dashboard Supabase dan pilih project yang sedang dikembangkan.

### 2. Tambahkan Kolom dengan SQL Editor

1. Buka SQL Editor di dashboard Supabase
2. Paste SQL berikut dan jalankan:

```sql
-- Add wallet_id and wallet_name columns to the loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS wallet_name TEXT;

-- Add wallet_id and wallet_name columns to the payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS wallet_name TEXT;
```

### 3. Buat Trigger untuk Memperbarui Saldo Wallet

Tambahkan function dan trigger berikut untuk memperbarui saldo wallet secara otomatis saat hutang/piutang dihapus:

```sql
-- Create a function to update wallet balance when a loan is deleted
CREATE OR REPLACE FUNCTION update_wallet_balance_on_loan_delete()
RETURNS TRIGGER AS $$
DECLARE
  adjustment NUMERIC;
  wallet_rec RECORD;
BEGIN
  -- Only process if the loan has a wallet_id
  IF OLD.wallet_id IS NOT NULL THEN
    -- Get current wallet data
    SELECT * INTO wallet_rec FROM wallets WHERE id = OLD.wallet_id;
    
    IF FOUND THEN
      -- Calculate adjustment based on loan type
      IF OLD.type = 'payable' THEN
        -- For payable loans (money we borrowed):
        -- When deleted: remove initial amount, add back paid amount
        adjustment := -OLD.amount + COALESCE(OLD.paid_amount, 0);
      ELSE
        -- For receivable loans (money we lent):
        -- When deleted: add back initial amount, remove paid amount
        adjustment := OLD.amount - COALESCE(OLD.paid_amount, 0);
      END IF;
      
      -- Update wallet balance
      UPDATE wallets 
      SET balance = wallet_rec.balance + adjustment,
          updated_at = NOW()
      WHERE id = OLD.wallet_id;
      
      RAISE NOTICE 'Updated wallet % balance from % to % (adjustment: %)', 
        OLD.wallet_id, wallet_rec.balance, wallet_rec.balance + adjustment, adjustment;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists already
DROP TRIGGER IF EXISTS loan_delete_trigger ON loans;

-- Create the trigger
CREATE TRIGGER loan_delete_trigger
BEFORE DELETE ON loans
FOR EACH ROW
EXECUTE FUNCTION update_wallet_balance_on_loan_delete();
```

### 4. Buat Trigger untuk Sinkronisasi Nama Wallet

Tambahkan function dan trigger untuk menyinkronkan nama wallet secara otomatis:

```sql
-- Create function to update loan with wallet_name when wallet_id is set
CREATE OR REPLACE FUNCTION sync_loan_wallet_name()
RETURNS TRIGGER AS $$
DECLARE
  wallet_name_val TEXT;
BEGIN
  -- Only process if wallet_id is set and changed or wallet_name is not set
  IF NEW.wallet_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.wallet_id <> OLD.wallet_id OR NEW.wallet_name IS NULL) THEN
    -- Get wallet name
    SELECT name INTO wallet_name_val FROM wallets WHERE id = NEW.wallet_id;
    
    IF FOUND THEN
      NEW.wallet_name := wallet_name_val;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists already
DROP TRIGGER IF EXISTS loan_wallet_sync_trigger ON loans;

-- Create the trigger
CREATE TRIGGER loan_wallet_sync_trigger
BEFORE INSERT OR UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION sync_loan_wallet_name();
```

### 5. Memigrasikan Data yang Ada

Untuk memperbarui data yang sudah ada:

```sql
-- Update existing loans with their wallet names
UPDATE loans l
SET wallet_name = w.name
FROM wallets w
WHERE l.wallet_id = w.id
AND (l.wallet_name IS NULL OR l.wallet_name <> w.name);

-- Update existing payments with their wallet names
UPDATE payments p
SET wallet_name = w.name
FROM wallets w
WHERE p.wallet_id = w.id
AND (p.wallet_name IS NULL OR p.wallet_name <> w.name);
```

## Verifikasi Implementasi

Setelah menerapkan perubahan:

1. Periksa apakah kolom baru sudah muncul di tabel loan dan payments
2. Buat entri hutang/piutang baru dan verifikasi kolom wallet_name otomatis terisi
3. Hapus hutang/piutang dan verifikasi saldo wallet berubah dengan benar
4. Ubah wallet_id dari hutang/piutang dan verifikasi wallet_name diperbarui secara otomatis

## Perubahan Kode Aplikasi

Pastikan tipe data di aplikasi sudah diperbarui dengan menambahkan `wallet_id` dan `wallet_name` ke interface `Loan` dan `Payment` di file `src/types/index.ts`. 