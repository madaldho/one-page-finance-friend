import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Wallet } from '@/types';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { formatCurrency } from '@/lib/utils';

const AddDebtPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    lender: '',
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
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error("Error fetching wallets:", error);
          toast.error("Gagal memuat daftar wallet");
        } else if (data) {
          setWallets(data);
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
        toast.error("Masukkan jumlah hutang yang valid");
        setIsLoading(false);
        return;
      }

      // Ensure we send required fields and convert amount to number
      const loanData = {
        description: formData.description,
        amount: formData.amount,
        lender: formData.lender,
        due_date: formData.due_date || null,
        wallet_id: formData.wallet_id,
        type: 'payable',
        status: 'unpaid',
        user_id: user!.id
      };

      // 1. Create the loan record
      const { data: loanResult, error: loanError } = await supabase
        .from('loans')
        .insert(loanData)
        .select();

      if (loanError) throw loanError;
      
      // 2. Create transaction record for this loan (untuk riwayat transaksi)
      // Gunakan try-catch terpisah agar kegagalan transaksi tidak menggagalkan seluruh proses
      try {
        const transactionData = {
          user_id: user!.id,
          title: formData.description,
          amount: formData.amount,
          type: 'income', // Debt is an income for the wallet
          date: new Date().toISOString().split('T')[0], // Today's date
          category: 'Hutang', // Using a category name that makes sense
          wallet_id: formData.wallet_id,
          description: `Pinjaman dari ${formData.lender}`,
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
          // Update saldo wallet dengan menambahkan jumlah hutang (income)
          await supabase
            .from('wallets')
            .update({ balance: walletData.balance + formData.amount })
            .eq('id', formData.wallet_id);
        }
        
        // Coba buat transaksi (mungkin akan gagal karena trigger)
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert(transactionData);
          
        if (transactionError) {
          console.error("Error creating transaction record:", transactionError);
          toast.warning("Hutang berhasil ditambahkan tetapi gagal mencatatnya sebagai transaksi. Saldo dompet sudah diperbarui.");
        }
      } catch (transactionErr) {
        console.error("Error in transaction processing:", transactionErr);
        toast.warning("Hutang berhasil ditambahkan tetapi gagal mencatatnya sebagai transaksi");
      }

      toast.success("Hutang berhasil ditambahkan");
      navigate('/loans');
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal menambahkan hutang");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate gradient or color style sesuai data dompet
  const getWalletStyle = (wallet: Wallet) => {
    // Menggunakan type assertion untuk mengatasi masalah TypeScript
    const walletWithGradient = wallet as { gradient?: string; color?: string };
    
    if (walletWithGradient.gradient && typeof walletWithGradient.gradient === 'string') {
      // Coba ekstrak warna pertama dari gradient jika ada
      const match = walletWithGradient.gradient.match(/rgba?\([\d\s,.]+\)|#[a-f\d]{3,8}/i);
      if (match) {
        // Gunakan warna pertama yang ditemukan dalam gradient
        return { backgroundColor: match[0] };
      }
      // Jika tidak bisa ekstrak warna, tetap gunakan gradient
      return { background: walletWithGradient.gradient };
    }
    
    // Fallback ke warna solid
    return { backgroundColor: wallet.color || '#94a3b8' };
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-md">
        <div className="flex items-center mb-6">
          <Link to="/loans" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Tambah Hutang</h1>
        </div>
        
        <Card className="shadow-sm border-0">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Pinjaman untuk apa"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah</Label>
                <CurrencyInput
                  id="amount"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  showPrefix={true}
                  placeholder="0"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lender">Pemberi Hutang</Label>
                <Input
                  type="text"
                  id="lender"
                  name="lender"
                  value={formData.lender}
                  onChange={handleChange}
                  placeholder="Nama pemberi pinjaman"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due_date">Tanggal Jatuh Tempo</Label>
                <Input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500">Opsional</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wallet_id">Pilih Dompet</Label>
                <Select
                  value={formData.wallet_id}
                  onValueChange={(value) => handleSelectChange('wallet_id', value)}
                >
                  <SelectTrigger id="wallet_id" className="w-full">
                    <SelectValue placeholder="Pilih dompet">
                      {selectedWallet && (
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-2" 
                            style={getWalletStyle(selectedWallet)}
                          />
                          <span>{selectedWallet.name}</span>
                          <span className="ml-2 text-gray-500">
                            ({formatCurrency(selectedWallet.balance)})
                          </span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map(wallet => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-2" 
                            style={getWalletStyle(wallet)}
                          />
                          <span>{wallet.name}</span>
                          <span className="ml-2 text-gray-500">
                            ({formatCurrency(wallet.balance)})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Hutang akan menambah saldo dompet yang dipilih
                </p>
              </div>
              
              <div className="pt-4 grid grid-cols-2 gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/loans')}
                  disabled={isLoading}
                  className="w-full"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Memproses..." : "Simpan Hutang"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AddDebtPage;
