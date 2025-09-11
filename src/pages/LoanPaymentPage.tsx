import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loan as LoanType, Payment, Wallet as WalletType, Category } from '@/types/index';
import { ChevronLeft, Calendar, Wallet, CreditCard, PiggyBank, Banknote, Landmark } from 'lucide-react';
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
  logo_url?: string | null;
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
        toast({
          title: "Peringatan",
          description: "Pembayaran berhasil tetapi gagal mengupdate saldo dompet. Silakan refresh halaman.",
          variant: "destructive"
        });
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
          toast({
            title: "Peringatan",
            description: "Pembayaran berhasil tetapi gagal mencatat transaksi. Saldo dompet telah diperbarui.",
            variant: "destructive"
          });
        }
      } catch (transactionErr) {
        console.error("Error in payment transaction:", transactionErr);
        toast({
          title: "Peringatan",
          description: "Pembayaran berhasil tetapi gagal mencatat transaksi",
          variant: "destructive"
        });
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

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'bank':
        return <Landmark className="h-4 w-4" />;
      case 'investment':
        return <CreditCard className="h-4 w-4" />;
      case 'savings':
        return <PiggyBank className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
        </div>

        <div className="container mx-auto py-2 px-2 md:px-6 max-w-2xl relative z-10 pt-6 md:pt-4 pb-32">
          {/* Header dengan glassmorphism effect */}
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md border border-white/30 p-0"
                aria-label="Kembali"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  {loan.type === 'payable' ? 'Pembayaran Hutang' : 'Terima Pembayaran Piutang'}
                </h1>
                <p className="text-xs text-gray-500">
                  {loan.description ? `${loan.description}` : 'Proses pembayaran'}
                </p>
              </div>
            </div>
          </div>

          {/* Detail Loan Card */}
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-6 mb-6 shadow-sm border border-white/20">
            <h3 className="font-semibold text-gray-800 mb-4">Detail {loan.type === 'payable' ? 'Hutang' : 'Piutang'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 mb-1">Total {loan.type === 'payable' ? 'Hutang' : 'Piutang'}</p>
                <p className="font-bold text-lg text-blue-800">{formatCurrency(loan.amount)}</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100">
                <p className="text-xs text-orange-600 mb-1">Sisa {loan.type === 'payable' ? 'Hutang' : 'Piutang'}</p>
                <p className="font-bold text-lg text-orange-800">{formatCurrency(loan.amount - (loan.paid_amount || 0))}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-sm border border-white/20 overflow-hidden">
            <div className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Tanggal Pembayaran */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Tanggal Pembayaran</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      type="date"
                      className="h-12 pl-10 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                      {...register('payment_date', { required: 'Tanggal pembayaran harus diisi' })}
                      defaultValue={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  {errors.payment_date && (
                    <p className="text-sm text-red-500">{errors.payment_date.message}</p>
                  )}
                  <p className="text-xs text-gray-500">Tanggal saat pembayaran dilakukan</p>
                </div>

                {/* Jumlah Pembayaran */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Jumlah Pembayaran</label>
                  <CurrencyInput
                    showPrefix={true}
                    value={watch('amount')}
                    onChange={(value) => setValue('amount', value)}
                    placeholder="0"
                    className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Maksimal pembayaran: {formatCurrency(loan.amount - (loan.paid_amount || 0))}
                  </p>
                </div>

                {/* Pilih Sumber Dana */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Pilih Sumber Dana</label>
                  <Select onValueChange={(value) => setValue('wallet_id', value)}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200">
                      <SelectValue placeholder="Pilih wallet" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-200">
                      {wallets.map(wallet => (
                        <SelectItem key={wallet.id} value={wallet.id} className="rounded-lg">
                          <div className="flex items-center gap-3 py-1">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                              style={{ 
                                background: wallet.gradient 
                                  ? `linear-gradient(135deg, ${wallet.color}, ${wallet.gradient})`
                                  : wallet.color || '#6E59A5'
                              }}
                            >
                              {wallet.logo_url ? (
                                <img 
                                  src={wallet.logo_url} 
                                  alt={wallet.name}
                                  className="w-6 h-6 rounded-lg object-cover"
                                />
                              ) : (
                                getWalletIcon(wallet.type)
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">{wallet.name}</div>
                              <div className="text-sm text-gray-500">{formatCurrency(wallet.balance)}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.wallet_id && (
                    <p className="text-sm text-red-500">{errors.wallet_id.message}</p>
                  )}
                </div>

                {/* Catatan */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Catatan (Opsional)</label>
                  <Input
                    {...register('description')}
                    placeholder="Tambahkan catatan pembayaran"
                    className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                  />
                </div>

                {/* Checkbox */}
                <div className="flex items-center space-x-3 p-4 bg-gray-50/50 rounded-xl border border-gray-200">
                  <Checkbox
                    id="mark-paid"
                    onCheckedChange={(checked) => setValue('mark_as_paid', checked === true)}
                  />
                  <label htmlFor="mark-paid" className="text-sm text-gray-700 cursor-pointer">
                    Tandai sebagai lunas meskipun pembayaran parsial
                  </label>
                </div>

                {/* Submit buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="w-full sm:w-auto order-2 sm:order-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50 transition-all duration-200"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`w-full sm:flex-1 order-1 sm:order-2 h-12 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                      loan.type === 'payable' 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Memproses...
                      </span>
                    ) : loan.type === 'payable' ? (
                      'Bayar Hutang'
                    ) : (
                      'Terima Pembayaran'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoanPaymentPage;
