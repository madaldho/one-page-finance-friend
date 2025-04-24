-- Membuat ulang fungsi dan trigger untuk database Supabase

-- 1. Fungsi update_wallet_balance_on_loan_insert
CREATE OR REPLACE FUNCTION update_wallet_balance_on_loan_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika loan adalah hutang (payable), tambahkan dana ke wallet
  -- Jika loan adalah piutang (receivable), kurangi dana dari wallet
  IF NEW.wallet_id IS NOT NULL THEN
    IF NEW.type = 'payable' THEN
      -- Hutang = menerima uang, tambahkan ke saldo
      UPDATE wallets 
      SET balance = balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.wallet_id;
    ELSIF NEW.type = 'receivable' THEN
      -- Piutang = memberi uang, kurangi saldo
      UPDATE wallets 
      SET balance = balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.wallet_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Fungsi log_wallet_balance_change
CREATE OR REPLACE FUNCTION log_wallet_balance_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.balance IS DISTINCT FROM NEW.balance THEN
    INSERT INTO wallet_history (
      wallet_id,
      previous_balance,
      new_balance,
      change_amount,
      created_at
    ) VALUES (
      NEW.id,
      OLD.balance,
      NEW.balance,
      NEW.balance - OLD.balance,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Fungsi sync_loan_wallet_name
CREATE OR REPLACE FUNCTION sync_loan_wallet_name()
RETURNS TRIGGER AS $$
DECLARE
  wallet_name TEXT;
BEGIN
  IF NEW.wallet_id IS NOT NULL AND 
     (TG_OP = 'INSERT' OR NEW.wallet_id IS DISTINCT FROM OLD.wallet_id) THEN
    
    SELECT name INTO wallet_name FROM wallets WHERE id = NEW.wallet_id;
    
    IF wallet_name IS NOT NULL THEN
      NEW.wallet_name = wallet_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Fungsi update_wallet_balance_on_transaction_change
CREATE OR REPLACE FUNCTION update_wallet_balance_on_transaction_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Saat INSERT, sesuaikan saldo dompet
  IF TG_OP = 'INSERT' THEN
    -- Jika transaksi adalah income, tambahkan ke saldo
    IF NEW.type = 'income' AND NEW.wallet_id IS NOT NULL THEN
      UPDATE wallets 
      SET balance = balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.wallet_id;
    
    -- Jika transaksi adalah expense, kurangi dari saldo
    ELSIF NEW.type = 'expense' AND NEW.wallet_id IS NOT NULL THEN
      UPDATE wallets 
      SET balance = balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.wallet_id;
    
    -- Jika transaksi adalah transfer, kurangi dari saldo sumber dan tambahkan ke saldo tujuan
    ELSIF NEW.type = 'transfer' THEN
      IF NEW.wallet_id IS NOT NULL THEN
        UPDATE wallets 
        SET balance = balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.wallet_id;
      END IF;
      
      IF NEW.destination_wallet_id IS NOT NULL THEN
        UPDATE wallets 
        SET balance = balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.destination_wallet_id;
      END IF;
    END IF;
    
  -- Saat UPDATE, kembalikan saldo lama dan terapkan saldo baru
  ELSIF TG_OP = 'UPDATE' THEN
    -- Jika ada perubahan jumlah atau jenis transaksi atau dompet
    IF NEW.amount != OLD.amount OR NEW.type != OLD.type OR NEW.wallet_id != OLD.wallet_id OR 
       NEW.destination_wallet_id != OLD.destination_wallet_id THEN
      
      -- Kembalikan efek transaksi lama
      IF OLD.type = 'income' AND OLD.wallet_id IS NOT NULL THEN
        UPDATE wallets 
        SET balance = balance - OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.wallet_id;
      
      ELSIF OLD.type = 'expense' AND OLD.wallet_id IS NOT NULL THEN
        UPDATE wallets 
        SET balance = balance + OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.wallet_id;
      
      ELSIF OLD.type = 'transfer' THEN
        IF OLD.wallet_id IS NOT NULL THEN
          UPDATE wallets 
          SET balance = balance + OLD.amount,
              updated_at = NOW()
          WHERE id = OLD.wallet_id;
        END IF;
        
        IF OLD.destination_wallet_id IS NOT NULL THEN
          UPDATE wallets 
          SET balance = balance - OLD.amount,
              updated_at = NOW()
          WHERE id = OLD.destination_wallet_id;
        END IF;
      END IF;
      
      -- Terapkan efek transaksi baru
      IF NEW.type = 'income' AND NEW.wallet_id IS NOT NULL THEN
        UPDATE wallets 
        SET balance = balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.wallet_id;
      
      ELSIF NEW.type = 'expense' AND NEW.wallet_id IS NOT NULL THEN
        UPDATE wallets 
        SET balance = balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.wallet_id;
      
      ELSIF NEW.type = 'transfer' THEN
        IF NEW.wallet_id IS NOT NULL THEN
          UPDATE wallets 
          SET balance = balance - NEW.amount,
              updated_at = NOW()
          WHERE id = NEW.wallet_id;
        END IF;
        
        IF NEW.destination_wallet_id IS NOT NULL THEN
          UPDATE wallets 
          SET balance = balance + NEW.amount,
              updated_at = NOW()
          WHERE id = NEW.destination_wallet_id;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Fungsi update_wallet_balance_on_transaction_delete
CREATE OR REPLACE FUNCTION update_wallet_balance_on_transaction_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Ketika transaksi dihapus, kembalikan efeknya pada saldo
  IF OLD.type = 'income' AND OLD.wallet_id IS NOT NULL THEN
    UPDATE wallets 
    SET balance = balance - OLD.amount,
        updated_at = NOW()
    WHERE id = OLD.wallet_id;
  
  ELSIF OLD.type = 'expense' AND OLD.wallet_id IS NOT NULL THEN
    UPDATE wallets 
    SET balance = balance + OLD.amount,
        updated_at = NOW()
    WHERE id = OLD.wallet_id;
  
  ELSIF OLD.type = 'transfer' THEN
    IF OLD.wallet_id IS NOT NULL THEN
      UPDATE wallets 
      SET balance = balance + OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.wallet_id;
    END IF;
    
    IF OLD.destination_wallet_id IS NOT NULL THEN
      UPDATE wallets 
      SET balance = balance - OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.destination_wallet_id;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 6. Fungsi update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Fungsi log_wallet_transaction
CREATE OR REPLACE FUNCTION log_wallet_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.balance IS DISTINCT FROM NEW.balance THEN
    INSERT INTO wallet_transactions (
      wallet_id,
      amount,
      balance_before,
      balance_after,
      description,
      created_at
    ) VALUES (
      NEW.id,
      NEW.balance - OLD.balance,
      OLD.balance,
      NEW.balance,
      'Perubahan saldo otomatis',
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Fungsi update_wallet_balance_on_loan_change
CREATE OR REPLACE FUNCTION update_wallet_balance_on_loan_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika ada perubahan jumlah, jenis, atau dompet
  IF OLD.amount != NEW.amount OR OLD.type != NEW.type OR OLD.wallet_id != NEW.wallet_id OR
     (OLD.wallet_id IS NULL AND NEW.wallet_id IS NOT NULL) OR
     (OLD.wallet_id IS NOT NULL AND NEW.wallet_id IS NULL) THEN
     
    -- Kembalikan perubahan untuk entri lama jika ada wallet_id
    IF OLD.wallet_id IS NOT NULL THEN
      IF OLD.type = 'payable' THEN
        -- Hutang lama = dikembalikan, kurangi saldo
        UPDATE wallets 
        SET balance = balance - OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.wallet_id;
      ELSIF OLD.type = 'receivable' THEN
        -- Piutang lama = dikembalikan, tambahkan saldo
        UPDATE wallets 
        SET balance = balance + OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.wallet_id;
      END IF;
    END IF;
    
    -- Terapkan perubahan untuk entri baru jika ada wallet_id
    IF NEW.wallet_id IS NOT NULL THEN
      IF NEW.type = 'payable' THEN
        -- Hutang baru = menerima uang, tambahkan ke saldo
        UPDATE wallets 
        SET balance = balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.wallet_id;
      ELSIF NEW.type = 'receivable' THEN
        -- Piutang baru = memberi uang, kurangi saldo
        UPDATE wallets 
        SET balance = balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.wallet_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Fungsi update_wallet_balance_on_loan_delete
CREATE OR REPLACE FUNCTION update_wallet_balance_on_loan_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika pinjaman yang dihapus memiliki wallet_id
  IF OLD.wallet_id IS NOT NULL THEN
    IF OLD.type = 'payable' THEN
      -- Hutang dihapus = uang dikembalikan, kurangi saldo
      UPDATE wallets 
      SET balance = balance - OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.wallet_id;
    ELSIF OLD.type = 'receivable' THEN
      -- Piutang dihapus = uang diterima kembali, tambahkan saldo
      UPDATE wallets 
      SET balance = balance + OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.wallet_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 10. Fungsi delete_loan_with_transactions
CREATE OR REPLACE FUNCTION delete_loan_with_transactions(loan_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  loan_data RECORD;
  tx_rec RECORD;
  tx_description_pattern TEXT;
  payment_pattern TEXT;
BEGIN
  -- Dapatkan data loan yang akan dihapus
  SELECT * INTO loan_data 
  FROM loans 
  WHERE id = loan_id_param;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Matikan trigger update wallet balance untuk transaksi sementara
  ALTER TABLE transactions DISABLE TRIGGER transaction_delete_trigger;
  
  -- Hapus transaksi terkait hutang/piutang
  -- 1. Transaksi saat pembuatan hutang/piutang
  IF loan_data.type = 'payable' THEN
    tx_description_pattern := 'Pinjaman dari ' || COALESCE(loan_data.lender, '');
  ELSE 
    tx_description_pattern := 'Pinjaman kepada ' || COALESCE(loan_data.borrower, '');
  END IF;
  
  -- Hapus transaksi untuk loan ini berdasarkan deskripsi dan judul
  DELETE FROM transactions 
  WHERE (description ILIKE '%' || tx_description_pattern || '%' OR 
        title = loan_data.description) AND
        category = CASE WHEN loan_data.type = 'payable' THEN 'Hutang' ELSE 'Piutang' END;
  
  -- 2. Hapus juga transaksi pembayaran terkait
  IF loan_data.type = 'payable' THEN
    payment_pattern := 'Pembayaran hutang untuk: ' || loan_data.description;
  ELSE
    payment_pattern := 'Penerimaan piutang dari: ' || loan_data.description;
  END IF;
  
  DELETE FROM transactions 
  WHERE description ILIKE '%' || payment_pattern || '%';
  
  -- Nyalakan kembali trigger
  ALTER TABLE transactions ENABLE TRIGGER transaction_delete_trigger;
  
  -- Hapus loan (ini akan memicu update_wallet_balance_on_loan_delete)
  DELETE FROM loans WHERE id = loan_id_param;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  -- Pastikan trigger diaktifkan kembali jika terjadi error
  ALTER TABLE transactions ENABLE TRIGGER transaction_delete_trigger;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Fungsi update_wallet_with_log
CREATE OR REPLACE FUNCTION update_wallet_with_log(
  wallet_id_param UUID,
  amount_param NUMERIC,
  description_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  old_balance NUMERIC;
  new_balance NUMERIC;
BEGIN
  -- Ambil saldo saat ini
  SELECT balance INTO old_balance FROM wallets WHERE id = wallet_id_param;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update saldo
  new_balance := old_balance + amount_param;
  
  UPDATE wallets 
  SET balance = new_balance,
      updated_at = NOW()
  WHERE id = wallet_id_param;
  
  -- Log transaksi wallet
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    balance_before,
    balance_after,
    description,
    created_at
  ) VALUES (
    wallet_id_param,
    amount_param,
    old_balance,
    new_balance,
    description_param,
    NOW()
  );
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Membuat tabel wallet_history jika belum ada
CREATE TABLE IF NOT EXISTS wallet_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  previous_balance NUMERIC NOT NULL,
  new_balance NUMERIC NOT NULL,
  change_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT wallet_history_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- Membuat tabel wallet_transactions jika belum ada
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  balance_before NUMERIC,
  balance_after NUMERIC,
  CONSTRAINT wallet_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- Periksa dan tambahkan kolom balance_before dan balance_after jika belum ada
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallet_transactions' 
    AND column_name = 'balance_before'
  ) THEN
    ALTER TABLE wallet_transactions ADD COLUMN balance_before NUMERIC;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallet_transactions' 
    AND column_name = 'balance_after'
  ) THEN
    ALTER TABLE wallet_transactions ADD COLUMN balance_after NUMERIC;
  END IF;
END $$;

-- Membuat trigger untuk fungsi update_wallet_balance_on_loan_insert
DROP TRIGGER IF EXISTS loan_insert_trigger ON loans;
CREATE TRIGGER loan_insert_trigger
AFTER INSERT ON loans
FOR EACH ROW
EXECUTE PROCEDURE update_wallet_balance_on_loan_insert();

-- Membuat trigger untuk fungsi log_wallet_balance_change
DROP TRIGGER IF EXISTS wallet_balance_change_trigger ON wallets;
CREATE TRIGGER wallet_balance_change_trigger
AFTER UPDATE OF balance ON wallets
FOR EACH ROW
EXECUTE PROCEDURE log_wallet_balance_change();

-- Membuat trigger untuk fungsi sync_loan_wallet_name
DROP TRIGGER IF EXISTS sync_loan_wallet_name_trigger ON loans;
CREATE TRIGGER sync_loan_wallet_name_trigger
BEFORE INSERT OR UPDATE ON loans
FOR EACH ROW
EXECUTE PROCEDURE sync_loan_wallet_name();

-- Membuat trigger untuk fungsi update_wallet_balance_on_transaction_change
DROP TRIGGER IF EXISTS transaction_change_trigger ON transactions;
CREATE TRIGGER transaction_change_trigger
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE PROCEDURE update_wallet_balance_on_transaction_change();

-- Membuat trigger untuk fungsi update_wallet_balance_on_transaction_delete
DROP TRIGGER IF EXISTS transaction_delete_trigger ON transactions;
CREATE TRIGGER transaction_delete_trigger
AFTER DELETE ON transactions
FOR EACH ROW
EXECUTE PROCEDURE update_wallet_balance_on_transaction_delete();

-- Membuat trigger untuk fungsi update_updated_at_column pada berbagai tabel
-- Untuk tabel wallets
DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Untuk tabel transactions
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Untuk tabel loans
DROP TRIGGER IF EXISTS update_loans_updated_at ON loans;
CREATE TRIGGER update_loans_updated_at
BEFORE UPDATE ON loans
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Untuk tabel categories
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Untuk tabel budget_sources
DROP TRIGGER IF EXISTS update_budget_sources_updated_at ON budget_sources;
CREATE TRIGGER update_budget_sources_updated_at
BEFORE UPDATE ON budget_sources
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Untuk tabel budgets
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Membuat trigger untuk fungsi log_wallet_transaction
DROP TRIGGER IF EXISTS wallet_transaction_log_trigger ON wallets;
CREATE TRIGGER wallet_transaction_log_trigger
AFTER UPDATE OF balance ON wallets
FOR EACH ROW
EXECUTE PROCEDURE log_wallet_transaction();

-- Membuat trigger untuk fungsi update_wallet_balance_on_loan_change
DROP TRIGGER IF EXISTS loan_change_trigger ON loans;
CREATE TRIGGER loan_change_trigger
AFTER UPDATE ON loans
FOR EACH ROW
EXECUTE PROCEDURE update_wallet_balance_on_loan_change();

-- Membuat trigger untuk fungsi update_wallet_balance_on_loan_delete
DROP TRIGGER IF EXISTS loan_delete_trigger ON loans;
CREATE TRIGGER loan_delete_trigger
AFTER DELETE ON loans
FOR EACH ROW
EXECUTE PROCEDURE update_wallet_balance_on_loan_delete();

-- Memberikan akses pada fungsi delete_loan_with_transactions untuk user terautentikasi
GRANT EXECUTE ON FUNCTION delete_loan_with_transactions TO authenticated;

-- Memberikan akses pada fungsi update_wallet_with_log untuk user terautentikasi
GRANT EXECUTE ON FUNCTION update_wallet_with_log TO authenticated;

-- Memberikan akses untuk operasi pada tabel wallet_history dan wallet_transactions
GRANT ALL ON wallet_history TO authenticated;
GRANT ALL ON wallet_transactions TO authenticated;

-- Memberikan akses untuk urutan id pada tabel wallet_history dan wallet_transactions jika menggunakan sequence
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 