import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loan as LoanType, Payment, Wallet as WalletType, Category } from '@/types/index';
import { ChevronLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { CurrencyInput } from '@/components/ui/currency-input';

interface PaymentFormData {
  amount: number;
  payment_date: string;
  wallet_id: string;
  description?: string;
  mark_as_paid: boolean;
}

// Tipe yang disesuaikan dengan struktur data dari database - tidak menggunakan Omit untuk menghindari title required
interface LoanData {
  id: string;
  user_id: string;
  amount: number;
  type: 'payable' | 'receivable';
  description: string;
  lender?: string | null;
  borrower?: string | null;
  status: string;
  due_date: string | null;
  paid_amount?: number | null;
  wallet_id?: string | null;
  wallet_name?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Tipe yang disesuaikan untuk wallet yang benar-benar sesuai dengan data Supabase
interface Wallet {
  id: string;
  name: string;
  balance: number;
  color?: string | null;
  gradient?: string | null;
  is_default?: boolean | null;
  type: string;
  user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
}

const LoanPaymentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loan, setLoan] = useState<LoanData | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PaymentFormData>({
    defaultValues: {
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      amount: 0,
      mark_as_paid: false
    }
  });

  useEffect(() => {
    if (user && id) {
      fetchLoanAndWallets();
    }
  }, [user, id]);

  const fetchLoanAndWallets = async () => {
    try {
      // Fetch loan details
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', id)
        .single();

      if (loanError) throw loanError;
      // Memastikan tipe loan adalah 'payable' atau 'receivable'
      const typedLoanData: LoanData = {
        ...loanData,
        type: loanData.type as 'payable' | 'receivable'
      };
      setLoan(typedLoanData);

      // Fetch wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id);

      if (walletsError) throw walletsError;
      setWallets(walletsData || []);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id);
        
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Set default amount to remaining amount
      if (loanData) {
        setValue('amount', loanData.amount - (loanData.paid_amount || 0));
      }
    } catch (error: unknown) {
      console.error('Error fetching data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data';
      toast({
        title: 'Gagal memuat data',
        description: errorMessage,
        variant: 'destructive'
      });
      navigate('/loans');
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    if (!user || !loan) return;
    setLoading(true);

    try {
      const selectedWallet = wallets.find(w => w.id === data.wallet_id);
      if (!selectedWallet) throw new Error('Wallet tidak ditemukan');

      // Check if wallet has enough balance for payment
      if (loan.type === 'payable' && selectedWallet.balance < data.amount) {
        throw new Error('Saldo wallet tidak mencukupi');
      }

      // Gunakan kategori sesuai dengan tipe loan
      // Untuk konsistensi dengan proses penambahan hutang/piutang
      const categoryName = loan.type === 'payable' ? 'Hutang' : 'Piutang';

      // Start transaction
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          loan_id: loan.id,
          user_id: user.id,
          amount: data.amount,
          payment_date: data.payment_date,
          wallet_id: data.wallet_id,
          description: data.description
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update loan status and remaining amount
      const remainingAmount = loan.amount - (loan.paid_amount || 0);
      const newStatus = data.mark_as_paid || remainingAmount - data.amount <= 0 ? 'paid' : 
                       remainingAmount - data.amount < loan.amount ? 'partial' : 'unpaid';

      const { error: loanError } = await supabase
        .from('loans')
        .update({
          status: newStatus,
          paid_amount: (loan.paid_amount || 0) + data.amount
        })
        .eq('id', loan.id);

      if (loanError) throw loanError;
      
      // Update saldo wallet secara manual
      try {
        const { data: walletData, error: walletFetchError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('id', data.wallet_id)
          .single();
          
        if (!walletFetchError && walletData) {
          // Hutang (payable): pembayaran = mengurangi saldo (expense)
          // Piutang (receivable): pembayaran = menambah saldo (income)
          const newBalance = loan.type === 'payable' 
            ? walletData.balance - data.amount 
            : walletData.balance + data.amount;
            
          await supabase
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', data.wallet_id);
            
          console.log(`Updated wallet balance from ${walletData.balance} to ${newBalance}`);
        }
      } catch (walletErr) {
        console.error("Error updating wallet balance:", walletErr);
        toast.warning("Pembayaran berhasil tetapi gagal mengupdate saldo dompet. Silakan refresh halaman.");
      }
      
      // Catat transaksi dengan kategori yang sama seperti saat penambahan hutang/piutang
      try {
        const transactionData = {
          user_id: user.id,
          title: loan.type === 'payable' ? 'Bayar Hutang' : 'Terima Pembayaran Piutang',
          amount: data.amount,
          type: loan.type === 'payable' ? 'expense' : 'income',
          date: data.payment_date,
          category: categoryName, // Gunakan nama kategori yang sama dengan saat penambahan hutang/piutang
          wallet_id: data.wallet_id,
          description: `${loan.type === 'payable' ? 'Pembayaran hutang' : 'Penerimaan piutang'} untuk ${loan.description || ''}${data.description ? ': ' + data.description : ''}`
        };
        
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert(transactionData);
          
        if (transactionError) {
          console.error("Error creating payment transaction:", transactionError);
          toast.warning("Pembayaran berhasil tetapi gagal mencatat transaksi. Saldo dompet telah diperbarui.");
        }
      } catch (transactionErr) {
        console.error("Error in payment transaction:", transactionErr);
        toast.warning("Pembayaran berhasil tetapi gagal mencatat transaksi");
      }

      toast({
        title: 'Pembayaran Berhasil',
        description: `${formatCurrency(data.amount)} telah ${loan.type === 'payable' ? 'dibayarkan' : 'diterima'}`
      });

      navigate('/loans');
    } catch (error: unknown) {
      console.error('Error processing payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pembayaran';
      toast({
        title: 'Gagal Memproses Pembayaran',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!loan) return null;

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-xl pb-24">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate(-1)} className="mr-2" title="Kembali">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">
            {loan.type === 'payable' ? 'Pembayaran Hutang' : 'Terima Pembayaran Piutang'}
            {loan.description && `: ${loan.description}`}
          </h1>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium">Detail {loan.type === 'payable' ? 'Hutang' : 'Piutang'}</h3>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-xs text-gray-500">Total {loan.type === 'payable' ? 'Hutang' : 'Piutang'}</p>
              <p className="font-medium">{formatCurrency(loan.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Sisa {loan.type === 'payable' ? 'Hutang' : 'Piutang'}</p>
              <p className="font-medium">{formatCurrency(loan.amount - (loan.paid_amount || 0))}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-24">
          <div>
            <label className="block text-sm font-medium mb-1">Tanggal Pembayaran</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                type="date"
                className="pl-10"
                {...register('payment_date', { required: 'Tanggal pembayaran harus diisi' })}
                defaultValue={format(new Date(), 'yyyy-MM-dd')}
                error={errors.payment_date?.message}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Tanggal saat pembayaran dilakukan</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Jumlah Pembayaran</label>
            <CurrencyInput
              showPrefix={true}
              value={watch('amount')}
              onChange={(value) => setValue('amount', value)}
              placeholder="0"
              error={errors.amount?.message}
            />
            <p className="text-xs text-gray-500 mt-1">
              Maksimal pembayaran: {formatCurrency(loan.amount - (loan.paid_amount || 0))}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Pilih Sumber Dana</label>
            <Select 
              onValueChange={(value) => setValue('wallet_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih wallet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map(wallet => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: wallet.color || (loan.type === 'payable' ? '#3b82f6' : '#10b981') }}
                      ></div>
                      <span>{wallet.name} ({formatCurrency(wallet.balance)})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.wallet_id && (
              <p className="text-sm text-red-500 mt-1">{errors.wallet_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Catatan (Opsional)</label>
            <Input
              {...register('description')}
              placeholder="Tambahkan catatan pembayaran"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="mark-paid"
              onCheckedChange={(checked) => setValue('mark_as_paid', checked === true)}
            />
            <label htmlFor="mark-paid" className="text-sm">
              Tandai sebagai lunas meskipun pembayaran parsial
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={loan.type === 'payable' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'}
            >
              {loading ? 'Memproses...' : loan.type === 'payable' ? 'Bayar' : 'Terima Pembayaran'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default LoanPaymentPage;
