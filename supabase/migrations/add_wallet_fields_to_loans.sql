-- Add wallet_id and wallet_name columns to the loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS wallet_name TEXT;

-- Add wallet_id and wallet_name columns to the payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS wallet_name TEXT;

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