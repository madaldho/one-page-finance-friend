import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loan } from '@/types';
import Layout from '@/components/Layout';
import { ArrowLeft, Calendar, User, Info } from 'lucide-react';
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
      
      setLoan(data);
      
      // Set form values
      setValue('amount', data.amount);
      setValue('description', data.description || '');
      setValue('due_date', data.due_date || format(new Date(), 'yyyy-MM-dd'));
      
      if (data.type === 'payable' && data.lender) {
        setValue('lender', data.lender);
      } else if (data.type === 'receivable' && data.borrower) {
        setValue('borrower', data.borrower);
      }
    } catch (error: any) {
      console.error('Error fetching loan data:', error);
      toast({
        title: 'Gagal memuat data',
        description: error.message || 'Terjadi kesalahan saat mengambil data',
        variant: 'destructive',
      });
      navigate('/loans');
    } finally {
      setInitialLoading(false);
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

      toast({
        title: 'Berhasil',
        description: `${loan.type === 'payable' ? 'Hutang' : 'Piutang'} berhasil diperbarui`,
      });

      navigate(`/loans/${loan.id}`);
    } catch (error: any) {
      console.error('Error updating loan:', error);
      toast({
        title: 'Gagal Menyimpan',
        description: error.message || 'Terjadi kesalahan saat menyimpan perubahan',
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
          <Link to={`/loans/${loan.id}`} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">
            Edit {loan.type === 'payable' ? 'Hutang' : 'Piutang'}
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mb-24">
          <div className="bg-white rounded-lg p-5 shadow-sm">
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
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/loans/${loan.id}`)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={loan.type === 'payable' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditLoanPage; 