-- Fungsi untuk menghapus loan dan transaksinya tanpa double adjustment
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

-- Berikan izin eksekusi ke user yang terautentikasi
GRANT EXECUTE ON FUNCTION delete_loan_with_transactions TO authenticated; 