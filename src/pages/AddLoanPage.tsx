import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loan, Wallet } from '@/types';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { CurrencyInput } from '@/components/ui/currency-input';

interface LoanFormData {
  amount: number;
  due_date: string;
  status: 'unpaid' | 'paid' | 'partial';
  lender?: string;  // untuk hutang
  borrower?: string;  // untuk piutang
  description: string;
  wallet_id: string;
}

const AddLoanPage = () => {
  const { type } = useParams<{ type: 'debt' | 'receivable' }>();  // debt = hutang, receivable = piutang
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm<LoanFormData>({
    defaultValues: {
      amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      status: 'unpaid',
      description: '',
      wallet_id: ''
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
    } catch (error: any) {
      console.error('Error fetching wallets:', error);
      toast({
        title: 'Gagal memuat dompet',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const onSubmit = async (data: LoanFormData) => {
    if (!user) return;
    setLoading(true);

    try {
      // Prepare loan data
      const loanData: Partial<Loan> = {
        user_id: user.id,
        amount: data.amount,
        due_date: data.due_date,
        type: type === 'debt' ? 'payable' : 'receivable',
        status: 'unpaid',
        description: data.description || '',
        ...(type === 'debt' ? { lender: data.lender } : { borrower: data.borrower })
      };

      // Insert to database
      const { data: newLoan, error } = await supabase
        .from('loans')
        .insert(loanData)
        .select()
        .single();

      if (error) throw error;

      // Update wallet balance if debt (uang masuk ke dompet) or receivable (uang keluar dari dompet)
      if (data.wallet_id) {
        const selectedWallet = wallets.find(w => w.id === data.wallet_id);
        if (selectedWallet) {
          // Untuk hutang, tambah saldo karena menerima uang
          // Untuk piutang, kurangi saldo karena memberi uang
          const newBalance = type === 'debt' 
            ? selectedWallet.balance + data.amount 
            : selectedWallet.balance - data.amount;
          
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
            type: type === 'debt' ? 'income' : 'expense',
            date: format(new Date(), 'yyyy-MM-dd'),
            category: type === 'debt' ? 'Hutang' : 'Piutang',
            wallet_id: data.wallet_id,
            description: type === 'debt' 
              ? `Pinjaman dari ${data.lender}`
              : `Pinjaman kepada ${data.borrower}`
          };
          
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert(transactionData);
            
          if (transactionError) throw transactionError;
        }
      }

      toast({
        title: 'Berhasil',
        description: `${type === 'debt' ? 'Hutang' : 'Piutang'} baru telah ditambahkan`,
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
    <div className="fixed inset-0 bg-black/50 flex flex-col z-50">
      <div className="bg-white rounded-t-xl flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between border-b p-4">
          <button onClick={() => navigate(-1)} className="p-1" title="Kembali">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-semibold">
            Tambah {type === 'debt' ? 'Hutang' : 'Piutang'} Baru
          </h2>
          <div className="w-6"></div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
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
            <label className="block text-sm font-medium mb-1">Dompet {type === 'debt' ? 'Tujuan' : 'Sumber'}</label>
            <Select
              onValueChange={(value) => setValue('wallet_id', value)}
              {...register('wallet_id', { required: 'Pilih dompet' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Dompet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map(wallet => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name} ({formatCurrency(wallet.balance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.wallet_id && (
              <p className="text-sm text-red-500 mt-1">{errors.wallet_id.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {type === 'debt' 
                ? 'Dompet dimana uang pinjaman masuk' 
                : 'Dompet yang digunakan untuk memberikan pinjaman'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Jatuh Tempo</label>
            <Input
              type="date"
              {...register('due_date', { required: 'Tanggal jatuh tempo harus diisi' })}
              error={errors.due_date?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {type === 'debt' ? 'Pemberi Pinjaman' : 'Peminjam'}
            </label>
            <Input
              {...register(type === 'debt' ? 'lender' : 'borrower', { 
                required: `${type === 'debt' ? 'Pemberi pinjaman' : 'Peminjam'} harus diisi` 
              })}
              placeholder={type === 'debt' ? 'Nama pemberi pinjaman' : 'Nama peminjam'}
              error={errors[type === 'debt' ? 'lender' : 'borrower']?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Catatan</label>
            <Input
              {...register('description', { required: 'Catatan harus diisi sebagai judul hutang/piutang' })}
              placeholder="Tambahkan catatan (akan digunakan sebagai judul)"
              error={errors.description?.message}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
              className={type === 'debt' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLoanPage; 