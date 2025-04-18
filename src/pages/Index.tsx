import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus,
  Wallet as WalletIcon,
  Receipt, 
  PiggyBank, 
  CreditCard, 
  ChevronRight, 
  Home, 
  Minus, 
  ArrowRight, 
  BarChart2, 
  Settings,
  PieChart
} from "lucide-react";
import { Transaction, Wallet } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Header from '@/components/Header';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { WalletCard } from "@/components/WalletCard";
import BudgetCard from "@/components/BudgetCard";
import SavingsCard from "@/components/SavingsCard";
import LoansCard from "@/components/LoansCard";
import TransactionList from "@/components/TransactionList";
import TransactionActions from "@/components/TransactionActions";
import WalletForm from "@/components/WalletForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getWalletIcon } from '@/components/WalletCard';

interface UserSettings {
  id: string;
  user_id: string;
  show_budgeting: boolean;
  show_savings: boolean;
  show_loans: boolean;
}

const Index = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  
  const [settings, setSettings] = useState<UserSettings>({
    id: "",
    user_id: "",
    show_budgeting: true,
    show_savings: true,
    show_loans: true,
  });
  
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  
  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      if (!user) {
        toast({
          title: "Tidak Terautentikasi",
          description: "Silakan login untuk melihat data",
          variant: "destructive"
        });
        return;
      }

      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (walletsError) throw walletsError;
      setWallets(walletsData as Wallet[]);

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;

      const enrichedTransactions = transactionsData.map(tx => {
        const wallet = walletsData.find(w => w.id === tx.wallet_id);
        return {
          ...tx,
          wallet_name: wallet?.name || 'N/A',
        };
      });

      setTransactions(enrichedTransactions as Transaction[]);

      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!settingsError && settingsData) {
        setSettings(settingsData as UserSettings);
      }

      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (budgetsError) {
        console.error("Budget fetch error:", budgetsError);
      } else {
      setBudgets(budgetsData as Budget[]);
      }

      const { data: savingsData, error: savingsError } = await supabase
        .from('savings')
        .select('*')
        .eq('user_id', user.id);

      if (savingsError) {
        console.error("Savings fetch error:", savingsError);
      } else {
      setSavings(savingsData as Saving[]);
      }

      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id);

      if (loansError) {
        console.error("Loans fetch error:", loansError);
      } else {
      setLoans(loansData as Loan[]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Gagal Memuat Data",
        description: "Terjadi kesalahan saat mengambil data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    let incomeSum = 0;
    let expenseSum = 0;
    let walletBalance = 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === "income") {
        incomeSum += transaction.amount;
      } else if (transaction.type === "expense") {
        expenseSum += transaction.amount;
      }
    });
    
    wallets.forEach(wallet => {
      walletBalance += wallet.balance;
    });
    
    setTotalIncome(incomeSum);
    setTotalExpense(expenseSum);
    setBalance(walletBalance);
  }, [transactions, wallets]);
  
  const handleAddTransaction = (transaction: Transaction) => {
    fetchData();
  };
  
  const handleFilterTransactions = async (query: string) => {
    if (!user) return;
    
    if (!query) {
      fetchData();
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .ilike('title', `%${query}%`)
        .order('date', { ascending: false });

      if (error) throw error;
      
      setTransactions(data as Transaction[]);
      
      toast({
        title: "Mencari transaksi",
        description: `Hasil pencarian untuk "${query}"`,
      });
    } catch (error) {
      console.error('Error filtering transactions:', error);
      toast({
        title: "Gagal Mencari Transaksi",
        description: "Terjadi kesalahan saat mencari transaksi",
        variant: "destructive"
      });
    }
  };
  
  const handleWalletClick = (wallet: Wallet) => {
    navigate(`/wallet/${wallet.id}`);
  };
  
  const handleDeleteTransaction = async (id: string | string[]) => {
    try {
      const ids = Array.isArray(id) ? id : [id];
      
      for (const transactionId of ids) {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', transactionId);
          
        if (error) throw error;
      }
      
      toast({
        title: "Transaksi Dihapus",
        description: `${ids.length} transaksi berhasil dihapus`
      });
      
      fetchData();
    } catch (error: unknown) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Gagal Menghapus Transaksi",
        description: "Terjadi kesalahan saat menghapus transaksi",
        variant: "destructive"
      });
    }
  };
  
  const handleEditTransaction = (transaction: Transaction) => {
    navigate(`/transaction/${transaction.type}/${transaction.id}`);
  };
  
  const handleDateRangeChange = (range: { from: Date; to: Date } | undefined) => {
    if (!range || !range.from || !range.to) return;
    
    console.log("Date range:", range.from, range.to);
    // Implement date filtering
  };
  
  return (
    <Layout>
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 pb-32 pt-2">
        {/* Wallet Section */}
        <section className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Saldo Dompet dan Rekening</h2>
                <Button 
                  size="sm" 
                onClick={() => {
                  setSelectedWallet(null);
                  setShowWalletForm(true);
                }}
                className="bg-black text-white hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Dompet
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {wallets.length === 0 ? (
                <Card className="col-span-full flex flex-col items-center justify-center py-8 text-center">
                  <WalletIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-gray-500 mb-2">Belum ada dompet</p>
                  <Button 
                    onClick={() => {
                      setSelectedWallet(null);
                      setShowWalletForm(true);
                    }}
                    className="bg-black text-white hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Tambah Dompet
                </Button>
              </Card>
            ) : (
              <>
                {wallets.map(wallet => (
                  <WalletCard 
                    key={wallet.id} 
                    wallet={wallet} 
                      onEdit={(wallet) => {
                        setSelectedWallet(wallet);
                        setShowWalletForm(true);
                      }}
                      onDelete={async (id) => {
                        try {
                          const { error } = await supabase
                            .from('wallets')
                            .delete()
                            .eq('id', id);
                            
                          if (error) throw error;
                          
                          toast({
                            title: "Dompet berhasil dihapus",
                            description: "Data dompet telah dihapus dari sistem"
                          });
                          
                          fetchData();
                        } catch (error) {
                          console.error('Error deleting wallet:', error);
                          toast({
                            variant: "destructive",
                            title: "Gagal menghapus dompet",
                            description: "Terjadi kesalahan saat menghapus dompet"
                          });
                        }
                      }}
                      onSuccess={fetchData}
                  />
                ))}
              </>
            )}
          </div>
        </section>

        {/* Budget Card Section */}
        {settings.show_budgeting && (
          <section className="mb-5">
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b p-4 flex flex-row items-center justify-between">
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-2">
                    <span className="text-xs text-green-700 font-bold">A</span>
                  </div>
                  <CardTitle className="text-base font-medium text-green-800">Anggaran Bulan Ini</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-green-600 hover:text-green-700 p-0 flex items-center"
                  onClick={() => navigate('/budgets')}
                >
                  Kelola <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {budgets && budgets.length > 0 ? (
                  <BudgetCard budgets={budgets.slice(0, 2)} />
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-2">Belum ada anggaran</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/budgets')}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Tambah Anggaran
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Savings Card Section */}
        {settings.show_savings && (
          <section className="mb-5">
            <Card>
              <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b p-4 flex flex-row items-center justify-between">
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center mr-2">
                    <span className="text-xs text-amber-700 font-bold">T</span>
                  </div>
                  <CardTitle className="text-base font-medium text-amber-800">Target Tabungan</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-amber-600 hover:text-amber-700 p-0 flex items-center"
                  onClick={() => navigate('/savings')}
                >
                  Kelola <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {savings && savings.length > 0 ? (
                  <SavingsCard savings={savings} />
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-2">Belum ada tabungan</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/savings')}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Tambah Tabungan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Loans Card Section */}
        {settings.show_loans && (
          <section className="mb-5">
            {loans && loans.length > 0 ? (
              <LoansCard loans={loans} loading={isLoading} onViewAll={() => navigate('/loans')} />
            ) : (
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-4 flex flex-row items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <span className="text-xs text-blue-700 font-bold">H</span>
                    </div>
                    <CardTitle className="text-base font-medium text-blue-800">Hutang & Piutang</CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-blue-600 hover:text-blue-700 p-0 flex items-center"
                    onClick={() => navigate('/loans')}
                  >
                    Kelola <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="text-center py-6">
                  <p className="text-gray-500 mb-2">Belum ada hutang atau piutang</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/loans')}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Tambah Hutang/Piutang
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* Transactions List Section */}
        <section className="mb-20">
          <Card>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b p-4 flex flex-row items-center justify-between">
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                  <span className="text-xs text-gray-700 font-bold">T</span>
                </div>
                <CardTitle className="text-base font-medium text-gray-800">Transaksi Terbaru</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-gray-600 hover:text-gray-700 p-0 flex items-center"
                onClick={() => navigate('/transactions')}
              >
                Lihat Semua <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:p-4">
              <TransactionList 
                transactions={transactions.slice(0, 5)} 
                onFilter={handleFilterTransactions}
                onDelete={handleDeleteTransaction}
                onEdit={handleEditTransaction}
                onDateRangeChange={handleDateRangeChange}
                  hideHeader={true}
              />
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Fixed Action Buttons at Bottom */}
        <div className="fixed bottom-20 left-0 right-0 flex justify-center z-50 px-4">
          <div className="flex gap-2 p-2 bg-white rounded-full shadow-lg max-w-md w-full justify-between">
          <Button 
              className="bg-green-500 hover:bg-green-600 px-3 sm:px-4 rounded-full text-sm h-10 flex-1"
            onClick={() => navigate('/transaction/income')}
              aria-label="Tambah Pemasukan"
          >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline ml-1">Pemasukan</span>
          </Button>
          <Button 
              className="bg-red-500 hover:bg-red-600 px-3 sm:px-4 rounded-full text-sm h-10 flex-1"
            onClick={() => navigate('/transaction/expense')}
              aria-label="Tambah Pengeluaran"
          >
              <Minus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline ml-1">Pengeluaran</span>
          </Button>
          <Button 
              className="bg-blue-500 hover:bg-blue-600 px-3 sm:px-4 rounded-full text-sm h-10 flex-1"
            onClick={() => navigate('/transaction/transfer')}
              aria-label="Tambah Transfer"
          >
              <ArrowRight className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline ml-1">Transfer</span>
          </Button>
        </div>
      </div>

        {/* Add Dialog for Wallet Form */}
        <Dialog open={showWalletForm} onOpenChange={(open) => {
          setShowWalletForm(open);
          if (!open) setSelectedWallet(null);
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {selectedWallet ? 'Edit Dompet' : 'Tambah Dompet'}
              </DialogTitle>
            </DialogHeader>
        <WalletForm 
              wallet={selectedWallet}
          onSuccess={() => {
                setShowWalletForm(false);
                setSelectedWallet(null);
            fetchData();
          }}
              onClose={() => {
                setShowWalletForm(false);
                setSelectedWallet(null);
              }}
        />
          </DialogContent>
        </Dialog>
    </div>
    </Layout>
  );
};

export default Index;
