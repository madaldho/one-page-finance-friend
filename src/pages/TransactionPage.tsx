import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ChevronLeft, Calendar, X, ArrowLeftCircle, Wallet, Tag, MessageSquareText, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/ui/currency-input";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Placeholder fallback categories jika database kosong
const fallbackIncomeCategories = ["Gaji", "Bonus", "Investasi", "Lainnya"];
const fallbackExpenseCategories = ["Belanja", "Makanan", "Transport", "Lainnya"];

interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
  user_id: string;
}

interface Wallet {
  id: string;
  name: string;
  balance: number;
  user_id: string;
  description?: string;
}

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: string;
  date: string;
  category: string;
  description?: string;
  user_id: string;
  wallet_id: string;
  destination_wallet_id?: string;
  fee?: number;
  created_at?: string;
}

interface TransactionFormData {
  title: string;
  amount: number;
  category: string;
  date: string;
  wallet_id: string;
  description: string;
  source_wallet: string;
  destination_wallet: string;
  source_fee: number;
  destination_fee: number;
}

const TransactionPage = () => {
  const { type, id } = useParams<{ type: string; id?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [showCategoryAlert, setShowCategoryAlert] = useState(false);
  const [showWalletAlert, setShowWalletAlert] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const form = useForm<TransactionFormData>({
    defaultValues: {
      title: "",
      amount: 0,
      category: "",
      date: new Date().toISOString().split("T")[0],
      wallet_id: "",
      description: "",
      source_wallet: "",
      destination_wallet: "",
      source_fee: 0,
      destination_fee: 0,
    },
    mode: "onChange"
  });

  const watchAmount = form.watch("amount");
  const watchCategory = form.watch("category");
  const watchWalletId = form.watch("wallet_id");
  const watchSourceWallet = form.watch("source_wallet");
  const watchDestWallet = form.watch("destination_wallet");
  const watchSourceFee = form.watch("source_fee");
  const watchDestFee = form.watch("destination_fee");

  // Fetch transaction data for editing
  const fetchTransactionData = async () => {
    if (!id || !user) return;
    
    setFetchingData(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setTransaction(data);
        setIsEditMode(true);
        
        // Populate form with transaction data
        form.setValue('title', data.title || '');
        form.setValue('amount', data.amount || 0);
        form.setValue('date', data.date || new Date().toISOString().split('T')[0]);
        form.setValue('description', data.description || '');
        
        if (data.type === 'transfer') {
          form.setValue('source_wallet', data.wallet_id || '');
          form.setValue('destination_wallet', data.destination_wallet_id || '');
          
          // Try to get fee data if available
          if (data.fee) {
            // For simplicity, assume half the fee is for source and half for destination
            const halfFee = data.fee / 2;
            form.setValue('source_fee', halfFee);
            form.setValue('destination_fee', halfFee);
          }
        } else {
          form.setValue('category', data.category || '');
          form.setValue('wallet_id', data.wallet_id || '');
        }
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data transaksi',
        variant: 'destructive',
      });
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWallets();
      fetchCategories();
      
      // If we have an ID, fetch the transaction data
      if (id) {
        fetchTransactionData();
      }
    }
    
    // Play bell sound on component mount to preload
    const audio = new Audio("/bellbike.MP3");
    audio.volume = 0.5;
    audio.load();
  }, [user, id]);

  const fetchWallets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id);
        
      if (error) throw error;
      setWallets(data || []);
      
      // Jika tidak ada wallet, tampilkan alert
      if (data?.length === 0) {
        setShowWalletAlert(true);
      }
    } catch (error) {
      console.error("Error fetching wallets:", error);
    }
  };
  
  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", type === "income" ? "income" : "expense");
        
      if (error) throw error;
      setCategories(data || []);
      
      // Jika tidak ada kategori, tampilkan alert
      if (type !== "transfer" && data?.length === 0) {
        setShowCategoryAlert(true);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const getPageTitle = () => {
      switch (type) {
        case "income":
          return "Tambah Pemasukan";
        case "expense":
          return "Tambah Pengeluaran";
        case "transfer":
          return "Transfer Antar Wallet";
        default:
          return "Tambah Transaksi";
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "income":
        return "bg-green-500 hover:bg-green-600";
      case "expense":
        return "bg-red-500 hover:bg-red-600";
      case "transfer":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-primary";
    }
  };

  const getGradientStyle = () => {
    switch (type) {
      case "income":
        return "from-green-600 to-green-500";
      case "expense":
        return "from-red-600 to-red-500";
      case "transfer":
        return "from-blue-600 to-blue-500";
      default:
        return "from-gray-600 to-gray-500";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "income":
        return "+";
      case "expense":
        return "-";
      case "transfer":
        return "↔";
      default:
        return "✓";
    }
  };
  
  const createCategory = () => {
    navigate(type === "income" ? "/categories/add?type=income" : "/categories/add?type=expense");
  };
  
  const createWallet = () => {
    navigate("/wallet/add");
  };

  const onSubmit = async (data: TransactionFormData) => {
    if (!user) return;
    
    // Tambahkan validasi untuk field wajib
    if (type !== "transfer" && !data.category) {
      toast({
        title: "Error",
        description: "Kategori wajib diisi",
        variant: "destructive"
      });
      return;
    }

    if (type !== "transfer" && !data.wallet_id) {
      toast({
        title: "Error",
        description: "Wallet wajib dipilih",
        variant: "destructive"
      });
      return;
    }

    if (data.amount <= 0) {
      toast({
        title: "Error",
        description: "Nominal harus lebih dari 0",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      let transactionData: Transaction;

      if (type === "transfer") {
        // Handle transfer transaction
        const sourceWallet = wallets.find(w => w.id === data.source_wallet);
        const destWallet = wallets.find(w => w.id === data.destination_wallet);
        
        if (!sourceWallet || !destWallet) {
          toast({
            title: "Error",
            description: "Pilih wallet sumber dan tujuan",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        // Calculate total fees
        const totalFees = (data.source_fee || 0) + (data.destination_fee || 0);
        
        try {
          console.log("Memproses transfer antar wallet...");
          
          // 1. Create expense transaction from source wallet for the transfer amount
          const { data: expenseData, error: expenseError } = await supabase
          .from("transactions")
          .insert({
              title: data.title || `Transfer ke ${destWallet.name}`,
              amount: data.amount,
              type: "expense",
              date: data.date,
              category: "Transfer",
              description: data.description,
              user_id: user.id,
              wallet_id: sourceWallet.id
          })
            .select()
            .single();
          
          if (expenseError) {
            console.error("Expense transaction error:", expenseError);
            throw expenseError;
          }
          
          console.log("Transaksi expense transfer berhasil dibuat:", expenseData);
          
          // 2. Create income transaction to destination wallet
          const { data: incomeData, error: incomeError } = await supabase
            .from("transactions")
            .insert({
              title: data.title || `Transfer dari ${sourceWallet.name}`,
              amount: data.amount,
              type: "income",
              date: data.date,
              category: "Transfer",
              description: data.description,
              user_id: user.id,
              wallet_id: destWallet.id
            })
            .select()
            .single();
            
          if (incomeError) {
            console.error("Income transaction error:", incomeError);
            throw incomeError;
          }
          
          console.log("Transaksi income berhasil dibuat:", incomeData);
          
          // 3. If there's a fee, create a separate expense transaction for it
          if (totalFees > 0) {
            const { data: feeData, error: feeError } = await supabase
              .from("transactions")
              .insert({
                title: `Biaya Admin Transfer`,
                amount: totalFees,
                type: "expense",
                date: data.date,
                category: "Biaya Admin",
                description: `Biaya admin untuk transfer ${sourceWallet.name} ke ${destWallet.name}`,
                user_id: user.id,
                wallet_id: sourceWallet.id
              })
              .select()
              .single();
              
            if (feeError) {
              console.error("Fee transaction error:", feeError);
              throw feeError;
            }
            
            console.log("Transaksi biaya admin berhasil dibuat:", feeData);
          }
        
          // Update source wallet (deduct transfer amount + fee)
          const { error: sourceWalletError } = await supabase
            .from("wallets")
            .update({ 
              balance: sourceWallet.balance - data.amount - totalFees 
            })
            .eq("id", sourceWallet.id);
          
          if (sourceWalletError) {
            console.error("Source wallet update error:", sourceWalletError);
            throw sourceWalletError;
          }
          
          // Update destination wallet (add transfer amount only)
          const { error: destWalletError } = await supabase
            .from("wallets")
            .update({ 
              balance: destWallet.balance + data.amount
            })
            .eq("id", destWallet.id);
          
          if (destWalletError) {
            console.error("Destination wallet update error:", destWalletError);
            throw destWalletError;
          }
          
          // Use the expense transaction as the main one to display
          transactionData = {
            ...expenseData,
            destination_wallet_id: destWallet.id, // Tambahkan info dompet tujuan untuk UI
            fee: totalFees
          } as Transaction;
          
          console.log("Transfer selesai, data transaksi:", transactionData);
          
        } catch (error: unknown) {
          console.error("Transfer transaction error:", error);
          throw error; // Re-throw untuk ditangkap di catch block utama
        }
      } else {
        // Handle income or expense transaction
        const wallet = wallets.find(w => w.id === data.wallet_id);
        
        if (!wallet) {
          toast({
            title: "Error",
            description: "Pilih wallet",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        // Persiapkan data transaksi
        const transactionPayload = {
          title: data.title || (type === "income" ? "Pemasukan" : "Pengeluaran"),
          amount: data.amount,
          type: type,
          date: data.date,
          category: data.category,
          description: data.description,
          user_id: user.id,
          wallet_id: data.wallet_id
        };
        
        if (isEditMode && id) {
          // Jika edit mode, update transaksi yang ada
          
          // 1. Ambil data transaksi lama untuk perbandingan
          const { data: oldTransactionData, error: oldTransactionError } = await supabase
            .from("transactions")
            .select("*")
            .eq("id", id)
            .single();
          
          if (oldTransactionError) throw oldTransactionError;
          const oldTransaction = oldTransactionData as Transaction;
          
          // 2. Update transaksi ke database
          const { data: updatedData, error: updateError } = await supabase
            .from("transactions")
            .update(transactionPayload)
            .eq("id", id)
            .select()
            .single();
            
          if (updateError) throw updateError;
          
          // 3. Jika jumlah atau wallet berubah, perlu update saldo wallet
          if (oldTransaction.amount !== data.amount || oldTransaction.wallet_id !== data.wallet_id) {
            
            // 3a. Kembalikan dulu saldo wallet lama ke kondisi semula
            const oldWallet = wallets.find(w => w.id === oldTransaction.wallet_id);
            if (oldWallet) {
              const oldWalletNewBalance = oldTransaction.type === "income" 
                ? oldWallet.balance - oldTransaction.amount 
                : oldWallet.balance + oldTransaction.amount;
              
              await supabase
                .from("wallets")
                .update({ balance: oldWalletNewBalance })
                .eq("id", oldWallet.id);
            }
            
            // 3b. Lalu update saldo wallet baru
            if (oldTransaction.wallet_id === data.wallet_id) {
              // Jika wallet sama, cukup update selisihnya
              const newBalance = type === "income" 
                ? wallet.balance + data.amount 
                : wallet.balance - data.amount;
              
              await supabase
                .from("wallets")
                .update({ balance: newBalance })
                .eq("id", wallet.id);
            } else {
              // Jika wallet berbeda, update wallet baru
              const newBalance = type === "income" 
                ? wallet.balance + data.amount 
                : wallet.balance - data.amount;
              
              // For expense, check if balance is sufficient
              if (type === "expense" && wallet.balance < data.amount) {
                toast({
                  title: "Saldo Tidak Cukup",
                  description: "Saldo tidak mencukupi",
                  variant: "destructive"
                });
                setLoading(false);
                return;
              }
              
              await supabase
                .from("wallets")
                .update({ balance: newBalance })
                .eq("id", wallet.id);
            }
          }
          
          transactionData = updatedData as Transaction;
        } else {
          // Jika buat baru
        // For expense, check if balance is sufficient
        if (type === "expense" && wallet.balance < data.amount) {
          toast({
            title: "Saldo Tidak Cukup",
            description: "Saldo tidak mencukupi",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        // Create income/expense transaction
        const { data: txData, error: txError } = await supabase
          .from("transactions")
            .insert(transactionPayload)
            .select()
            .single();
          
        if (txError) throw txError;
        
        // Update wallet balance
          const newBalance = type === "income" 
            ? wallet.balance + data.amount 
            : wallet.balance - data.amount;
          
          await supabase
            .from("wallets")
            .update({ balance: newBalance })
            .eq("id", wallet.id);
          
          transactionData = txData as Transaction;
        }
      }
      
      // Play success sound
      const audio = new Audio("/bellbike.MP3");
      audio.volume = 0.5;
      audio.play();
      
      // Show success screen
      setTransaction(transactionData);
      setShowSuccess(true);
      
    } catch (error: unknown) {
      console.error("Error saving transaction:", error);
      toast({
        title: "Gagal Menyimpan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan transaksi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate("/home");
  };

  // Show success screen
  if (showSuccess && transaction) {
    const date = new Date();
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    // Temukan nama kategori berdasarkan ID
    const getCategoryName = (categoryId: string) => {
      if (categoryId === "Transfer") return "Transfer";
      const category = categories.find(c => c.id === categoryId);
      return category ? category.name : categoryId;
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md overflow-hidden bg-white">
          <div className={cn(
            "bg-gradient-to-br p-6 text-white flex flex-col items-center",
            getGradientStyle()
          )}>
            <div className="rounded-full bg-white/20 p-4 mb-4 w-16 h-16 flex items-center justify-center">
              <div className="text-3xl font-bold">{getIcon()}</div>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold">{formatCurrency(transaction.amount)}</h3>
              <Badge className="bg-white/30 text-white mt-1">
                {type === "income" ? "Pemasukan" : type === "expense" ? "Pengeluaran" : "Transfer"}
              </Badge>
            </div>
          </div>
          
          <div className="p-4 divide-y">
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Tanggal</span>
              <span className="font-medium">{new Date(transaction.date).toLocaleDateString('id-ID')}</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Kategori</span>
              <span className="font-medium">{getCategoryName(transaction.category)}</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Wallet</span>
              <span className="font-medium">{type === "transfer" ? 
                `${wallets.find(w => w.id === transaction.wallet_id)?.name} → ${wallets.find(w => w.id === transaction.destination_wallet_id)?.name}` : 
                wallets.find(w => w.id === transaction.wallet_id)?.name}</span>
            </div>
            
            {transaction.description && (
              <div className="py-2">
                <span className="text-gray-500 block mb-1">Deskripsi</span>
                <p className="text-sm">{transaction.description}</p>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-gray-50 text-xs text-center text-gray-500">
            <div>ID: {transaction.id}</div>
            <div>Transaksi berhasil pada {formattedDate}</div>
          </div>
          
          <div className="p-4">
            <Button 
              onClick={handleClose} 
              className={cn("w-full", getButtonColor())}
              aria-label="Tutup"
              title="Tutup">
              Kembali ke Beranda
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Di bagian awal render, tambahkan loading state
  if (fetchingData) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-500">Memuat data transaksi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header dengan gradien */}
      <div className={cn(
        "bg-gradient-to-br p-4 text-white",
        getGradientStyle()
      )}>
        <div className="flex items-center justify-between max-w-xl mx-auto w-full">
          <button 
            onClick={handleClose} 
            className="p-1 rounded-full bg-white/20 h-8 w-8 flex items-center justify-center"
            aria-label="Tutup"
            title="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 className="font-semibold">{isEditMode ? `Edit ${getPageTitle().replace('Tambah ', '')}` : getPageTitle()}</h2>
          <div className="w-8"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Alert Dialog untuk Kategori */}
      <AlertDialog open={showCategoryAlert} onOpenChange={setShowCategoryAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Belum Ada Kategori</AlertDialogTitle>
            <AlertDialogDescription>
              Anda belum memiliki kategori {type === "income" ? "pemasukan" : "pengeluaran"}. Buat kategori baru terlebih dahulu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate("/home")}>Kembali</AlertDialogCancel>
            <AlertDialogAction onClick={createCategory}>Buat Kategori</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Alert Dialog untuk Wallet */}
      <AlertDialog open={showWalletAlert} onOpenChange={setShowWalletAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Belum Ada Wallet</AlertDialogTitle>
            <AlertDialogDescription>
              Anda belum memiliki wallet. Buat wallet baru terlebih dahulu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate("/home")}>Kembali</AlertDialogCancel>
            <AlertDialogAction onClick={createWallet}>Buat Wallet</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto p-4 pb-24 w-full">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
              {/* Nominal - Prioritaskan input nominal */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <div className={cn(
                      "p-6 rounded-xl bg-white border-2 border-gray-100 text-center mb-6",
                      watchAmount > 0 ? (
                        type === "income" ? "bg-green-50/50" : 
                        type === "expense" ? "bg-red-50/50" : 
                        "bg-blue-50/50"
                      ) : ""
                    )}>
                      <FormLabel className="text-gray-500 text-sm">Nominal <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                        <div className="relative">
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold ml-4">
                            Rp
                          </span>
                          <CurrencyInput
                            placeholder="0" 
                            value={field.value}
                            onChange={(value) => field.onChange(value)}
                            className="text-3xl font-bold text-center border-0 h-16 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                          />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Tanggal */}
              <FormField
                control={form.control}
                  name="date"
                render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200">
                        <Calendar className="h-4 w-4 text-gray-500" />
                    <FormControl>
                      <Input
                            type="date" 
                        {...field}
                            className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </FormControl>
                      </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

                {/* Kategori untuk income/expense */}
                {type !== "transfer" && (
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200">
                          <Tag className="h-4 w-4 text-gray-500" />
                          <div className="flex-1 flex items-center justify-between">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 flex-1">
                                  <SelectValue placeholder="Pilih kategori *" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.length > 0 ? (
                                  categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                                        <span>{category.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  (type === "income" ? fallbackIncomeCategories : fallbackExpenseCategories).map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="ml-1 p-0 h-6 w-6" 
                              onClick={createCategory}
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Wallet selection */}
              {type !== "transfer" ? (
              <FormField
                control={form.control}
                  name="wallet_id"
                render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200">
                        <Wallet className="h-4 w-4 text-gray-500 mt-2" />
                        <div className="flex-1">
                          <FormLabel className="text-xs text-gray-500">Wallet <span className="text-red-500">*</span></FormLabel>
                          <div className="flex items-center">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="border-0 p-0 h-auto mt-1 focus:ring-0">
                                  <SelectValue placeholder="Pilih Wallet" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {wallets.map((wallet) => (
                                  <SelectItem key={wallet.id} value={wallet.id}>
                                    {wallet.name} ({formatCurrency(wallet.balance)})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="ml-1 p-0 h-6 w-6" 
                              onClick={createWallet}
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                // Transfer wallets (source and destination)
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="source_wallet"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200">
                          <Wallet className="h-4 w-4 text-gray-500 mt-2" />
                          <div className="flex-1">
                            <FormLabel className="text-xs text-gray-500">Wallet Sumber</FormLabel>
                            <div className="flex items-center">
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="border-0 p-0 h-auto mt-1 focus:ring-0">
                                    <SelectValue placeholder="Pilih wallet sumber" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {wallets.map((wallet) => (
                                    <SelectItem key={wallet.id} value={wallet.id}>
                                      {wallet.name} ({formatCurrency(wallet.balance)})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="ml-1 p-0 h-6 w-6" 
                                onClick={createWallet}
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {watchSourceWallet && (
                    <div className="flex justify-center my-2">
                      <ArrowLeftCircle className="rotate-90 text-gray-400" />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="destination_wallet"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200">
                          <Wallet className="h-4 w-4 text-gray-500 mt-2" />
                          <div className="flex-1">
                            <FormLabel className="text-xs text-gray-500">Wallet Tujuan</FormLabel>
                            <div className="flex items-center">
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="border-0 p-0 h-auto mt-1 focus:ring-0">
                                    <SelectValue placeholder="Pilih wallet tujuan" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {wallets
                                    .filter(wallet => wallet.id !== watchSourceWallet)
                                    .map((wallet) => (
                                      <SelectItem key={wallet.id} value={wallet.id}>
                                        {wallet.name} ({formatCurrency(wallet.balance)})
                                      </SelectItem>
                                    ))
                                  }
                                </SelectContent>
                              </Select>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="ml-1 p-0 h-6 w-6" 
                                onClick={createWallet}
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            
              {/* Deskripsi - dipindah ke atas title */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200">
                      <MessageSquareText className="h-4 w-4 text-gray-500 mt-2" />
                      <div className="flex-1">
                        <FormLabel className="text-xs text-gray-500">Catatan</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Catatan transaksi (opsional)" 
                            {...field}
                            className="border-0 p-0 h-auto mt-1 min-h-[60px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </FormControl>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
              {/* Transfer fees fields */}
              {type === "transfer" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="source_fee"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200">
                          <div className="flex-1">
                            <FormLabel className="text-xs text-gray-500">Biaya Admin Sumber</FormLabel>
                        <FormControl>
                              <CurrencyInput
                                placeholder="0"
                                value={field.value || 0}
                                onChange={(value) => field.onChange(value)}
                                className="border-0 p-0 h-auto mt-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                              />
                        </FormControl>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destination_fee"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200">
                          <div className="flex-1">
                            <FormLabel className="text-xs text-gray-500">Biaya Admin Tujuan</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            placeholder="0"
                            value={field.value || 0}
                            onChange={(value) => field.onChange(value)}
                            className="border-0 p-0 h-auto mt-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </FormControl>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            
              {/* Transfer summary */}
              {type === "transfer" && watchSourceWallet && watchDestWallet && watchAmount > 0 && (
                <div className="bg-blue-50 p-4 rounded-xl mt-4">
                  <p className="text-sm font-medium text-blue-700 mb-2">Ringkasan Transfer</p>
                  <div className="text-sm space-y-2 text-blue-600">
                    <div className="flex justify-between">
                      <span>Jumlah Transfer:</span>
                      <span className="font-medium">{formatCurrency(watchAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Biaya Admin:</span>
                      <span className="font-medium">+ {formatCurrency((watchSourceFee || 0) + (watchDestFee || 0))}</span>
                    </div>
                    <div className="border-t border-blue-200 my-2 pt-2"></div>
                    <div className="flex justify-between font-medium">
                      <span>Total Dikeluarkan:</span>
                      <span className="font-medium">{formatCurrency(watchAmount + (watchSourceFee || 0) + (watchDestFee || 0))}</span>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>
      </div>
      
      {/* Bottom action bar fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="max-w-xl mx-auto p-4 flex gap-3 w-full">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="flex-1 rounded-xl"
          >
            Batal
          </Button>
              <Button
            onClick={form.handleSubmit(onSubmit)}
            className={cn("flex-1 rounded-xl", getButtonColor())}
            disabled={loading}
          >
            {loading ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : type === "transfer" ? "Transfer" : "Simpan"}
              </Button>
            </div>
      </div>
    </div>
  );
};

export default TransactionPage;
