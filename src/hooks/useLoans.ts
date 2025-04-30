import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loan, Wallet, Transaction } from '@/types';
import { format } from 'date-fns';

export const useLoans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [featureEnabled, setFeatureEnabled] = useState(true);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", user?.id);

      if (loansError) throw loansError;
      setLoans(loansData as unknown as Loan[]);

      const { data: walletsData, error: walletsError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user?.id);

      if (walletsError) throw walletsError;
      setWallets(walletsData as Wallet[]);

      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("show_loans")
        .eq("user_id", user?.id)
        .single();

      if (!settingsError && settingsData) {
        setFeatureEnabled(settingsData.show_loans);
      }

    } catch (error) {
      console.error("Error fetching loans data:", error instanceof Error ? error.message : String(error));
      toast({
        title: "Gagal memuat data",
        description: "Terjadi kesalahan saat mengambil data hutang dan piutang",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to directly adjust wallet balance with a transaction record
  const adjustWalletBalance = async (walletId: string, amount: number, description: string) => {
    try {
      console.log(`Adjusting wallet ${walletId} balance by ${amount}: ${description}`);
      
      // 1. Get current wallet data
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single();
      
      if (walletError) {
        console.error("Error fetching wallet:", walletError);
        throw walletError;
      }
      
      if (!walletData) {
        console.error("Wallet not found");
        return false;
      }
      
      console.log(`Current wallet balance: ${walletData.balance}`);
      
      // 2. Calculate new balance
      const newBalance = walletData.balance + amount;
      console.log(`New wallet balance will be: ${newBalance}`);
      
      // 3. Create adjustment transaction
      const transactionType = amount > 0 ? 'income' : 'expense';
      
      // Since is_adjustment isn't in the Supabase schema, add it to the description
      const adjustmentDescription = `[ADJUSTMENT] ${description}`;
      
      const transactionData = {
        user_id: user?.id || '',
        title: "Penyesuaian Saldo",
        amount: Math.abs(amount),
        type: transactionType,
        date: new Date().toISOString().split('T')[0],
        wallet_id: walletId,
        description: adjustmentDescription,
        category: "adjustment" // Required by Supabase schema
      };
      
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionData);
      
      if (transactionError) {
        console.error("Error creating adjustment transaction:", transactionError);
      } else {
        console.log("Adjustment transaction created");
      }
      
      // 4. Update wallet balance - use RPC for atomic operation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updateResult, error: updateError } = await (supabase.rpc as any)(
        'update_wallet_balance_directly',
        { 
          wallet_id_param: walletId,
          new_balance_param: newBalance
        }
      );
      
      if (updateError) {
        // Fallback to direct update if RPC fails
        console.error("Error using RPC to update wallet:", updateError);
        console.log("Falling back to direct update");
        
        const { error: directUpdateError } = await supabase
          .from('wallets')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', walletId);
        
        if (directUpdateError) {
          console.error("Error updating wallet balance:", directUpdateError);
          throw directUpdateError;
        }
      }
      
      // 5. Verify wallet balance was updated
      const { data: verifyData, error: verifyError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', walletId)
        .single();
      
      if (verifyError) {
        console.error("Error verifying wallet update:", verifyError);
      } else {
        console.log(`Verified wallet balance is now: ${verifyData.balance}`);
        if (verifyData.balance !== newBalance) {
          console.warn(`Warning: Wallet balance (${verifyData.balance}) doesn't match expected value (${newBalance})`);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error adjusting wallet balance:", error);
      return false;
    }
  };

  const handleToggleFeature = async () => {
    const newValue = !featureEnabled;
    setFeatureEnabled(newValue);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Tidak Terautentikasi",
          description: "Silakan login untuk mengubah pengaturan",
          variant: "destructive"
        });
        setFeatureEnabled(!newValue);
        return;
      }
      
      const { error } = await supabase
        .from("user_settings")
        .update({ show_loans: newValue })
        .eq("user_id", user?.id);

      if (error) throw error;
      
      toast({
        title: `Fitur Hutang & Piutang ${newValue ? "Diaktifkan" : "Dinonaktifkan"}`,
        description: newValue ? 
          "Fitur hutang dan piutang sekarang aktif di halaman utama" : 
          "Fitur hutang dan piutang tidak akan ditampilkan di halaman utama",
      });
    } catch (error) {
      console.error("Error updating settings:", error instanceof Error ? error.message : String(error));
      setFeatureEnabled(!newValue);
      toast({
        title: "Gagal Mengubah Pengaturan",
        description: (error instanceof Error ? error.message : String(error)) || "Terjadi kesalahan saat mengubah pengaturan",
        variant: "destructive",
      });
      fetchData();
    }
  };

  const handleDelete = async (loanId: string) => {
    if (deleteInProgress) return;
    
    try {
      setDeleteInProgress(true);
      
      // Fetch the loan to be deleted untuk informasi
      const { data: loanToDelete, error: loanError } = await supabase
        .from("loans")
        .select("*")
        .eq("id", loanId)
        .single();

      if (loanError || !loanToDelete) {
        toast({
          title: "Gagal mengambil data",
          description: "Tidak dapat menemukan data hutang/piutang",
          variant: "destructive"
        });
        return;
      }
      
      // Cast to the proper Loan type from types.ts
      const loanData = loanToDelete as Loan;

      // Get current wallet balance for logging
      let initialBalance = 0;
      if (loanData.wallet_id) {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("id", loanData.wallet_id)
          .single();
          
        if (wallet) {
          initialBalance = wallet.balance;
          console.log(`Initial wallet balance: ${initialBalance}`);
        }
      }
      
      // Gunakan RPC function untuk menghapus loan dan transaksi terkait tanpa double adjustment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: deleteResult, error: deleteError } = await (supabase.rpc as any)(
        'delete_loan_with_transactions',
        { loan_id_param: loanId }
      );

      if (deleteError) {
        // Fallback ke cara normal jika RPC gagal
        console.error("RPC failed, falling back to normal delete:", deleteError);
        
        const { error: fallbackError } = await supabase
          .from("loans")
          .delete()
          .eq("id", loanId);
          
        if (fallbackError) {
          toast({
            title: "Gagal menghapus data",
            description: fallbackError.message,
            variant: "destructive"
          });
          return;
        }
      }
      
      // Verify adjustment worked correctly
      if (loanData.wallet_id) {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("id", loanData.wallet_id)
          .single();
          
        if (wallet) {
          console.log(`Final wallet balance: ${wallet.balance} (change: ${wallet.balance - initialBalance})`);
        }
      }

      // Refresh data
      await fetchData();
      
      toast({
        title: "Berhasil",
        description: `${loanData.type === 'payable' ? 'Hutang' : 'Piutang'} berhasil dihapus`,
      });
    } catch (error) {
      console.error("Error deleting loan:", error);
      toast({
        title: "Terjadi kesalahan",
        description: error instanceof Error ? error.message : "Gagal menghapus data",
        variant: "destructive"
      });
    } finally {
      setDeleteInProgress(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  return {
    loans,
    wallets,
    loading,
    featureEnabled,
    handleToggleFeature,
    handleDelete,
    fetchData
  };
}; 