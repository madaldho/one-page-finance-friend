import React, { useEffect, useState } from 'react';
import { ArrowLeft, Wallet, PiggyBank, ArrowUpRight, Plus, CreditCard } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { WalletTransactionsChart } from '@/components/analysis/charts/WalletTransactionsChart';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';

interface Wallet {
  id: string;
  name: string;
  balance: number;
  color?: string;
  logo_url?: string; // URL logo yang di-upload (field yang benar dari database)
  type?: 'cash' | 'bank' | 'savings' | string;
}

const WalletDetailPage = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mengambil data dompet dari Supabase
  useEffect(() => {
    const fetchWallets = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (error) {
          console.error('Error fetching wallets:', error);
          return;
        }

        console.log('Fetched wallets with logo data:', data); // Debug log
        setWallets(data || []);
      } catch (error) {
        console.error('Error in fetchWallets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWallets();
  }, [user]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleAddWallet = () => {
    navigate('/wallets/add');
  };

  // Menghitung total saldo dari semua dompet
  const totalBalance = wallets.reduce((total, wallet) => total + wallet.balance, 0);

  // Menyiapkan data untuk grafik
  const walletChartData = wallets.map(wallet => ({
    name: wallet.name,
    value: wallet.balance,
    color: wallet.color || '#6366F1', // Default color jika tidak ada
    percentage: (wallet.balance / (totalBalance || 1)) * 100,
    icon: wallet.logo_url, // Tambahkan logo untuk grafik
  }));

  console.log('Chart data with logos:', walletChartData); // Debug log

  // Tampilan loading
  const renderLoading = () => (
    <div className="bg-white rounded-xl shadow-sm p-10 text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-500">Memuat data dompet...</p>
      </div>
    </div>
  );

  // Tampilan untuk wallet kosong
  const renderEmptyState = () => (
    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <PiggyBank className="h-8 w-8 text-purple-600" />
      </div>
      <h3 className="font-medium mb-2 text-gray-800">Belum ada dompet</h3>
      <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
        Tambahkan dompet untuk melacak aliran keuangan Anda secara real-time
      </p>
      <Button 
        onClick={handleAddWallet}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        Tambah Dompet Baru
      </Button>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-xl">
        {/* Header yang konsisten dengan halaman lain */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center">
            <button 
              onClick={handleBack}
              className="mr-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 rounded-full p-1 transition-colors"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">Detail Saldo Dompet</h1>
          </div>
         
        </div>

        {isLoading ? (
          renderLoading()
        ) : wallets.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Kartu Total Saldo dengan design modern */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-5">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <Wallet className="w-5 h-5 text-white/80 mr-2" />
                    <h2 className="font-medium">Total Saldo Dompet</h2>
                  </div>
                  
                  <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
                  
                  <div className="flex items-center text-xs text-white/80">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    <span>Total dari {wallets.length} dompet aktif</span>
                  </div>
                </div>
              </div>
              
            </div>

            {/* Komponen Grafik dengan kartu yang lebih modern */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center">
                <div className="bg-purple-100 p-1.5 rounded-full mr-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="font-medium text-gray-800">
                  Distribusi Saldo
                </h2>
                <div className="ml-auto">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {wallets.length} dompet
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <WalletTransactionsChart walletChartData={walletChartData} />
              </div>
            </div>
            
            {/* Daftar individual dompet */}
            <div className="mt-5 bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-medium text-gray-800">Daftar Dompet</h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {wallets.map((wallet) => (
                  <div 
                    key={wallet.id} 
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/wallets/${wallet.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center mr-3 overflow-hidden"
                          style={{ backgroundColor: wallet.color ? `${wallet.color}15` : '#6366F115' }}
                        >
                          {wallet.logo_url ? (
                            <img 
                              src={wallet.logo_url} 
                              alt={wallet.name}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                // Jika gambar gagal dimuat, tampilkan icon default
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <Wallet 
                            className={`w-5 h-5 ${wallet.logo_url ? 'hidden' : ''}`}
                            style={{ color: wallet.color || '#6366F1' }} 
                          />
                        </div>
                        <div>
                          <p className="font-medium">{wallet.name}</p>
                          <p className="text-xs text-gray-500">Terakhir diperbarui: Hari ini</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(wallet.balance)}</p>
                        <p className="text-xs text-gray-500">
                          {((wallet.balance / totalBalance) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default WalletDetailPage; 