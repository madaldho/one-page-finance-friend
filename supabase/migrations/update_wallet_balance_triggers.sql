-- Migrasi untuk menambahkan trigger database yang akan memperbarui saldo wallet
-- saat transaksi dibuat, dimodifikasi, atau dihapus

-- 1. Function untuk menangani pembuatan/update transaksi
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
          
          RAISE NOTICE 'Transfer: updated destination wallet % balance from % to % (added: %)', 
            NEW.destination_wallet_id, dest_wallet_rec.balance, dest_wallet_rec.balance + NEW.amount, NEW.amount;
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
      
      RAISE NOTICE 'Transaction insert: updated wallet % balance from % to % (adjustment: %)', 
        NEW.wallet_id, wallet_rec.balance, wallet_rec.balance + adjustment, adjustment;
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
                
                RAISE NOTICE 'Transfer update: restored destination wallet % balance from % to % (subtracted: %)', 
                  OLD.destination_wallet_id, dest_wallet_rec.balance, dest_wallet_rec.balance - OLD.amount, OLD.amount;
              END IF;
            END IF;
          END IF;
          
          -- Update wallet lama
          UPDATE wallets 
          SET balance = wallet_rec.balance + adjustment,
              updated_at = NOW()
          WHERE id = OLD.wallet_id;
          
          RAISE NOTICE 'Transaction update (old): adjusted wallet % balance from % to % (adjustment: %)', 
            OLD.wallet_id, wallet_rec.balance, wallet_rec.balance + adjustment, adjustment;
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
                
                RAISE NOTICE 'Transfer update (new): updated destination wallet % balance from % to % (added: %)', 
                  NEW.destination_wallet_id, dest_wallet_rec.balance, dest_wallet_rec.balance + NEW.amount, NEW.amount;
              END IF;
            END IF;
          END IF;
          
          -- Update wallet baru
          UPDATE wallets 
          SET balance = wallet_rec.balance + adjustment,
              updated_at = NOW()
          WHERE id = NEW.wallet_id;
          
          RAISE NOTICE 'Transaction update (new): updated wallet % balance from % to % (adjustment: %)', 
            NEW.wallet_id, wallet_rec.balance, wallet_rec.balance + adjustment, adjustment;
        END IF;
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Function untuk menangani penghapusan transaksi
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
            
            RAISE NOTICE 'Transaction delete: adjusted destination wallet % balance from % to % (subtracted: %)', 
              OLD.destination_wallet_id, dest_wallet_rec.balance, dest_wallet_rec.balance - OLD.amount, OLD.amount;
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
      
      RAISE NOTICE 'Transaction delete: updated wallet % balance from % to % (adjustment: %)', 
        OLD.wallet_id, wallet_rec.balance, wallet_rec.balance + adjustment, adjustment;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 3. Pasang trigger untuk insert/update
DROP TRIGGER IF EXISTS transaction_balance_trigger ON transactions;
CREATE TRIGGER transaction_balance_trigger
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_wallet_balance_on_transaction_change();

-- 4. Pasang trigger untuk delete
DROP TRIGGER IF EXISTS transaction_delete_trigger ON transactions;
CREATE TRIGGER transaction_delete_trigger
BEFORE DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_wallet_balance_on_transaction_delete();

-- 5. Tambahkan kolom destination_wallet_id jika belum ada
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

-- 6. Tambahkan kolom is_adjustment jika belum ada
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