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
  Filter as FilterIcon,
  X,
  MoreHorizontal,
  MoreVertical,
  Edit2
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [selectedWalletName, setSelectedWalletName] = useState<string>('Semua Dompet');
  const [showFilters, setShowFilters] = useState(false);
  const [dateGroups, setDateGroups] = useState<{[key: string]: Transaction[]}>({});
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const isSmallScreen = useMediaQuery("(max-width: 767px)");

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

  useEffect(() => {
    // Group transactions by date
    const filtered = getFilteredTransactions();
    const groups: {[key: string]: Transaction[]} = {};
    
    filtered.forEach(transaction => {
      const date = transaction.date.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    
    // Sort dates in descending order
    const sortedGroups: {[key: string]: Transaction[]} = {};
    Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .forEach(date => {
        sortedGroups[date] = groups[date];
      });
    
    setDateGroups(sortedGroups);
  }, [transactions, activeTab, selectedWalletId, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id);

      if (categoriesError) throw categoriesError;
      // Cast hasil dari supabase ke type Category[]
      setCategories(categoriesData as unknown as Category[]);

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

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedWalletId('all');
    setActiveTab('all');
    setShowFilters(false);
  };

  const formatDateHeader = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, d MMMM yyyy', { locale: id });
    } catch (error) {
      return dateString;
    }
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isYesterday = (dateString: string) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = new Date(dateString);
    return (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    );
  };

  const getDateLabel = (dateString: string) => {
    if (isToday(dateString)) return 'Hari Ini';
    if (isYesterday(dateString)) return 'Kemarin';
    return formatDateHeader(dateString);
  };

  const formatShortDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: id });
    } catch (error) {
      return dateString;
    }
  };

  // Helper untuk mendapatkan warna badge kategori
  const getCategoryBadgeClass = (transaction: Transaction) => {
    const categoryName = transaction.category_data?.name?.toLowerCase() || '';
    
    if (transaction.type === 'income') {
      return "bg-green-100 text-green-700";
    } else if (transaction.type === 'expense') {
      if (categoryName.includes('makan')) {
        return "bg-amber-100 text-amber-700";
      } else if (categoryName.includes('belanja') || categoryName.includes('shopping')) {
        return "bg-lime-100 text-lime-700";  
      } else if (categoryName.includes('hutang')) {
        return "bg-teal-100 text-teal-700";
      } else {
        return "bg-red-100 text-red-700";
      }
    } else if (transaction.type === 'transfer') {
      return "bg-blue-100 text-blue-700";
    }
    
    return "bg-gray-100 text-gray-700";
  };

  // Helper untuk mendapatkan nama kategori untuk display
  const getCategoryDisplayName = (transaction: Transaction) => {
    if (transaction.category_data?.name) {
      return transaction.category_data.name;
    }
    
    if (transaction.type === 'income') {
      return 'Terima Piutang';
    } else if (transaction.type === 'expense') {
      return 'Hutang';
    } else {
      return 'Transfer';
    }
  };

  // Helper untuk mendapatkan warna badge dompet
  const getWalletBadgeClass = (walletName: string = '') => {
    const name = walletName.toLowerCase();
    
    if (name.includes('ovo')) {
      return "bg-purple-100 text-purple-700";
    } else if (name.includes('dana')) {
      return "bg-blue-100 text-blue-700";
    } else if (name.includes('bca')) {
      return "bg-blue-900 text-white";
    } else if (name.includes('gopay')) {
      return "bg-green-100 text-green-700";
    }
    
    return "bg-gray-100 text-gray-700";
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) return;
    
    try {
      await Promise.all(
        selectedTransactions.map(id => 
          supabase.from('transactions').delete().eq('id', id)
        )
      );
      
      setTransactions(prev => prev.filter(t => !selectedTransactions.includes(t.id)));
      toast({
        title: 'Berhasil',
        description: `${selectedTransactions.length} transaksi berhasil dihapus`,
      });
      
      // Reset selection mode
      setIsBulkMode(false);
      setSelectedTransactions([]);
    } catch (error) {
      console.error('Error deleting transactions:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus transaksi',
        variant: 'destructive',
      });
    }
  };
  
  // Toggle selection of a transaction
  const toggleTransactionSelection = (id: string) => {
    setSelectedTransactions(prev => {
      if (prev.includes(id)) {
        const newSelected = prev.filter(transId => transId !== id);
        if (newSelected.length === 0) {
          setIsBulkMode(false);
        }
        return newSelected;
      } else {
        return [...prev, id];
      }
    });
  };
  
  // Handle long press on mobile
  const handleLongPress = (id: string) => {
    if (!isSmallScreen) return;
    
    if (longPressTimer) clearTimeout(longPressTimer);
    
    const timer = setTimeout(() => {
      setIsBulkMode(true);
      toggleTransactionSelection(id);
    }, 500); // 500ms long press
    
    setLongPressTimer(timer);
  };
  
  const handlePressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };
  
  // Handle click on transaction
  const handleTransactionClick = (id: string) => {
    if (isBulkMode) {
      toggleTransactionSelection(id);
    }
  };

  // Get wallet badge style - similar to TransactionList component
  const getWalletBadgeStyle = (walletId: string | null) => {
    if (!walletId) return {};
    
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) return {};
    
    if (wallet.color) {
      return {
        backgroundColor: `${wallet.color}15`,
        color: wallet.color,
        borderColor: `${wallet.color}30`
      };
    }
    
    return {};
  };
  
  // Get category badge style
  const getCategoryBadgeStyle = (categoryId: string | undefined) => {
    if (!categoryId) return {};
    
    const category = categories.find(c => c.id === categoryId);
    if (!category || !category.color) return {};
    
    return {
      backgroundColor: `${category.color}15`,
      color: category.color,
      borderColor: `${category.color}30`
    };
  };
  
  // Get transaction type color
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'expense':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'transfer':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-5xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-background pt-2 pb-4">
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
            {selectedWalletId !== 'all' && (
              <Badge variant="outline" className="ml-2">
                {selectedWalletName}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {/* Tampilkan tombol cancel dan delete saat mode bulk */}
            {isBulkMode ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsBulkMode(false);
                    setSelectedTransactions([]);
                  }}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={selectedTransactions.length === 0}
                >
                  Hapus ({selectedTransactions.length})
                </Button>
              </>
            ) : (
              <>
                <div className="relative">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                
                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <FilterIcon className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-sm">
                    <SheetHeader>
                      <SheetTitle>Filter Transaksi</SheetTitle>
                    </SheetHeader>
                    <div className="py-6 space-y-6">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Jenis Transaksi</p>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                          <TabsList className="grid grid-cols-4 w-full rounded-full">
                            <TabsTrigger value="all" className="rounded-full">Semua</TabsTrigger>
                            <TabsTrigger value="income" className="rounded-full">Masuk</TabsTrigger>
                            <TabsTrigger value="expense" className="rounded-full">Keluar</TabsTrigger>
                            <TabsTrigger value="transfer" className="rounded-full">Transfer</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Dompet</p>
                        <Select 
                          value={selectedWalletId} 
                          onValueChange={setSelectedWalletId}
                        >
                          <SelectTrigger className="w-full">
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
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Pengurutan</p>
                        <Select>
                          <SelectTrigger className="w-full">
                            <Calendar className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Terbaru" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Terbaru</SelectItem>
                            <SelectItem value="oldest">Terlama</SelectItem>
                            <SelectItem value="highest">Nominal Tertinggi</SelectItem>
                            <SelectItem value="lowest">Nominal Terendah</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
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
                      
                      <div className="pt-4 space-y-4">
                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={resetFilters}
                        >
                          Reset Filter
                        </Button>
                        <Button 
                          className="w-full"
                          onClick={() => setShowFilters(false)}
                        >
                          Terapkan Filter
                        </Button>
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
              </>
            )}
          </div>
        </div>

        {/* Filter Badges */}
        {!isBulkMode && (
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
            {selectedWalletId !== 'all' && (
              <Badge 
                variant="outline"
                className="flex items-center gap-1 pl-2 bg-primary/5 border-primary/20"
              >
                {selectedWalletName}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 p-0 ml-1"
                  onClick={() => setSelectedWalletId('all')}
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
            {(activeTab !== 'all' || selectedWalletId !== 'all' || searchTerm) && (
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
        )}

        {/* Search input, especially visible for desktop */}
        {!isBulkMode && isSmallScreen === false && (
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-gray-200 focus:border-primary/40"
            />
          </div>
        )}

        {/* Desktop Sorting options */}
        {!isBulkMode && isSmallScreen === false && (
          <div className="mb-4 flex justify-end">
            <Select>
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Terbaru" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="oldest">Terlama</SelectItem>
                <SelectItem value="highest">Nominal Tertinggi</SelectItem>
                <SelectItem value="lowest">Nominal Terendah</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Transactions Table */}
              {loading ? (
          <div className="flex flex-col items-center justify-center p-8 min-h-[60vh]">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                  <p className="text-gray-500">Memuat data transaksi...</p>
                </div>
        ) : Object.keys(dateGroups).length === 0 ? (
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
        ) : isSmallScreen ? (
          // Mobile view
          <div className="space-y-2">
            {Object.entries(dateGroups).flatMap(([date, dateTransactions]) => 
              dateTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className={`rounded-lg border overflow-hidden transition-all ${
                    selectedTransactions.includes(transaction.id) ? 'bg-muted border-primary' : 'bg-card'
                  }`}
                  onTouchStart={() => handleLongPress(transaction.id)}
                  onTouchEnd={handlePressEnd}
                  onTouchMove={handlePressEnd}
                  onClick={() => handleTransactionClick(transaction.id)}
                >
                  <div className="p-4">
                              <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Badge 
                          variant="outline"
                          className={`rounded-full font-normal ${
                            transaction.category_data 
                              ? '' 
                              : getTransactionTypeColor(transaction.type)
                          }`}
                          style={transaction.category_data 
                            ? getCategoryBadgeStyle(transaction.category)
                            : {}
                          }
                        >
                          {transaction.category_data?.name || getCategoryDisplayName(transaction)}
                        </Badge>
                        
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            {formatShortDate(transaction.date)}
                          </p>
                          <span className="text-muted-foreground/30">•</span>
                          <Badge 
                            variant="outline"
                            className="rounded-full font-normal"
                            style={getWalletBadgeStyle(transaction.wallet_id)}
                          >
                            {transaction.wallet_name}
                          </Badge>
                        </div>
                                </div>
                      <div className={`font-medium ${
                                    transaction.type === 'income' 
                                      ? 'text-green-600' 
                                      : transaction.type === 'expense' 
                                        ? 'text-red-600' 
                                        : 'text-blue-600'
                                  }`}>
                                    {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                                    {formatCurrency(transaction.amount)}
                                </div>
                              </div>

                    {transaction.title && (
                      <p className="text-sm mt-2">
                        {transaction.title}
                      </p>
                    )}
                    
                    {transaction.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {transaction.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
                                  )}
                                </div>
        ) : (
          // Desktop view
          <Card className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  {isBulkMode && (
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTransactions(filteredTransactions.map(t => t.id));
                          } else {
                            setSelectedTransactions([]);
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-[100px]">Tanggal</TableHead>
                  <TableHead className="w-[180px]">Kategori</TableHead>
                  <TableHead className="w-[140px]">Dompet</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right w-[140px]">Jumlah</TableHead>
                  {!isBulkMode && (
                    <TableHead className="w-[70px] text-center">Aksi</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(dateGroups).flatMap(([date, dateTransactions]) => 
                  dateTransactions.map((transaction) => (
                    <TableRow 
                      key={transaction.id}
                      className={`hover:bg-gray-50 border-t border-gray-100 group ${
                        selectedTransactions.includes(transaction.id) ? 'bg-muted' : ''
                      }`}
                      onClick={() => handleTransactionClick(transaction.id)}
                    >
                      {isBulkMode && (
                        <TableCell className="w-[50px]">
                          <Checkbox 
                            checked={selectedTransactions.includes(transaction.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTransactions(prev => [...prev, transaction.id]);
                              } else {
                                setSelectedTransactions(prev => prev.filter(id => id !== transaction.id));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                      )}
                      <TableCell className="py-3 font-medium">
                        {formatShortDate(transaction.date)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            transaction.category_data 
                              ? '' 
                              : getTransactionTypeColor(transaction.type)
                          }`}
                          style={transaction.category_data 
                            ? getCategoryBadgeStyle(transaction.category)
                            : {}
                          }
                        >
                          {transaction.category_data?.icon && (
                            <i className={`fas fa-${transaction.category_data.icon} mr-1.5 text-xs`}></i>
                          )}
                          {transaction.category_data?.name || getCategoryDisplayName(transaction)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className="rounded-full px-3 py-1 text-xs font-medium"
                          style={getWalletBadgeStyle(transaction.wallet_id)}
                        >
                          {transaction.wallet_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.title || transaction.description || '-'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        transaction.type === 'income' 
                          ? 'text-green-600' 
                          : transaction.type === 'expense' 
                            ? 'text-red-600' 
                            : 'text-blue-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      {!isBulkMode && (
                        <TableCell className="text-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => console.log('Edit transaction')}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Hapus</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
                      </Card>
              )}
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
        <DialogContent className="sm:max-w-md">
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