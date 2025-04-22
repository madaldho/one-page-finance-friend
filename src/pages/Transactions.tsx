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
} from '@/components/ui/tabs'
import {
  Card,
  CardContent,
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
  Search,
  Plus,
  FileDown,
  Trash2,
  ArrowRight,
  ChevronLeft,
  Calendar,
  Filter,
  X,
  MoreHorizontal,
  MoreVertical,
  Edit2,
  RotateCcw,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TransactionForm from '@/components/TransactionForm';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Category } from '@/types';
import { DateRange } from 'react-day-picker';
import TransactionList from '@/components/TransactionList';
import { cn } from '@/lib/utils';

// Helper function for media queries
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

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
  selected?: boolean;
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
  const [selectedWalletIds, setSelectedWalletIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [selectedWalletName, setSelectedWalletName] = useState<string>('Semua Dompet');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const isSmallScreen = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);
  
  useEffect(() => {
    // Jika ada parameter wallet di URL, atur filter dompet
    if (walletParam && walletParam !== 'all') {
      setSelectedWalletIds([walletParam]);
    }
  }, [walletParam]);

  useEffect(() => {
    // Dapatkan nama dompet yang dipilih
    if (selectedWalletIds.length === 0) {
      setSelectedWalletName('Semua Dompet');
    } else {
      const selectedWallet = wallets.find(w => w.id === selectedWalletIds[0]);
      if (selectedWallet) {
        setSelectedWalletName(selectedWallet.name);
      }
    }
  }, [selectedWalletIds, wallets]);

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
      
      // Cast hasil dari enrichment ke type Transaction[]
      setTransactions(enrichedTransactions as unknown as Transaction[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Terjadi Kesalahan',
        description: 'Gagal memuat data transaksi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (ids: string[]) => {
    try {
      await Promise.all(
        ids.map(id => supabase.from('transactions').delete().eq('id', id))
      );
      
      setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
      toast({
        title: 'Berhasil',
        description: `${ids.length > 1 ? `${ids.length} transaksi` : 'Transaksi'} berhasil dihapus`,
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

  const handleEditTransaction = (transaction: Transaction) => {
    console.log('Edit transaction', transaction);
    // Arahkan ke halaman edit transaksi
    navigate(`/transaction/${transaction.type}/${transaction.id}`);
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
    if (!transactions) return [];
    
    return transactions.filter(transaction => {
      // Jenis transaksi (all, income, expense, transfer)
      if (activeTab !== 'all' && transaction.type !== activeTab) {
        return false;
      }
      
      // Filter berdasarkan wallet IDs (jika ada yang dipilih)
      if (selectedWalletIds.length > 0 && !selectedWalletIds.includes(transaction.wallet_id as string) && 
          !(transaction.destination_wallet_id && selectedWalletIds.includes(transaction.destination_wallet_id as string))) {
        return false;
      }
      
      // Filter berdasarkan kategori IDs (jika ada yang dipilih)
      if (selectedCategoryIds.length > 0 && !selectedCategoryIds.includes(transaction.category as string)) {
        return false;
      }
      
      // Rentang tanggal
      if (dateRangeFilter?.from && new Date(transaction.date) < dateRangeFilter.from) {
        return false;
      }
      
      if (dateRangeFilter?.to) {
        const toDateWithEndOfDay = new Date(dateRangeFilter.to);
        toDateWithEndOfDay.setHours(23, 59, 59, 999);
        if (new Date(transaction.date) > toDateWithEndOfDay) {
          return false;
        }
      }
      
      // Filter berdasarkan kata kunci
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesTitle = transaction.title?.toLowerCase().includes(searchLower);
        const matchesDescription = transaction.description?.toLowerCase().includes(searchLower);
        const matchesCategory = categories.find(
          cat => cat.id === transaction.category
        )?.name?.toLowerCase().includes(searchLower);
        
        const matchesWallet = wallets.find(
          w => w.id === transaction.wallet_id
        )?.name?.toLowerCase().includes(searchLower);
        
        if (!(matchesTitle || matchesDescription || matchesCategory || matchesWallet)) {
          return false;
        }
      }
      
      return true;
    });
  };

  const handleGoBack = () => {
    if (walletParam) {
      navigate(`/wallet/${walletParam}`);
    } else {
      navigate('/home');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedWalletIds([]);
    setSelectedCategoryIds([]);
    setActiveTab('all');
    setDateRangeFilter(undefined);
    setShowFilters(false);
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-5xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-background pt-2 pb-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-full" 
              onClick={handleGoBack}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Transaksi</h1>
            {selectedWalletIds.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {selectedWalletName}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2 pr-3">
           
                
                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[85vw] sm:max-w-md p-0">
                    <div className="h-full flex flex-col">
                      <div className="p-4 border-b">
                        <SheetTitle className="flex items-center gap-2">
                          <Filter className="w-5 h-5 text-primary" />
                          Filter Transaksi
                        </SheetTitle>
                      </div>
                      
                      <div className="flex-1 overflow-auto">
                        <div className="p-4 space-y-5">
                          {/* Jenis Transaksi */}
                      <div className="space-y-2">
                            <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Jenis Transaksi</p>
                              <Badge variant="outline" className="font-normal">
                                {activeTab === 'all' && 'Semua'}
                                {activeTab === 'income' && 'Pemasukan'}
                                {activeTab === 'expense' && 'Pengeluaran'}
                                {activeTab === 'transfer' && 'Transfer'}
                              </Badge>
                            </div>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                              <TabsList className="grid grid-cols-4 w-full rounded-lg h-9">
                                <TabsTrigger value="all" className="text-xs rounded-l-lg">Semua</TabsTrigger>
                                <TabsTrigger value="income" className="text-xs">Masuk</TabsTrigger>
                                <TabsTrigger value="expense" className="text-xs">Keluar</TabsTrigger>
                                <TabsTrigger value="transfer" className="text-xs rounded-r-lg">Transfer</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                          {/* Multi-select Wallet */}
                      <div className="space-y-2">
                            <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Dompet</p>
                              {selectedWalletIds.length > 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setSelectedWalletIds([])}
                                  className="h-6 px-2 text-xs"
                                >
                                  Reset ({selectedWalletIds.length})
                                </Button>
                              )}
                            </div>
                            <div className="relative">
                              <Select onValueChange={(value) => {
                                // Handle "all" option
                                if (value === "all") {
                                  setSelectedWalletIds([]);
                                  return;
                                }
                                
                                // Toggle selection
                                setSelectedWalletIds(prev => 
                                  prev.includes(value) 
                                    ? prev.filter(id => id !== value)
                                    : [...prev, value]
                                );
                              }}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={
                                    selectedWalletIds.length === 0 
                                      ? "Semua Dompet" 
                                      : `${selectedWalletIds.length} dompet dipilih`
                                  } />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="py-2 px-2 border-b border-gray-100">
                                    <SelectItem value="all" className="rounded-md">
                                      <div className="flex items-center space-x-2">
                                        <div className={`h-4 w-4 rounded-sm flex items-center justify-center ${selectedWalletIds.length === 0 ? "bg-primary border-primary" : "border border-gray-300"}`}>
                                          {selectedWalletIds.length === 0 && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                              <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                          )}
                                        </div>
                                        <span className="font-medium">Semua Dompet</span>
                                      </div>
                                    </SelectItem>
                                  </div>
                                  
                                  <div className="py-1 max-h-[200px] overflow-auto">
                                    {wallets.map(wallet => (
                                      <SelectItem
                                        key={wallet.id}
                                        value={wallet.id}
                                        className={`rounded-md my-1 ${selectedWalletIds.includes(wallet.id) ? `bg-${wallet.color ? wallet.color.replace('#', '') : 'primary'}/10` : ""}`}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <div className={`h-4 w-4 rounded-sm flex items-center justify-center ${selectedWalletIds.includes(wallet.id) ? `bg-${wallet.color || 'primary'} border-${wallet.color || 'primary'}` : "border"}`} style={{ borderColor: wallet.color }}>
                                            {selectedWalletIds.includes(wallet.id) && (
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                              </svg>
                                            )}
                                          </div>
                                          <span style={{ color: wallet.color }} className="font-medium">{wallet.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </div>
                                </SelectContent>
                              </Select>
                              
                              {/* Selected Wallets Badges */}
                              {selectedWalletIds.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {selectedWalletIds.map(walletId => {
                                    const wallet = wallets.find(w => w.id === walletId);
                                    if (!wallet) return null;
                                    return (
                                      <Badge 
                                        key={walletId} 
                                        className="flex items-center gap-1 py-0.5 pl-2 pr-1"
                                        style={{ backgroundColor: `${wallet.color}20`, color: wallet.color, borderColor: `${wallet.color}30` }}
                                      >
                                        {wallet.name}
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                                          onClick={() => setSelectedWalletIds(prev => prev.filter(id => id !== walletId))}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </Badge>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Multi-select Kategori */}
                      <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">Kategori</p>
                              {selectedCategoryIds.length > 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setSelectedCategoryIds([])}
                                  className="h-6 px-2 text-xs"
                                >
                                  Reset ({selectedCategoryIds.length})
                                </Button>
                              )}
                      </div>
                            <div className="relative">
                              <Select onValueChange={(value) => {
                                // Handle "all" option
                                if (value === "all") {
                                  setSelectedCategoryIds([]);
                                  return;
                                }
                                
                                // Toggle selection
                                setSelectedCategoryIds(prev => 
                                  prev.includes(value) 
                                    ? prev.filter(id => id !== value)
                                    : [...prev, value]
                                );
                              }}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={
                                    selectedCategoryIds.length === 0 
                                      ? "Semua Kategori" 
                                      : `${selectedCategoryIds.length} kategori dipilih`
                                  } />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="py-2 px-2 border-b border-gray-100">
                                    <SelectItem value="all" className="rounded-md">
                                      <div className="flex items-center space-x-2">
                                        <div className={`h-4 w-4 rounded-sm flex items-center justify-center ${selectedCategoryIds.length === 0 ? "bg-primary border-primary" : "border border-gray-300"}`}>
                                          {selectedCategoryIds.length === 0 && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                              <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                          )}
                                        </div>
                                        <span className="font-medium">Semua Kategori</span>
                                      </div>
                                    </SelectItem>
                                  </div>
                                  
                                  <div className="py-1 max-h-[200px] overflow-auto">
                                    {categories.map(category => (
                                      <SelectItem
                                        key={category.id}
                                        value={category.id}
                                        className={`rounded-md my-1 ${selectedCategoryIds.includes(category.id) ? `bg-${category.color ? category.color.replace('#', '') : 'primary'}/10` : ""}`}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <div className={`h-4 w-4 rounded-sm flex items-center justify-center ${selectedCategoryIds.includes(category.id) ? `bg-${category.color || 'primary'} border-${category.color || 'primary'}` : "border"}`} style={{ borderColor: category.color }}>
                                            {selectedCategoryIds.includes(category.id) && (
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                              </svg>
                                            )}
                                          </div>
                                          <span style={{ color: category.color }} className="font-medium">
                                            {category.icon && <i className={`fas fa-${category.icon} mr-1 text-xs`}></i>}
                                            {category.name}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                    
                                    {/* Kategori Khusus */}
                                    <SelectItem
                                      key="Transfer"
                                      value="Transfer"
                                      className={`rounded-md my-1 ${selectedCategoryIds.includes("Transfer") ? "bg-blue-50" : ""}`}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <div className={`h-4 w-4 rounded-sm flex items-center justify-center ${selectedCategoryIds.includes("Transfer") ? "bg-blue-500 border-blue-500" : "border border-blue-400"}`}>
                                          {selectedCategoryIds.includes("Transfer") && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                              <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                          )}
                                        </div>
                                        <span className="text-blue-600 font-medium">
                                          <i className="fas fa-exchange-alt mr-1 text-xs"></i>
                                          Transfer
                                        </span>
                                      </div>
                                    </SelectItem>
                                    
                                    <SelectItem
                                      key="Fee"
                                      value="Fee"
                                      className={`rounded-md my-1 ${selectedCategoryIds.includes("Fee") ? "bg-amber-50" : ""}`}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <div className={`h-4 w-4 rounded-sm flex items-center justify-center ${selectedCategoryIds.includes("Fee") ? "bg-amber-500 border-amber-500" : "border border-amber-400"}`}>
                                          {selectedCategoryIds.includes("Fee") && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                              <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                          )}
                                        </div>
                                        <span className="text-amber-600 font-medium">
                                          <i className="fas fa-percentage mr-1 text-xs"></i>
                                          Biaya Admin
                                        </span>
                                      </div>
                                    </SelectItem>
                                  </div>
                                </SelectContent>
                              </Select>
                              
                              {/* Selected Categories Badges */}
                              {selectedCategoryIds.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {selectedCategoryIds.map(catId => {
                                    if (catId === "Transfer") {
                                      return (
                                        <Badge 
                                          key={catId} 
                                          className="flex items-center gap-1 py-0.5 pl-2 pr-1 bg-blue-50 text-blue-700 border-blue-200"
                                        >
                                          <i className="fas fa-exchange-alt mr-1 text-xs"></i>
                                          Transfer
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-4 w-4 p-0 text-blue-400 hover:text-blue-700"
                                            onClick={() => setSelectedCategoryIds(prev => prev.filter(id => id !== catId))}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </Badge>
                                      );
                                    }
                                    
                                    if (catId === "Fee") {
                                      return (
                                        <Badge 
                                          key={catId} 
                                          className="flex items-center gap-1 py-0.5 pl-2 pr-1 bg-amber-50 text-amber-700 border-amber-200"
                                        >
                                          <i className="fas fa-percentage mr-1 text-xs"></i>
                                          Biaya Admin
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-4 w-4 p-0 text-amber-400 hover:text-amber-700"
                                            onClick={() => setSelectedCategoryIds(prev => prev.filter(id => id !== catId))}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </Badge>
                                      );
                                    }
                                    
                                    const category = categories.find(c => c.id === catId);
                                    if (!category) return null;
                                    return (
                                      <Badge 
                                        key={catId} 
                                        className="flex items-center gap-1 py-0.5 pl-2 pr-1"
                                        style={{ backgroundColor: `${category.color}20`, color: category.color, borderColor: `${category.color}30` }}
                                      >
                                        {category.icon && <i className={`fas fa-${category.icon} mr-1 text-xs`}></i>}
                                        {category.name}
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                                          onClick={() => setSelectedCategoryIds(prev => prev.filter(id => id !== catId))}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </Badge>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Rentang Tanggal */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Rentang Tanggal</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Dari</p>
                                <div className="relative">
                                  <Input 
                                    type="date" 
                                    className="w-full pl-8"
                                    value={dateRangeFilter?.from ? format(new Date(dateRangeFilter.from), "yyyy-MM-dd") : ""}
                                    onChange={(e) => {
                                      const fromDate = e.target.value ? new Date(e.target.value) : undefined;
                                      setDateRangeFilter(prev => ({
                                        from: fromDate,
                                        to: prev?.to
                                      }));
                                    }}
                                  />
                                  <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Sampai</p>
                                <div className="relative">
                                  <Input 
                                    type="date" 
                                    className="w-full pl-8"
                                    value={dateRangeFilter?.to ? format(new Date(dateRangeFilter.to), "yyyy-MM-dd") : ""}
                                    onChange={(e) => {
                                      const toDate = e.target.value ? new Date(e.target.value) : undefined;
                                      setDateRangeFilter(prev => ({
                                        from: prev?.from,
                                        to: toDate
                                      }));
                                    }}
                                  />
                                  <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Pencarian */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Pencarian</p>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            type="text"
                            placeholder="Cari transaksi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                          />
                          {searchTerm && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                              onClick={() => setSearchTerm('')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                          {/* Jumlah Transaksi */}
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Jumlah transaksi</span>
                              <Badge variant="secondary">{filteredTransactions.length}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Footer dengan tombol reset dan terapkan */}
                      <div className="p-4 border-t">
                        <div className="flex gap-2">
                        <Button 
                          variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setActiveTab('all');
                              setSelectedWalletIds([]);
                              setSelectedCategoryIds([]);
                              setDateRangeFilter(undefined);
                              setSearchTerm('');
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                          Reset Filter
                        </Button>
                        <Button 
                            className="flex-1"
                          onClick={() => setShowFilters(false)}
                        >
                            Terapkan
                        </Button>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  className="rounded-full"
                  onClick={exportTransactions}
                >
                  <FileDown className="h-4 w-4" />
                </Button>
          </div>
        </div>

        {/* Filter Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {activeTab !== 'all' && (
              <Badge 
                variant="outline"
                className="flex items-center gap-1 pl-2 bg-primary/5 border-primary/20"
              >
                {activeTab === 'income' ? 'Pemasukan' : activeTab === 'expense' ? 'Pengeluaran' : 'Transfer'}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 p-0 ml-1"
                  onClick={() => setActiveTab('all')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {selectedWalletIds.length > 0 && (
              <Badge 
                variant="outline"
                className="flex items-center gap-1 pl-2 bg-primary/5 border-primary/20"
              >
                {selectedWalletName}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 p-0 ml-1"
                  onClick={() => setSelectedWalletIds([])}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {searchTerm && (
              <Badge 
                variant="outline"
                className="flex items-center gap-1 pl-2 bg-primary/5 border-primary/20"
              >
                "{searchTerm}"
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 p-0 ml-1"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {(activeTab !== 'all' || selectedWalletIds.length > 0 || searchTerm) && (
              <Button 
                variant="ghost" 
                size="sm"
                className="text-xs h-7"
                onClick={resetFilters}
              >
                Reset Semua
              </Button>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Pengeluaran Card */}
            <Card className="bg-red-50 border-red-100 shadow-sm overflow-hidden relative">
              <div className="absolute right-0 top-0 h-full w-1 bg-red-400"></div>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium mb-1">Pengeluaran</p>
                    <p className="text-2xl font-bold text-red-700">
                      {formatCurrency(filteredTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      {filteredTransactions.filter(t => t.type === 'expense').length} transaksi
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <ArrowDownRight className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pemasukan Card */}
            <Card className="bg-green-50 border-green-100 shadow-sm overflow-hidden relative">
              <div className="absolute right-0 top-0 h-full w-1 bg-green-400"></div>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium mb-1">Pemasukan</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(filteredTransactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </p>
                    <p className="text-xs text-green-500 mt-1">
                      {filteredTransactions.filter(t => t.type === 'income').length} transaksi
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <ArrowUpRight className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Transaksi Card */}
            <Card className="bg-slate-50 border-slate-100 shadow-sm overflow-hidden relative">
              <div className="absolute right-0 top-0 h-full w-1 bg-slate-400"></div>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">Jumlah Transaksi</p>
                    <p className="text-2xl font-bold text-slate-700">
                      {filteredTransactions.length}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatCurrency(
                        filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) -
                        filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-slate-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Main Content with TransactionList */}
              {loading ? (
          <div className="flex flex-col items-center justify-center p-8 min-h-[60vh]">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                  <p className="text-gray-500">Memuat data transaksi...</p>
                </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 min-h-[60vh] bg-white/50 rounded-lg shadow-sm">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto opacity-20" />
                </div>
            <p className="text-gray-500 font-medium">Tidak ada transaksi</p>
            <p className="text-gray-400 text-sm">Tambahkan transaksi baru untuk melihat rekap keuangan Anda</p>
            <Button
              variant="default"
              size="sm"
              className="mt-4"
              onClick={() => {
                setTransactionType('expense');
                setShowAddTransaction(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Transaksi
            </Button>
                                </div>
        ) : (
          <TransactionList
            transactions={filteredTransactions as Transaction[]}
            onFilter={setSearchTerm}
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
            onDateRangeChange={setDateRangeFilter}
          />
              )}
                          </div>
    </Layout>
  );
};

export default Transactions; 