import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loan, Payment, Wallet } from '@/types';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface PaymentFormData {
  amount: number;
  payment_date: DateRange;
  wallet_id: string;
  description?: string;
  mark_as_paid: boolean;
}

const LoanPaymentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PaymentFormData>({
    defaultValues: {
      payment_date: { from: new Date(), to: new Date() },
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
      setLoan(loanData);

      // Fetch wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id);

      if (walletsError) throw walletsError;
      setWallets(walletsData || []);

      // Set default amount to remaining amount
      if (loanData) {
        setValue('amount', loanData.remaining_amount || loanData.amount);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Gagal memuat data',
        description: error.message,
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

      // Start transaction
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          loan_id: loan.id,
          user_id: user.id,
          amount: data.amount,
          payment_date: data.payment_date.from,
          wallet_id: data.wallet_id,
          description: data.description
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update loan status and remaining amount
      const newRemainingAmount = (loan.remaining_amount || loan.amount) - data.amount;
      const newStatus = data.mark_as_paid || newRemainingAmount <= 0 ? 'paid' : 
                       newRemainingAmount < loan.amount ? 'partial' : 'unpaid';

      const { error: loanError } = await supabase
        .from('loans')
        .update({
          remaining_amount: newRemainingAmount,
          status: newStatus,
          paid_amount: (loan.paid_amount || 0) + data.amount
        })
        .eq('id', loan.id);

      if (loanError) throw loanError;

      // Update wallet balance
      const newBalance = loan.type === 'payable' 
        ? selectedWallet.balance - data.amount 
        : selectedWallet.balance + data.amount;

      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', data.wallet_id);

      if (walletError) throw walletError;

      toast({
        title: 'Pembayaran Berhasil',
        description: `${formatCurrency(data.amount)} telah ${loan.type === 'payable' ? 'dibayarkan' : 'diterima'}`
      });

      navigate('/loans');
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Gagal Memproses Pembayaran',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!loan) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex flex-col z-50">
      <div className="bg-white rounded-t-xl flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between border-b p-4">
          <button onClick={() => navigate(-1)} className="p-1" title="Kembali">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-semibold">
            {loan.type === 'payable' ? 'Pembayaran Hutang' : 'Terima Pembayaran Piutang'}
          </h2>
          <div className="w-6"></div>
        </div>

        <div className="p-4">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="font-medium">Detail {loan.type === 'payable' ? 'Hutang' : 'Piutang'}</h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-gray-500">Total {loan.type === 'payable' ? 'Hutang' : 'Piutang'}</p>
                <p className="font-medium">{formatCurrency(loan.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sisa {loan.type === 'payable' ? 'Hutang' : 'Piutang'}</p>
                <p className="font-medium">{formatCurrency(loan.remaining_amount || loan.amount)}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tanggal Pembayaran</label>
              <DateRangePicker
                onChange={(date) => setValue('payment_date', date)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Jumlah Pembayaran</label>
              <Input
                type="number"
                {...register('amount', {
                  required: 'Jumlah pembayaran harus diisi',
                  min: { value: 1, message: 'Jumlah harus lebih dari 0' },
                  max: { 
                    value: loan.remaining_amount || loan.amount,
                    message: `Maksimal pembayaran ${formatCurrency(loan.remaining_amount || loan.amount)}`
                  }
                })}
                placeholder="0"
                error={errors.amount?.message}
              />
              <p className="text-xs text-gray-500 mt-1">
                Maksimal pembayaran: {formatCurrency(loan.remaining_amount || loan.amount)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pilih Sumber Dana</label>
              <Select 
                onValueChange={(value) => setValue('wallet_id', value)}
                {...register('wallet_id', { required: 'Pilih wallet untuk pembayaran' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih wallet" />
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
                {...register('mark_as_paid')}
              />
              <label htmlFor="mark-paid" className="text-sm">
                Tandai sebagai lunas meskipun pembayaran parsial
              </label>
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
                className={loan.type === 'payable' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'}
              >
                {loading ? 'Memproses...' : loan.type === 'payable' ? 'Bayar' : 'Terima Pembayaran'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoanPaymentPage; 