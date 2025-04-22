-- Create an RPC function to adjust wallet balance by a specific amount
CREATE OR REPLACE FUNCTION adjust_wallet_balance(
  wallet_id_param UUID,
  adjustment_param NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance NUMERIC;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM wallets
  WHERE id = wallet_id_param;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update with adjustment
  UPDATE wallets
  SET 
    balance = current_balance + adjustment_param,
    updated_at = NOW()
  WHERE id = wallet_id_param;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adjusting wallet balance: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION adjust_wallet_balance TO authenticated; 