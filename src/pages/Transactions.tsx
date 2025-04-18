import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeftRight, 
  Wallet, 
  Filter,
  Search,
  Plus,
  FileDown,
  Trash2,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TransactionForm from '@/components/TransactionForm';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer' | string;
  date: string;
  description?: string;
  category?: string;
  category_data?: Category;
  wallet_id: string | null;
  wallet_name?: string;
  destination_wallet_id?: string | null;
  destination_wallet_name?: string;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
}

interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: number;
  color?: string;
}

const Transactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const walletParam = searchParams.get('wallet');
  const navigate = useNavigate();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [selectedWalletName, setSelectedWalletName] = useState<string>('Semua Dompet');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);
  
  useEffect(() => {
    // Jika ada parameter wallet di URL, atur filter dompet
    if (walletParam && walletParam !== 'all') {
      setSelectedWalletId(walletParam);
    }
  }, [walletParam]);

  useEffect(() => {
    // Dapatkan nama dompet yang dipilih
    if (selectedWalletId === 'all') {
      setSelectedWalletName('Semua Dompet');
    } else {
      const selectedWallet = wallets.find(w => w.id === selectedWalletId);
      if (selectedWallet) {
        setSelectedWalletName(selectedWallet.name);
      }
    }
  }, [selectedWalletId, wallets]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id);

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id);

      if (walletsError) throw walletsError;
      setWallets(walletsData || []);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Enrich transactions with wallet and category data
      const enrichedTransactions = transactionsData?.map(transaction => {
        const categoryData = categoriesData?.find(cat => cat.id === transaction.category);
        const walletData = walletsData?.find(w => w.id === transaction.wallet_id);
        const destinationWallet = walletsData?.find(w => w.id === transaction.destination_wallet_id);
        
        return {
          ...transaction,
          category_data: categoryData,
          wallet_name: walletData?.name,
          destination_wallet_name: destinationWallet?.name
        };
      }) || [];
      
      setTransactions(enrichedTransactions);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data transaksi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
      toast({
        title: 'Berhasil',
        description: 'Transaksi berhasil dihapus',
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus transaksi',
        variant: 'destructive',
      });
    }
  };

  const exportTransactions = async () => {
    try {
      const filteredData = getFilteredTransactions();
      
      const csvContent = [
        // Header row
        ['ID', 'Tanggal', 'Judul', 'Dompet', 'Tujuan', 'Kategori', 'Jenis', 'Jumlah', 'Deskripsi'].join(','),
        // Data rows
        ...filteredData.map(t => [
          t.id,
          t.date,
          t.title,
          t.wallet_name || '',
          t.destination_wallet_name || '',
          t.category_data?.name || t.category || '',
          t.type,
          t.amount,
          t.description || ''
        ].map(val => `"${val}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaksi-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: 'Berhasil',
        description: 'Data transaksi berhasil diekspor ke CSV',
      });
    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengekspor data transaksi',
        variant: 'destructive',
      });
    }
  };

  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      // Filter by tab (transaction type)
      if (activeTab !== 'all' && transaction.type !== activeTab) {
        return false;
      }
      
      // Filter by wallet
      if (selectedWalletId !== 'all' && transaction.wallet_id !== selectedWalletId) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          transaction.title.toLowerCase().includes(searchLower) ||
          (transaction.description?.toLowerCase().includes(searchLower) || false) ||
          (transaction.category_data?.name.toLowerCase().includes(searchLower) || false) ||
          (transaction.wallet_name?.toLowerCase().includes(searchLower) || false)
        );
      }
      
      return true;
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'expense':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      case 'transfer':
        return <ArrowLeftRight className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const filteredTransactions = getFilteredTransactions();

  const handleGoBack = () => {
    if (walletParam) {
      navigate(`/wallet/${walletParam}`);
    } else {
      navigate('/home');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full h-9 w-9" 
              onClick={handleGoBack}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Transaksi</h1>
            {selectedWalletId !== 'all' && (
              <span className="ml-2 py-1 px-3 bg-gray-100 rounded-full text-sm">
                {selectedWalletName}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportTransactions}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setTransactionType('income');
                setShowAddTransaction(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-gray-50"
                />
              </div>
              <div className="flex gap-2">
                <Select 
                  value={selectedWalletId} 
                  onValueChange={setSelectedWalletId}
                >
                  <SelectTrigger className="w-[160px]">
                    <Wallet className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Semua Dompet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Dompet</SelectItem>
                    {wallets.map(wallet => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  className="px-2" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedWalletId('all');
                    setActiveTab('all');
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="income">Pemasukan</TabsTrigger>
            <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
            <TabsTrigger value="transfer">Transfer</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center p-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Memuat data transaksi...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-500">Tidak ada transaksi</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredTransactions.map(transaction => {
                    const categoryData = transaction.category_data;
                    
                    return (
                      <Card key={transaction.id} className="overflow-hidden">
                        <div className="flex p-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div 
                              className={`p-2 rounded-xl ${
                                categoryData?.color 
                                  ? 'text-white'
                                  : transaction.type === 'income' 
                                    ? 'bg-green-50 text-green-500' 
                                    : transaction.type === 'expense' 
                                      ? 'bg-red-50 text-red-500' 
                                      : 'bg-blue-50 text-blue-500'
                              }`}
                              style={{ 
                                backgroundColor: categoryData?.color || '',
                              }}
                            >
                              {categoryData?.icon ? (
                                <i className={`fas fa-${categoryData.icon} w-4 h-4`}></i>
                              ) : (
                                getTransactionIcon(transaction.type)
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium text-gray-900">{transaction.title}</h3>
                                  <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`font-semibold ${
                                    transaction.type === 'income' 
                                      ? 'text-green-600' 
                                      : transaction.type === 'expense' 
                                        ? 'text-red-600' 
                                        : 'text-blue-600'
                                  }`}>
                                    {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                                    {formatCurrency(transaction.amount)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center mt-2">
                                <div className="flex-1">
                                  {categoryData && (
                                    <span className="inline-block px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700 mr-2">
                                      {categoryData.name}
                                    </span>
                                  )}
                                  <span className="inline-block px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                                    <Wallet className="w-3 h-3 inline mr-1" />
                                    {transaction.wallet_name}
                                  </span>
                                  {transaction.type === 'transfer' && transaction.destination_wallet_name && (
                                    <span className="inline-block px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700 ml-2">
                                      <ArrowRight className="w-3 h-3 inline mr-1" />
                                      {transaction.destination_wallet_name}
                                    </span>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 text-gray-400 hover:text-red-500"
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              {transaction.description && (
                                <p className="text-sm text-gray-600 mt-2">{transaction.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transactionType === 'income' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran'}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm 
            type={transactionType}
            onAddTransaction={() => {
              setShowAddTransaction(false);
              fetchData();
            }}
            onClose={() => setShowAddTransaction(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Transactions; 