-- Create an RPC function to update wallet balance atomically
CREATE OR REPLACE FUNCTION update_wallet_balance_directly(
  wallet_id_param UUID,
  new_balance_param NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE wallets
  SET 
    balance = new_balance_param,
    updated_at = NOW()
  WHERE id = wallet_id_param;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating wallet balance: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION update_wallet_balance_directly TO authenticated; 