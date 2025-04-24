
import { supabase } from '@/integrations/supabase/client';

/**
 * Safely updates a wallet's balance with proper history tracking
 * @param walletId Wallet ID to update
 * @param amount Amount to adjust (positive or negative)
 * @param userId User ID
 * @param description Description of the transaction
 * @returns Success status
 */
export async function updateWalletBalance(
  walletId: string, 
  amount: number, 
  userId: string, 
  description: string
): Promise<boolean> {
  try {
    // Get current wallet balance
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', walletId)
      .single();
    
    if (walletError || !walletData) {
      console.error('Error getting wallet balance:', walletError);
      return false;
    }

    const currentBalance = walletData.balance;
    const newBalance = currentBalance + amount;
    
    // Update wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', walletId);
    
    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      return false;
    }
    
    // Add entry to wallet_history
    const { error: historyError } = await supabase
      .from('wallet_history')
      .insert({
        wallet_id: walletId,
        user_id: userId,
        amount: Math.abs(amount),
        type: amount >= 0 ? 'increase' : 'decrease',
        previous_balance: currentBalance,
        balance_before: currentBalance,
        balance_after: newBalance,
        change_amount: amount,
        description
      });
    
    if (historyError) {
      console.error('Error adding wallet history:', historyError);
      // We don't return false here because the balance was already updated
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error updating wallet balance:', error);
    return false;
  }
}
