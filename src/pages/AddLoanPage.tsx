import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useEffect } from 'react';
import { Wallet } from '@/types';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AddLoanPage = () => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    borrower: '',
    dueDate: '',
    wallet_id: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();
  const [wallets, setWallets] = useState<Wallet[]>([]);

  useEffect(() => {
    const fetchWallets = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error("Error fetching wallets:", error);
        }

        if (data) {
          setWallets(data);
        }
      }
    };

    fetchWallets();
  }, [user]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Make sure we have a numeric amount
      if (!formData.amount || isNaN(parseFloat(formData.amount.toString()))) {
        toast.error("Please enter a valid amount");
        setIsLoading(false);
        return;
      }

      const amount = parseFloat(formData.amount.toString());

      // Ensure we send required fields and convert amount to number
      const loanData = {
        ...formData,
        amount: amount,
        type: 'receivable',
        status: 'unpaid',
        user_id: user!.id
      };

      const { data, error } = await supabase
        .from('loans')
        .insert(loanData)
        .select();

      if (error) throw error;
      
      // Buat transaksi untuk mencatat piutang ini ke dalam daftar transaksi
      // Gunakan try-catch terpisah agar kegagalan transaksi tidak menggagalkan seluruh proses
      try {
        const transactionData = {
          user_id: user!.id,
          title: formData.description,
          amount: amount,
          type: 'expense', // Piutang adalah expense untuk wallet (uang keluar)
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
          // Update saldo wallet dengan mengurangkan jumlah piutang (expense)
          await supabase
            .from('wallets')
            .update({ balance: walletData.balance - amount })
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
    <div className="container mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-5">Add Receivable</h2>
      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="mb-4">
          <Label htmlFor="description">Description</Label>
          <Input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="amount">Amount</Label>
          <Input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="borrower">Borrower</Label>
          <Input
            type="text"
            id="borrower"
            name="borrower"
            value={formData.borrower}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <Label htmlFor="wallet_id">Wallet</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, wallet_id: value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a wallet" />
            </SelectTrigger>
            <SelectContent>
              {wallets.map((wallet) => (
                <SelectItem key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {isLoading ? 'Adding...' : 'Add Receivable'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddLoanPage;
