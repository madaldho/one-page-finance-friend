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
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
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
import TransactionForm from '@/components/TransactionForm';
import { getWalletIcon, getDefaultGradient } from '@/components/WalletCard';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import TransactionList from '@/components/TransactionList';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/DateRangePicker';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';

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
  destination_wallet_id?: string | null;
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
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
}

const WalletDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchWalletAndTransactions();
  }, [id]);

  // Tambahkan useEffect untuk memanggil fetch saat filter diubah
  useEffect(() => {
    if (wallet) {
      fetchWalletAndTransactions();
    }
  }, [filterType, dateRange]);

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
      setWallet(walletData);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', walletData.user_id);

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch transactions
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', id)
        .order('date', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      if (dateRange?.from && dateRange?.to) {
        query = query
          .gte('date', dateRange.from.toISOString())
          .lte('date', dateRange.to.toISOString());
      }

      const { data: transactionsData, error: transactionsError } = await query;

      if (transactionsError) throw transactionsError;
      
      // Tambahkan data kategori ke transaksi
      const transactionsWithCategories = transactionsData?.map(transaction => {
        const categoryData = categoriesData?.find(cat => cat.id === transaction.category);
        return {
          ...transaction,
          category_data: categoryData
        };
      }) || [];
      
      setTransactions(transactionsWithCategories);
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

  if (loading) {
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
    const style: React.CSSProperties = {
      background: wallet.gradient 
        ? `linear-gradient(135deg, ${wallet.color}, ${wallet.gradient})`
        : wallet.color,
      color: "white",
    };
    return style;
  };

  return (
    <Layout>
      <div className="container mxauto px-4 py-6 pb-24">
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={filterType} onValueChange={(value: 'all' | 'income' | 'expense' | 'transfer') => setFilterType(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter Transaksi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Transaksi</SelectItem>
              <SelectItem value="income">Pemasukan</SelectItem>
              <SelectItem value="expense">Pengeluaran</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
            
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              type="date"
              value={dateRange?.from?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const fromDate = e.target.value ? new Date(e.target.value) : undefined;
                setDateRange(prev => ({ 
                  from: fromDate, 
                  to: prev?.to 
                }));
              }}
              className="w-full"
              placeholder="Dari tanggal"
            />
            <span className="text-gray-500">-</span>
            <Input
              type="date"
              value={dateRange?.to?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const toDate = e.target.value ? new Date(e.target.value) : undefined;
                setDateRange(prev => ({ 
                  from: prev?.from, 
                  to: toDate 
                }));
              }}
              className="w-full"
              placeholder="Sampai tanggal"
            />
          </div>
        </div>

        {/* Transactions */}
        <Card className="mb-24">
          <TransactionList
            transactions={transactions}
            isLoading={loading}
            onFilter={(query) => setSearchTerm(query)}
            onDateRangeChange={(range) => setDateRange(range)}
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
    </Layout>
  );
};

export default WalletDetail;
