import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Wallet } from '@/types';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ArrowLeft, TrendingUp, DollarSign, User, Calendar, WalletIcon } from 'lucide-react';
import Layout from '@/components/Layout';
import { formatCurrency } from '@/lib/utils';

const AddReceivablePage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    borrower: '',
    due_date: '',
    wallet_id: '',
  });
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    // Fetch wallets when component mounts
    const fetchWallets = async () => {
      if (user) {
      const { data, error } = await supabase
        .from('wallets')
          .select('id, name, color, balance, type, gradient, logo_url')
        .eq('user_id', user.id);

      if (error) {
        console.error("Error fetching wallets:", error);
          toast.error("Gagal memuat daftar wallet");
        } else if (data) {
          setWallets(data as unknown as Wallet[]);
      }
      }
    };

    fetchWallets();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
    
    // Jika yang diubah adalah wallet_id, update selectedWallet
    if (name === 'wallet_id') {
      const wallet = wallets.find(w => w.id === value);
      setSelectedWallet(wallet || null);
    }
  };
  
  const handleAmountChange = (value: number) => {
    setFormData(prevData => ({
      ...prevData,
      amount: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.wallet_id) {
        toast.error("Pilih dompet terlebih dahulu");
        setIsLoading(false);
        return;
      }

      // Make sure we have a numeric amount
      if (!formData.amount || formData.amount <= 0) {
        toast.error("Masukkan jumlah piutang yang valid");
        setIsLoading(false);
        return;
      }

      // Create loan data with correct type
      const loanData = {
        description: formData.description,
        amount: formData.amount,
        lender: formData.borrower, // We store borrower in lender field for receivables
        due_date: formData.due_date || null,
        wallet_id: formData.wallet_id,
        type: 'receivable',
        status: 'unpaid',
        user_id: user!.id
      };

      // 1. Create the loan record
      const { data: loanResult, error: loanError } = await supabase
        .from('loans')
        .insert(loanData)
        .select();

      if (loanError) throw loanError;
      
      // 2. Create transaction record for this receivable
      try {
        const transactionData = {
          user_id: user!.id,
          title: formData.description,
          amount: formData.amount,
          type: 'expense', // Receivable reduces wallet balance initially
          date: new Date().toISOString().split('T')[0], // Today's date
          category: 'Piutang',
          wallet_id: formData.wallet_id,
          description: `Pinjaman kepada ${formData.borrower}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Coba update saldo wallet secara manual jika transaksi gagal dibuat
        const { data: walletData, error: walletFetchError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('id', formData.wallet_id)
          .single();
          
        if (!walletFetchError && walletData) {
          // Update saldo wallet dengan mengurangi jumlah piutang (karena ini expense)
          await supabase
            .from('wallets')
            .update({ balance: walletData.balance - formData.amount })
            .eq('id', formData.wallet_id);
        }
        
        // Coba buat transaksi (mungkin akan gagal karena trigger)
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert(transactionData);
          
        if (transactionError) {
          console.error("Error creating transaction record:", transactionError);
          toast.warning("Piutang berhasil ditambahkan tetapi gagal mencatatnya sebagai transaksi. Saldo dompet sudah diperbarui.");
        }
      } catch (transactionErr) {
        console.error("Error in transaction processing:", transactionErr);
        toast.warning("Piutang berhasil ditambahkan tetapi gagal mencatatnya sebagai transaksi");
      }
      
      toast.success("Piutang berhasil ditambahkan");
      navigate('/loans');
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal menambahkan piutang");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-slate-200 to-gray-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="container mx-auto py-2 px-2 md:px-6 max-w-2xl relative z-10 pt-6 pb-32">
          {/* Header */}
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
            <div className="flex items-center gap-3">
              <Link 
                to="/loans"
                className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md border border-white/30"
                aria-label="Kembali"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Tambah Piutang</h1>
                <p className="text-xs text-gray-500">Catat pinjaman yang diberikan kepada orang lain</p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="backdrop-blur-sm bg-white/95 rounded-2xl shadow-md border border-gray-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Form Piutang</h3>
                  <p className="text-white/70 text-sm">Data pinjaman yang Anda berikan</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Deskripsi Piutang*
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Pinjaman untuk modal usaha"
                  rows={3}
                  className="border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  Jumlah Piutang*
                </Label>
                <CurrencyInput
                  id="amount"
                  showPrefix={true}
                  placeholder="Masukkan jumlah piutang"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              {/* Borrower */}
              <div className="space-y-2">
                <Label htmlFor="borrower" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  Peminjam*
                </Label>
                <Input
                  id="borrower"
                  name="borrower"
                  value={formData.borrower}
                  onChange={handleChange}
                  required
                  placeholder="Nama orang yang meminjam"
                  className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="due_date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Jatuh Tempo (Opsional)
                </Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              {/* Wallet Selection */}
              <div className="space-y-2">
                <Label htmlFor="wallet_id" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <WalletIcon className="h-4 w-4 text-gray-500" />
                  Dompet Sumber*
                </Label>
                <Select
                  value={formData.wallet_id}
                  onValueChange={(value) => handleSelectChange('wallet_id', value)}
                >
                  <SelectTrigger className="h-12 border-gray-200 focus:border-green-500">
                    <SelectValue placeholder="Pilih dompet sumber dana">
                      {selectedWallet && (
                        <div className="flex items-center gap-3 w-full">
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: selectedWallet.color || '#6B7280' }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{selectedWallet.name}</span>
                              <span className="text-sm font-semibold text-green-600">
                                {formatCurrency(selectedWallet.balance)}
                              </span>
                            </div>
                            {selectedWallet.type && (
                              <span className="text-xs text-gray-500 capitalize">{selectedWallet.type}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id} className="p-3">
                        <div className="flex items-center gap-3 w-full">
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: wallet.color || '#6B7280' }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{wallet.name}</span>
                              <span className="text-sm font-semibold text-green-600">
                                {formatCurrency(wallet.balance)}
                              </span>
                            </div>
                            {wallet.type && (
                              <span className="text-xs text-gray-500 capitalize">{wallet.type}</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Piutang akan mengurangi saldo dompet yang dipilih
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan Piutang...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Tambah Piutang
                    </div>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/loans')}
                  disabled={isLoading}
                  className="h-12 border-gray-200 hover:bg-gray-50"
                >
                  Kembali ke Hutang & Piutang
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AddReceivablePage;
