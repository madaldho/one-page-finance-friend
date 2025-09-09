import React, { useState, useEffect, FormEvent } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Plus, Info, Calendar, PiggyBank, Trash, ChevronDown, ChevronUp, History, Edit, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Wallet, Saving } from "@/types";
import { format, parseISO } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { CurrencyInput } from "@/components/ui/currency-input";

// Definisikan interface untuk transaksi tabungan
interface SavingTransaction {
  id: string;
  savings_id: string;
  wallet_id: string;
  amount: number;
  type: 'deposit' | 'withdraw';
  date: string;
  notes?: string;
  user_id: string;
  created_at: string;
  wallet?: Wallet;
}

const SavingsManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [savings, setSavings] = useState<Saving[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
  const [featureEnabled, setFeatureEnabled] = useState(true);
  const [expandedSavingId, setExpandedSavingId] = useState<string | null>(null);
  const [depositData, setDepositData] = useState({
    date: new Date().toISOString().split('T')[0],
    wallet_id: "",
    amount: "",
    notes: ""
  });
  const [depositLoading, setDepositLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawData, setWithdrawData] = useState({
    date: new Date().toISOString().split('T')[0],
    wallet_id: "",
    amount: "",
    notes: ""
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [transactions, setTransactions] = useState<SavingTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchCategories();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch savings
      const { data: savingsData, error: savingsError } = await supabase
        .from("savings")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (savingsError) throw savingsError;
      setSavings(savingsData as Saving[]);

      // Fetch wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user?.id);

      if (walletsError) throw walletsError;
      setWallets(walletsData as any);

    } catch (error: any) {
      console.error("Error fetching savings data:", error.message);
      toast({
        title: "Gagal memuat data",
        description: "Terjadi kesalahan saat mengambil data tabungan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'transfer') // Kategori bertipe transfer untuk tabungan
        .or('name.ilike.%tabungan%,name.ilike.%saving%');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: unknown) {
      console.error('Error fetching categories:', error);
    }
  };

  const calculateProgress = (saving: Saving) => {
    return (saving.current_amount / saving.target_amount) * 100;
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Tidak ada target";
    try {
      return format(parseISO(dateString), "dd/MM/yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const handleToggleFeature = async () => {
    const newValue = !featureEnabled;
    setFeatureEnabled(newValue);
    
    try {
      const { error } = await supabase
        .from("user_settings")
        .update({ show_savings: newValue })
        .eq("user_id", user?.id);

      if (error) throw error;
      
      toast({
        title: `Fitur Tabungan ${newValue ? "Diaktifkan" : "Dinonaktifkan"}`,
        description: newValue ? 
          "Fitur tabungan sekarang aktif di halaman utama" : 
          "Fitur tabungan tidak akan ditampilkan di halaman utama",
      });
    } catch (error: any) {
      console.error("Error updating settings:", error);
      setFeatureEnabled(!newValue); // Revert state on error
      toast({
        title: "Gagal Mengubah Pengaturan",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSavingClick = (saving: Saving) => {
    if (expandedSavingId === saving.id) {
      setExpandedSavingId(null);
    } else {
      setExpandedSavingId(saving.id);
    }
    setSelectedSaving(saving);
  };

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDepositData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWithdrawChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setWithdrawData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDepositSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedSaving) return;
    
    // Validasi input
    if (!depositData.wallet_id) {
      toast({
        title: "Pilih Dompet",
        description: "Pilih dompet sumber untuk setoran",
        variant: "destructive",
      });
      return;
    }
    
    // Konversi amount ke number dengan 2 digit presisi
    let amount = 0;
    try {
      amount = parseFloat(parseFloat(depositData.amount).toFixed(2));
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");
    } catch (err) {
      toast({
        title: "Jumlah Tidak Valid",
        description: "Masukkan jumlah setoran yang valid",
        variant: "destructive",
      });
      return;
    }
    
    // Cek apakah dompet memiliki saldo cukup
    const sourceWallet = wallets.find(w => w.id === depositData.wallet_id);
    if (!sourceWallet) {
      toast({
        title: "Dompet Tidak Ditemukan",
        description: "Dompet sumber tidak valid",
        variant: "destructive",
      });
      return;
    }
    
    if (sourceWallet.balance < amount) {
      toast({
        title: "Saldo Tidak Cukup",
        description: "Saldo dompet tidak mencukupi untuk melakukan setoran",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setDepositLoading(true);
      
      // Temukan kategori tabungan untuk transaksi
      const savingsCategory = categories.find(cat => 
        cat.name.toLowerCase().includes('tabungan') || 
        cat.name.toLowerCase().includes('saving')
      );
      
      const now = new Date().toISOString();
      
      // 1. Kurangi saldo dompet sumber dengan presisi
      const newWalletBalance = parseFloat((sourceWallet.balance - amount).toFixed(2));
      const { error: walletError } = await supabase
        .from("wallets")
        .update({ balance: newWalletBalance })
        .eq("id", depositData.wallet_id);
        
      if (walletError) throw walletError;
      
      // 2. Tambah jumlah tabungan dengan presisi
      const newAmount = parseFloat((selectedSaving.current_amount + amount).toFixed(2));
      const { error: savingError } = await supabase
        .from("savings")
        .update({ current_amount: newAmount })
        .eq("id", selectedSaving.id);
        
      if (savingError) throw savingError;
      
      // 3. Catat transaksi setoran di tabel savings_transactions
      const savingsTransactionData = {
        user_id: user?.id,
        savings_id: selectedSaving.id,
        wallet_id: depositData.wallet_id,
        amount: amount,
        type: "deposit",
        date: depositData.date,
        notes: depositData.notes || null,
        created_at: now,
        updated_at: now
      };
      
      console.log("Saving to savings_transactions:", savingsTransactionData);
      
      const { error: savingsTransactionError } = await supabase
        .from("savings_transactions")
        .insert([savingsTransactionData]);
        
      if (savingsTransactionError) {
        console.error("Error inserting savings transaction:", savingsTransactionError);
        throw savingsTransactionError;
      }
      
      // 4. Catat transaksi di tabel transactions untuk ditampilkan di histori wallet
      const transactionData = {
        user_id: user?.id,
        title: `Setor ke Tabungan: ${selectedSaving.name}`,
        amount: amount,
        type: "expense", // Pengeluaran dari perspektif wallet
        category: savingsCategory?.id || "7f1b", // ID kategori "Tabungan" atau default "7f1b"
        date: depositData.date,
        created_at: now,
        updated_at: now,
        description: depositData.notes || `Setoran ke tabungan ${selectedSaving.name}`,
        wallet_id: depositData.wallet_id,
        destination_wallet_id: null,
        fee: 0
      };

      console.log("Saving to transactions:", transactionData);
      
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert([transactionData]);
      
      if (transactionError) {
        console.error("Error inserting transaction:", transactionError);
        throw transactionError;
      }
      
      toast({
        title: "Setoran Berhasil",
        description: `Berhasil menyetor ${formatCurrency(amount)} ke tabungan ${selectedSaving.name}`,
      });
      
      // Reset form dan tutup dialog
      setDepositData({
        date: new Date().toISOString().split('T')[0],
        wallet_id: "",
        amount: "",
        notes: ""
      });
      setDepositOpen(false);
      
      // Refresh data
      fetchData();
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat memproses setoran";
      console.error("Error depositing to savings:", errorMessage);
      toast({
        title: "Gagal Melakukan Setoran",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedSaving) {
      toast({
        title: "Terjadi Kesalahan",
        description: "Tidak ada tabungan yang dipilih",
        variant: "destructive",
      });
      return;
    }
    
    if (!withdrawData.wallet_id) {
      toast({
        title: "Dompet Diperlukan",
        description: "Pilih dompet tujuan untuk penarikan",
        variant: "destructive",
      });
      return;
    }
    
    // Konversi amount ke number dengan 2 digit presisi
    let amount = 0;
    try {
      amount = parseFloat(parseFloat(withdrawData.amount).toFixed(2));
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");
    } catch (err) {
      toast({
        title: "Jumlah Tidak Valid",
        description: "Masukkan jumlah penarikan yang valid",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > selectedSaving.current_amount) {
      toast({
        title: "Saldo Tidak Cukup",
        description: "Jumlah penarikan melebihi saldo tabungan",
        variant: "destructive",
      });
      return;
    }
    
    // Temukan dompet tujuan
    const targetWallet = wallets.find(w => w.id === withdrawData.wallet_id);
    if (!targetWallet) {
      toast({
        title: "Dompet Tidak Ditemukan",
        description: "Dompet tujuan tidak valid",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setWithdrawLoading(true);
      
      // Temukan kategori tabungan untuk transaksi
      const savingsCategory = categories.find(cat => 
        cat.name.toLowerCase().includes('tabungan') || 
        cat.name.toLowerCase().includes('saving')
      );
      
      const now = new Date().toISOString();
      
      // 1. Tambah saldo dompet tujuan dengan presisi
      const newWalletBalance = parseFloat((targetWallet.balance + amount).toFixed(2));
      const { error: walletError } = await supabase
        .from("wallets")
        .update({ balance: newWalletBalance })
        .eq("id", withdrawData.wallet_id);
        
      if (walletError) throw walletError;
      
      // 2. Kurangi jumlah tabungan dengan presisi
      const newAmount = parseFloat((selectedSaving.current_amount - amount).toFixed(2));
      const { error: savingError } = await supabase
        .from("savings")
        .update({ current_amount: newAmount })
        .eq("id", selectedSaving.id);
        
      if (savingError) throw savingError;
      
      // 3. Catat transaksi penarikan di tabel savings_transactions
      const savingsTransactionData = {
        user_id: user?.id,
        savings_id: selectedSaving.id,
        wallet_id: withdrawData.wallet_id,
        amount: amount,
        type: "withdraw",
        date: withdrawData.date,
        notes: withdrawData.notes || null,
        created_at: now,
        updated_at: now
      };
      
      console.log("Saving to savings_transactions:", savingsTransactionData);
      
      const { error: savingsTransactionError } = await supabase
        .from("savings_transactions")
        .insert([savingsTransactionData]);
        
      if (savingsTransactionError) {
        console.error("Error inserting withdrawal transaction:", savingsTransactionError);
        throw savingsTransactionError;
      }
      
      // 4. Catat transaksi di tabel transactions untuk ditampilkan di histori wallet
      const transactionData = {
        user_id: user?.id,
        title: `Tarik dari Tabungan: ${selectedSaving.name}`,
        amount: amount,
        type: "income", // Pemasukan dari perspektif wallet
        category: savingsCategory?.id || "7f1b", // ID kategori "Tabungan" atau default "7f1b"
        date: withdrawData.date,
        created_at: now,
        updated_at: now,
        description: withdrawData.notes || `Penarikan dari tabungan ${selectedSaving.name}`,
        wallet_id: withdrawData.wallet_id,
        destination_wallet_id: null,
        fee: 0
      };

      console.log("Saving to transactions:", transactionData);
      
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert([transactionData]);
      
      if (transactionError) {
        console.error("Error inserting transaction:", transactionError);
        throw transactionError;
      }
      
      toast({
        title: "Penarikan Berhasil",
        description: `Berhasil menarik ${formatCurrency(amount)} dari tabungan ${selectedSaving.name}`,
      });
      
      // Reset form dan tutup dialog
      setWithdrawData({
        date: new Date().toISOString().split('T')[0],
        wallet_id: "",
        amount: "",
        notes: ""
      });
      setWithdrawOpen(false);
      
      // Refresh data
      fetchData();
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat memproses penarikan";
      console.error("Error withdrawing from savings:", errorMessage);
      toast({
        title: "Gagal Melakukan Penarikan",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  const handleDeleteSaving = async () => {
    if (!selectedSaving) return;
    
    try {
      // Cek apakah tabungan masih memiliki saldo
      if (selectedSaving.current_amount > 0) {
        toast({
          title: "Tidak Dapat Menghapus",
          description: "Tabungan masih memiliki saldo. Tarik seluruh dana terlebih dahulu.",
          variant: "destructive",
        });
        setDeleteDialogOpen(false);
        return;
      }
      
      // Hapus semua transaksi tabungan terlebih dahulu
      const { error: transactionsError } = await supabase
        .from("savings_transactions")
        .delete()
        .eq("savings_id", selectedSaving.id);
      
      if (transactionsError) throw transactionsError;
      
      // Hapus tabungan
      const { error } = await supabase
        .from("savings")
        .delete()
        .eq("id", selectedSaving.id);
        
      if (error) throw error;
      
      toast({
        title: "Tabungan Dihapus",
        description: `Tabungan ${selectedSaving.name} berhasil dihapus`,
      });
      
      setDeleteDialogOpen(false);
      fetchData();
      
    } catch (error: any) {
      console.error("Error deleting saving:", error.message);
      toast({
        title: "Gagal Menghapus Tabungan",
        description: error.message || "Terjadi kesalahan saat menghapus tabungan",
        variant: "destructive",
      });
    }
  };

  const fetchSavingTransactions = async (savingId: string) => {
    if (!savingId) return;
    
    try {
      setLoadingTransactions(true);
      
      const { data, error } = await supabase
        .from("savings_transactions")
        .select(`
          *,
          wallet:wallet_id (
            id,
            name,
            type
          )
        `)
        .eq("savings_id", savingId)
        .order("date", { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setTransactions(data as any);
      } else {
        setTransactions([]);
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil data riwayat transaksi";
      console.error("Error fetching transactions:", errorMessage);
      toast({
        title: "Gagal Memuat Transaksi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingTransactions(false);
    }
  };
  
  const handleViewHistory = (saving: Saving) => {
    setSelectedSaving(saving);
    fetchSavingTransactions(saving.id);
    setHistoryOpen(true);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-300 to-red-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
        </div>

        <div className="container mx-auto py-2 px-2 md:px-6 max-w-4xl lg:max-w-5xl relative z-10 pt-6 md:pt-4 pb-32">
          {/* Header dengan glassmorphism effect */}
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
            <div className="flex items-center gap-3">
              <Link 
                to="/settings"
                className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md border border-white/30"
                aria-label="Kembali"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Tabungan & Celengan</h1>
                <p className="text-xs text-gray-500">Kelola target tabungan dan wujudkan impian finansial Anda</p>
              </div>
            </div>
          </div>

          {/* Layout Grid untuk Desktop dan Mobile */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Column - Feature Toggle & Summary */}
            <div className="lg:col-span-5 space-y-6">
              {/* Feature Toggle Section */}
              <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-lg">Fitur Tabungan</h2>
                      <p className="text-white/80 text-sm">
                        {featureEnabled ? "Aktif - Tabungan sedang berjalan" : "Nonaktif - Fitur tidak digunakan"}
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-xl">
                      <Switch 
                        checked={featureEnabled} 
                        onCheckedChange={handleToggleFeature}
                        className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg mt-0.5">
                      <Info className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Atur target tabungan dan alokasikan persentase dari pemasukan Anda secara otomatis untuk mencapai target finansial.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Statistics */}
              {savings.length > 0 && (
                <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20">
                  <div className="p-6">
                    <h3 className="font-semibold text-lg text-gray-800 mb-4">Ringkasan Tabungan</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                        <p className="text-xs text-green-600 mb-1">Total Target</p>
                        <p className="font-bold text-lg text-green-800">
                          Rp {savings.reduce((sum, s) => sum + s.target_amount, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-600 mb-1">Total Terkumpul</p>
                        <p className="font-bold text-lg text-blue-800">
                          Rp {savings.reduce((sum, s) => sum + s.current_amount, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-100">
                        <p className="text-xs text-amber-600 mb-1">Rata-rata Progress</p>
                        <p className="font-bold text-lg text-amber-800">
                          {Math.round(savings.reduce((sum, s) => sum + calculateProgress(s), 0) / savings.length)}%
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
                        <p className="text-xs text-purple-600 mb-1">Target Aktif</p>
                        <p className="font-bold text-lg text-purple-800">{savings.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Savings Targets */}
            <div className="lg:col-span-7">
              {/* Savings Targets Section */}
              <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-lg">Target Tabungan Anda</h2>
                      <p className="text-white/80 text-sm">Pantau progres menuju tujuan finansial</p>
                    </div>
                    <Button 
                      variant="default" 
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/20"
                      asChild
                    >
                      <Link to="/savings/add">
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Tambah Target</span>
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-base font-medium text-gray-700">Memuat data tabungan...</p>
                    </div>
                  ) : savings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <PiggyBank className="h-10 w-10 text-amber-600" />
                      </div>
                      <h3 className="font-semibold text-xl mb-3 text-gray-800">Belum ada target tabungan</h3>
                      <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed">
                        Mulai perjalanan finansial Anda dengan menetapkan target tabungan pertama
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        asChild
                      >
                        <Link to="/savings/add">
                          <Plus className="h-5 w-5 mr-2" />
                          Buat Target Pertama
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {savings.map((saving) => {
                        const progress = calculateProgress(saving);
                        const isExpanded = expandedSavingId === saving.id;
                        
                        return (
                          <div 
                            key={saving.id} 
                            className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-200"
                          >
                            <div 
                              className="p-5 cursor-pointer"
                              onClick={() => handleSavingClick(saving)}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    saving.savings_category === "fisik" 
                                      ? "bg-gradient-to-br from-green-100 to-emerald-100" 
                                      : "bg-gradient-to-br from-blue-100 to-cyan-100"
                                  }`}>
                                    <PiggyBank className={`h-6 w-6 ${
                                      saving.savings_category === "fisik" ? "text-green-600" : "text-blue-600"
                                    }`} />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-lg text-gray-800">{saving.name}</h3>
                                    <p className="text-sm text-gray-500">
                                      {saving.savings_category === "fisik" ? "Tabungan Fisik" : "Tabungan Digital"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    progress >= 100 ? "bg-green-100 text-green-700" :
                                    progress >= 50 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                  }`}>
                                    {Math.round(progress)}%
                                  </div>
                                  <button 
                                    className={`text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all duration-200 ${isExpanded ? 'bg-gray-100 text-gray-600' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSavingClick(saving);
                                    }}
                                    aria-label={isExpanded ? "Tutup detail tabungan" : "Lihat detail tabungan"}
                                  >
                                    {isExpanded ? 
                                      <ChevronUp className="h-5 w-5" /> : 
                                      <ChevronDown className="h-5 w-5" />
                                    }
                                  </button>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600 font-medium">Terkumpul: {formatCurrency(saving.current_amount)}</span>
                                  <span className="font-semibold text-gray-800">Target: {formatCurrency(saving.target_amount)}</span>
                                </div>
                                
                                <Progress
                                  value={progress}
                                  className="h-3 bg-gray-200"
                                  indicatorClassName={
                                    progress >= 100 ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                                    progress >= 50 ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-blue-500 to-cyan-500"
                                  }
                                />
                                
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Target: {formatDate(saving.target_date)}</span>
                                  </div>
                                  <span className="font-medium">
                                    Sisa: {formatCurrency(saving.target_amount - saving.current_amount)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="bg-gradient-to-br from-gray-50 to-white px-5 py-4 border-t border-gray-100">
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-10 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/savings/withdraw/${saving.id}`);
                                    }}
                                  >
                                    <LogOut className="h-4 w-4 mr-2" /> Tarik Dana
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="h-10 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/savings/deposit/${saving.id}`);
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" /> Setor Dana
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-9 text-xs border-gray-200 hover:bg-gray-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewHistory(saving);
                                    }}
                                  >
                                    <History className="h-3.5 w-3.5 mr-1.5" /> Riwayat
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-9 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/savings/edit/${saving.id}`);
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-9 text-xs border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSaving(saving);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash className="h-3.5 w-3.5 mr-1.5" /> Hapus
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 mt-6">
            <div className="p-6">
              <h2 className="font-semibold text-lg mb-4 text-gray-800">Cara Kerja Tabungan</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-amber-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <strong>Buat Target:</strong> Tentukan nama, jumlah target, dan tanggal yang ingin dicapai
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-amber-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <strong>Setor Rutin:</strong> Lakukan setoran secara berkala dari dompet yang Anda pilih
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-amber-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <strong>Pantau Progress:</strong> Lihat kemajuan tabungan dan sisa waktu untuk mencapai target
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dialogs */}
        {/* Deposit Dialog */}

        {/* Deposit Dialog */}
        <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Setor ke Tabungan</DialogTitle>
            </DialogHeader>
            <div className="p-4 bg-amber-50 rounded-lg mb-4">
              <h3 className="font-medium">{selectedSaving?.name}</h3>
              <p className="text-sm">Saldo saat ini: {selectedSaving ? formatCurrency(selectedSaving.current_amount) : "Rp 0"}</p>
              <p className="text-sm">Jenis: {selectedSaving?.savings_category === "fisik" ? "Fisik (Cash)" : "Digital (Saldo)"}</p>
            </div>
            <form className="space-y-4" onSubmit={handleDepositSubmit}>
              <div>
                <label htmlFor="deposit-date" className="block text-sm font-medium mb-1">Tanggal*</label>
                <input 
                  type="date" 
                  id="deposit-date"
                  className="w-full rounded-md border border-gray-300 p-2"
                  name="date"
                  value={depositData.date}
                  onChange={handleDepositChange}
                  aria-label="Tanggal setoran"
                  required
                />
              </div>
              <div>
                <label htmlFor="deposit-wallet" className="block text-sm font-medium mb-1">Dompet Sumber (Hanya Cash)*</label>
                <select 
                  id="deposit-wallet"
                  className="w-full rounded-md border border-gray-300 p-2" 
                  name="wallet_id"
                  value={depositData.wallet_id}
                  onChange={handleDepositChange}
                  aria-label="Pilih dompet sumber"
                  required
                >
                  <option value="">Pilih dompet cash</option>
                  {wallets.filter(w => w.type === "cash").map(wallet => (
                    <option key={wallet.id} value={wallet.id}>{wallet.name} - {formatCurrency(wallet.balance)}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Untuk tabungan fisik, Anda hanya dapat menggunakan dompet cash sebagai sumber
                </p>
              </div>
              <div>
                <label htmlFor="deposit-amount" className="block text-sm font-medium mb-1">Jumlah Setoran*</label>
                <input 
                  type="text"
                  id="deposit-amount"
                  placeholder="100000" 
                  className="w-full rounded-md border border-gray-300 p-2"
                  name="amount"
                  value={depositData.amount}
                  onChange={handleDepositChange}
                  aria-label="Jumlah setoran"
                  required
                />
              </div>
              <div>
                <label htmlFor="deposit-notes" className="block text-sm font-medium mb-1">Catatan (Opsional)</label>
                <textarea 
                  id="deposit-notes"
                  className="w-full rounded-md border border-gray-300 p-2"
                  placeholder="Tambahkan catatan tentang setoran ini"
                  rows={3}
                  name="notes"
                  value={depositData.notes}
                  onChange={handleDepositChange}
                  aria-label="Catatan setoran"
                />
              </div>
              <div className="flex flex-col space-y-2 pt-4">
                <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600" disabled={depositLoading} aria-label="Tombol setor">
                  {depositLoading ? "Memproses..." : "Setor"}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => setDepositOpen(false)} disabled={depositLoading} aria-label="Tombol tutup">Tutup</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Withdraw Dialog */}
        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tarik dari Tabungan</DialogTitle>
            </DialogHeader>
            <div className="p-4 bg-blue-50 rounded-lg mb-4">
              <h3 className="font-medium">{selectedSaving?.name}</h3>
              <p className="text-sm">Saldo saat ini: {selectedSaving ? formatCurrency(selectedSaving.current_amount) : "Rp 0"}</p>
              <p className="text-sm">Jenis: {selectedSaving?.savings_category === "fisik" ? "Fisik (Cash)" : "Digital (Saldo)"}</p>
            </div>
            <form className="space-y-4" onSubmit={handleWithdrawSubmit}>
              <div>
                <label htmlFor="withdraw-date" className="block text-sm font-medium mb-1">Tanggal*</label>
                <input 
                  id="withdraw-date"
                  type="date" 
                  className="w-full rounded-md border border-gray-300 p-2"
                  name="date"
                  value={withdrawData.date}
                  onChange={handleWithdrawChange}
                  required
                  aria-label="Tanggal penarikan"
                />
              </div>
              <div>
                <label htmlFor="withdraw-wallet" className="block text-sm font-medium mb-1">Dompet Tujuan*</label>
                <select
                  id="withdraw-wallet"
                  className="w-full rounded-md border border-gray-300 p-2"
                  name="wallet_id"
                  value={withdrawData.wallet_id}
                  onChange={handleWithdrawChange}
                  title="Pilih dompet tujuan"
                  aria-label="Pilih dompet tujuan"
                  required
                >
                  <option value="">Pilih dompet</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name} - {formatCurrency(wallet.balance)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="withdraw-amount" className="block text-sm font-medium mb-1">Jumlah Penarikan*</label>
                <CurrencyInput
                  id="withdraw-amount"
                  showPrefix={true}
                  placeholder="100000" 
                  value={Number(withdrawData.amount)}
                  onChange={(value) => setWithdrawData({...withdrawData, amount: value.toString()})}
                  disabled={withdrawLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maksimal penarikan: {selectedSaving ? formatCurrency(selectedSaving.current_amount) : "Rp 0"}
                </p>
              </div>
              <div>
                <label htmlFor="withdraw-notes" className="block text-sm font-medium mb-1">Catatan (Opsional)</label>
                <textarea 
                  id="withdraw-notes"
                  className="w-full rounded-md border border-gray-300 p-2"
                  placeholder="Tambahkan catatan tentang penarikan ini"
                  name="notes"
                  value={withdrawData.notes}
                  onChange={handleWithdrawChange}
                  rows={3}
                  aria-label="Catatan penarikan"
                />
              </div>
              <div className="flex flex-col space-y-2 pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={withdrawLoading} 
                  aria-label="Tarik dana dari tabungan"
                  title="Tarik Dana"
                >
                  {withdrawLoading ? "Memproses..." : "Tarik Dana"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setWithdrawOpen(false)}
                  disabled={withdrawLoading}
                >
                  Tutup
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteSaving}
          title="Hapus Tabungan"
          description={`Apakah Anda yakin ingin menghapus tabungan "${selectedSaving?.name}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Hapus"
          cancelLabel="Batal"
        />
        
        {/* Transaction History Dialog */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Riwayat Transaksi</DialogTitle>
            </DialogHeader>
            
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <h3 className="font-medium">{selectedSaving?.name}</h3>
              <p className="text-sm">Saldo saat ini: {selectedSaving ? formatCurrency(selectedSaving.current_amount) : "Rp 0"}</p>
            </div>
            
            {loadingTransactions ? (
              <div className="text-center py-4">
                <p>Memuat riwayat transaksi...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-4">
                <p>Belum ada transaksi untuk tabungan ini</p>
              </div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="border-b py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {transaction.type === 'deposit' ? 'Setoran' : 'Penarikan'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.date ? format(parseISO(transaction.date), "dd MMM yyyy") : "-"}
                        </p>
                      </div>
                      <div className={`text-right ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                        <p className="font-medium">
                          {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.wallet?.name || 'Dompet tidak diketahui'}
                        </p>
                      </div>
                    </div>
                    {transaction.notes && (
                      <p className="text-sm text-gray-600 mt-1">
                        Catatan: {transaction.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setHistoryOpen(false)}
                title="Tutup dialog"
                aria-label="Tutup dialog"
              >
                Tutup
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SavingsManagement;
