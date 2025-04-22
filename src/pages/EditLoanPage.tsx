import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loan } from '@/types';
import Layout from '@/components/Layout';
import { ArrowLeft, Calendar, User, Info, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { CurrencyInput } from '@/components/ui/currency-input';

interface EditLoanFormData {
  amount: number;
  due_date: string;
  description: string;
  lender?: string;
  borrower?: string;
}

const EditLoanPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [originalDescription, setOriginalDescription] = useState('');
  const [originalLender, setOriginalLender] = useState('');
  const [originalBorrower, setOriginalBorrower] = useState('');

  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm<EditLoanFormData>();

  useEffect(() => {
    if (user && id) {
      fetchLoan();
    }
  }, [user, id]);

  const fetchLoan = async () => {
    try {
      setInitialLoading(true);
      
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Memastikan tipe data sesuai dengan interface Loan
      setLoan({
        ...data,
        type: data.type as "payable" | "receivable",
        status: data.status as "paid" | "unpaid" | "partial",
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        due_date: data.due_date || new Date().toISOString(),
      });
      
      // Simpan data asli untuk pencarian transaksi terkait
      setOriginalDescription(data.description || '');
      setOriginalLender(data.lender || '');
      setOriginalBorrower(data.borrower || '');
      
      // Set form values
      setValue('amount', data.amount);
      setValue('description', data.description || '');
      setValue('due_date', data.due_date || format(new Date(), 'yyyy-MM-dd'));
      
      if (data.type === 'payable' && data.lender) {
        setValue('lender', data.lender);
      } else if (data.type === 'receivable' && data.borrower) {
        setValue('borrower', data.borrower);
      }
    } catch (error: unknown) {
      console.error('Error fetching loan data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data';
      toast({
        title: 'Gagal memuat data',
        description: errorMessage,
        variant: 'destructive',
      });
      navigate('/loans');
    } finally {
      setInitialLoading(false);
    }
  };

  // Fungsi untuk memperbarui transaksi terkait dengan pinjaman
  const updateRelatedTransactions = async (formData: EditLoanFormData) => {
    if (!user || !loan || !loan.wallet_id) return;

    try {
      // Mengambil transaksi original yang terkait dengan pinjaman
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('wallet_id', loan.wallet_id)
        .eq('category', loan.type === 'payable' ? 'Hutang' : 'Piutang');

      if (transactionsError) throw transactionsError;

      console.log('Transaksi yang ditemukan:', transactionsData?.length || 0);

      if (!transactionsData || transactionsData.length === 0) {
        console.log('Tidak ada transaksi terkait yang ditemukan');
        return;
      }

      // Cari transaksi yang sesuai baik dengan judul, deskripsi, atau keduanya
      const relatedTransactions = transactionsData.filter(transaction => {
        // Match berdasarkan deskripsi transaksi yang berisi informasi pemberi/peminjam
        const descriptionMatch = 
          loan.type === 'payable' 
            ? transaction.description?.includes(`Pinjaman dari ${originalLender}`)
            : transaction.description?.includes(`Pinjaman kepada ${originalBorrower}`);
        
        // Match berdasarkan judul transaksi yang sama dengan deskripsi pinjaman
        const titleMatch = transaction.title === originalDescription;
        
        return titleMatch || descriptionMatch;
      });

      console.log('Transaksi terkait yang akan diupdate:', relatedTransactions.length);

      // Update setiap transaksi yang terkait
      for (const transaction of relatedTransactions) {
        const updatedTransaction = {
          title: formData.description,
          amount: formData.amount,
          description: loan.type === 'payable'
            ? `Pinjaman dari ${formData.lender}`
            : `Pinjaman kepada ${formData.borrower}`
        };

        const { error: updateError } = await supabase
          .from('transactions')
          .update(updatedTransaction)
          .eq('id', transaction.id);

        if (updateError) {
          console.error('Error updating transaction:', updateError);
        } else {
          console.log('Transaksi berhasil diperbarui:', transaction.id);
        }
      }

      return relatedTransactions.length;
    } catch (error) {
      console.error('Error updating related transactions:', error);
      throw error;
    }
  };

  const onSubmit = async (data: EditLoanFormData) => {
    if (!user || !loan) return;
    setLoading(true);

    try {
      // Prepare loan data
      const loanData: Partial<Loan> = {
        amount: data.amount,
        due_date: data.due_date,
        description: data.description,
      };

      // Add type-specific fields
      if (loan.type === 'payable' && data.lender) {
        loanData.lender = data.lender;
      } else if (loan.type === 'receivable' && data.borrower) {
        loanData.borrower = data.borrower;
      }

      // Update loan
      const { error } = await supabase
        .from('loans')
        .update(loanData)
        .eq('id', loan.id);

      if (error) throw error;

      // Hanya update wallet dan transaksi jika wallet_id tersedia
      if (loan.wallet_id) {
        try {
          // Mengambil data wallet
          const { data: walletData, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('id', loan.wallet_id)
            .single();

          if (walletError) throw walletError;

          // Update wallet balance jika jumlah berubah
          if (data.amount !== loan.amount && walletData) {
            const amountDifference = data.amount - loan.amount;
            
            // Untuk hutang (payable), saldo bertambah saat meminjam
            // Untuk piutang (receivable), saldo berkurang saat meminjamkan
            const newBalance = loan.type === 'payable'
              ? walletData.balance + amountDifference
              : walletData.balance - amountDifference;

            const { error: updateWalletError } = await supabase
              .from('wallets')
              .update({ balance: newBalance })
              .eq('id', loan.wallet_id);

            if (updateWalletError) throw updateWalletError;
          }

          // Update semua transaksi terkait
          const updatedCount = await updateRelatedTransactions(data);
          if (updatedCount) {
            console.log(`Berhasil memperbarui ${updatedCount} transaksi terkait`);
          }
        } catch (walletError: unknown) {
          console.error('Error updating wallet/transaction:', walletError);
          // Tidak melempar error agar proses tetap berjalan meskipun ada masalah pada wallet
        }
      }

      toast({
        title: 'Berhasil',
        description: `${loan.type === 'payable' ? 'Hutang' : 'Piutang'} berhasil diperbarui`,
      });

      navigate('/loans');
    } catch (error: unknown) {
      console.error('Error updating loan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan perubahan';
      toast({
        title: 'Gagal Menyimpan',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading || !loan) {
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
            <div className="h-10 bg-gray-200 rounded-lg"></div>
            <div className="h-10 bg-gray-200 rounded-lg"></div>
            <div className="h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-xl pb-24">
        <div className="flex items-center mb-6">
          <Link to="/loans" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">
            Edit {loan.type === 'payable' ? 'Hutang' : 'Piutang'}
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mb-24">
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <div className="flex items-center mb-4">
              <CreditCard className={`${loan.type === 'payable' ? 'text-purple-500' : 'text-green-500'} mr-2 h-5 w-5`} />
              <h2 className="text-lg font-medium">Detail {loan.type === 'payable' ? 'Hutang' : 'Piutang'}</h2>
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

              {loan.type === 'payable' ? (
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
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">Peminjam</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      className="pl-10"
                      {...register('borrower', { 
                        required: 'Peminjam harus diisi'
                      })}
                      placeholder="Nama peminjam"
                      error={errors.borrower?.message}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Catatan / Judul</label>
                <div className="relative">
                  <Info className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    className="pl-10"
                    {...register('description', { required: 'Catatan harus diisi sebagai judul' })}
                    placeholder="Tambahkan catatan (akan digunakan sebagai judul)"
                    error={errors.description?.message}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm">
            <div className="flex items-center mb-4">
              <Calendar className={`${loan.type === 'payable' ? 'text-purple-500' : 'text-green-500'} mr-2 h-5 w-5`} />
              <h2 className="text-lg font-medium">Jangka Waktu</h2>
            </div>

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
              className={`w-full ${loan.type === 'payable' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-rose-600 hover:bg-rose-700'}`}
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditLoanPage; 