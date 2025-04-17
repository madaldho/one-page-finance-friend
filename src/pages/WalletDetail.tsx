
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, ArrowLeftRight, ArrowUp, ArrowDown, ChevronLeft, Filter } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  title: string;
  description: string;
  type: 'income' | 'expense' | 'transfer';
  wallet_id: string;
  destination_wallet_id?: string;
  category: string;
  date: string;
}

const WalletDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<{ id: string; name: string; balance: number } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    const fetchWalletAndTransactions = async () => {
      setLoading(true);
      try {
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('*')
          .eq('id', id)
          .single();

        if (walletError) {
          console.error("Error fetching wallet:", walletError);
          throw walletError;
        }

        setWallet(walletData);

        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .or(`wallet_id.eq.${id},destination_wallet_id.eq.${id}`)
          .order('date', { ascending: false });

        if (transactionsError) {
          console.error("Error fetching transactions:", transactionsError);
          throw transactionsError;
        }

        setTransactions(transactionsData || []);
      } catch (error) {
        console.error("Failed to fetch wallet details and transactions", error);
        toast({
          title: "Error",
          description: "Gagal memuat detail wallet dan transaksi",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchWalletAndTransactions();
    }
  }, [id, toast]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getTransactionTypeIcon = (type: string, isDestination: boolean = false) => {
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
        return 'text-red-600';
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
        (transaction.title && transaction.title.toLowerCase().includes(searchTermLower)) ||
        (transaction.description && transaction.description.toLowerCase().includes(searchTermLower)) ||
        formatDate(transaction.date).toLowerCase().includes(searchTermLower) ||
        (transaction.category && transaction.category.toLowerCase().includes(searchTermLower))
      );
    })
    .filter(transaction => {
      if (filterType === 'all') {
        return true;
      }
      return transaction.type === filterType;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const handleDelete = async (transactionId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      return;
    }

    try {
      // First get the transaction details
      const { data: transactionData, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Delete the transaction
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;
      
      // If needed, update wallet balances
      if (transactionData) {
        // For income transaction, subtract the amount from the wallet
        if (transactionData.type === 'income' && transactionData.wallet_id) {
          const { data: walletData } = await supabase
            .from('wallets')
            .select('balance')
            .eq('id', transactionData.wallet_id)
            .single();
            
          if (walletData) {
            await supabase
              .from('wallets')
              .update({ balance: walletData.balance - transactionData.amount })
              .eq('id', transactionData.wallet_id);
          }
        }
        
        // For expense transaction, add the amount back to the wallet
        else if (transactionData.type === 'expense' && transactionData.wallet_id) {
          const { data: walletData } = await supabase
            .from('wallets')
            .select('balance')
            .eq('id', transactionData.wallet_id)
            .single();
            
          if (walletData) {
            await supabase
              .from('wallets')
              .update({ balance: walletData.balance + transactionData.amount })
              .eq('id', transactionData.wallet_id);
          }
        }
        
        // For transfer transaction, handle both wallets
        else if (transactionData.type === 'transfer') {
          if (transactionData.wallet_id) {
            const { data: sourceWalletData } = await supabase
              .from('wallets')
              .select('balance')
              .eq('id', transactionData.wallet_id)
              .single();
              
            if (sourceWalletData) {
              await supabase
                .from('wallets')
                .update({ balance: sourceWalletData.balance + transactionData.amount })
                .eq('id', transactionData.wallet_id);
            }
          }
          
          if (transactionData.destination_wallet_id) {
            const { data: destWalletData } = await supabase
              .from('wallets')
              .select('balance')
              .eq('id', transactionData.destination_wallet_id)
              .single();
              
            if (destWalletData) {
              const fee = transactionData.fee || 0;
              await supabase
                .from('wallets')
                .update({ balance: destWalletData.balance - (transactionData.amount - fee) })
                .eq('id', transactionData.destination_wallet_id);
            }
          }
        }
      }

      // Update the local state to remove the deleted transaction
      setTransactions(prevTransactions =>
        prevTransactions.filter(transaction => transaction.id !== transactionId)
      );
      
      toast({
        title: "Berhasil",
        description: "Transaksi berhasil dihapus",
      });
      
      // Refresh the wallet data to show updated balance
      const { data: refreshedWallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', id)
        .single();
        
      if (refreshedWallet) {
        setWallet(refreshedWallet);
      }
      
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus transaksi",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 w-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="p-4 text-center">
        <p className="text-lg text-gray-600 mb-4">Wallet tidak ditemukan.</p>
        <Button onClick={() => navigate('/home')}>Kembali ke Home</Button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="bg-white p-4 shadow-sm">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/home')}
            className="mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Detail Wallet</h1>
        </div>
      </div>
      
      <div className="p-4">
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-5 mb-6 rounded-xl">
          <h2 className="text-sm font-medium opacity-80 mb-1">{wallet.name}</h2>
          <p className="text-2xl font-bold">{formatCurrency(wallet.balance)}</p>
        </Card>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filter</span>
          </div>
          <div className="flex gap-2">
            <Select
              value={filterType}
              onValueChange={(value: 'all' | 'income' | 'expense' | 'transfer') => setFilterType(value)}
            >
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="Filter transaksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="income">Pemasukan</SelectItem>
                <SelectItem value="expense">Pengeluaran</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={sortOrder}
              onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}
            >
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="oldest">Terlama</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Cari transaksi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Tidak ada transaksi yang ditemukan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map(transaction => {
              const isDestinationWallet = transaction.destination_wallet_id === id;
              
              return (
                <Card key={transaction.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gray-100">
                        {getTransactionTypeIcon(transaction.type, isDestinationWallet)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{transaction.title || transaction.category}</h3>
                        <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                        {transaction.description && (
                          <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className={`font-semibold ${getTransactionColor(transaction.type, isDestinationWallet)}`}>
                        {getTransactionSign(transaction.type, isDestinationWallet)} {formatCurrency(transaction.amount).replace('Rp', '')}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(transaction.id)}
                        className="h-6 w-6 text-gray-400 hover:text-red-500 mt-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletDetail;
