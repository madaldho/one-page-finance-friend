import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ChevronLeft, Calendar, Clock, X, ArrowDown, ArrowLeftRight, Wallet, Tag, MessageSquareText, PlusCircle, CheckCircle, CreditCard } from "lucide-react";
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
  color?: string;
  type?: string;
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
  source_fee?: number;
  destination_fee?: number;
  created_at?: string;
}

interface TransactionFormData {
  title: string;
  amount: number;
  category: string;
  date: string;
  time: string;
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
  const [showTimeField, setShowTimeField] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Jakarta');

  const form = useForm<TransactionFormData>({
    defaultValues: {
      title: "",
      amount: 0,
      category: "",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5), // HH:MM format
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
        
        // Extract time from created_at or use current time
        if (data.created_at) {
          const createdDate = new Date(data.created_at);
          const timeString = createdDate.toTimeString().slice(0, 5);
          form.setValue('time', timeString);
          setShowTimeField(true); // Show time field if editing existing transaction
        }
        
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
      fetchUserTimezone();
      
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
        .eq("user_id", user.id)
        .order('name');
        
      if (error) throw error;
      
      console.log('Fetched wallets:', data); // Debug log
      const walletsWithDefaults = (data || []).map(wallet => ({
        ...wallet,
        color: wallet.color || '#6366F1', // Default color indigo
        type: wallet.type || 'cash'
      }));
      
      setWallets(walletsWithDefaults);
      
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

  const fetchUserTimezone = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching timezone:', error);
        // Use default if error
        setUserTimezone('Asia/Jakarta');
        return;
      }
      
      // Set timezone from database or default
      setUserTimezone((data as any)?.timezone || 'Asia/Jakarta');
    } catch (error) {
      console.error('Error in fetchUserTimezone:', error);
      setUserTimezone('Asia/Jakarta');
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
    
    // Helper function to create timezone-aware datetime string
    const createDateTimeString = () => {
      // Get timezone offset for the user's selected timezone
      const getTimezoneOffset = (timezone: string) => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const targetTime = new Date(utc + (getOffsetMinutes(timezone) * 60000));
        return getOffsetString(timezone);
      };

      const getOffsetMinutes = (timezone: string) => {
        // Map common timezones to their offset in minutes
        const timezoneOffsets: Record<string, number> = {
          'Asia/Jakarta': 7 * 60,        // UTC+7
          'Asia/Makassar': 8 * 60,       // UTC+8  
          'Asia/Jayapura': 9 * 60,       // UTC+9
          'Asia/Singapore': 8 * 60,      // UTC+8
          'Asia/Kuala_Lumpur': 8 * 60,   // UTC+8
          'Asia/Bangkok': 7 * 60,        // UTC+7
          'Asia/Manila': 8 * 60,         // UTC+8
          'UTC': 0,                      // UTC+0
          'America/New_York': -5 * 60,   // UTC-5
          'America/Los_Angeles': -8 * 60, // UTC-8
          'Europe/London': 0,            // UTC+0
          'Europe/Paris': 1 * 60,        // UTC+1
          'Asia/Tokyo': 9 * 60,          // UTC+9
          'Australia/Sydney': 10 * 60,   // UTC+10
        };
        return timezoneOffsets[timezone] || 7 * 60; // Default to Jakarta
      };

      const getOffsetString = (timezone: string) => {
        const offsetMinutes = getOffsetMinutes(timezone);
        const hours = Math.floor(Math.abs(offsetMinutes) / 60);
        const minutes = Math.abs(offsetMinutes) % 60;
        const sign = offsetMinutes >= 0 ? '+' : '-';
        return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      };

      if (showTimeField && data.time) {
        // Use user-selected date and time with user's timezone
        const offsetString = getOffsetString(userTimezone);
        const selectedDateTime = `${data.date}T${data.time}:00${offsetString}`;
        return selectedDateTime;
      } else {
        // Use user-selected date but current time with user's timezone
        const now = new Date();
        const currentTime = new Intl.DateTimeFormat('sv-SE', {
          timeZone: userTimezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).format(now);
        
        const offsetString = getOffsetString(userTimezone);
        return `${data.date}T${currentTime}${offsetString}`;
      }
    };
    
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
          
          // Prepare datetime for transfer transactions
          const dateTimeString = createDateTimeString();
          
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
              wallet_id: sourceWallet.id,
              created_at: dateTimeString
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
              wallet_id: destWallet.id,
              created_at: dateTimeString
            })
            .select()
            .single();
            
          if (incomeError) {
            console.error("Income transaction error:", incomeError);
            throw incomeError;
          }
          
          console.log("Transaksi income berhasil dibuat:", incomeData);
          
          // 3. If there are fees, create separate expense transactions for source and destination fees
          // 3a. Handle source wallet fee if it exists
          if (data.source_fee > 0) {
            const { data: sourceFeeData, error: sourceFeeError } = await supabase
              .from("transactions")
              .insert({
                title: `Biaya Admin Transfer (${sourceWallet.name})`,
                amount: data.source_fee,
                type: "expense",
                date: data.date,
                category: "Fee",
                description: `Biaya admin pengiriman dari ${sourceWallet.name} ke ${destWallet.name}`,
                user_id: user.id,
                wallet_id: sourceWallet.id,
                created_at: dateTimeString
              })
              .select()
              .single();
              
            if (sourceFeeError) {
              console.error("Source fee transaction error:", sourceFeeError);
              throw sourceFeeError;
            }
            
            console.log("Transaksi biaya admin sumber berhasil dibuat:", sourceFeeData);
          }
          
          // 3b. Handle destination wallet fee if it exists
          if (data.destination_fee > 0) {
            const { data: destFeeData, error: destFeeError } = await supabase
              .from("transactions")
              .insert({
                title: `Biaya Admin Transfer (${destWallet.name})`,
                amount: data.destination_fee,
                type: "expense",
                date: data.date,
                category: "Fee",
                description: `Biaya admin penerimaan di ${destWallet.name} dari ${sourceWallet.name}`,
                user_id: user.id,
                wallet_id: destWallet.id,
                created_at: dateTimeString
              })
              .select()
              .single();
              
            if (destFeeError) {
              console.error("Destination fee transaction error:", destFeeError);
              throw destFeeError;
            }
            
            console.log("Transaksi biaya admin tujuan berhasil dibuat:", destFeeData);
          }
        
          // Update source wallet (deduct transfer amount + source fee)
          const { error: sourceWalletError } = await supabase
            .from("wallets")
            .update({ 
              balance: sourceWallet.balance - data.amount - (data.source_fee || 0)
            })
            .eq("id", sourceWallet.id);
          
          if (sourceWalletError) {
            console.error("Source wallet update error:", sourceWalletError);
            throw sourceWalletError;
          }
          
          // Update destination wallet (add transfer amount - destination fee)
          const { error: destWalletError } = await supabase
            .from("wallets")
            .update({ 
              balance: destWallet.balance + data.amount - (data.destination_fee || 0)
            })
            .eq("id", destWallet.id);
          
          if (destWalletError) {
            console.error("Destination wallet update error:", destWalletError);
            throw destWalletError;
          }
          
          // Use the expense transaction as the main one to display
          transactionData = {
            ...expenseData,
            destination_wallet_id: destWallet.id,
            source_fee: data.source_fee || 0,
            destination_fee: data.destination_fee || 0
          } as unknown as Transaction;
          
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
        
        // Persiapkan data transaksi dengan waktu
        const dateTimeString = createDateTimeString();
        const transactionPayload = {
          title: data.title || (type === "income" ? "Pemasukan" : "Pengeluaran"),
          amount: data.amount,
          type: type,
          date: data.date,
          category: data.category,
          description: data.description,
          user_id: user.id,
          wallet_id: data.wallet_id,
          created_at: dateTimeString
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

            {type === "transfer" && (transaction.source_fee > 0 || transaction.destination_fee > 0) && (
              <div className="py-2 border-t">
                <span className="text-gray-500 block mb-1">Biaya Admin</span>
                <div className="space-y-1">
                  {transaction.source_fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">{wallets.find(w => w.id === transaction.wallet_id)?.name}</span>
                      <span className="font-medium text-red-500">{formatCurrency(transaction.source_fee)}</span>
                    </div>
                  )}
                  {transaction.destination_fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">{wallets.find(w => w.id === transaction.destination_wallet_id)?.name}</span>
                      <span className="font-medium text-red-500">{formatCurrency(transaction.destination_fee)}</span>
                    </div>
                  )}
                  {(transaction.source_fee > 0 && transaction.destination_fee > 0) && (
                    <div className="flex justify-between pt-1 border-t border-dashed border-gray-200">
                      <span className="text-sm font-medium">Total Biaya</span>
                      <span className="font-medium text-red-500">{formatCurrency((transaction.source_fee || 0) + (transaction.destination_fee || 0))}</span>
                    </div>
                  )}
                </div>
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
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 z-50 flex flex-col">
      {/* Modern Header */}
      <div className="relative">
        <div className={cn(
          "bg-gradient-to-r p-6 text-white relative overflow-hidden",
          getGradientStyle()
        )}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
          </div>
          
          <div className="flex items-center justify-between max-w-xl mx-auto w-full relative z-10">
            <button 
              onClick={handleClose} 
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <h2 className="font-bold text-lg">
                {isEditMode ? `Edit ${getPageTitle().replace('Tambah ', '')}` : getPageTitle()}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {type === "income" ? "Catat pemasukan Anda" : 
                 type === "expense" ? "Catat pengeluaran Anda" : 
                 "Transfer antar dompet"}
              </p>
            </div>
            
            <div className="w-9"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Alert Dialog untuk Kategori - Redesigned */}
      <AlertDialog open={showCategoryAlert} onOpenChange={setShowCategoryAlert}>
        <AlertDialogContent className="mx-auto max-w-[340px] sm:max-w-md rounded-2xl border-0 bg-white shadow-2xl">
          <div className="relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-indigo-50"></div>
            
            <div className="relative p-6 sm:p-8 text-center">
              {/* Icon Container */}
              <div className="mx-auto mb-6 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg transform">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
                Oops! Belum Ada Kategori
              </h3>
              
              {/* Description */}
              <p className="text-sm sm:text-base text-gray-600 mb-8 leading-relaxed">
                Anda belum memiliki kategori <span className="font-semibold text-purple-600">
                {type === "income" ? "pemasukan" : "pengeluaran"}</span>. 
                <br className="hidden sm:block" />
                Mari buat kategori pertama Anda!
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => navigate("/home")}
                  className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base"
                >
                  Kembali ke Home
                </button>
                <button
                  onClick={createCategory}
                  className="flex-1 px-4 py-3 text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                >
                  Buat Kategori Sekarang
                </button>
              </div>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Alert Dialog untuk Wallet - Redesigned */}
      <AlertDialog open={showWalletAlert} onOpenChange={setShowWalletAlert}>
        <AlertDialogContent className="mx-auto max-w-[340px] sm:max-w-md rounded-2xl border-0 bg-white shadow-2xl">
          <div className="relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50"></div>
            
            <div className="relative p-6 sm:p-8 text-center">
              {/* Icon Container */}
              <div className="mx-auto mb-6 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg transform">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
                Oops! Belum Ada Wallet
              </h3>
              
              {/* Description */}
              <p className="text-sm sm:text-base text-gray-600 mb-8 leading-relaxed">
                Anda belum memiliki <span className="font-semibold text-emerald-600">dompet</span> untuk menyimpan transaksi.
                <br className="hidden sm:block" />
                Mari buat dompet pertama Anda!
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => navigate("/home")}
                  className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base"
                >
                  Kembali ke Home
                </button>
                <button
                  onClick={createWallet}
                  className="flex-1 px-4 py-3 text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                >
                  Buat Wallet Sekarang
                </button>
              </div>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto p-4 pb-24 w-full space-y-4">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
              {/* Modern Amount Card */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <Card className={cn(
                      "border-0 shadow-lg overflow-hidden transition-all duration-300",
                      watchAmount > 0 ? (
                        type === "income" ? "bg-gradient-to-br from-green-500 to-green-600 text-white" : 
                        type === "expense" ? "bg-gradient-to-br from-red-500 to-red-600 text-white" : 
                        "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                      ) : "bg-white"
                    )}>
                      <div className="p-6 text-center">
                        <FormLabel className={cn(
                          "text-sm font-medium mb-3 block",
                          watchAmount > 0 ? "text-white/90" : "text-gray-600"
                        )}>
                          Nominal <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className={cn(
                              "absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold",
                              watchAmount > 0 ? "text-white" : "text-gray-400"
                            )}>
                              Rp
                            </span>
                            <CurrencyInput
                              placeholder="0" 
                              value={field.value}
                              onChange={(value) => field.onChange(value)}
                              className={cn(
                                "text-3xl font-bold text-center border-0 h-16 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent",
                                watchAmount > 0 ? "text-white placeholder:text-white/50" : "text-gray-900 placeholder:text-gray-400"
                              )}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </div>
                    </Card>
                  </FormItem>
                )}
              />

              {/* Date & Category Grid */}
              <div className="grid grid-cols-1 gap-4">
                {/* Date Card */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all">
                        <div className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <FormLabel className="text-sm font-semibold text-gray-700">Tanggal</FormLabel>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowTimeField(!showTimeField)}
                                  className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  {showTimeField ? 'Sembunyikan Waktu' : 'Atur Waktu'}
                                </Button>
                              </div>
                              <FormControl>
                                <Input
                                  type="date" 
                                  {...field}
                                  className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent text-gray-900 font-medium"
                                />
                              </FormControl>
                            </div>
                          </div>
                        </div>
                      </Card>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Time Card - Show/Hide based on state */}
                {showTimeField && (
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all">
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Clock className="h-5 w-5 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-1 block">Waktu</FormLabel>
                                <FormControl>
                                  <Input
                                    type="time" 
                                    {...field}
                                    className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent text-gray-900 font-medium"
                                  />
                                </FormControl>
                              </div>
                            </div>
                          </div>
                        </Card>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Category Card untuk income/expense */}
                {type !== "transfer" && (
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all">
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Tag className="h-5 w-5 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-1 block">
                                  Kategori <span className="text-red-500">*</span>
                                </FormLabel>
                                <div className="flex items-center gap-2">
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 bg-transparent flex-1">
                                        <SelectValue placeholder="Pilih kategori">
                                          {field.value && (
                                            <div className="flex items-center gap-2">
                                              <div 
                                                className="w-3 h-3 rounded-full"
                                                style={{ 
                                                  backgroundColor: categories.find(c => c.id === field.value)?.color || '#6B7280' 
                                                }}
                                              />
                                              <span className="font-medium text-gray-900">
                                                {categories.find(c => c.id === field.value)?.name || field.value}
                                              </span>
                                            </div>
                                          )}
                                        </SelectValue>
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {categories.length > 0 ? (
                                        categories.map((category) => (
                                          <SelectItem key={category.id} value={category.id} className="p-3">
                                            <div className="flex items-center gap-2">
                                              <div 
                                                className="w-4 h-4 rounded-full" 
                                                style={{ backgroundColor: category.color }}
                                              />
                                              <span className="font-medium">{category.name}</span>
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
                                    className="p-1 h-8 w-8 hover:bg-purple-100 rounded-lg" 
                                    onClick={createCategory}
                                  >
                                    <PlusCircle className="h-4 w-4 text-purple-600" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
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
                      <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white/80">
                        <Wallet className="h-5 w-5 text-gray-500 mt-3" />
                        <div className="flex-1">
                          <FormLabel className="text-sm font-medium text-gray-700 mb-2 block">
                            Dompet <span className="text-red-500">*</span>
                          </FormLabel>
                          <div className="flex items-center">
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 bg-transparent">
                                  <SelectValue placeholder="Pilih Dompet">
                                    {field.value && (
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                          style={{ 
                                            backgroundColor: wallets.find(w => w.id === field.value)?.color || '#6B7280' 
                                          }}
                                        />
                                        <span className="font-medium">
                                          {wallets.find(w => w.id === field.value)?.name}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                          ({formatCurrency(wallets.find(w => w.id === field.value)?.balance || 0)})
                                        </span>
                                      </div>
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="w-full">
                                {wallets.length > 0 ? (
                                  wallets.map((wallet) => (
                                    <SelectItem key={wallet.id} value={wallet.id} className="p-3">
                                      <div className="flex items-center gap-3 w-full">
                                        <div 
                                          className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                                          style={{ backgroundColor: wallet.color || '#6B7280' }}
                                        />
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-900">{wallet.name}</span>
                                            <span className="text-sm font-semibold text-green-600">
                                              {formatCurrency(wallet.balance)}
                                            </span>
                                          </div>
                                          {wallet.type && (
                                            <span className="text-xs text-gray-500 capitalize">{wallet.type}</span>
                                          )}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-wallet" disabled>
                                    Tidak ada dompet tersedia
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="ml-2 p-1 h-8 w-8 hover:bg-gray-100" 
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
                // Transfer wallets (source and destination) - Modern Cards
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="source_wallet"
                    render={({ field }) => (
                      <FormItem>
                        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all">
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Wallet className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">
                                  Dompet Sumber <span className="text-red-500">*</span>
                                </FormLabel>
                                <div className="flex items-center gap-2">
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 bg-transparent flex-1">
                                        <SelectValue placeholder="Pilih dompet sumber">
                                          {field.value && (
                                            <div className="flex items-center gap-2">
                                              <div 
                                                className="w-3 h-3 rounded-full border border-white shadow-sm"
                                                style={{ 
                                                  backgroundColor: wallets.find(w => w.id === field.value)?.color || '#6B7280' 
                                                }}
                                              />
                                              <span className="font-medium text-gray-900">
                                                {wallets.find(w => w.id === field.value)?.name}
                                              </span>
                                              <span className="text-sm text-gray-500">
                                                ({formatCurrency(wallets.find(w => w.id === field.value)?.balance || 0)})
                                              </span>
                                            </div>
                                          )}
                                        </SelectValue>
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {wallets.map((wallet) => (
                                        <SelectItem key={wallet.id} value={wallet.id} className="p-3">
                                          <div className="flex items-center gap-3 w-full">
                                            <div 
                                              className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                                              style={{ backgroundColor: wallet.color || '#6B7280' }}
                                            />
                                            <div className="flex-1">
                                              <div className="flex items-center justify-between">
                                                <span className="font-medium text-gray-900">{wallet.name}</span>
                                                <span className="text-sm font-semibold text-green-600">
                                                  {formatCurrency(wallet.balance)}
                                                </span>
                                              </div>
                                              {wallet.type && (
                                                <span className="text-xs text-gray-500 capitalize">{wallet.type}</span>
                                              )}
                                            </div>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="p-1 h-8 w-8 hover:bg-blue-100 rounded-lg" 
                                    onClick={createWallet}
                                  >
                                    <PlusCircle className="h-4 w-4 text-blue-600" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {watchSourceWallet && (
                    <div className="flex justify-center my-4">
                      <div className="w-10 h-10 bg-gradient-to-b from-blue-100 to-orange-100 rounded-full flex items-center justify-center">
                        <ArrowDown className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="destination_wallet"
                    render={({ field }) => (
                      <FormItem>
                        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all">
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Wallet className="h-5 w-5 text-orange-600" />
                              </div>
                              <div className="flex-1">
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">
                                  Dompet Tujuan <span className="text-red-500">*</span>
                                </FormLabel>
                                <div className="flex items-center gap-2">
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 bg-transparent flex-1">
                                        <SelectValue placeholder="Pilih dompet tujuan">
                                          {field.value && (
                                            <div className="flex items-center gap-2">
                                              <div 
                                                className="w-3 h-3 rounded-full border border-white shadow-sm"
                                                style={{ 
                                                  backgroundColor: wallets.find(w => w.id === field.value)?.color || '#6B7280' 
                                                }}
                                              />
                                              <span className="font-medium text-gray-900">
                                                {wallets.find(w => w.id === field.value)?.name}
                                              </span>
                                              <span className="text-sm text-gray-500">
                                                ({formatCurrency(wallets.find(w => w.id === field.value)?.balance || 0)})
                                              </span>
                                            </div>
                                          )}
                                        </SelectValue>
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {wallets
                                        .filter(wallet => wallet.id !== watchSourceWallet)
                                        .map((wallet) => (
                                          <SelectItem key={wallet.id} value={wallet.id} className="p-3">
                                            <div className="flex items-center gap-3 w-full">
                                              <div 
                                                className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                                                style={{ backgroundColor: wallet.color || '#6B7280' }}
                                              />
                                              <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                  <span className="font-medium text-gray-900">{wallet.name}</span>
                                                  <span className="text-sm font-semibold text-green-600">
                                                    {formatCurrency(wallet.balance)}
                                                  </span>
                                                </div>
                                                {wallet.type && (
                                                  <span className="text-xs text-gray-500 capitalize">{wallet.type}</span>
                                                )}
                                              </div>
                                            </div>
                                          </SelectItem>
                                        ))
                                      }
                                    </SelectContent>
                                  </Select>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="p-1 h-8 w-8 hover:bg-orange-100 rounded-lg" 
                                    onClick={createWallet}
                                  >
                                    <PlusCircle className="h-4 w-4 text-orange-600" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            
              {/* Description Card */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <MessageSquareText className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">Catatan</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Catatan transaksi (opsional)" 
                                {...field}
                                className="border-0 p-0 h-auto min-h-[60px] resize-none focus-visible:ring-0 bg-transparent text-gray-900 placeholder:text-gray-500"
                              />
                            </FormControl>
                          </div>
                        </div>
                      </div>
                    </Card>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
              {/* Transfer fees fields - Fixed Mobile Keyboard */}
              {type === "transfer" && (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-gray-700 mb-3">
                    Biaya Admin (Opsional)
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="source_fee"
                      render={({ field }) => (
                        <FormItem>
                          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all">
                            <div className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                  <CreditCard className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                  <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">
                                    Biaya Admin Sumber
                                  </FormLabel>
                                  <div className="relative">
                                    <FormControl>
                                      <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={field.value ? field.value.toString() : ""}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/[^0-9]/g, '');
                                          field.onChange(value ? parseInt(value) : 0);
                                        }}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900 font-medium placeholder:text-gray-400"
                                      />
                                    </FormControl>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Biaya yang dikenakan dari dompet sumber
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Card>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="destination_fee"
                      render={({ field }) => (
                        <FormItem>
                          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all">
                            <div className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                  <CreditCard className="h-5 w-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                  <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">
                                    Biaya Admin Tujuan
                                  </FormLabel>
                                  <div className="relative">
                                    <FormControl>
                                      <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={field.value ? field.value.toString() : ""}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/[^0-9]/g, '');
                                          field.onChange(value ? parseInt(value) : 0);
                                        }}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900 font-medium placeholder:text-gray-400"
                                      />
                                    </FormControl>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Biaya yang ditambahkan ke dompet tujuan
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Card>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
      
      {/* Bottom action bar fixed - Modern Design */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
        <div className="max-w-xl mx-auto p-4 flex gap-3 w-full">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="flex-1 h-12 rounded-xl border-gray-300 hover:bg-gray-50 font-medium"
          >
            Batal
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            className={cn(
              "flex-1 h-12 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200",
              type === "income" 
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" 
                : type === "expense" 
                ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            )}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {type === "transfer" ? (
                  <ArrowLeftRight className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>
                  {isEditMode ? "Simpan Perubahan" : type === "transfer" ? "Transfer" : "Simpan"}
                </span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionPage;
