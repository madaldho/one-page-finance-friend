
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loan, Payment } from '@/types';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const LoanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchLoanAndPayments();
    }
  }, [user, id]);

  const fetchLoanAndPayments = async () => {
    try {
      setLoading(true);
      
      // Fetch loan details
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', id)
        .single();

      if (loanError) throw loanError;
      
      // The loan data from the database might not have all the fields we need
      // so we'll add them here if they're missing
      const loanWithDefaults = {
        ...loanData,
        date: loanData.created_at || new Date().toISOString(),
        remaining_amount: loanData.remaining_amount || (loanData.amount - (loanData.paid_amount || 0)),
      };
      
      setLoan(loanWithDefaults);

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('loan_id', id)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Gagal memuat data',
        description: error.message,
        variant: 'destructive'
      });
      navigate('/loans');
    } finally {
      setLoading(false);
    }
  };

  if (!loan) return null;

  const canPay = loan.status !== 'paid';

  return (
    <div className="fixed inset-0 bg-black/50 flex flex-col z-50">
      <div className="bg-white rounded-t-xl flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between border-b p-4">
          <button onClick={() => navigate(-1)} className="p-1" title="Kembali">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-semibold">
            Detail {loan.type === 'payable' ? 'Hutang' : 'Piutang'}
          </h2>
          <div className="w-6"></div>
        </div>

        <div className="p-4">
          {/* Loan Summary */}
          <div className={`p-4 rounded-lg mb-4 ${loan.type === 'payable' ? 'bg-blue-50' : 'bg-green-50'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total {loan.type === 'payable' ? 'Hutang' : 'Piutang'}</p>
                <p className="font-medium">{formatCurrency(loan.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sisa {loan.type === 'payable' ? 'Hutang' : 'Piutang'}</p>
                <p className="font-medium">{formatCurrency(loan.remaining_amount || loan.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sudah Dibayar</p>
                <p className="font-medium">{formatCurrency(loan.paid_amount || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className={`font-medium ${
                  loan.status === 'paid' ? 'text-green-600' :
                  loan.status === 'partial' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {loan.status === 'paid' ? 'Lunas' :
                   loan.status === 'partial' ? 'Sebagian' :
                   'Belum Lunas'}
                </p>
              </div>
            </div>

            {/* Loan Details */}
            <div className="mt-4 space-y-2">
              <div>
                <p className="text-xs text-gray-500">Tanggal</p>
                <p className="font-medium">
                  {format(new Date(loan.date || loan.created_at || new Date()), 'dd MMMM yyyy', { locale: id })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Catatan</p>
                <p className="font-medium">{loan.description || '-'}</p>
              </div>
            </div>

            {/* Payment Button */}
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

          {/* Payment History */}
          <div>
            <h3 className="font-medium mb-2">Riwayat Pembayaran</h3>
            {payments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Belum ada pembayaran
              </p>
            ) : (
              <div className="space-y-2">
                {payments.map(payment => (
                  <div key={payment.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(payment.payment_date), 'dd MMMM yyyy', { locale: id })}
                        </p>
                      </div>
                      {payment.description && (
                        <p className="text-sm text-gray-500">{payment.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDetail;
