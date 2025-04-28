import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChevronLeft, 
  Search, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeftRight,
  MoreVertical,
  Trash2,
  Pencil,
  Calendar,
  Filter,
  ExternalLink,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  RotateCcw,
  X,
  Check,
  SlidersHorizontal,
  Lock,
  CheckCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, Locale } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import TransactionForm from '@/components/TransactionForm';
import { getWalletIcon } from '@/components/WalletCard';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import TransactionList from '@/components/TransactionList';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/DateRangePicker';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import PremiumFeatureCounter from '@/components/premium/PremiumFeatureCounter';
import { UserSubscriptionProfile } from '@/utils/subscription';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer' | string;
  date: string;
  description?: string;
  category: string;
  category_data?: Category;
  wallet_id: string;
  destination_wallet_id?: string | null;
  wallet_name?: string;
  user_id: string;
  category_id: string;
  attachment_url?: string;
  is_recurring?: boolean;
  recurring_id?: string;
  is_adjustment?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Wallet {
  id: string;
  name: string;
  balance: number;
  type?: 'cash' | 'bank' | 'savings' | string;
  color?: string;
  gradient?: string;
  icon?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  is_default?: boolean;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | string;
  color?: string;
  icon?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Mendefinisikan interface untuk event custom
interface WalletBalanceChangedEvent {
  walletId: string;
  oldBalance: number;
  newBalance: number;
}

const WalletDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserSubscriptionProfile | null>(null);
  
  // State untuk filter periode
  const [period, setPeriod] = useState<'last-7' | 'last-30' | 'last-90' | 'last-365' | 'custom'>('last-30');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  // Helper untuk mendapatkan range tanggal berdasarkan periode
  const getDateRangeFromPeriod = (selectedPeriod: string): DateRange => {
    const today = new Date();
    const to = endOfDay(today);
    
    switch(selectedPeriod) {
      case 'last-7':
        return { from: subDays(today, 7), to }; // 7 hari terakhir
      case 'last-30':
        return { from: subDays(today, 29), to }; // 30 hari terakhir
      case 'last-90':
        return { from: subDays(today, 89), to }; // 90 hari terakhir
      case 'last-365':
        return { from: subDays(today, 364), to }; // 365 hari terakhir
      default:
        return { from: subDays(today, 29), to }; // default 30 hari
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchWalletAndTransactions();
    
    // Set interval untuk refresh wallet balance secara berkala dengan interval yang lebih lama
    const refreshInterval = setInterval(() => {
      if (id) {
        // Hanya refresh wallet data tanpa refresh transaksi untuk performa
        refreshWalletBalance(false, true);
      }
    }, 30000); // Ubah dari 3 detik menjadi 30 detik
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [id]);

  useEffect(() => {
    // Periksa jika id ada, kemudian inisialisasi data
    if (id) {
      // Pasang periode awal ke 30 hari terakhir
      setPeriod('last-30');
      const initialDateRange = getDateRangeFromPeriod('last-30');
      setDateRange(initialDateRange);
      setTempDateRange(initialDateRange);
    fetchWalletAndTransactions();
    }
    
    // Handler untuk event perubahan saldo wallet
    const handleWalletBalanceChanged = (event: Event) => {
      // Pastikan ini adalah custom event
      const customEvent = event as CustomEvent<WalletBalanceChangedEvent>;
      if (!customEvent.detail) return;
      
      const { walletId, newBalance } = customEvent.detail;
      
      // Periksa apakah wallet yang berubah adalah wallet yang sedang ditampilkan
      if (id === walletId) {
        console.log(`Wallet balance updated: ${newBalance}`);
        // Perbarui state wallet dengan saldo baru
        setWallet(prevWallet => {
          if (!prevWallet) return null;
          return {
            ...prevWallet,
            balance: newBalance
          };
        });
        
        // Refresh data transaksi juga
        fetchWalletAndTransactions();
      }
    };
    
    // Tambahkan event listener
    window.addEventListener('wallet_balance_changed', handleWalletBalanceChanged);
    
    // Cleanup event listener saat komponen unmount
    return () => {
      window.removeEventListener('wallet_balance_changed', handleWalletBalanceChanged);
    };
  }, [id]);

  // Handler untuk perubahan periode
  useEffect(() => {
    if (period !== 'custom') {
      // Jika periode bukan custom, atur rentang tanggal otomatis
      const newDateRange = getDateRangeFromPeriod(period);
      setDateRange(newDateRange);
      setTempDateRange(newDateRange); // Simpan juga di temporary
    }
  }, [period]);

  useEffect(() => {
    if (wallet && dateRange) {
      // Jika wallet dan dateRange ada, refresh data
      fetchWalletAndTransactions();
    }
  }, [filterType, dateRange]);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data as UserSubscriptionProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchWalletAndTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', id)
        .single();

      if (walletError) throw walletError;
      if (!walletData) throw new Error("Wallet tidak ditemukan");
      
      setWallet(walletData);

      // Semua query secara parallel untuk mempercepat loading
      const [categoriesResult, transactionsResult] = await Promise.all([
      // Fetch categories
        supabase
        .from('categories')
        .select('*')
          .eq('user_id', walletData?.user_id || ''),

      // Fetch transactions
        supabase
        .from('transactions')
        .select('*')
          .eq('wallet_id', id || '')
          .eq(filterType !== 'all' ? 'type' : 'user_id', filterType !== 'all' ? filterType : walletData.user_id)
          .order('date', { ascending: false })
          .limit(500) // Tingkatkan batas untuk data yang lebih lengkap
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (transactionsResult.error) throw transactionsResult.error;
      
      // Convert kategori untuk memastikan tipe yang benar
      const typedCategories = categoriesResult.data?.map(cat => ({
        ...cat,
        type: cat.type as 'income' | 'expense'
      })) || [];
      
      setCategories(typedCategories);
      
      // Filter berdasarkan date range jika ada
      let filteredTransactions = transactionsResult.data || [];
      if (dateRange?.from && dateRange?.to) {
        const fromTime = dateRange.from.getTime();
        const toTime = dateRange.to.getTime();
        filteredTransactions = filteredTransactions.filter(tx => {
          const txDate = new Date(tx.date).getTime();
          return txDate >= fromTime && txDate <= toTime;
        });
      }
      
      // Tambahkan data kategori ke transaksi
      const transactionsWithCategories = filteredTransactions.map(transaction => {
        const categoryData = typedCategories?.find(cat => cat.id === transaction.category);
        return {
          ...transaction,
          category_data: categoryData,
          // Pastikan wallet_name tersedia untuk TransactionList
          wallet_name: walletData?.name || 'Dompet', // Tambahkan fallback jika name tidak ada
          // Pastikan semua field required ada
          category: transaction.category || '',
          category_id: transaction.category || '',
        };
      });
      
      // Gunakan tipe yang sesuai dengan definisi Transaction
      setTransactions(transactionsWithCategories as Transaction[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data wallet",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWallet = async () => {
    try {
      setIsDeleting(true);
      
      // Check if there are transactions
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('wallet_id', id);
        
      if (countError) throw countError;
      
      if (count && count > 0) {
        toast({
          title: "Tidak dapat menghapus",
          description: "Dompet ini masih memiliki transaksi. Hapus atau pindahkan transaksi terlebih dahulu.",
          variant: "destructive"
        });
        setIsDeleting(false);
        setShowDeleteDialog(false);
        return;
      }
      
      // Delete wallet
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: "Dompet berhasil dihapus",
      });
      
      // Navigate back to home
      navigate('/home');
    } catch (error) {
      console.error('Error deleting wallet:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus dompet",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getTransactionIcon = (type: string, isDestination: boolean = false) => {
    if (type === 'transfer' && isDestination) {
      return <ArrowDown className="w-4 h-4 text-green-500" />;
    }
    
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

  const getTransactionColor = (type: string, isDestination: boolean = false) => {
    if (type === 'transfer' && isDestination) {
      return 'text-green-600';
    }
    
    switch (type) {
      case 'income':
        return 'text-green-600';
      case 'expense':
        return 'text-red-600';
      case 'transfer':
        return 'text-blue-600';
      default:
        return '';
    }
  };

  const getTransactionSign = (type: string, isDestination: boolean = false) => {
    if (type === 'transfer' && isDestination) {
      return '+';
    }
    
    switch (type) {
      case 'income':
        return '+';
      case 'expense':
      case 'transfer':
        return '-';
      default:
        return '';
    }
  };

  const filteredTransactions = transactions
    .filter(transaction => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        transaction.title.toLowerCase().includes(searchTermLower) ||
        (transaction.description?.toLowerCase().includes(searchTermLower) || false) ||
        formatDate(transaction.date).toLowerCase().includes(searchTermLower)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  // Fungsi untuk melihat semua transaksi dompet ini di halaman Transactions
  const navigateToAllTransactions = () => {
    navigate(`/transactions?wallet=${id}`);
  };

  // Perbaiki fungsi refreshWalletBalance agar lebih efisien
  const refreshWalletBalance = async (showFeedback = false, quietMode = false) => {
    if (!id) return;
    
    if (showFeedback) setRefreshing(true);
    
    try {
      // Dapatkan saldo terbaru langsung dari database
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', id)
        .single();
        
      if (error) {
        if (!quietMode) console.error("Error refreshing wallet balance:", error);
        if (showFeedback) toast({
          title: "Gagal menyegarkan saldo",
          description: "Terjadi kesalahan saat memuat saldo terbaru",
          variant: "destructive"
        });
        return;
      }
      
      // Jika saldo berubah, perbarui state
      if (data && wallet && data.balance !== wallet.balance) {
        if (!quietMode) console.log(`Wallet balance changed: ${wallet.balance} -> ${data.balance}`);
        
        // Update saldo wallet
        setWallet(prev => prev ? {...prev, balance: data.balance} : null);
        
        if (showFeedback) toast({
          title: "Saldo diperbarui",
          description: `Saldo terbaru: ${formatCurrency(data.balance)}`,
        });
      } else if (showFeedback) {
        toast({
          title: "Saldo sudah yang terbaru",
          description: `Saldo saat ini: ${formatCurrency(wallet?.balance || 0)}`,
        });
      }
    } catch (err) {
      if (!quietMode) console.error("Error in refreshWalletBalance:", err);
    } finally {
      if (showFeedback) setRefreshing(false);
    }
  };

  // Format tanggal untuk tampilan dalam bahasa Indonesia
  const formatDateRange = (from?: Date, to?: Date) => {
    if (!from || !to) return '';
    
    // Format nama bulan dalam bahasa Indonesia
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const fromDate = from.getDate();
    const fromMonth = months[from.getMonth()];
    const fromYear = from.getFullYear();
    
    const toDate = to.getDate();
    const toMonth = months[to.getMonth()];
    const toYear = to.getFullYear();
    
    // Jika tahun sama, jangan duplikasi
    if (fromYear === toYear) {
      // Jika bulan sama, jangan duplikasi
      if (fromMonth === toMonth) {
        return `${fromDate} - ${toDate} ${fromMonth} ${toYear}`;
      }
      return `${fromDate} ${fromMonth} - ${toDate} ${toMonth} ${toYear}`;
    }
    
    return `${fromDate} ${fromMonth} ${fromYear} - ${toDate} ${toMonth} ${toYear}`;
  };

  // Tambahkan format untuk input date
  const formatDateForInput = (date?: Date) => {
    if (!date) return "";
    return format(date, 'yyyy-MM-dd');
  };

  // Dapatkan label untuk filter periode yang aktif
  const getPeriodLabel = (p: string) => {
    switch(p) {
      case 'last-7': return '7 hari terakhir';
      case 'last-30': return '30 hari terakhir';
      case 'last-90': return '3 bulan terakhir';
      case 'last-365': return '1 tahun terakhir';
      case 'custom': return 'Rentang kustom';
      default: return '30 hari terakhir';
    }
  };

  // Tambahkan handler untuk perubahan tanggal
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
      setTempDateRange(range);
      setPeriod('custom'); // Jika range tanggal berubah manual, set ke custom
    }
  };

  // Fungsi untuk menerapkan filter tanggal kustom
  const applyCustomDateFilter = () => {
    if (tempDateRange) {
      setDateRange(tempDateRange);
      // Tutup sheet filter setelah filter diterapkan
      setShowFilters(false);
    }
  };

  // Fungsi untuk mereset filter
  const resetFilters = () => {
    setPeriod('last-30');
    const newRange = getDateRangeFromPeriod('last-30');
    setDateRange(newRange);
    setTempDateRange(newRange);
    setFilterType('all');
  };

  // Fallback content untuk pengguna free yang telah mencapai batas
  const walletDetailFallback = (
    <div className="container mx-auto py-2 px-2 md:px-6 my-auto max-w-5xl">
     

      <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-amber-100 to-yellow-50 p-8 rounded-2xl border border-amber-200 shadow-sm my-4 max-w-3xl mx-auto">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-300/20 to-yellow-300/20 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-300/20 to-yellow-300/20 rounded-full -ml-16 -mb-16"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="p-5 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl shadow-md border border-amber-400/30">
            <Lock className="h-8 w-8 text-white" />
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <h2 className="text-xl md:text-2xl font-bold text-amber-800">Batas Harian Tercapai</h2>
              <Badge className="bg-amber-200 text-amber-700 hover:bg-amber-300 border-0">
                5/5
              </Badge>
            </div>
            
            <p className="text-gray-700 mb-6 max-w-lg">
              Anda telah mencapai batas melihat detail dompet untuk hari ini. 
              Upgrade ke <span className="font-semibold">Pro</span> untuk akses tanpa batas ke semua fitur premium!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Button 
                onClick={() => navigate('/upgrade')}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium px-6 py-5 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
              >
                <span>Upgrade ke Pro Sekarang</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="border-gray-300 hover:bg-gray-50 text-gray-600"
              >
                Kembali
              </Button>
            </div>
          </div>
          
          <div className="hidden md:block bg-gradient-to-br from-amber-100 to-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
            <div className="grid gap-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700">Lihat detail transaksi tanpa batas</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700">Analisis pengeluaran mendalam</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700">Fitur tabungan dan anggaran</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Small testimonial at the bottom */}
        <div className="mt-6 pt-4 border-t border-amber-200/50 text-center md:text-left">
          <p className="text-sm text-gray-600 italic">
            "Dengan Pro, saya bisa memantau semua transaksi tanpa batasan. Sangat membantu untuk mengelola keuangan!" — Budi S.
          </p>
        </div>
      </div>
    </div>
  );

  if (loading && !wallet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 w-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-lg text-gray-600 mb-4">Wallet tidak ditemukan</p>
        <Button onClick={() => navigate('/home')}>Kembali ke Home</Button>
      </div>
    );
  }

  const getCardStyle = () => {
    const defaultColor = "#4f46e5"; // Default color jika tidak ada
    const style: React.CSSProperties = {
      background: wallet.gradient && wallet.color
        ? `linear-gradient(135deg, ${wallet.color}, ${wallet.gradient})`
        : wallet.color || defaultColor,
      color: "white",
    };
    return style;
  };

  return (
    <Layout>
      <PremiumFeatureCounter
        feature="wallet_detail"
        walletId={id}
        userProfile={userProfile}
        maxDailyCount={5}
        fallback={walletDetailFallback}
      >
        <div className="container mx-auto py-2 px-2 md:px-6 max-w-5xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-semibold">Detail Dompet</h1>
          </div>

          {/* Wallet Card */}
          <Card className="mb-6 p-6" style={getCardStyle()}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{wallet.name}</h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      size="icon"
                      aria-label="Menu dompet"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => navigate(`/wallet/edit/${wallet.id}`)}
                      className="cursor-pointer"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Dompet
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                      disabled={wallet.is_default}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus Dompet
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm opacity-90">
                {wallet.type === "bank"
                  ? "Rekening Bank"
                  : wallet.type === "savings"
                  ? "Tabungan"
                  : "Uang Tunai"}
              </p>
              <div className="mt-4">
                <p className="text-sm opacity-90">Saldo Saat Ini</p>
                <p className="text-3xl font-bold">{formatCurrency(wallet.balance)}</p>
              </div>
            </div>
          </Card>

          {/* Filter Bar - Yang lebih sederhana */}
          <div className="bg-white rounded-xl shadow-sm border mb-4 overflow-hidden">
            <div className="p-3 flex items-center justify-between">
              {/* Tombol Filter - Buka Sheet */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-9 border-gray-200 px-3"
                    onClick={() => setShowFilters(true)}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filter Transaksi
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0 w-[85vw] sm:max-w-md">
                  <div className="flex flex-col h-full">
                    <SheetHeader className="p-4 border-b">
                      <SheetTitle className="flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-primary" />
                        Filter Transaksi
                      </SheetTitle>
                    </SheetHeader>
                    
                    <div className="p-4 flex-1 overflow-auto space-y-5">
                      {/* Jenis Transaksi */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Jenis Transaksi</label>
                        <Select value={filterType} onValueChange={(value: 'all' | 'income' | 'expense') => setFilterType(value)}>
                          <SelectTrigger className="bg-white border border-gray-200 rounded-lg h-9 w-full">
                            <SelectValue placeholder="Filter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Transaksi</SelectItem>
                            <SelectItem value="income">Pemasukan</SelectItem>
                            <SelectItem value="expense">Pengeluaran</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Filter Periode */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Periode Waktu</label>
                        <Select 
                          value={period} 
                          onValueChange={(value: 'last-7' | 'last-30' | 'last-90' | 'last-365' | 'custom') => {
                            setPeriod(value);
                            // Jika bukan custom, langsung terapkan range tanggal
                            if (value !== 'custom') {
                              const newRange = getDateRangeFromPeriod(value);
                              setTempDateRange(newRange);
                            }
                          }}
                        >
                          <SelectTrigger className="bg-white border border-gray-200 rounded-lg h-9 w-full">
                            <SelectValue placeholder="Pilih periode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="last-7">7 hari terakhir</SelectItem>
                            <SelectItem value="last-30">30 hari terakhir</SelectItem>
                            <SelectItem value="last-90">3 bulan terakhir</SelectItem>
                            <SelectItem value="last-365">1 tahun terakhir</SelectItem>
                            <SelectItem value="custom">Rentang kustom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Rentang Tanggal Kustom */}
                      {period === 'custom' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Rentang Tanggal</label>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">Dari</p>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                  type="date"
                                  className="pl-10"
                                  value={formatDateForInput(tempDateRange?.from)}
                                  onChange={(e) => {
                                    const from = e.target.value ? new Date(e.target.value) : undefined;
                                    setTempDateRange(prev => ({
                                      from: from,
                                      to: prev?.to 
                                    }));
                                  }}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">Sampai</p>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                  type="date"
                                  className="pl-10"
                                  value={formatDateForInput(tempDateRange?.to)}
                                  onChange={(e) => {
                                    const to = e.target.value ? new Date(e.target.value) : undefined;
                                    setTempDateRange(prev => ({
                                      from: prev?.from, 
                                      to: to
                                    }));
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Footer dengan tombol aksi */}
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={resetFilters}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" /> 
                          Reset
                        </Button>
                        <Button 
                          className="flex-1"
                          onClick={applyCustomDateFilter}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Terapkan
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              
              {/* Badge status filter aktif */}
              <div className="flex items-center gap-2">
                {filterType !== 'all' && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100">
                    {filterType === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </Badge>
                )}
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                  {getPeriodLabel(period)}
                </Badge>
              </div>
            </div>
            
            {/* Info tanggal untuk periode yang dipilih */}
            {dateRange?.from && dateRange?.to && (
              <div className="bg-gray-50 px-3 py-1.5 text-xs text-gray-500 border-t flex items-center">
                <Calendar className="h-3 w-3 mr-2 flex-shrink-0" />
                <span>
                  {formatDateRange(dateRange.from, dateRange.to)}
                </span>
              </div>
            )}
          </div>

          {/* Transactions */}
          <Card className="mb-24 p-1">
            <TransactionList
              transactions={transactions as (Transaction & { wallet_name?: string })[]}
              isLoading={loading}
              onFilter={(query) => setSearchTerm(query)}
              onDateRangeChange={handleDateRangeChange}
              onDelete={async (id) => {
                try {
                  const { error } = await supabase
                    .from("transactions")
                    .delete()
                    .eq("id", id[0]);

                  if (error) throw error;

                  toast({
                    title: "Transaksi dihapus",
                    description: "Transaksi berhasil dihapus",
                  });

                  fetchWalletAndTransactions();
                } catch (error) {
                  console.error("Error deleting transaction:", error);
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Gagal menghapus transaksi",
                  });
                }
              }}
              onEdit={(transaction) => {
                navigate(`/transaction/${transaction.type}/${transaction.id}`);
              }}
            />
          </Card>
          
          {/* Delete Confirmation Dialog */}
          <DeleteConfirmationDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onConfirm={handleDeleteWallet}
            title="Hapus Dompet"
            description="Apakah Anda yakin ingin menghapus dompet"
            itemName={wallet.name}
            confirmLabel="Hapus"
            cancelLabel="Batal"
          />
        </div>
      </PremiumFeatureCounter>
    </Layout>
  );
};

export default WalletDetail;
