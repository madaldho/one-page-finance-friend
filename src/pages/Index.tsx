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
  PieChart,
  BellIcon,
  PlusCircle,
  User,
  DollarSign,
  CircleDollarSign,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ListFilter,
  Store,
  Coffee,
  Car,
  ShoppingBag,
  Film,
  Heart,
  GraduationCap,
  FileText,
  Umbrella,
  Percent,
  X,
  PlayCircle
} from "lucide-react";
import { Transaction, Wallet, Budget, Loan, Saving, Category } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Header from "@/components/HeaderNew";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { WalletCard, getWalletIcon } from "@/components/WalletCard";
import BudgetCard from "@/components/BudgetCard";
import SavingsCard from "@/components/SavingsCard";
import LoansCard from "@/components/LoansCard";
import TransactionList from "@/components/TransactionList";
import TransactionActions from "@/components/TransactionActions";
import WalletForm from "@/components/WalletForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface UserSettings {
  id: string;
  user_id: string;
  show_budgeting: boolean;
  show_savings: boolean;
  show_loans: boolean;
}

// Komponen untuk notifikasi tutorial
const TutorialNotification = () => {
  const [visible, setVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const [animation, setAnimation] = useState("animate-slide-down");

  useEffect(() => {
    // Periksa apakah notifikasi sudah ditutup sebelumnya
    const tutorialDismissed = localStorage.getItem("tutorialDismissed");
    if (tutorialDismissed === "true") {
      setShouldRender(false);
    }
  }, []);

  const handleDismiss = () => {
    // Set animasi untuk slide up sebelum menghilangkan komponen
    setAnimation("animate-slide-up");
    
    // Tunggu animasi selesai
    setTimeout(() => {
      setVisible(false);
      // Simpan ke localStorage bahwa notifikasi sudah ditutup
      localStorage.setItem("tutorialDismissed", "true");
    }, 300);
  };

  const openTutorial = () => {
    const videoId = "JtcduL3ohYk";
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Coba buka aplikasi YouTube di perangkat mobile
      window.location.href = `youtube://watch?v=${videoId}`;
      
      // Fallback ke URL normal jika aplikasi tidak terbuka dalam waktu tertentu
      setTimeout(() => {
        window.location.href = `https://youtu.be/${videoId}`;
      }, 2000);
    } else {
      // Buka di browser untuk desktop
      window.open(`https://youtu.be/${videoId}`, "_blank");
    }
  };

  if (!shouldRender || !visible) {
    return null;
  }

  return (
    <div className={`mb-5 pt-2 ${animation}`}>
      <div className="relative overflow-visible">
        <div className="animate-float bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md p-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-full">
              <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </div>
            <p className="text-sm font-medium">
              Baru menggunakan aplikasi ini? Lihat tutorial kami
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={openTutorial}
              className="bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-medium px-3 py-1 rounded-full"
            >
              Lihat Tutorial
            </button>
            
            <button 
              onClick={handleDismiss}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [categories, setCategories] = useState<Category[]>([]);

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

  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [currentStats, setCurrentStats] = useState<Array<{
    id?: string;
    name?: string;
    title?: string;
    category?: string;
    category_id?: string;
    amount?: number;
    count?: number;
    percentage?: number;
    date?: string;
    type?: string;
    wallet_id?: string;
    wallet_name?: string;
    icon?: string;
    color?: string;
  }>>([]);
  const [currentStatType, setCurrentStatType] = useState<string>("expenses");

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
          variant: "destructive",
        });
        return;
      }

      const { data: walletsData, error: walletsError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (walletsError) throw walletsError;
      setWallets(walletsData as Wallet[]);

      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

      if (transactionsError) throw transactionsError;

      const enrichedTransactions = transactionsData.map((tx) => {
        const wallet = walletsData.find((w) => w.id === tx.wallet_id);
        return {
          ...tx,
          wallet_name: wallet?.name || "N/A",
        };
      });

      setTransactions(enrichedTransactions as Transaction[]);

      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!settingsError && settingsData) {
        setSettings(settingsData as UserSettings);
      }

      const { data: budgetsData, error: budgetsError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id);

      if (budgetsError) {
        console.error("Budget fetch error:", budgetsError);
      } else {
        setBudgets(budgetsData as Budget[]);
      }

      const { data: savingsData, error: savingsError } = await supabase
        .from("savings")
        .select("*")
        .eq("user_id", user.id);

      if (savingsError) {
        console.error("Savings fetch error:", savingsError);
      } else {
        setSavings(savingsData as Saving[]);
      }

      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", user.id);

      if (loansError) {
        console.error("Loans fetch error:", loansError);
      } else {
        setLoans(loansData as Loan[]);
      }

      // Ambil data kategori
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id);

      if (categoriesError) {
        console.error("Categories fetch error:", categoriesError);
      } else {
        setCategories(categoriesData as Category[]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Gagal Memuat Data",
        description: "Terjadi kesalahan saat mengambil data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let incomeSum = 0;
    let expenseSum = 0;
    let walletBalance = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        incomeSum += transaction.amount;
      } else if (transaction.type === "expense") {
        expenseSum += transaction.amount;
      }
    });

    wallets.forEach((wallet) => {
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
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .ilike("title", `%${query}%`)
        .order("date", { ascending: false });

      if (error) throw error;

      setTransactions(data as Transaction[]);

      toast({
        title: "Mencari transaksi",
        description: `Hasil pencarian untuk "${query}"`,
      });
    } catch (error) {
      console.error("Error filtering transactions:", error);
      toast({
        title: "Gagal Mencari Transaksi",
        description: "Terjadi kesalahan saat mencari transaksi",
        variant: "destructive",
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
          .from("transactions")
          .delete()
          .eq("id", transactionId);

        if (error) throw error;
      }

      toast({
        title: "Transaksi Dihapus",
        description: `${ids.length} transaksi berhasil dihapus`,
      });

      fetchData();
    } catch (error: unknown) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Gagal Menghapus Transaksi",
        description: "Terjadi kesalahan saat menghapus transaksi",
        variant: "destructive",
      });
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    navigate(`/transaction/${transaction.type}/${transaction.id}`);
  };

  const handleDateRangeChange = (
    range: { from: Date; to: Date } | undefined
  ) => {
    if (!range || !range.from || !range.to) return;

    console.log("Date range:", range.from, range.to);
    // Implement date filtering
  };

  const handleAddWallet = () => {
    navigate("/wallet/add");
  };

  const handleEditWallet = (wallet: Wallet) => {
    navigate(`/wallet/edit/${wallet.id}`);
  };

  const loadTopStatistics = async (type: string) => {
    setIsLoadingStats(true);
    setCurrentStatType(type);

    try {
      let statsData: Array<{
        id?: string;
        name?: string;
        description?: string;
        title?: string;
        category?: string;
        category_id?: string;
        amount?: number;
        count?: number;
        percentage?: number;
        date?: string;
        type?: string;
        wallet_id?: string;
        wallet_name?: string;
        icon?: string;
        color?: string;
      }> = [];

      // Menggunakan if-else sebagai pengganti switch-case
      if (type === "expenses") {
        // Ambil pengeluaran terbesar, kecuali kategori transfer/admin
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "expense")
          .order("amount", { ascending: false })
          .limit(20); // ambil lebih banyak, filter di bawah

        if (error) throw error;
        // filter kategori
        statsData = (data || []).filter(tx => {
          const cat = (tx.category || "").toLowerCase();
          return cat !== "transfer" && cat !== "admin";
        }).slice(0, 5);
      } 
      else if (type === "income") {
        // Ambil pemasukan terbesar, kecuali kategori transfer/admin
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "income")
          .order("amount", { ascending: false })
          .limit(20);

        if (error) throw error;
        statsData = (data || []).filter(tx => {
          const cat = (tx.category || "").toLowerCase();
          return cat !== "transfer" && cat !== "admin";
        }).slice(0, 5);
      } 
      else if (type === "wallets") {
        // Hitung manual jumlah transaksi per dompet
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .not("wallet_id", "is", null);

        if (error) throw error;
        
        // Hitung jumlah transaksi untuk setiap dompet
        const walletCount: Record<string, number> = {};
        data.forEach(tx => {
          if (tx.wallet_id) {
            walletCount[tx.wallet_id] = (walletCount[tx.wallet_id] || 0) + 1;
          }
        });
        
        // Konversi ke array, urutkan, dan ambil 5 teratas
        const topWallets = Object.entries(walletCount)
          .map(([walletId, count]) => {
            // Temukan nama dompet berdasarkan ID
            const wallet = wallets.find(w => w.id === walletId);
            return {
              id: walletId,
              name: wallet?.name || "Dompet tidak ditemukan",
              count,
              color: wallet?.color || null
            };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        statsData = topWallets;
      }

      // Konversi data ke format yang seragam untuk ditampilkan
      const formattedStats = statsData.map(item => ({
        id: item.id,
        name: item.name || item.description || item.category || item.title || "Tidak ada nama",
        amount: item.amount,
        count: item.count,
        percentage: item.percentage || null,
        date: item.date,
        type: item.type,
        wallet_id: item.wallet_id,
        wallet_name: item.wallet_name,
        category: item.category,
        icon: item.icon,
        color: item.color
      }));

      setCurrentStats(formattedStats);
    } catch (error) {
      console.error("Error loading top statistics:", error);
      toast({
        title: "Gagal Memuat Statistik",
        description: "Terjadi kesalahan saat memuat statistik",
        variant: "destructive",
      });
      setCurrentStats([]);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Load statistik saat pertama kali komponen dimuat
  useEffect(() => {
    if (user) {
      loadTopStatistics("expenses");
    }
  }, [user]);

  const getStatItemColor = (item: typeof currentStats[0], type: string) => {
    if (type === "expenses") {
      return "#ef4444"; // merah
    } else if (type === "income") {
      return "#10b981"; // hijau
    } else if (type === "wallets") {
      // Gunakan warna dari item jika tersedia
      if (item.color) {
        return item.color;
      }
      
      // Cari warna dari wallet berdasarkan ID
      const walletId = item.id || item.wallet_id;
      if (walletId) {
        const wallet = wallets.find(w => w.id === walletId);
        if (wallet) {
          return wallet.color || "#3b82f6"; // Gunakan warna dompet jika ada
        }
      }
      return "#3b82f6"; // Default biru
    } else {
      return "#f59e0b"; // amber
    }
  };

  const getStatItemIcon = (item: typeof currentStats[0], type: string) => {
    if (type === "expenses") {
      return <ArrowUpRight className="w-4 h-4" />;
    } else if (type === "income") {
      return <ArrowDownRight className="w-4 h-4" />;
    } else if (type === "wallets") {
      // Gunakan ikon default untuk dompet
      return <WalletIcon className="w-4 h-4" />;
    } else {
      return <Store className="w-4 h-4" />;
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "";
    
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  };

  // Menambahkan fungsi untuk mengarahkan ke halaman detail saldo dompet
  const handleTotalBalanceClick = () => {
    navigate('/wallet-detail');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 animate-gradient-x"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/40 to-transparent"></div>

        <main className="container mx-auto px-4 pb-32 pt-2 relative z-10">
          <Header />
          <TutorialNotification />

          {/* Modern Floating Action Buttons - tetap floating di bawah, z-index tinggi */}
          {/* ...existing code... */}

          {/* Hero Balance Section */}
          {wallets.length > 0 && (
            <section className="mb-8">
              <div 
                onClick={handleTotalBalanceClick}
                className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 shadow-2xl cursor-pointer hover:shadow-3xl transition-all duration-300 group"
              >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/30 to-pink-400/30 rounded-full -translate-y-16 translate-x-16 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/30 to-cyan-400/30 rounded-full translate-y-12 -translate-x-12 animate-pulse"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <CircleDollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-white/90 text-sm font-medium">Total Saldo</p>
                        <p className="text-white/70 text-xs">{wallets.length} Dompet Aktif</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/60 group-hover:text-white/90 transition-colors" />
                  </div>
                  
                  <div className="text-white">
                    <p className="text-3xl font-bold tracking-tight">
                      {formatCurrency(
                        wallets.reduce((total, wallet) => total + wallet.balance, 0)
                      )}
                    </p>
                    <p className="text-white/80 text-sm mt-1">Dalam {wallets.length} dompet berbeda</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Wallet Section */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <WalletIcon className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Dompet & Rekening
                </h2>
              </div>
              <Button
                size="sm"
                onClick={handleAddWallet}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 rounded-xl px-4 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="w-4 h-4 mr-1" />
                Tambah
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">{wallets.length === 0 ? (
                <div className="col-span-full">
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg border border-white/30">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <WalletIcon className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada dompet</h3>
                    <p className="text-gray-500 mb-4">Mulai dengan menambahkan dompet pertama Anda</p>
                    <Button
                      onClick={handleAddWallet}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 rounded-xl px-6 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200">
                      <Plus className="w-4 h-4 mr-2" /> Tambah Dompet Pertama
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {wallets.map((wallet) => (
                    <WalletCard
                      key={wallet.id}
                      wallet={wallet}
                      onEdit={handleEditWallet}
                      onDelete={async (id) => {
                        try {
                          const { error } = await supabase
                            .from("wallets")
                            .delete()
                            .eq("id", id);

                          if (error) throw error;

                          toast({
                            title: "Dompet berhasil dihapus",
                            description:
                              "Data dompet telah dihapus dari sistem",
                          });

                          fetchData();
                        } catch (error) {
                          console.error("Error deleting wallet:", error);
                          toast({
                            variant: "destructive",
                            title: "Gagal menghapus dompet",
                            description:
                              "Terjadi kesalahan saat menghapus dompet",
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

          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Budget Card Section */}
            {settings.show_budgeting && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold">A</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Anggaran</h3>
                        <p className="text-white/80 text-sm">Kelola pengeluaran</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 p-2 rounded-lg"
                      onClick={() => navigate("/budgets")}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  {budgets && budgets.length > 0 ? (
                    <BudgetCard budgets={budgets.slice(0, 2)} />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-3">Belum ada anggaran</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-green-200 text-green-600 hover:bg-green-50"
                        onClick={() => navigate("/budgets")}>
                        <Plus className="w-4 h-4 mr-1" /> Tambah Anggaran
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Savings Card Section */}
            {settings.show_savings && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <PiggyBank className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Tabungan</h3>
                        <p className="text-white/80 text-sm">Target & progres</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 p-2 rounded-lg"
                      onClick={() => navigate("/savings")}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  {savings && savings.length > 0 ? (
                    <SavingsCard savings={savings} />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-3">Belum ada target tabungan</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-amber-200 text-amber-600 hover:bg-amber-50"
                        onClick={() => navigate("/savings")}>
                        <Plus className="w-4 h-4 mr-1" /> Tambah Target
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loans Card Section */}
            {settings.show_loans && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold">H</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Hutang & Piutang</h3>
                        <p className="text-white/80 text-sm">Kelola kewajiban</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 p-2 rounded-lg"
                      onClick={() => navigate("/loans")}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  {loans && loans.length > 0 ? (
                    <LoansCard
                      loans={loans}
                      loading={isLoading}
                      onViewAll={() => navigate("/loans")}
                    />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-3">Belum ada hutang atau piutang</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={() => navigate("/loans")}>
                        <Plus className="w-4 h-4 mr-1" /> Tambah Data
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Statistics Section */}
          <section className="mb-20">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-900 to-gray-700 p-6">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <BarChart2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Statistik Teratas</h3>
                      <p className="text-white/80 text-sm">Analisis aktivitas keuangan Anda</p>
                    </div>
                  </div>
                  <Select
                    defaultValue="expenses"
                    onValueChange={(value) => loadTopStatistics(value)}
                  >
                    <SelectTrigger className="w-[200px] h-10 bg-white/10 border-white/20 text-white rounded-lg">
                      <SelectValue placeholder="Pilih statistik" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expenses">Pengeluaran Terbesar</SelectItem>
                      <SelectItem value="income">Pemasukan Terbesar</SelectItem>
                      <SelectItem value="wallets">Dompet Paling Sering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="p-6">
                {isLoadingStats ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <p className="text-gray-500">Memuat statistik...</p>
                    </div>
                  </div>
                ) : currentStats.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Data</h3>
                    <p className="text-gray-500">Statistik akan muncul setelah Anda melakukan transaksi</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-6">
                      {currentStatType === "expenses" && <ArrowUpRight className="w-5 h-5 text-red-500" />}
                      {currentStatType === "income" && <ArrowDownRight className="w-5 h-5 text-green-500" />}
                      {currentStatType === "wallets" && <WalletIcon className="w-5 h-5 text-blue-500" />}
                      <h4 className="text-lg font-semibold text-gray-800">
                        {currentStatType === "expenses" && "5 Pengeluaran Terbesar"}
                        {currentStatType === "income" && "5 Pemasukan Terbesar"}
                        {currentStatType === "wallets" && "5 Dompet Paling Sering Digunakan"}
                      </h4>
                    </div>
                    
                    <div className="grid gap-3">
                      {currentStats.map((item, index) => {
                        // Ambil data wallet
                        const wallet = wallets.find(w => w.id === item.id || w.id === item.wallet_id);
                        return (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all duration-200 group"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {/* Logo dompet */}
                              <div className="relative">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
                                  style={{ 
                                    background: currentStatType === 'wallets' && wallet?.color ? wallet.color : `linear-gradient(135deg, ${getStatItemColor(item, currentStatType)}, ${getStatItemColor(item, currentStatType)}cc)`, 
                                    color: 'white' 
                                  }}>
                                  {wallet?.logo_url && currentStatType === 'wallets' ? (
                                    <img src={wallet.logo_url} alt={wallet.name} className="w-8 h-8 object-contain rounded-lg" />
                                  ) : (
                                    getStatItemIcon(item, currentStatType)
                                  )}
                                </div>
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900 truncate text-lg">
                                  {item.name || item.title || item.category || "Tidak ada nama"}
                                </p>
                                {item.date && (
                                  <p className="text-sm text-gray-500 mt-1">{formatDate(item.date)}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                "font-bold text-lg whitespace-nowrap",
                                currentStatType === 'expenses' ? "text-red-600" : 
                                currentStatType === 'income' ? "text-green-600" :
                                currentStatType === 'wallets' ? "text-blue-600" : "text-gray-900"
                              )}>
                                {item.amount 
                                  ? formatCurrency(item.amount) 
                                  : <>
                                      <span>{item.count || 0}</span>
                                      <span className="text-sm text-gray-500 ml-1">transaksi</span>
                                    </>
                                }
                              </p>
                              {item.percentage && (
                                <p className="text-sm text-gray-500 mt-1">{item.percentage}% dari total</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>

          {/* Modern Floating Action Buttons - floating fixed di bawah, z-index lebih tinggi dari nav */}
          <div className="fixed bottom-24 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-3 flex gap-3 border border-white/20 pointer-events-auto">
              <Button
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white w-12 h-12 sm:w-auto sm:px-6 sm:py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-0"
                onClick={() => navigate("/transaction/income")}
                aria-label="Tambah Pemasukan">
                <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Pemasukan</span>
              </Button>
              <Button
                className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white w-12 h-12 sm:w-auto sm:px-6 sm:py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-0"
                onClick={() => navigate("/transaction/expense")}
                aria-label="Tambah Pengeluaran">
                <Minus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Pengeluaran</span>
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white w-12 h-12 sm:w-auto sm:px-6 sm:py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-0"
                onClick={() => navigate("/transaction/transfer")}
                aria-label="Tambah Transfer">
                <ArrowRight className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Transfer</span>
              </Button>
            </div>
          </div>
      </div>
    </Layout>
  );
};

export default Index;
