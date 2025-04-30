import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loan } from '@/types';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { toast as sonnerToast } from 'sonner';

export const useLoanPayment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const handlePayment = async (
    loan: Loan,
    amount: number,
    walletId: string,
    markPaid: boolean
  ) => {
    if (!amount || isNaN(amount) || amount <= 0) {
      toast({
        title: "Jumlah Pembayaran Tidak Valid",
        description: "Masukkan jumlah pembayaran yang valid",
        variant: "destructive",
      });
      return false;
    }

    if (!walletId) {
      toast({
        title: "Pilih Sumber Dana",
        description: "Pilih dompet atau rekening untuk pembayaran",
        variant: "destructive",
      });
      return false;
    }

    const maxAmount = loan.amount - (loan.paid_amount || 0);
    
    if (amount > maxAmount) {
      toast({
        title: "Jumlah Melebihi Sisa Hutang",
        description: `Maksimal pembayaran adalah ${formatCurrency(maxAmount)}`,
        variant: "destructive",
      });
      return false;
    }

    try {
      setPaymentProcessing(true);
      
      const { data: selectedWalletData, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", walletId)
        .single();
      
      if (walletError) throw walletError;
      
      const categoryType = loan.type === "payable" ? "expense" : "income";
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("type", categoryType)
        .eq("user_id", user?.id)
        .limit(1);
      
      if (categoryError) throw categoryError;
      
      if (!categoryData || categoryData.length === 0) {
        throw new Error(`Tidak ditemukan kategori dengan tipe ${categoryType}. Buat kategori terlebih dahulu.`);
      }
      
      const categoryId = categoryData[0].id;
      
      const newPaidAmount = (loan.paid_amount || 0) + amount;
      const isPaid = newPaidAmount >= loan.amount;
      const newStatus = isPaid ? "paid" : (newPaidAmount > 0 ? "partial" : "unpaid");
      
      const { error: updateLoanError } = await supabase
        .from("loans")
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", loan.id);
      
      if (updateLoanError) throw updateLoanError;
      
      const newBalance = loan.type === "payable"
        ? selectedWalletData.balance - amount
        : selectedWalletData.balance + amount;
      
      const { error: updateWalletError } = await supabase
        .from("wallets")
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq("id", walletId);
      
      if (updateWalletError) throw updateWalletError;
      
      const today = new Date();
      const formattedDate = format(today, 'yyyy-MM-dd');
      
      const transactionData = {
        user_id: user?.id,
        title: loan.type === "payable" 
          ? "Pembayaran Hutang" 
          : "Penerimaan Piutang",
        amount: amount,
        type: loan.type === "payable" ? "expense" : "income",
        date: formattedDate,
        category: categoryId,
        wallet_id: walletId,
        description: loan.type === "payable"
          ? `Pembayaran hutang untuk: ${loan.description} (${loan.lender || 'Tidak ada nama'})`
          : `Penerimaan piutang dari: ${loan.description} (${loan.borrower || 'Tidak ada nama'})`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionData);
      
      if (transactionError) throw transactionError;
      
      const paymentData = {
        loan_id: loan.id,
        user_id: user?.id,
        amount: amount,
        payment_date: formattedDate,
        wallet_id: walletId,
        description: markPaid ? "Pembayaran penuh" : "Pembayaran sebagian",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: paymentHistoryError } = await supabase
        .from("payments")
        .insert(paymentData);
      
      if (paymentHistoryError) {
        console.error("Error recording payment history:", paymentHistoryError);
      }
      
      toast({
        title: "Pembayaran Berhasil",
        description: `Pembayaran ${formatCurrency(amount)} untuk ${loan.description} berhasil`,
      });
      
      return true;
    } catch (error) {
      console.error("Error processing payment:", error instanceof Error ? error.message : String(error));
      toast({
        title: "Gagal Memproses Pembayaran",
        description: (error instanceof Error ? error.message : String(error)) || "Terjadi kesalahan saat memproses pembayaran",
        variant: "destructive",
      });
      return false;
    } finally {
      setPaymentProcessing(false);
    }
  };

  return {
    paymentProcessing,
    handlePayment
  };
};
