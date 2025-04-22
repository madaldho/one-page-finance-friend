import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loan, Wallet } from '@/types';
import Layout from '@/components/Layout';
import { ArrowLeft, Calendar, Wallet as WalletIcon, User, Info, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CurrencyInput } from '@/components/ui/currency-input';

interface DebtFormData {
  amount: number;
  due_date: string;
  lender: string;
  description: string;
  wallet_id: string;
  installment: number; // jumlah cicilan
}

const AddDebtPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DebtFormData>({
    defaultValues: {
      amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      lender: '',
      description: '',
      wallet_id: '',
      installment: 0
    }
  });

  useEffect(() => {
    if (user) {
      fetchWallets();
    }
  }, [user]);

  const fetchWallets = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setWallets(data || []);
      
      // Set default wallet if available
      if (data && data.length > 0) {
        const defaultWallet = data.find(w => w.is_default) || data[0];
        setValue('wallet_id', defaultWallet.id);
      }
    } catch (error: any) {
      console.error('Error fetching wallets:', error);
      toast({
        title: 'Gagal memuat dompet',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const onSubmit = async (data: DebtFormData) => {
    if (!user) return;
    setLoading(true);

    try {
      // Prepare loan data
      const loanData: Partial<Loan> = {
        user_id: user.id,
        amount: data.amount,
        due_date: data.due_date,
        type: 'payable', // hutang = payable
        status: 'unpaid',
        description: data.description,
        lender: data.lender
      };

      // Insert to database
      const { data: newLoan, error } = await supabase
        .from('loans')
        .insert(loanData)
        .select()
        .single();

      if (error) throw error;

      // Update wallet balance (uang masuk ke dompet)
      if (data.wallet_id) {
        const selectedWallet = wallets.find(w => w.id === data.wallet_id);
        if (selectedWallet) {
          // Untuk hutang, tambah saldo karena menerima uang
          const newBalance = selectedWallet.balance + data.amount;
          
          const { error: walletError } = await supabase
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', data.wallet_id);
            
          if (walletError) throw walletError;
          
          // Catat transaksi
          const transactionData = {
            user_id: user.id,
            title: data.description,
            amount: data.amount,
            type: 'income',
            date: format(new Date(), 'yyyy-MM-dd'),
            category: 'Hutang',
            wallet_id: data.wallet_id,
            description: `Pinjaman dari ${data.lender}`
          };
          
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert(transactionData);
            
          if (transactionError) throw transactionError;
        }
      }

      toast({
        title: 'Berhasil',
        description: 'Hutang baru telah ditambahkan',
      });

      navigate('/loans');
    } catch (error: any) {
      console.error('Error saving loan:', error);
      toast({
        title: 'Gagal Menyimpan',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-xl pb-24">
        <div className="flex items-center mb-6">
          <Link to="/loans" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Tambah Hutang Baru</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mb-24">
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <div className="flex items-center mb-4">
              <CreditCard className="text-purple-500 mr-2 h-5 w-5" />
              <h2 className="text-lg font-medium">Detail Hutang</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Jumlah</label>
                <CurrencyInput
                  showPrefix={true}
                  value={watch('amount')}
                  onChange={(value) => setValue('amount', value)}
                  placeholder="0"
                  error={errors.amount?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Pemberi Pinjaman</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    className="pl-10"
                    {...register('lender', { 
                      required: 'Pemberi pinjaman harus diisi'
                    })}
                    placeholder="Nama pemberi pinjaman"
                    error={errors.lender?.message}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Catatan / Judul Hutang</label>
                <div className="relative">
                  <Info className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    className="pl-10"
                    {...register('description', { required: 'Catatan harus diisi sebagai judul hutang' })}
                    placeholder="Tambahkan catatan (akan digunakan sebagai judul)"
                    error={errors.description?.message}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm">
            <div className="flex items-center mb-4">
              <Calendar className="text-purple-500 mr-2 h-5 w-5" />
              <h2 className="text-lg font-medium">Jangka Waktu</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Jatuh Tempo</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    type="date"
                    className="pl-10"
                    {...register('due_date', { required: 'Tanggal jatuh tempo harus diisi' })}
                    error={errors.due_date?.message}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cicilan (Opsional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                  <Input
                    type="number"
                    className="pl-10"
                    {...register('installment')}
                    placeholder="1"
                    error={errors.installment?.message}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Jumlah cicilan yang harus dibayar (kosongkan jika tidak ada cicilan)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm">
            <div className="flex items-center mb-4">
              <WalletIcon className="text-purple-500 mr-2 h-5 w-5" />
              <h2 className="text-lg font-medium">Dompet Tujuan</h2>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pilih Dompet</label>
              <Select
                onValueChange={(value) => setValue('wallet_id', value)}
                defaultValue={watch('wallet_id')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Dompet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map(wallet => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: wallet.color || '#3b82f6' }}
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
              <p className="text-xs text-gray-500 mt-1">
                Dompet dimana uang pinjaman akan masuk
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate('/loans')}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddDebtPage; 