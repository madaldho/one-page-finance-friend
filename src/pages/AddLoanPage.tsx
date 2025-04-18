import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loan } from '@/types';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

interface LoanFormData {
  title: string;
  amount: number;
  due_date: string;
  installment: number;
  wallet_id: string;
  status: 'unpaid' | 'paid' | 'partial';
  lender?: string;  // untuk hutang
  borrower?: string;  // untuk piutang
}

const AddLoanPage = () => {
  const { type } = useParams<{ type: 'debt' | 'receivable' }>();  // debt = hutang, receivable = piutang
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoanFormData>({
    defaultValues: {
      title: '',
      amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      installment: 1,
      status: 'unpaid',
    }
  });

  const onSubmit = async (data: LoanFormData) => {
    if (!user) return;
    setLoading(true);

    try {
      // Prepare loan data
      const loanData: Partial<Loan> = {
        user_id: user.id,
        title: data.title,
        amount: data.amount,
        remaining_amount: data.amount,
        due_date: data.due_date,
        type: type === 'debt' ? 'payable' : 'receivable',
        status: 'unpaid',
        installment: data.installment,
        total_installments: data.installment,
        ...(type === 'debt' ? { lender: data.lender } : { borrower: data.borrower })
      };

      // Insert to database
      const { data: newLoan, error } = await supabase
        .from('loans')
        .insert(loanData)
        .select()
        .single();

      if (error) throw error;

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
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-semibold">
            Tambah {type === 'debt' ? 'Hutang' : 'Piutang'} Baru
          </h2>
          <div className="w-6"></div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Judul</label>
            <Input
              {...register('title', { required: 'Judul harus diisi' })}
              placeholder={`${type === 'debt' ? 'Hutang' : 'Piutang'} baru`}
              error={errors.title?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Jumlah</label>
            <Input
              type="number"
              {...register('amount', { 
                required: 'Jumlah harus diisi',
                min: { value: 1, message: 'Jumlah harus lebih dari 0' }
              })}
              placeholder="0"
              error={errors.amount?.message}
            />
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
            <label className="block text-sm font-medium mb-1">Cicilan</label>
            <Input
              type="number"
              {...register('installment', { 
                required: 'Jumlah cicilan harus diisi',
                min: { value: 1, message: 'Minimal 1 cicilan' }
              })}
              placeholder="1"
              error={errors.installment?.message}
            />
            <p className="text-xs text-gray-500 mt-1">
              Jumlah cicilan yang harus dibayar
            </p>
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