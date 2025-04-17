import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  wallet_id: string;
}

const WalletDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<{ id: string; name: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletAndTransactions = async () => {
      setLoading(true);
      try {
        // Fetch wallet details
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

        // Fetch transactions for the wallet
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('wallet_id', id)
          .order('created_at', { ascending: false });

        if (transactionsError) {
          console.error("Error fetching transactions:", transactionsError);
          throw transactionsError;
        }

        setTransactions(transactionsData || []);
      } catch (error) {
        console.error("Failed to fetch wallet details and transactions", error);
        // Optionally redirect or display an error message to the user
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchWalletAndTransactions();
    }
  }, [id]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const filteredTransactions = transactions
    .filter(transaction => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        transaction.description.toLowerCase().includes(searchTermLower) ||
        formatDate(transaction.created_at).includes(searchTermLower) ||
        formatCurrency(transaction.amount).includes(searchTermLower)
      );
    })
    .filter(transaction => {
      if (filterType === 'all') {
        return true;
      }
      return transaction.type === filterType;
    });

  const handleDelete = async (transactionId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) {
        throw error;
      }

      // Optimistically update the UI
      setTransactions(prevTransactions =>
        prevTransactions.filter(transaction => transaction.id !== transactionId)
      );
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Gagal menghapus transaksi.");
    }
  };

  if (loading) {
    return <div className="p-4">Loading wallet details and transactions...</div>;
  }

  if (!wallet) {
    return <div className="p-4">Wallet not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">{wallet.name}</h1>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Cari transaksi..."
          className="p-2 border rounded w-full md:w-auto"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="p-2 border rounded w-full md:w-auto"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
        >
          <option value="all">Semua</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </select>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-gray-500">Tidak ada transaksi yang ditemukan.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded shadow-md">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-3 border-b text-left">Deskripsi</th>
                <th className="py-2 px-3 border-b text-left">Tanggal</th>
                <th className="py-2 px-3 border-b text-left">Jumlah</th>
                <th className="py-2 px-3 border-b text-left">Tipe</th>
                <th className="py-2 px-3 border-b text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(transaction => (
                <tr key={transaction.id} className="hover:bg-gray-100">
                  <td className="py-2 px-3 border-b">{transaction.description}</td>
                  <td className="py-2 px-3 border-b">{formatDate(transaction.created_at)}</td>
                  <td className="py-2 px-3 border-b">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="py-2 px-3 border-b">{transaction.type}</td>
                  <td className="py-2 px-3 border-b">
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WalletDetail;
