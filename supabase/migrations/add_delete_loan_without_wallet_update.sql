-- Buat fungsi untuk menghapus loan tanpa memicu update saldo wallet
CREATE OR REPLACE FUNCTION delete_loan_without_wallet_update(loan_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN := false;
BEGIN
  -- Menonaktifkan trigger sementara
  ALTER TABLE loans DISABLE TRIGGER loan_delete_trigger;
  
  -- Hapus loan
  DELETE FROM loans WHERE id = loan_id;
  
  -- Mengaktifkan trigger kembali
  ALTER TABLE loans ENABLE TRIGGER loan_delete_trigger;
  
  success := true;
  RETURN success;
EXCEPTION WHEN OTHERS THEN
  -- Pastikan trigger diaktifkan kembali meskipun ada error
  ALTER TABLE loans ENABLE TRIGGER loan_delete_trigger;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 