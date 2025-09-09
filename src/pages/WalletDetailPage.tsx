import React, { useEffect, useState } from 'react';
import { ArrowLeft, Wallet, PiggyBank, ArrowUpRight, Plus, CreditCard, Banknote, TrendingUp } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { WalletTransactionsChart } from '@/components/analysis/charts/WalletTransactionsChart';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { getWalletIcon } from '@/components/WalletCard';

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

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
        <div className="container mx-auto p-4 pb-32 max-w-xl">
          {/* Header dengan glassmorphism effect */}
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleBack}
                  className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md border border-white/30"
                  aria-label="Kembali"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-700" />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Detail Saldo Dompet</h1>
                  <p className="text-xs text-gray-500">Kelola semua dompet Anda</p>
                </div>
              </div>
              <Button 
                onClick={handleAddWallet}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Tambah</span>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="backdrop-blur-sm bg-white/70 rounded-2xl shadow-sm p-10 text-center border border-white/20">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center mb-4">
                  <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                </div>
                <p className="text-gray-600 font-medium">Memuat data dompet...</p>
              </div>
            </div>
          ) : wallets.length === 0 ? (
            <div className="backdrop-blur-sm bg-white/70 rounded-2xl shadow-sm p-8 text-center border border-white/20">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PiggyBank className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-800">Belum ada dompet</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                Tambahkan dompet untuk melacak aliran keuangan Anda secara real-time
              </p>
              <Button 
                onClick={handleAddWallet}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Dompet Baru
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Kartu Total Saldo dengan glassmorphism dan logo */}
              <div className="relative overflow-hidden rounded-2xl shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                
                <div className="relative p-6 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-white/90">Total Saldo Dompet</h2>
                        <p className="text-xs text-white/70">Semua dompet aktif</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-xs text-white/80 mb-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        <span>{wallets.length} dompet</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-3xl font-bold mb-2">{formatCurrency(totalBalance)}</p>
                    <div className="flex items-center text-sm text-white/80">
                      <ArrowUpRight className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span>Terakhir diperbarui hari ini</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Komponen Grafik dengan design yang lebih modern */}
              <div className="backdrop-blur-sm bg-white/70 rounded-2xl shadow-sm overflow-hidden border border-white/20">
                <div className="px-6 py-4 border-b border-gray-100/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-800">Distribusi Saldo</h2>
                      <p className="text-xs text-gray-500">Persentase dari total saldo</p>
                    </div>
                  </div>
                  <div className="bg-purple-50 px-3 py-1 rounded-xl">
                    <span className="text-xs font-medium text-purple-600">
                      {wallets.length} dompet
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <WalletTransactionsChart walletChartData={walletChartData} />
                </div>
              </div>
              
              {/* Daftar individual dompet dengan design seperti WalletCard */}
              <div className="backdrop-blur-sm bg-white/70 rounded-2xl shadow-sm overflow-hidden border border-white/20">
                <div className="px-6 py-4 border-b border-gray-100/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-800">Daftar Dompet</h2>
                      <p className="text-xs text-gray-500">Klik untuk melihat detail</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  {wallets.map((wallet) => (
                    <div 
                      key={wallet.id} 
                      className="relative group cursor-pointer"
                      onClick={() => navigate(`/wallets/${wallet.id}`)}
                    >
                      {/* Kartu dompet dengan design glassmorphism seperti WalletCard */}
                      <div 
                        className="relative p-4 rounded-xl overflow-hidden transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1 border border-white/20"
                        style={{
                          background: `linear-gradient(135deg, ${wallet.color || '#4F46E5'}, ${wallet.color || '#4F46E5'}dd)`,
                        }}
                      >
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8 transition-transform group-hover:scale-110 duration-300"></div>
                        <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full translate-y-6 -translate-x-6 transition-transform group-hover:scale-110 duration-300"></div>
                        
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-white">
                            {wallet.logo_url ? (
                              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md border border-white/30 group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                                <img 
                                  src={wallet.logo_url} 
                                  alt={wallet.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.nextElementSibling) {
                                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                    }
                                  }}
                                />
                                <div 
                                  className="w-full h-full bg-white/20 items-center justify-center"
                                  style={{ display: 'none' }}
                                >
                                  {getWalletIcon(wallet.type || "cash")}
                                </div>
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center shadow-md border border-white/30 group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                                {getWalletIcon(wallet.type || "cash")}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="font-semibold text-lg truncate drop-shadow-sm">{wallet.name}</h3>
                              <p className="text-sm text-white/80">
                                {((wallet.balance / totalBalance) * 100).toFixed(1)}% dari total
                              </p>
                            </div>
                          </div>
                          <div className="text-right text-white">
                            <p className="font-bold text-xl drop-shadow-sm">{formatCurrency(wallet.balance)}</p>
                            <p className="text-sm text-white/80">Saldo saat ini</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WalletDetailPage; 