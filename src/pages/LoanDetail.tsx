import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loan, Payment } from '@/types';
import { ArrowLeft, Calendar, Trash, Edit, MoreVertical, Info, CreditCard, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import Layout from '@/components/Layout';
import { PostgrestError } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LoanWithRemaining extends Loan {
  remaining_amount: number;
}

const LoanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loan, setLoan] = useState<LoanWithRemaining | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchLoanAndPayments();
    }
  }, [user, id]);

  const fetchLoanAndPayments = async () => {
    try {
      setLoading(true);
      
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', id)
        .single();

      if (loanError) {
        throw loanError;
      }
      
      if (!loanData) {
        throw new Error('Data pinjaman tidak ditemukan');
      }
      
      const paidAmount = loanData.paid_amount || 0;
      const remainingAmount = loanData.amount - paidAmount;
      
      const loanWithDefaults: LoanWithRemaining = {
        ...loanData as Loan,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount
      };
      
      setLoan(loanWithDefaults);

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('loan_id', id)
        .order('payment_date', { ascending: false });

      if (paymentsError) {
        throw paymentsError;
      }
      
      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      
      let errorMessage = 'Terjadi kesalahan yang tidak diketahui';
      
      if (error instanceof PostgrestError) {
        errorMessage = `Error database: ${error.message}`;
        console.log('PostgrestError code:', error.code);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Gagal memuat data',
        description: errorMessage,
        variant: 'destructive'
      });
      
      navigate('/loans');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!loan) return;
    setDeleting(true);

    try {
      console.log("Mulai proses penghapusan hutang/piutang:", loan.id);

      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', loan.wallet_id)
        .single();

      if (walletError && loan.wallet_id) {
        console.error("Error mengambil data wallet:", walletError);
        throw walletError;
      }

      const { data: relatedTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id);

      if (transactionsError) {
        console.error("Error mengambil data transaksi:", transactionsError);
        throw transactionsError;
      }

      const matchingTransactions = relatedTransactions ? relatedTransactions.filter(transaction => {
        if (loan.type === 'payable') {
          return transaction.description?.includes(`Pinjaman dari ${loan.lender}`) &&
                 transaction.title === loan.description;
        } else {
          return transaction.description?.includes(`Pinjaman kepada ${loan.borrower}`) &&
                 transaction.title === loan.description;
        }
      }) : [];

      const { data: paymentsData, error: paymentsCheckError } = await supabase
        .from("payments")
        .select("*")
        .eq("loan_id", loan.id);

      if (paymentsCheckError) {
        console.error("Error mengambil data pembayaran:", paymentsCheckError);
        throw paymentsCheckError;
      }

      let paymentTransactions: any[] = [];
      if (paymentsData && paymentsData.length > 0) {
        console.log("Pembayaran terkait yang ditemukan:", paymentsData.length);
        
        const { data: allTransactions, error: allTransError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user?.id);

        if (allTransError) {
          console.error("Error mengambil semua transaksi:", allTransError);
          throw allTransError;
        }

        paymentTransactions = allTransactions ? allTransactions.filter(transaction => {
          const titleMatch = loan.type === 'payable' 
            ? transaction.title?.includes('Pembayaran Hutang')
            : transaction.title?.includes('Penerimaan Piutang');
            
          const descMatch = transaction.description?.includes(loan.description);
          
          return titleMatch && descMatch;
        }) : [];

        console.log("Transaksi pembayaran terkait:", paymentTransactions.length);
      }

      if (walletData) {
        let newBalance = walletData.balance;
        
        if (matchingTransactions.length > 0) {
          const adjustment = loan.type === 'payable' ? -loan.amount : loan.amount;
          newBalance += adjustment;
          console.log(`Penyesuaian saldo transaksi awal: ${adjustment}`);
        }
        
        if (paymentTransactions.length > 0) {
          for (const trans of paymentTransactions) {
            const adjustment = loan.type === 'payable' ? trans.amount : -trans.amount;
            newBalance += adjustment;
            console.log(`Penyesuaian saldo pembayaran: ${adjustment}`);
          }
        }
        
        const { error: updateWalletError } = await supabase
          .from('wallets')
          .update({ balance: newBalance })
          .eq('id', walletData.id);

        if (updateWalletError) {
          console.error("Error updating wallet balance:", updateWalletError);
          throw updateWalletError;
        }
        
        console.log(`Saldo wallet berhasil diperbarui dari ${walletData.balance} menjadi ${newBalance}`);
      }

      const allRelatedTransactions = [...matchingTransactions, ...paymentTransactions];
      if (allRelatedTransactions.length > 0) {
        for (const transaction of allRelatedTransactions) {
          const { error: deleteTransError } = await supabase
            .from('transactions')
            .delete()
            .eq('id', transaction.id);
          
          if (deleteTransError) {
            console.error(`Error deleting transaction ${transaction.id}:`, deleteTransError);
          } else {
            console.log(`Transaction ${transaction.id} deleted`);
          }
        }
      }

      if (paymentsData && paymentsData.length > 0) {
        const { error: paymentsError } = await supabase
          .from("payments")
          .delete()
          .eq("loan_id", loan.id);

        if (paymentsError) {
          console.error("Error menghapus pembayaran:", paymentsError);
          throw paymentsError;
        }
        console.log("Semua pembayaran berhasil dihapus");
      }

      const { error } = await supabase
        .from("loans")
        .delete()
        .eq("id", loan.id);

      if (error) {
        console.error("Error menghapus hutang/piutang:", error);
        throw error;
      }

      console.log("Hutang/piutang berhasil dihapus");
      
      toast({
        title: "Berhasil",
        description: `${loan.type === 'payable' ? 'Hutang' : 'Piutang'} telah dihapus`,
      });

      navigate('/loans');
    } catch (error: any) {
      console.error('Error deleting loan:', error instanceof Error ? error.message : String(error));
      toast({
        title: "Gagal Menghapus",
        description: (error instanceof Error ? error.message : String(error)) || "Terjadi kesalahan saat menghapus",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading || !loan) {
    return (
      <Layout>
        <div className="container mx-auto p-4 max-w-xl">
          <div className="flex items-center mb-6">
            <Link to="/loans" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold">Memuat...</h1>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-20 bg-gray-200 rounded-lg"></div>
            <div className="h-60 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const canPay = loan.status !== 'paid';
  const isPaid = loan.status === 'paid';
  const isOverdue = new Date(loan.due_date) < new Date() && !isPaid;
  const progressPercentage = loan.paid_amount ? Math.min(100, Math.round((loan.paid_amount / loan.amount) * 100)) : 0;

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-xl pb-24">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link to="/loans" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold">
              {loan.type === 'payable' ? 'Hutang' : 'Piutang'}
            </h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/loans/edit/${loan.id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-500 focus:text-red-500"
              >
                <Trash className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className={`bg-white rounded-lg p-5 shadow-sm border-l-4 mb-6 ${
          isPaid ? "border-gray-300" : 
          loan.type === 'payable' ? (isOverdue ? "border-red-500" : "border-red-300") :
          (isOverdue ? "border-yellow-500" : "border-green-300")
        }`}>
          <h2 className="text-xl font-semibold mb-2">{loan.description}</h2>
          
          <div className="flex items-center mb-4">
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              isPaid ? "bg-gray-100 text-gray-700" : 
              isOverdue ? "bg-red-100 text-red-700" : 
              "bg-yellow-100 text-yellow-700"
            }`}>
              {isPaid ? "Lunas" : isOverdue ? "Terlambat" : "Belum Lunas"}
            </span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-sm text-gray-500">
              {loan.type === 'payable' ? 'Hutang' : 'Piutang'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-semibold text-lg">{formatCurrency(loan.amount)}</p>
            </div>
              <div>
              <p className="text-xs text-gray-500">Sisa</p>
              <p className="font-semibold text-lg">{formatCurrency(loan.remaining_amount)}</p>
              </div>
              <div>
              <p className="text-xs text-gray-500">Terbayar</p>
              <p className="font-semibold">{formatCurrency(loan.paid_amount || 0)}</p>
              </div>
              <div>
              <p className="text-xs text-gray-500">Progress</p>
              <p className="font-semibold">{progressPercentage}%</p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className={`h-2 rounded-full ${
                isPaid ? "bg-gray-400" : 
                loan.type === 'payable' ? "bg-red-500" : "bg-green-500"
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-start">
              <Calendar className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Jatuh Tempo</p>
                <p className="font-medium">
                  {loan.due_date ? format(parseISO(loan.due_date), 'dd MMMM yyyy', { locale: id as any }) : '-'}
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CreditCard className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
              <div>
                <p className="text-xs text-gray-500">
                  {loan.type === 'payable' ? 'Pemberi Pinjaman' : 'Peminjam'}
                </p>
                <p className="font-medium">
                  {loan.type === 'payable' ? loan.lender : loan.borrower}
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Info className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Catatan</p>
                <p className="font-medium">{loan.description || '-'}</p>
              </div>
            </div>
          </div>

          {canPay && (
            <div className="mt-4">
              <Button
                onClick={() => navigate(`/loans/${loan.id}/payment`)}
                className={`w-full ${
                  loan.type === 'payable' 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {loan.type === 'payable' ? 'Bayar Hutang' : 'Terima Pembayaran'}
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h3 className="font-medium mb-4 flex items-center">
            <Check className="h-4 w-4 mr-2 text-blue-500" />
            Riwayat Pembayaran
          </h3>
          
          {payments.length === 0 ? (
            <div className="text-center py-6 border border-dashed rounded-lg">
              <p className="text-gray-500">Belum ada pembayaran</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map(payment => (
                <div key={payment.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(payment.payment_date), 'dd MMMM yyyy', { locale: id as any })}
                      </p>
                    </div>
                    {payment.description && (
                      <p className="text-sm text-gray-500 max-w-[50%] text-right">{payment.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Hapus</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus {loan.type === 'payable' ? 'hutang' : 'piutang'} ini?
                {payments.length > 0 && (
                  <p className="mt-2 text-red-500">
                    Tindakan ini juga akan menghapus {payments.length} riwayat pembayaran terkait.
                  </p>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default LoanDetail;
