import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Plus, Info, Calendar, CreditCard, FileText, Edit, Trash } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loan, Wallet } from "@/types";
import { format, parseISO } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

const LoansManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  const [featureEnabled, setFeatureEnabled] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentWallet, setPaymentWallet] = useState("");
  const [markPaid, setMarkPaid] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loanToEdit, setLoanToEdit] = useState<Loan | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch loans
      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", user?.id);

      if (loansError) throw loansError;
      setLoans(loansData as unknown as Loan[]);

      // Fetch wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user?.id);

      if (walletsError) throw walletsError;
      setWallets(walletsData as Wallet[]);

      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("show_loans")
        .eq("user_id", user?.id)
        .single();

      if (!settingsError && settingsData) {
        setFeatureEnabled(settingsData.show_loans);
      }

    } catch (error) {
      console.error("Error fetching loans data:", error instanceof Error ? error.message : String(error));
      toast({
        title: "Gagal memuat data",
        description: "Terjadi kesalahan saat mengambil data hutang dan piutang",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async () => {
    const newValue = !featureEnabled;
    setFeatureEnabled(newValue);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Tidak Terautentikasi",
          description: "Silakan login untuk mengubah pengaturan",
          variant: "destructive"
        });
        setFeatureEnabled(!newValue); // Revert on error
        return;
      }
      
      const { error } = await supabase
        .from("user_settings")
        .update({ show_loans: newValue })
        .eq("user_id", user?.id);

      if (error) throw error;
      
      toast({
        title: `Fitur Hutang & Piutang ${newValue ? "Diaktifkan" : "Dinonaktifkan"}`,
        description: newValue ? 
          "Fitur hutang dan piutang sekarang aktif di halaman utama" : 
          "Fitur hutang dan piutang tidak akan ditampilkan di halaman utama",
      });
    } catch (error) {
      console.error("Error updating settings:", error instanceof Error ? error.message : String(error));
      setFeatureEnabled(!newValue); // Revert state on error
      toast({
        title: "Gagal Mengubah Pengaturan",
        description: (error instanceof Error ? error.message : String(error)) || "Terjadi kesalahan saat mengubah pengaturan",
        variant: "destructive",
      });
      fetchData();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(parseISO(dateString), "dd/MM/yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Filter loans based on selected tab
  const filteredLoans = () => {
    switch (selectedTab) {
      case "unpaid":
        return loans.filter(loan => loan.status === "unpaid");
      case "overdue":
        return loans.filter(loan => {
          const dueDate = new Date(loan.due_date);
          const today = new Date();
          return loan.status !== "paid" && dueDate < today;
        });
      case "paid":
        return loans.filter(loan => loan.status === "paid");
      default:
        return loans;
    }
  };

  // Get total for hutang (debts)
  const totalHutang = loans
    .filter(loan => loan.type === 'payable' && loan.status !== 'paid')
    .reduce((sum, loan) => sum + (loan.amount - (loan.paid_amount || 0)), 0);

  // Get total for piutang (receivables)
  const totalPiutang = loans
    .filter(loan => loan.type === 'receivable' && loan.status !== 'paid')
    .reduce((sum, loan) => sum + (loan.amount - (loan.paid_amount || 0)), 0);

  // Count items by status
  const countHutangItems = loans.filter(loan => loan.type === "payable" && loan.status !== "paid").length;
  const countPiutangItems = loans.filter(loan => loan.type === "receivable" && loan.status !== "paid").length;

  // Count overdue items
  const countHutangOverdue = loans.filter(loan => {
    const dueDate = new Date(loan.due_date);
    const today = new Date();
    return loan.type === "payable" && loan.status !== "paid" && dueDate < today;
  }).length;

  const countPiutangOverdue = loans.filter(loan => {
    const dueDate = new Date(loan.due_date);
    const today = new Date();
    return loan.type === "receivable" && loan.status !== "paid" && dueDate < today;
  }).length;

  const handleOpenPayment = (loan: Loan) => {
    setSelectedLoan(loan);
    setPaymentAmount(String(loan.amount - (loan.paid_amount || 0)));
    setPaymentWallet("");
    setMarkPaid(false);
    setPaymentDialogOpen(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLoan) return;
    
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      toast({
        title: "Jumlah Pembayaran Tidak Valid",
        description: "Masukkan jumlah pembayaran yang valid",
        variant: "destructive",
      });
      return;
    }

    if (!paymentWallet) {
      toast({
        title: "Pilih Sumber Dana",
        description: "Pilih dompet atau rekening untuk pembayaran",
        variant: "destructive",
      });
      return;
    }

    const amount = Number(paymentAmount);
    const maxAmount = selectedLoan.amount - (selectedLoan.paid_amount || 0);
    
    if (amount > maxAmount) {
      toast({
        title: "Jumlah Melebihi Sisa Hutang",
        description: `Maksimal pembayaran adalah ${formatCurrency(maxAmount)}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setPaymentProcessing(true);
      
      // 1. Dapatkan data wallet yang dipilih
      const { data: selectedWalletData, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", paymentWallet)
        .single();
      
      if (walletError) throw walletError;
      
      // 2. Ambil kategori yang sesuai dari database
      // Mencari kategori berdasarkan tipe (income/expense)
      const categoryType = selectedLoan.type === "payable" ? "expense" : "income";
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("type", categoryType)
        .eq("user_id", user?.id)
        .limit(1);
      
      if (categoryError) throw categoryError;
      
      // Jika tidak ditemukan kategori, lempar error
      if (!categoryData || categoryData.length === 0) {
        throw new Error(`Tidak ditemukan kategori dengan tipe ${categoryType}. Buat kategori terlebih dahulu.`);
      }
      
      // Gunakan ID kategori pertama yang ditemukan
      const categoryId = categoryData[0].id;
      
      // 3. Hitung paid_amount baru dan status
      const newPaidAmount = (selectedLoan.paid_amount || 0) + amount;
      const isPaid = newPaidAmount >= selectedLoan.amount;
      const newStatus = isPaid ? "paid" : (newPaidAmount > 0 ? "partial" : "unpaid");
      
      // 4. Update loan data (amount_paid dan status)
      const { error: updateLoanError } = await supabase
        .from("loans")
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedLoan.id);
      
      if (updateLoanError) throw updateLoanError;
      
      // 5. Perbarui saldo wallet
      // - Jika hutang (payable), mengurangi saldo wallet (pengeluaran) karena membayar hutang
      // - Jika piutang (receivable), menambah saldo wallet (pemasukan) karena menerima pembayaran
      const newBalance = selectedLoan.type === "payable"
        ? selectedWalletData.balance - amount
        : selectedWalletData.balance + amount;
      
      const { error: updateWalletError } = await supabase
        .from("wallets")
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq("id", paymentWallet);
      
      if (updateWalletError) throw updateWalletError;
      
      // 6. Catat transaksi di tabel transactions
      const today = new Date();
      const formattedDate = format(today, 'yyyy-MM-dd');
      
      const transactionData = {
        user_id: user?.id,
        title: selectedLoan.type === "payable" 
          ? "Pembayaran Hutang" 
          : "Penerimaan Piutang",
        amount: amount,
        // Hutang = expense (uang keluar), Piutang = income (uang masuk)
        type: selectedLoan.type === "payable" ? "expense" : "income",
        date: formattedDate,
        // Gunakan ID kategori yang sudah diambil dari database
        category: categoryId,
        wallet_id: paymentWallet,
        description: selectedLoan.type === "payable"
          ? `Pembayaran hutang untuk: ${selectedLoan.description} (${selectedLoan.lender || 'Tidak ada nama'})`
          : `Penerimaan piutang dari: ${selectedLoan.description} (${selectedLoan.borrower || 'Tidak ada nama'})`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionData);
      
      if (transactionError) throw transactionError;
      
      // 7. Opsional: Catat payment history
      const paymentData = {
        loan_id: selectedLoan.id,
        user_id: user?.id,
        amount: amount,
        payment_date: formattedDate,
        wallet_id: paymentWallet,
        description: markPaid ? "Pembayaran penuh" : "Pembayaran sebagian",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: paymentHistoryError } = await supabase
        .from("payments")
        .insert(paymentData);
      
      if (paymentHistoryError) {
        console.error("Error recording payment history:", paymentHistoryError);
        // Tidak throw error karena ini opsional
      }
      
      toast({
        title: "Pembayaran Berhasil",
        description: `Pembayaran ${formatCurrency(amount)} untuk ${selectedLoan.description} berhasil`,
      });
      
      setPaymentDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error processing payment:", error instanceof Error ? error.message : String(error));
      toast({
        title: "Gagal Memproses Pembayaran",
        description: (error instanceof Error ? error.message : String(error)) || "Terjadi kesalahan saat memproses pembayaran",
        variant: "destructive",
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLoan) return;
    
    try {
      // Check if there are payments
      const { data: payments, error: paymentsCheckError } = await supabase
        .from("payments")
        .select("id")
        .eq("loan_id", selectedLoan.id);
      
      if (paymentsCheckError) throw paymentsCheckError;
      
      if (payments && payments.length > 0) {
        // Delete all payments first
        const { error: paymentsError } = await supabase
          .from("payments")
          .delete()
          .eq("loan_id", selectedLoan.id);

        if (paymentsError) throw paymentsError;
      }

      // Cari transaksi terkait dengan pinjaman ini
      if (selectedLoan.wallet_id) {
        try {
          // Cari transaksi berdasarkan kategori dan deskripsi
          const { data: transactionsData, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user?.id)
            .eq('wallet_id', selectedLoan.wallet_id)
            .eq('category', selectedLoan.type === 'payable' ? 'Hutang' : 'Piutang');

          if (transactionsError) throw transactionsError;

          if (transactionsData && transactionsData.length > 0) {
            // Filter transaksi yang benar-benar terkait dengan pinjaman ini
            const relatedTransactions = transactionsData.filter(transaction => {
              // Match berdasarkan judul dan deskripsi
              const titleMatch = transaction.title === selectedLoan.description;
              const descriptionMatch = 
                selectedLoan.type === 'payable' 
                  ? transaction.description?.includes(`Pinjaman dari ${selectedLoan.lender}`)
                  : transaction.description?.includes(`Pinjaman kepada ${selectedLoan.borrower}`);
              
              return titleMatch || descriptionMatch;
            });

            // Hapus semua transaksi terkait
            for (const transaction of relatedTransactions) {
              const { error: deleteTransError } = await supabase
                .from('transactions')
                .delete()
                .eq('id', transaction.id);
              
              if (deleteTransError) {
                console.error(`Error menghapus transaksi ${transaction.id}:`, deleteTransError);
              } else {
                console.log(`Transaksi ${transaction.id} berhasil dihapus`);
              }
            }

            console.log(`Berhasil menghapus ${relatedTransactions.length} transaksi terkait`);
          }
        } catch (transactionError) {
          console.error("Error menghapus transaksi terkait:", transactionError);
          // Lanjutkan proses meskipun ada masalah menghapus transaksi
        }
      }

      // Delete the loan
      const { error } = await supabase
        .from("loans")
        .delete()
        .eq("id", selectedLoan.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `${selectedLoan.type === 'payable' ? 'Hutang' : 'Piutang'} telah dihapus`,
      });

      setDeleteDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error deleting loan:", error instanceof Error ? error.message : String(error));
      toast({
        title: "Gagal Menghapus",
        description: (error instanceof Error ? error.message : String(error)) || "Terjadi kesalahan saat menghapus",
        variant: "destructive"
      });
    }
  };

  // Fungsi untuk menangani klik pada item hutang/piutang
  const handleBudgetClick = (loan: Loan) => {
    // Toggle: jika mengklik item yang sama, tutup detail, jika tidak, tampilkan detail item baru
    setLoanToEdit(loanToEdit?.id === loan.id ? null : loan);
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-xl">
        <div className="flex items-center mb-6">
          <Link to="/home" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Hutang & Piutang</h1>
        </div>

        {/* Feature Toggle Section */}
        <section className="mb-6 bg-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Fitur Hutang & Piutang</h2>
              <p className="text-sm text-gray-500">{featureEnabled ? "Aktif" : "Nonaktif"}</p>
            </div>
            <Switch 
              checked={featureEnabled} 
              onCheckedChange={handleToggleFeature} 
              aria-label="Toggle fitur hutang dan piutang"
            />
          </div>
        </section>

        {/* Summary Section */}
        <section className="mb-6 grid grid-cols-2 gap-3">
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <p className="text-xs text-red-700 mb-1">Total Hutang</p>
            <p className="text-lg font-semibold text-red-800">{formatCurrency(totalHutang)}</p>
            <div className="flex justify-between text-xs mt-2">
              <span>{countHutangItems} lunas</span>
              <span>{countHutangOverdue} terlambat</span>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <p className="text-xs text-green-700 mb-1">Total Piutang</p>
            <p className="text-lg font-semibold text-green-800">{formatCurrency(totalPiutang)}</p>
            <div className="flex justify-between text-xs mt-2">
              <span>{countPiutangItems} lunas</span>
              <span>{countPiutangOverdue} terlambat</span>
            </div>
          </div>
        </section>

        {/* Tabs Section */}
        <section className="mb-6">
          <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="unpaid">Belum Lunas</TabsTrigger>
              <TabsTrigger value="overdue">Terlambat</TabsTrigger>
              <TabsTrigger value="paid">Lunas</TabsTrigger>
            </TabsList>
          </Tabs>
        </section>

        {/* Hutang List Section */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Daftar Hutang Aktif</h2>
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <Link to="/loans/add-debt">
                <Plus className="h-4 w-4 mr-1" />
                Tambah Hutang Baru
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p>Memuat data hutang...</p>
            </div>
          ) : filteredLoans().filter(loan => loan.type === "payable").length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>Tidak ada hutang yang ditemukan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLoans()
                .filter(loan => loan.type === "payable")
                .map((loan) => {
                  const isOverdue = new Date(loan.due_date) < new Date() && loan.status !== "paid";
                  const isPaid = loan.status === "paid";
                  return (
                    <div 
                      key={loan.id} 
                      className="bg-white rounded-lg shadow-sm"
                    >
                      {/* Header loan item yang selalu terlihat */}
                      <div onClick={() => handleBudgetClick(loan)} className="cursor-pointer">
                        <div className="flex items-start p-3">
                          <div className="w-1 self-stretch bg-red-500 rounded-l-lg mr-3"></div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                        <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-800">{loan.description}</h3>
                                  {isPaid && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Lunas</span>
                                  )}
                                  {isOverdue && !isPaid && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">Terlambat</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">Jatuh tempo: {formatDate(loan.due_date)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-red-600">{formatCurrency(loan.amount)}</p>
                                <p className="text-xs text-gray-500">{loan.paid_amount ? Math.round((loan.paid_amount / loan.amount) * 100) : 0}% terbayar</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detail hutang ketika diklik */}
                      {loanToEdit?.id === loan.id && (
                        <div className="p-4 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Pemberi</p>
                              <p className="font-medium">{loan.lender || "-"}</p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Total Hutang</p>
                              <p className="font-medium">Rp {loan.amount.toLocaleString()}</p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 mb-1">Tanggal Dibuat</p>
                              <p className="font-medium">{formatDate(loan.created_at)}</p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Wallet</p>
                              <p className="font-medium">{loan.wallet_name || "CASH"}</p>
                            </div>
                        </div>
                          
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-1">Progress Pembayaran</p>
                            <div className="flex items-center justify-between">
                              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${loan.paid_amount ? Math.round((loan.paid_amount / loan.amount) * 100) : 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium">
                                {loan.paid_amount ? Math.round((loan.paid_amount / loan.amount) * 100) : 0}%
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between text-sm mb-4">
                            <div>
                              <p className="text-gray-500">Terbayar: {formatCurrency(loan.paid_amount || 0)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Sisa: {formatCurrency(loan.amount - (loan.paid_amount || 0))}</p>
                        </div>
                      </div>

                          <div className="flex gap-2 justify-between">
                      {!isPaid && (
                          <Button 
                            size="sm" 
                                className="flex-1"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/loans/${loan.id}/payment`);
                                }}
                          >
                            Bayar
                          </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="flex-1"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedLoan(loan);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              Hapus
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/* Piutang List Section */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Daftar Piutang Aktif</h2>
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <Link to="/loans/add-receivable">
                <Plus className="h-4 w-4 mr-1" />
                Tambah Piutang Baru
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p>Memuat data piutang...</p>
            </div>
          ) : filteredLoans().filter(loan => loan.type === "receivable").length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>Tidak ada piutang yang ditemukan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLoans()
                .filter(loan => loan.type === "receivable")
                .map((loan) => {
                  const isOverdue = new Date(loan.due_date) < new Date() && loan.status !== "paid";
                  const isPaid = loan.status === "paid";
                  return (
                    <div 
                      key={loan.id} 
                      className="bg-white rounded-lg shadow-sm"
                    >
                      {/* Header loan item yang selalu terlihat */}
                      <div onClick={() => handleBudgetClick(loan)} className="cursor-pointer">
                        <div className="flex items-start p-3">
                          <div className="w-1 self-stretch bg-green-500 rounded-l-lg mr-3"></div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                        <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-800">{loan.description}</h3>
                                  {isPaid && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Lunas</span>
                                  )}
                                  {isOverdue && !isPaid && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">Terlambat</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">Jatuh tempo: {formatDate(loan.due_date)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">{formatCurrency(loan.amount)}</p>
                                <p className="text-xs text-gray-500">{loan.paid_amount ? Math.round((loan.paid_amount / loan.amount) * 100) : 0}% terbayar</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detail piutang ketika diklik */}
                      {loanToEdit?.id === loan.id && (
                        <div className="p-4 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Peminjam</p>
                              <p className="font-medium">{loan.borrower || "-"}</p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Total Piutang</p>
                              <p className="font-medium">Rp {loan.amount.toLocaleString()}</p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 mb-1">Tanggal Dibuat</p>
                              <p className="font-medium">{formatDate(loan.created_at)}</p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Wallet</p>
                              <p className="font-medium">{loan.wallet_name || "CASH"}</p>
                            </div>
                        </div>
                          
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-1">Progress Pembayaran</p>
                            <div className="flex items-center justify-between">
                              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${loan.paid_amount ? Math.round((loan.paid_amount / loan.amount) * 100) : 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium">
                                {loan.paid_amount ? Math.round((loan.paid_amount / loan.amount) * 100) : 0}%
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between text-sm mb-4">
                            <div>
                              <p className="text-gray-500">Diterima: {formatCurrency(loan.paid_amount || 0)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Sisa: {formatCurrency(loan.amount - (loan.paid_amount || 0))}</p>
                        </div>
                      </div>

                          <div className="flex gap-2 justify-between">
                      {!isPaid && (
                              <Button 
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/loans/${loan.id}/payment`);
                                }}
                              >
                                Terima
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="flex-1"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedLoan(loan);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              Hapus
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/* Tips Section */}
        <section className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3 text-blue-800">Tips Penggunaan Hutang & Piutang</h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Hutang yang Anda terima akan masuk sebagai pemasukan dengan label "Ngutang"</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Pembayaran hutang akan masuk sebagai pengeluaran dengan label "Bayar Hutang"</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Pinjaman yang Anda berikan akan masuk sebagai pengeluaran dengan label "Beri Piutang"</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Penerimaan pembayaran pinjaman akan masuk sebagai pemasukan dengan label "Terima dari Piutang"</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Anda dapat mengatur anggaran khusus untuk pembayaran hutang di menu Anggaran</span>
            </li>
          </ul>
        </section>

        {/* Feature Description Section */}
        <section className="bg-purple-50 rounded-lg p-4">
          <h3 className="font-semibold mb-3 text-purple-800">Penjelasan Fitur Hutang & Piutang</h3>
          <div className="space-y-2 text-sm text-purple-700">
            <h4 className="font-medium">Daftar Hutang Aktif:</h4>
            <p>Menampilkan semua hutang yang Anda miliki (uang yang Anda pinjam dari orang lain atau lembaga). Fitur ini membantu Anda:</p>
            <ul className="ml-4 space-y-1">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Melacak jumlah hutang yang masih harus dibayar</span>
              </li>
            </ul>
          </div>
        </section>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedLoan?.type === "payable" ? "Pembayaran Hutang" : "Terima Pembayaran Piutang"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium">Detail {selectedLoan?.type === "payable" ? "Hutang" : "Piutang"}</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <p className="text-xs text-gray-500">Total {selectedLoan?.type === "payable" ? "Hutang" : "Piutang"}</p>
                  <p className="font-medium">{selectedLoan ? formatCurrency(selectedLoan.amount) : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sisa {selectedLoan?.type === "payable" ? "Hutang" : "Piutang"}</p>
                  <p className="font-medium">{selectedLoan ? formatCurrency(selectedLoan.amount - (selectedLoan.paid_amount || 0)) : "-"}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Jumlah Pembayaran</label>
              <input 
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
                max={selectedLoan?.amount - (selectedLoan?.paid_amount || 0)}
                required
                aria-label="Jumlah Pembayaran"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maksimal pembayaran: {selectedLoan ? formatCurrency(selectedLoan.amount - (selectedLoan.paid_amount || 0)) : "-"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pilih Sumber Dana</label>
              <div className="flex items-center border rounded-md px-3 py-2">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                <select 
                  value={paymentWallet}
                  onChange={(e) => setPaymentWallet(e.target.value)}
                  className="flex-1 border-0 focus:ring-0"
                  required
                  aria-label="Pilih Sumber Dana"
                >
                  <option value="">Pilih dompet</option>
                  {wallets.map(wallet => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name} - {formatCurrency(wallet.balance)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="mark-paid"
                checked={markPaid}
                onChange={() => setMarkPaid(!markPaid)}
                className="rounded border-gray-300"
              />
              <label htmlFor="mark-paid" className="text-sm">
                Tandai sebagai lunas meskipun pembayaran parsial
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPaymentDialogOpen(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={paymentProcessing}
                className={
                  selectedLoan?.type === "payable" ? 
                  "bg-blue-600 hover:bg-blue-700" : 
                  "bg-green-600 hover:bg-green-700"
                }
              >
                {paymentProcessing ? 
                  "Memproses..." : 
                  (selectedLoan?.type === "payable" ? "Bayar Sekarang" : "Terima Pembayaran")
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p>
            Apakah Anda yakin ingin menghapus {selectedLoan?.type === 'payable' ? 'hutang' : 'piutang'} "{selectedLoan?.description}"?
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default LoansManagement;
