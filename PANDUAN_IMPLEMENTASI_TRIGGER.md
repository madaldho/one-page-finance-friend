# Panduan Implementasi Trigger Database untuk Memperbaiki Saldo Wallet

## Deskripsi Masalah

Saat ini, aplikasi mengalami masalah dengan saldo wallet yang tidak diperbarui dengan benar saat loan dihapus. Hal ini karena:

1. Ada dua mekanisme yang bekerja secara bersamaan:
   - Database trigger `update_wallet_balance_on_loan_delete()` yang otomatis menyesuaikan saldo wallet
   - Kode manual di aplikasi yang juga menyesuaikan saldo wallet melalui fungsi `adjustWalletBalance()`

Masalah ini menyebabkan perhitungan ganda, di mana saldo wallet diperbarui dua kali ketika loan dihapus. Perbaikan sudah dilakukan dengan menghapus kode manual di aplikasi.

## Langkah 1: Akses SQL Editor di Supabase

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project yang sedang dikembangkan
3. Pilih menu "SQL Editor" 
4. Buat Query baru ("New Query")

## Langkah 2: Implementasi Trigger Database

Pastikan trigger database berikut sudah ada dan berjalan dengan benar. Jika belum, jalankan SQL berikut:

```sql
-- Function untuk menangani transaksi (insert/update)
CREATE OR REPLACE FUNCTION update_wallet_balance_on_transaction_change()
RETURNS TRIGGER AS $$
DECLARE
  adjustment NUMERIC;
  wallet_rec RECORD;
  dest_wallet_rec RECORD;
BEGIN
  -- Untuk INSERT: tambahkan/kurangi saldo wallet
  IF (TG_OP = 'INSERT') THEN
    -- Get wallet data
    SELECT * INTO wallet_rec FROM wallets WHERE id = NEW.wallet_id;
    
    IF FOUND THEN
      -- Penanganan untuk tipe transaksi berbeda
      IF NEW.type = 'income' THEN
        -- Pemasukan: tambahkan ke saldo
        adjustment := NEW.amount;
      ELSIF NEW.type = 'expense' THEN
        -- Pengeluaran: kurangi dari saldo
        adjustment := -NEW.amount;
      ELSIF NEW.type = 'transfer' AND NEW.destination_wallet_id IS NOT NULL THEN
        -- Transfer keluar: kurangi dari saldo wallet sumber
        adjustment := -NEW.amount;
        
        -- Tangani wallet tujuan
        SELECT * INTO dest_wallet_rec FROM wallets WHERE id = NEW.destination_wallet_id;
        IF FOUND THEN
          -- Tambahkan ke wallet tujuan
          UPDATE wallets 
          SET balance = dest_wallet_rec.balance + NEW.amount,
              updated_at = NOW()
          WHERE id = NEW.destination_wallet_id;
        END IF;
      ELSE
        -- Tipe transaksi lain, tidak perlu diproses
        RETURN NEW;
      END IF;
      
      -- Update saldo wallet
      UPDATE wallets 
      SET balance = wallet_rec.balance + adjustment,
          updated_at = NOW()
      WHERE id = NEW.wallet_id;
    END IF;
    
    RETURN NEW;
  
  -- Untuk UPDATE: sesuaikan saldo wallet
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Jika amount/tipe/wallet_id berubah, sesuaikan saldo
    IF (NEW.amount <> OLD.amount OR NEW.type <> OLD.type OR NEW.wallet_id <> OLD.wallet_id OR
        COALESCE(NEW.destination_wallet_id, '00000000-0000-0000-0000-000000000000') <> COALESCE(OLD.destination_wallet_id, '00000000-0000-0000-0000-000000000000')) THEN
      
      -- Pertama, kembalikan saldo wallet lama
      IF OLD.wallet_id IS NOT NULL THEN
        SELECT * INTO wallet_rec FROM wallets WHERE id = OLD.wallet_id;
        
        IF FOUND THEN
          IF OLD.type = 'income' THEN
            adjustment := -OLD.amount; -- Kembalikan pemasukan
          ELSIF OLD.type = 'expense' THEN
            adjustment := OLD.amount; -- Kembalikan pengeluaran
          ELSIF OLD.type = 'transfer' THEN
            adjustment := OLD.amount; -- Kembalikan transfer keluar
            
            -- Juga sesuaikan wallet tujuan jika perlu
            IF OLD.destination_wallet_id IS NOT NULL THEN
              SELECT * INTO dest_wallet_rec FROM wallets WHERE id = OLD.destination_wallet_id;
              IF FOUND THEN
                UPDATE wallets 
                SET balance = dest_wallet_rec.balance - OLD.amount,
                    updated_at = NOW()
                WHERE id = OLD.destination_wallet_id;
              END IF;
            END IF;
          END IF;
          
          -- Update wallet lama
          UPDATE wallets 
          SET balance = wallet_rec.balance + adjustment,
              updated_at = NOW()
          WHERE id = OLD.wallet_id;
        END IF;
      END IF;
      
      -- Kemudian, terapkan transaksi baru
      IF NEW.wallet_id IS NOT NULL THEN
        SELECT * INTO wallet_rec FROM wallets WHERE id = NEW.wallet_id;
        
        IF FOUND THEN
          IF NEW.type = 'income' THEN
            adjustment := NEW.amount; -- Tambahkan pemasukan baru
          ELSIF NEW.type = 'expense' THEN
            adjustment := -NEW.amount; -- Kurangkan pengeluaran baru
          ELSIF NEW.type = 'transfer' THEN
            adjustment := -NEW.amount; -- Kurangkan transfer keluar baru
            
            -- Sesuaikan wallet tujuan baru jika ada
            IF NEW.destination_wallet_id IS NOT NULL THEN
              SELECT * INTO dest_wallet_rec FROM wallets WHERE id = NEW.destination_wallet_id;
              IF FOUND THEN
                UPDATE wallets 
                SET balance = dest_wallet_rec.balance + NEW.amount,
                    updated_at = NOW()
                WHERE id = NEW.destination_wallet_id;
              END IF;
            END IF;
          END IF;
          
          -- Update wallet baru
          UPDATE wallets 
          SET balance = wallet_rec.balance + adjustment,
              updated_at = NOW()
          WHERE id = NEW.wallet_id;
        END IF;
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function untuk menangani penghapusan transaksi
CREATE OR REPLACE FUNCTION update_wallet_balance_on_transaction_delete()
RETURNS TRIGGER AS $$
DECLARE
  adjustment NUMERIC;
  wallet_rec RECORD;
  dest_wallet_rec RECORD;
BEGIN
  -- Get current wallet data
  IF OLD.wallet_id IS NOT NULL THEN
    SELECT * INTO wallet_rec FROM wallets WHERE id = OLD.wallet_id;
    
    IF FOUND THEN
      -- Hitung adjustment berdasarkan tipe transaksi
      IF OLD.type = 'income' THEN
        -- Jika pemasukan dihapus: kurangi saldo
        adjustment := -OLD.amount;
      ELSIF OLD.type = 'expense' THEN
        -- Jika pengeluaran dihapus: tambahkan saldo
        adjustment := OLD.amount;
      ELSIF OLD.type = 'transfer' THEN
        -- Jika transfer dihapus: tambahkan saldo ke wallet sumber
        adjustment := OLD.amount;
        
        -- Dan kurangi dari wallet tujuan jika ada
        IF OLD.destination_wallet_id IS NOT NULL THEN
          SELECT * INTO dest_wallet_rec FROM wallets WHERE id = OLD.destination_wallet_id;
          IF FOUND THEN
            UPDATE wallets 
            SET balance = dest_wallet_rec.balance - OLD.amount,
                updated_at = NOW()
            WHERE id = OLD.destination_wallet_id;
          END IF;
        END IF;
      ELSE
        -- Tipe transaksi lain, tidak perlu diproses
        RETURN OLD;
      END IF;
      
      -- Update saldo wallet
      UPDATE wallets 
      SET balance = wallet_rec.balance + adjustment,
          updated_at = NOW()
      WHERE id = OLD.wallet_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function untuk menangani penghapusan loan
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
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Pasang trigger untuk transaksi insert/update
DROP TRIGGER IF EXISTS transaction_balance_trigger ON transactions;
CREATE TRIGGER transaction_balance_trigger
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_wallet_balance_on_transaction_change();

-- Pasang trigger untuk transaksi delete
DROP TRIGGER IF EXISTS transaction_delete_trigger ON transactions;
CREATE TRIGGER transaction_delete_trigger
BEFORE DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_wallet_balance_on_transaction_delete();

-- Pasang trigger untuk loan delete
DROP TRIGGER IF EXISTS loan_delete_trigger ON loans;
CREATE TRIGGER loan_delete_trigger
BEFORE DELETE ON loans
FOR EACH ROW
EXECUTE FUNCTION update_wallet_balance_on_loan_delete();

-- Tambahkan kolom destination_wallet_id jika belum ada
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'destination_wallet_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN destination_wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Tambahkan kolom is_adjustment jika belum ada
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'is_adjustment'
  ) THEN
    ALTER TABLE transactions ADD COLUMN is_adjustment BOOLEAN DEFAULT false;
  END IF;
END $$;
```

## Langkah 3: Perbaiki Saldo Wallet yang Salah

Jika ada saldo wallet yang tidak akurat, jalankan SQL berikut untuk menghitung ulang saldo berdasarkan transaksi yang ada:

```sql
-- Koreksi saldo wallet berdasarkan transaksi yang ada
DO $$
DECLARE
  w RECORD;
  calculated_balance DECIMAL;
BEGIN
  -- Loop melalui semua wallet
  FOR w IN SELECT id, balance FROM wallets LOOP
    -- Hitung ulang saldo berdasarkan transaksi yang ada
    SELECT COALESCE(
      SUM(
        CASE
          WHEN type = 'income' THEN amount
          WHEN type = 'expense' THEN -amount
          WHEN type = 'transfer' AND wallet_id = w.id THEN -amount
          WHEN type = 'transfer' AND destination_wallet_id = w.id THEN amount
          ELSE 0
        END
      ), 0
    ) INTO calculated_balance
    FROM transactions
    WHERE wallet_id = w.id OR destination_wallet_id = w.id;
    
    -- Jika saldo berbeda dengan yang dihitung, perbarui
    IF w.balance <> calculated_balance THEN
      RAISE NOTICE 'Memperbaiki saldo wallet %: % -> %', w.id, w.balance, calculated_balance;
      
      UPDATE wallets
      SET balance = calculated_balance,
          updated_at = NOW()
      WHERE id = w.id;
    END IF;
  END LOOP;
END $$;
```

## Langkah 4: Cara Kerja Trigger Database

Trigger database akan otomatis bekerja ketika ada perubahan data di tabel:

1. **Transaksi Baru**: Ketika transaksi baru dibuat, trigger `transaction_balance_trigger` akan mengupdate saldo wallet sesuai tipe transaksi.

2. **Update Transaksi**: Jika transaksi diubah (jumlah, tipe, wallet), trigger akan menyesuaikan saldo wallet dengan membatalkan transaksi lama dan menerapkan transaksi baru.

3. **Hapus Transaksi**: Ketika transaksi dihapus, trigger `transaction_delete_trigger` akan membatalkan efek transaksi tersebut pada saldo wallet.

4. **Hapus Loan**: Ketika hutang/piutang dihapus, trigger `loan_delete_trigger` akan otomatis menyesuaikan saldo wallet berdasarkan tipe loan:
   - Untuk hutang (payable): Mengurangi jumlah pinjaman (karena pinjaman awalnya menambah saldo) dan menambahkan jumlah yang sudah dibayar
   - Untuk piutang (receivable): Menambahkan jumlah pinjaman (karena pinjaman awalnya mengurangi saldo) dan mengurangi jumlah yang sudah dibayar 