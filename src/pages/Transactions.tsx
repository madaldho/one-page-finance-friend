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
import { Category, Transaction as BaseTransaction } from '@/types';
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

interface ExtendedTransaction extends BaseTransaction {
  category_data?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
    type?: string;
    sort_order?: number;
  };
  wallet_name?: string;
  destination_wallet_name?: string;
  selected?: boolean;
  // Pastikan category dari BaseTransaction bisa diakses
  category: string;
}

interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: number;
  color?: string;
}

interface LocalCategory {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  type?: string;
  sort_order?: number;
}

const Transactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const walletParam = searchParams.get('wallet');
  const navigate = useNavigate();
  
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [categories, setCategories] = useState<LocalCategory[]>([]);
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
      setCategories((categoriesData || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        type: cat.type,
        sort_order: 0
      })));

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
      
      // Cast hasil dari enrichment ke type ExtendedTransaction[]
      setTransactions(enrichedTransactions as unknown as ExtendedTransaction[]);
      
      // Debug: Log sample transaction date to see format
      if (enrichedTransactions.length > 0) {
        console.log('Sample transaction date format:', enrichedTransactions[0].date);
        console.log('Type of date:', typeof enrichedTransactions[0].date);
        console.log('Date object conversion:', new Date(enrichedTransactions[0].date));
      }
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
      // Process each transaction deletion separately
      for (const id of ids) {
        // Check if this is an asset sale transaction
        const { data: transactionData, error: fetchError } = await supabase
          .from('transactions')
          .select('category, type')
          .eq('id', id)
          .single();
        
        if (fetchError) {
          console.error('Error fetching transaction:', fetchError);
          continue;
        }
        
        if (transactionData?.category === 'asset_sale') {
          // For asset sale transactions, we need to handle cleanup properly
          
          // First, try to find and delete associated asset transaction record
          try {
            const { error: assetTxDeleteError } = await supabase
              .from('asset_transactions')
              .delete()
              .eq('transaction_id', id);
            
            if (assetTxDeleteError) {
              console.error('Error deleting asset transaction:', assetTxDeleteError);
            }
          } catch (error) {
            console.error('Error during asset transaction cleanup:', error);
          }
          
          // Then delete the main transaction
          const { error: deleteError } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);
          
          if (deleteError) {
            console.error('Error deleting asset sale transaction:', deleteError);
            toast({
              title: 'Error',
              description: 'Gagal menghapus transaksi aset',
              variant: 'destructive',
            });
            continue;
          }
          
          toast({
            title: 'Perhatian',
            description: 'Transaksi aset telah dihapus. Aset terkait tidak akan dikembalikan.',
            variant: 'default',
          });
        } else {
          // Regular transaction deletion
          const { error: deleteError } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);
          
          if (deleteError) {
            console.error('Error deleting transaction:', deleteError);
            continue;
          }
        }
      }
      
      // Refresh the transactions list
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

  const handleEditTransaction = (transaction: ExtendedTransaction) => {
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
      // Jenis transaksi (all, income, expense)
      if (activeTab !== 'all' && transaction.type !== activeTab) {
        return false;
      }
      
      // Filter berdasarkan wallet IDs (jika ada yang dipilih)
      if (selectedWalletIds.length > 0 && !selectedWalletIds.includes(transaction.wallet_id as string) && 
          !(transaction.destination_wallet_id && selectedWalletIds.includes(transaction.destination_wallet_id as string))) {
        return false;
      }
      
      // Filter berdasarkan kategori IDs (jika ada yang dipilih)
      if (selectedCategoryIds.length > 0 && !selectedCategoryIds.includes(transaction.category)) {
        return false;
      }
      
      // Rentang tanggal
      if (dateRangeFilter?.from || dateRangeFilter?.to) {
        // Normalisasi tanggal transaksi ke format YYYY-MM-DD untuk perbandingan
        const transactionDate = new Date(transaction.date);
        const transactionDateOnly = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
        
        if (dateRangeFilter?.from) {
          const fromDateOnly = new Date(dateRangeFilter.from.getFullYear(), dateRangeFilter.from.getMonth(), dateRangeFilter.from.getDate());
          if (transactionDateOnly < fromDateOnly) {
            return false;
          }
        }
        
        if (dateRangeFilter?.to) {
          const toDateOnly = new Date(dateRangeFilter.to.getFullYear(), dateRangeFilter.to.getMonth(), dateRangeFilter.to.getDate());
          if (transactionDateOnly > toDateOnly) {
            return false;
          }
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
      <div className="container mx-auto py-2 px-2 md:px-6 max-w-5xl pb-32">
        {/* Header dengan glassmorphism effect */}
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-8 shadow-sm border border-white/20 sticky top-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {walletParam && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl border border-white/30"
                  onClick={handleGoBack}
                  aria-label="Kembali"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-700" />
                </Button>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-800">Transaksi</h1>
                <p className="text-xs text-gray-500">{filteredTransactions.length} transaksi ditemukan</p>
              </div>
              {selectedWalletIds.length > 0 && (
                <Badge variant="outline" className="ml-2 px-3 py-1.5 h-7 text-xs bg-gradient-to-r from-primary/10 to-blue-50 border-primary/20 text-primary font-medium">
                  {selectedWalletName}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="relative rounded-xl h-10 w-10 bg-white/70 border-white/30 hover:bg-white hover:scale-105 transition-all duration-300"
                >
                      <Filter className="h-4 w-4 text-gray-600" />
                      {(activeTab !== 'all' || selectedWalletIds.length > 0 || selectedCategoryIds.length > 0 || searchTerm || dateRangeFilter?.from || dateRangeFilter?.to) && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gradient-to-r from-primary to-blue-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[90vw] sm:max-w-lg p-0 bg-white border-0 shadow-2xl">
                    <div className="h-full flex flex-col">
                      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white via-primary/5 to-blue-50/50">
                        <SheetTitle className="flex items-center gap-3 text-xl font-semibold">
                          <div className="p-3 rounded-2xl bg-gradient-to-r from-primary/10 to-blue-100 shadow-lg">
                            <Filter className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Filter & Pencarian</span>
                            <p className="text-sm text-gray-500 mt-0.5 font-normal">Atur filter sesuai kebutuhan Anda</p>
                          </div>
                        </SheetTitle>
                      </div>
                      
                      <div className="flex-1 overflow-auto bg-white">
                        <div className="p-6 space-y-6">
                          {/* Quick Stats */}
                          <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-r from-gray-50 via-white to-blue-50/30 rounded-2xl border border-gray-100/50 shadow-sm">
                            <div className="text-center">
                              <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                                <div className="w-3 h-3 bg-slate-500 rounded-sm"></div>
                              </div>
                              <p className="text-xs text-gray-600 font-medium">Total</p>
                              <p className="text-sm font-bold text-gray-900">{filteredTransactions.length}</p>
                            </div>
                            <div className="text-center border-x border-gray-200/50">
                              <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-r from-green-100 to-green-200 rounded-xl flex items-center justify-center shadow-sm">
                                <ArrowUp className="w-3 h-3 text-green-600" />
                              </div>
                              <p className="text-xs text-gray-600 font-medium">Masuk</p>
                              <p className="text-sm font-bold text-green-600">
                                {filteredTransactions.filter(t => t.type === 'income').length}
                              </p>
                            </div>
                            <div className="text-center">
                              <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-r from-red-100 to-red-200 rounded-xl flex items-center justify-center shadow-sm">
                                <ArrowDown className="w-3 h-3 text-red-600" />
                              </div>
                              <p className="text-xs text-gray-600 font-medium">Keluar</p>
                              <p className="text-sm font-bold text-red-600">
                                {filteredTransactions.filter(t => t.type === 'expense').length}
                              </p>
                            </div>
                          </div>

                          {/* Pencarian - Moved to top for better UX */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-xl bg-gradient-to-r from-primary/10 to-blue-100 shadow-sm">
                                <Search className="w-4 h-4 text-primary" />
                              </div>
                              <p className="text-sm font-semibold text-gray-900">Pencarian Cepat</p>
                            </div>
                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                type="text"
                                placeholder="Cari transaksi, kategori, atau dompet..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-11 pr-10 h-12 rounded-2xl border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm hover:shadow-md transition-all duration-200"
                              />
                              {searchTerm && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full hover:bg-gray-100"
                                  onClick={() => setSearchTerm('')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Jenis Transaksi */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100 shadow-sm">
                                  <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-900">Jenis Transaksi</p>
                              </div>
                              <Badge variant="outline" className="font-medium text-xs px-3 py-1.5 bg-gradient-to-r from-primary/5 to-blue-50 border-primary/20 text-primary shadow-sm">
                                {activeTab === 'all' && 'Semua'}
                                {activeTab === 'income' && 'Pemasukan'}
                                {activeTab === 'expense' && 'Pengeluaran'}
                              </Badge>
                            </div>
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                              <TabsList className="grid grid-cols-3 w-full rounded-2xl h-12 bg-white border border-gray-200 shadow-sm p-1">
                                <TabsTrigger value="all" className="text-sm rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                                  Semua
                                </TabsTrigger>
                                <TabsTrigger value="income" className="text-sm rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                                  Masuk
                                </TabsTrigger>
                                <TabsTrigger value="expense" className="text-sm rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                                  Keluar
                                </TabsTrigger>
                              </TabsList>
                            </Tabs>
                          </div>

                          {/* Multi-select Wallet */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 shadow-sm">
                                  <Wallet className="w-4 h-4 text-purple-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-900">Dompet</p>
                              </div>
                              {selectedWalletIds.length > 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setSelectedWalletIds([])}
                                  className="h-8 px-3 text-xs bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors duration-200 rounded-xl font-medium"
                                >
                                  Reset ({selectedWalletIds.length})
                                </Button>
                              )}
                            </div>
                            <div className="relative">
                              <Select onValueChange={(value) => {
                                if (value === "all") {
                                  setSelectedWalletIds([]);
                                  return;
                                }
                                setSelectedWalletIds(prev => 
                                  prev.includes(value) 
                                    ? prev.filter(id => id !== value)
                                    : [...prev, value]
                                );
                              }}>
                                <SelectTrigger className="w-full h-12 rounded-2xl border-gray-200 bg-white hover:bg-gray-50 hover:border-primary/30 transition-all duration-200 shadow-sm">
                                  <SelectValue placeholder={
                                    selectedWalletIds.length === 0 
                                      ? "Pilih dompet..." 
                                      : `${selectedWalletIds.length} dompet dipilih`
                                  } />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-200 shadow-2xl bg-white">
                                  <div className="py-2 px-2 border-b border-gray-100">
                                    <SelectItem value="all" className="rounded-xl hover:bg-gray-50 transition-colors duration-200 py-3">
                                      <div className="flex items-center space-x-3">
                                        <div className={`h-5 w-5 rounded-xl flex items-center justify-center transition-all duration-200 ${selectedWalletIds.length === 0 ? "bg-gradient-to-r from-primary to-blue-500 border-primary shadow-sm" : "border-2 border-gray-300"}`}>
                                          {selectedWalletIds.length === 0 && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                              <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                          )}
                                        </div>
                                        <span className="font-semibold text-gray-900">Semua Dompet</span>
                                      </div>
                                    </SelectItem>
                                  </div>
                                  
                                  <div className="py-1 max-h-[200px] overflow-auto">
                                    {wallets.map(wallet => (
                                      <SelectItem
                                        key={wallet.id}
                                        value={wallet.id}
                                        className={`rounded-xl my-1 mx-1 hover:bg-gray-50 transition-all duration-200 py-3 ${selectedWalletIds.includes(wallet.id) ? 'bg-gradient-to-r from-primary/5 to-blue-50 border border-primary/20' : ""}`}
                                      >
                                        <div className="flex items-center space-x-3">
                                          <div 
                                            className={`h-5 w-5 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm ${selectedWalletIds.includes(wallet.id) ? 'border-2' : "border-2 border-gray-300"}`} 
                                            style={{ 
                                              backgroundColor: selectedWalletIds.includes(wallet.id) ? wallet.color : 'transparent',
                                              borderColor: wallet.color || '#6b7280'
                                            }}
                                          >
                                            {selectedWalletIds.includes(wallet.id) && (
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                              </svg>
                                            )}
                                          </div>
                                          <span style={{ color: wallet.color || '#374151' }} className="font-semibold">{wallet.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </div>
                                </SelectContent>
                              </Select>
                              
                              {/* Selected Wallets Badges */}
                              {selectedWalletIds.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {selectedWalletIds.map(walletId => {
                                    const wallet = wallets.find(w => w.id === walletId);
                                    if (!wallet) return null;
                                    return (
                                      <Badge 
                                        key={walletId} 
                                        className="flex items-center gap-2 py-2 pl-3 pr-2 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-105 shadow-sm"
                                        style={{ 
                                          backgroundColor: `${wallet.color}15`, 
                                          color: wallet.color, 
                                          borderColor: `${wallet.color}30`,
                                          border: '1px solid'
                                        }}
                                      >
                                        {wallet.name}
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-4 w-4 p-0 text-current hover:bg-current/20 rounded-full"
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
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded-lg bg-purple-100">
                                  <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">Kategori</p>
                              </div>
                              {selectedCategoryIds.length > 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setSelectedCategoryIds([])}
                                  className="h-7 px-3 text-xs hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                >
                                  Reset ({selectedCategoryIds.length})
                                </Button>
                              )}
                            </div>
                            
                            {/* Categories Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                variant={selectedCategoryIds.length === 0 ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategoryIds([])}
                                className={`h-12 rounded-2xl justify-start text-xs font-semibold transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 ${
                                  selectedCategoryIds.length === 0 
                                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white border-0' 
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <div className="w-4 h-4 rounded-lg bg-current opacity-80 mr-3"></div>
                                Semua
                              </Button>
                              
                              {categories.slice(0, 5).map(category => (
                                <Button
                                  key={category.id}
                                  variant={selectedCategoryIds.includes(category.id) ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCategoryIds(prev => 
                                      prev.includes(category.id) 
                                        ? prev.filter(id => id !== category.id)
                                        : [...prev, category.id]
                                    );
                                  }}
                                  className="h-12 rounded-2xl justify-start text-xs font-semibold transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
                                  style={{
                                    backgroundColor: selectedCategoryIds.includes(category.id) ? category.color : 'white',
                                    borderColor: category.color,
                                    color: selectedCategoryIds.includes(category.id) ? 'white' : category.color,
                                    borderWidth: '1px'
                                  }}
                                >
                                  <div 
                                    className="w-4 h-4 rounded-lg mr-3 shadow-sm" 
                                    style={{ backgroundColor: selectedCategoryIds.includes(category.id) ? 'rgba(255,255,255,0.9)' : category.color }}
                                  ></div>
                                  {category.name}
                                </Button>
                              ))}
                              
                              {/* Transfer */}
                              <Button
                                variant={selectedCategoryIds.includes("Transfer") ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  setSelectedCategoryIds(prev => 
                                    prev.includes("Transfer") 
                                      ? prev.filter(id => id !== "Transfer")
                                      : [...prev, "Transfer"]
                                  );
                                }}
                                className="h-12 rounded-2xl justify-start text-xs font-semibold transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
                                style={{
                                  backgroundColor: selectedCategoryIds.includes("Transfer") ? '#3b82f6' : 'white',
                                  borderColor: '#3b82f6',
                                  color: selectedCategoryIds.includes("Transfer") ? 'white' : '#3b82f6',
                                  borderWidth: '1px'
                                }}
                              >
                                <div className="p-1 rounded-lg bg-current/20 mr-3">
                                  <ArrowLeftRight className="w-2.5 h-2.5" />
                                </div>
                                Transfer
                              </Button>
                              
                              {/* Fee */}
                              <Button
                                variant={selectedCategoryIds.includes("Fee") ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  setSelectedCategoryIds(prev => 
                                    prev.includes("Fee") 
                                      ? prev.filter(id => id !== "Fee")
                                      : [...prev, "Fee"]
                                  );
                                }}
                                className="h-12 rounded-2xl justify-start text-xs font-semibold transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
                                style={{
                                  backgroundColor: selectedCategoryIds.includes("Fee") ? '#f59e0b' : 'white',
                                  borderColor: '#f59e0b',
                                  color: selectedCategoryIds.includes("Fee") ? 'white' : '#f59e0b',
                                  borderWidth: '1px'
                                }}
                              >
                                <div className="w-4 h-4 rounded-lg mr-3 bg-current opacity-90"></div>
                                Biaya Admin
                              </Button>
                            </div>
                            
                            {/* More Categories Dropdown */}
                            {categories.length > 5 && (
                              <Select onValueChange={(value) => {
                                if (value === "all") {
                                  setSelectedCategoryIds([]);
                                  return;
                                }
                                setSelectedCategoryIds(prev => 
                                  prev.includes(value) 
                                    ? prev.filter(id => id !== value)
                                    : [...prev, value]
                                );
                              }}>
                                <SelectTrigger className="w-full h-12 rounded-2xl border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200">
                                  <SelectValue placeholder="Kategori lainnya..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-200 shadow-2xl bg-white">
                                  {categories.slice(5).map(category => (
                                    <SelectItem
                                      key={category.id}
                                      value={category.id}
                                      className="rounded-xl hover:bg-gray-50 transition-colors duration-200 py-3"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div 
                                          className="w-4 h-4 rounded-lg shadow-sm" 
                                          style={{ backgroundColor: category.color }}
                                        ></div>
                                        <span style={{ color: category.color }} className="font-semibold">
                                          {category.name}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {/* Selected Categories Display */}
                            {selectedCategoryIds.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-gray-50 via-white to-blue-50/30 rounded-2xl border border-gray-100 shadow-sm">
                                <p className="text-xs font-semibold text-gray-700 w-full mb-2">Kategori dipilih:</p>
                                {selectedCategoryIds.map(catId => {
                                  if (catId === "Transfer") {
                                    return (
                                      <Badge 
                                        key={catId} 
                                        className="flex items-center gap-2 py-2 pl-3 pr-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200"
                                      >
                                        <ArrowLeftRight className="w-3 h-3" />
                                        Transfer
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-4 w-4 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-200/50 rounded-full transition-colors duration-200"
                                          onClick={() => setSelectedCategoryIds(prev => prev.filter(id => id !== catId))}
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </Button>
                                      </Badge>
                                    );
                                  }
                                  
                                  if (catId === "Fee") {
                                    return (
                                      <Badge 
                                        key={catId} 
                                        className="flex items-center gap-2 py-2 pl-3 pr-2 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200"
                                      >
                                        <div className="w-2.5 h-2.5 rounded-sm bg-amber-500"></div>
                                        Biaya Admin
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-4 w-4 p-0 text-amber-500 hover:text-amber-700 hover:bg-amber-200/50 rounded-full transition-colors duration-200"
                                          onClick={() => setSelectedCategoryIds(prev => prev.filter(id => id !== catId))}
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </Button>
                                      </Badge>
                                    );
                                  }
                                  
                                  const category = categories.find(c => c.id === catId);
                                  if (!category) return null;
                                  return (
                                    <Badge 
                                      key={catId} 
                                      className="flex items-center gap-2 py-2 pl-3 pr-2 rounded-xl text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200"
                                      style={{ 
                                        backgroundColor: `${category.color}15`, 
                                        color: category.color, 
                                        borderColor: `${category.color}40`,
                                        border: '1px solid'
                                      }}
                                    >
                                      <div 
                                        className="w-2.5 h-2.5 rounded-lg shadow-sm" 
                                        style={{ backgroundColor: category.color }}
                                      ></div>
                                      {category.name}
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-4 w-4 p-0 text-current/60 hover:text-current hover:bg-current/10 rounded-full transition-colors duration-200"
                                        onClick={() => setSelectedCategoryIds(prev => prev.filter(id => id !== catId))}
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </Button>
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          
                          {/* Rentang Tanggal */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-100 to-purple-100 shadow-sm">
                                <Calendar className="w-4 h-4 text-indigo-600" />
                              </div>
                              <p className="text-sm font-semibold text-gray-900">Rentang Tanggal</p>
                            </div>
                            
                            {/* Quick Date Filters */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const today = new Date();
                                  // Reset waktu ke 00:00:00 untuk perbandingan yang tepat
                                  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                  console.log('Setting "Hari Ini" filter to:', todayOnly);
                                  setDateRangeFilter({ from: todayOnly, to: todayOnly });
                                }}
                                className="h-10 rounded-2xl text-xs font-semibold bg-white border border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
                              >
                                Hari Ini
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const today = new Date();
                                  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                  const sevenDaysAgo = new Date(todayOnly);
                                  sevenDaysAgo.setDate(todayOnly.getDate() - 7);
                                  setDateRangeFilter({ from: sevenDaysAgo, to: todayOnly });
                                }}
                                className="h-10 rounded-2xl text-xs font-semibold bg-white border border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
                              >
                                7 Hari
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const today = new Date();
                                  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                  const thirtyDaysAgo = new Date(todayOnly);
                                  thirtyDaysAgo.setDate(todayOnly.getDate() - 30);
                                  setDateRangeFilter({ from: thirtyDaysAgo, to: todayOnly });
                                }}
                                className="h-10 rounded-2xl text-xs font-semibold bg-white border border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
                              >
                                30 Hari
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const today = new Date();
                                  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                                  setDateRangeFilter({ from: startOfMonth, to: todayOnly });
                                }}
                                className="h-10 rounded-2xl text-xs font-semibold bg-white border border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
                              >
                                Bulan Ini
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-700">Dari Tanggal</p>
                                <div className="relative">
                                  <Input 
                                    type="date" 
                                    className="w-full pl-11 h-12 rounded-2xl border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm hover:shadow-md transition-all duration-200"
                                    value={dateRangeFilter?.from ? format(new Date(dateRangeFilter.from), "yyyy-MM-dd") : ""}
                                    onChange={(e) => {
                                      const fromDate = e.target.value ? new Date(e.target.value) : undefined;
                                      setDateRangeFilter(prev => ({
                                        from: fromDate,
                                        to: prev?.to
                                      }));
                                    }}
                                  />
                                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-700">Sampai Tanggal</p>
                                <div className="relative">
                                  <Input 
                                    type="date" 
                                    className="w-full pl-11 h-12 rounded-2xl border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm hover:shadow-md transition-all duration-200"
                                    value={dateRangeFilter?.to ? format(new Date(dateRangeFilter.to), "yyyy-MM-dd") : ""}
                                    onChange={(e) => {
                                      const toDate = e.target.value ? new Date(e.target.value) : undefined;
                                      setDateRangeFilter(prev => ({
                                        from: prev?.from,
                                        to: toDate
                                      }));
                                    }}
                                  />
                                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </div>
                            
                            {/* Clear Date Filter */}
                            {(dateRangeFilter?.from || dateRangeFilter?.to) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDateRangeFilter(undefined)}
                                className="w-full h-10 text-xs bg-red-50 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-2xl transition-colors duration-200 font-medium border border-red-200"
                              >
                                <X className="w-3 h-3 mr-2" />
                                Hapus Filter Tanggal
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Footer dengan tombol reset dan terapkan */}
                      <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-white via-gray-50/30 to-white">
                        <div className="flex gap-3">
                          <Button 
                            variant="outline"
                            className="flex-1 h-12 rounded-2xl border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
                            onClick={() => {
                              setActiveTab('all');
                              setSelectedWalletIds([]);
                              setSelectedCategoryIds([]);
                              setDateRangeFilter(undefined);
                              setSearchTerm('');
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                          </Button>
                          <Button 
                            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-primary via-blue-500 to-blue-600 hover:from-primary/90 hover:via-blue-500/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                            onClick={() => setShowFilters(false)}
                          >
                            <Filter className="h-4 w-4 mr-2" />
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
                  className="rounded-2xl h-11 w-11 bg-white border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  onClick={exportTransactions}
                >
                  <FileDown className="h-4 w-4 text-gray-600" />
                </Button>
          </div>
        </div>

        {/* Enhanced Filter Badges */}
        {(activeTab !== 'all' || selectedWalletIds.length > 0 || selectedCategoryIds.length > 0 || searchTerm || dateRangeFilter?.from || dateRangeFilter?.to) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-600">Filter Aktif:</p>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-xs h-7 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                onClick={resetFilters}
              >
                <X className="w-3 h-3 mr-1" />
                Hapus Semua
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeTab !== 'all' && (
                <Badge 
                  variant="outline"
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-primary/10 border-primary/30 text-primary rounded-full hover:bg-primary/20 transition-colors duration-200"
                >
                  {activeTab === 'income' ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : activeTab === 'expense' ? (
                    <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowLeftRight className="w-3 h-3" />
                  )}
                  {activeTab === 'income' ? 'Pemasukan' : activeTab === 'expense' ? 'Pengeluaran' : 'Transfer'}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 p-0 ml-1 hover:bg-primary/20 rounded-full"
                    onClick={() => setActiveTab('all')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {selectedWalletIds.length > 0 && (
                <Badge 
                  variant="outline"
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-blue-50 border-blue-200 text-blue-700 rounded-full hover:bg-blue-100 transition-colors duration-200"
                >
                  <Wallet className="w-3 h-3" />
                  {selectedWalletIds.length === 1 ? selectedWalletName : `${selectedWalletIds.length} dompet`}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 p-0 ml-1 hover:bg-blue-200 rounded-full"
                    onClick={() => setSelectedWalletIds([])}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {selectedCategoryIds.length > 0 && (
                <Badge 
                  variant="outline"
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-purple-50 border-purple-200 text-purple-700 rounded-full hover:bg-purple-100 transition-colors duration-200"
                >
                  <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                  {selectedCategoryIds.length === 1 ? 'Kategori' : `${selectedCategoryIds.length} kategori`}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 p-0 ml-1 hover:bg-purple-200 rounded-full"
                    onClick={() => setSelectedCategoryIds([])}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {searchTerm && (
                <Badge 
                  variant="outline"
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-green-50 border-green-200 text-green-700 rounded-full hover:bg-green-100 transition-colors duration-200"
                >
                  <Search className="w-3 h-3" />
                  "{searchTerm}"
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 p-0 ml-1 hover:bg-green-200 rounded-full"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {(dateRangeFilter?.from || dateRangeFilter?.to) && (
                <Badge 
                  variant="outline"
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-amber-50 border-amber-200 text-amber-700 rounded-full hover:bg-amber-100 transition-colors duration-200"
                >
                  <Calendar className="w-3 h-3" />
                  {dateRangeFilter?.from && dateRangeFilter?.to 
                    ? `${format(dateRangeFilter.from, 'dd/MM')} - ${format(dateRangeFilter.to, 'dd/MM')}`
                    : dateRangeFilter?.from 
                    ? `Dari ${format(dateRangeFilter.from, 'dd/MM/yyyy')}`
                    : `Sampai ${format(dateRangeFilter.to!, 'dd/MM/yyyy')}`
                  }
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 p-0 ml-1 hover:bg-amber-200 rounded-full"
                    onClick={() => setDateRangeFilter(undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Summary Cards - Mobile Optimized */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8 mt-8">
          {(() => {
            const expenseAmount = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
            const incomeAmount = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
            const netAmount = incomeAmount - expenseAmount;
            const expenseCount = filteredTransactions.filter((t) => t.type === "expense").length;
            const incomeCount = filteredTransactions.filter((t) => t.type === "income").length;
            
            // Fungsi untuk format nominal singkat di mobile
            const formatCompactCurrency = (amount: number): string => {
              const formatted = formatCurrency(amount);
              // Untuk mobile, potong jika lebih dari 12 karakter
              if (formatted.length > 12) {
                if (amount >= 1000000000) { // Milyar
                  return `Rp ${(amount / 1000000000).toFixed(1)}M`;
                } else if (amount >= 1000000) { // Juta
                  return `Rp ${(amount / 1000000).toFixed(1)}jt`;
                } else if (amount >= 1000) { // Ribu
                  return `Rp ${(amount / 1000).toFixed(0)}rb`;
                }
              }
              return formatted;
            };

            return (
              <>
                {/* Pengeluaran Card */}
                <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-red-50 to-red-100/50 hover:shadow-xl transition-all duration-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="w-1.5 h-5 sm:h-6 bg-gradient-to-b from-red-400 to-red-600 rounded-full"></div>
                        <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-xl bg-red-100 flex items-center justify-center">
                          <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs font-semibold text-red-700 mb-1">Pengeluaran</p>
                      <div className="min-h-[2.5rem] sm:min-h-[3rem] flex items-center">
                        <div className="w-full">
                          {/* Desktop version */}
                          <p className="hidden sm:block text-sm font-bold text-red-800 leading-tight">
                            {formatCurrency(expenseAmount)}
                          </p>
                          {/* Mobile version */}
                          <p className="block sm:hidden text-xs font-bold text-red-800 leading-tight" title={formatCurrency(expenseAmount)}>
                            {formatCompactCurrency(expenseAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[9px] sm:text-[10px] text-red-600">
                          {expenseCount} transaksi
                        </p>
                        <div className="h-1 sm:h-1.5 w-4 sm:w-6 bg-red-200 rounded-full">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pemasukan Card */}
                <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-xl transition-all duration-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="w-1.5 h-5 sm:h-6 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
                        <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-xl bg-green-100 flex items-center justify-center">
                          <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs font-semibold text-green-700 mb-1">Pemasukan</p>
                      <div className="min-h-[2.5rem] sm:min-h-[3rem] flex items-center">
                        <div className="w-full">
                          {/* Desktop version */}
                          <p className="hidden sm:block text-sm font-bold text-green-800 leading-tight">
                            {formatCurrency(incomeAmount)}
                          </p>
                          {/* Mobile version */}
                          <p className="block sm:hidden text-xs font-bold text-green-800 leading-tight" title={formatCurrency(incomeAmount)}>
                            {formatCompactCurrency(incomeAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[9px] sm:text-[10px] text-green-600">
                          {incomeCount} transaksi
                        </p>
                        <div className="h-1 sm:h-1.5 w-4 sm:w-6 bg-green-200 rounded-full">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Net Balance Card */}
                <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-slate-50 to-gray-100/50 hover:shadow-xl transition-all duration-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="w-1.5 h-5 sm:h-6 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full"></div>
                        <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs font-semibold text-slate-700 mb-1">Saldo Bersih</p>
                      <div className="min-h-[2.5rem] sm:min-h-[3rem] flex items-center">
                        <div className="w-full">
                          {/* Desktop version */}
                          <p className="hidden sm:block text-sm font-bold text-slate-800 leading-tight">
                            {formatCurrency(netAmount)}
                          </p>
                          {/* Mobile version */}
                          <p className="block sm:hidden text-xs font-bold text-slate-800 leading-tight" title={formatCurrency(netAmount)}>
                            {formatCompactCurrency(netAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[9px] sm:text-[10px] text-slate-600">{filteredTransactions.length} total</p>
                        <div className="h-1 sm:h-1.5 w-4 sm:w-6 bg-slate-200 rounded-full">
                          <div className="h-full bg-slate-500 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            );
          })()}
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
            transactions={filteredTransactions as BaseTransaction[]}
            onFilter={setSearchTerm}
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
            onDateRangeChange={setDateRangeFilter}
          />
        )}
      </div>
      </div>
    </Layout>
  );
};

export default Transactions; 