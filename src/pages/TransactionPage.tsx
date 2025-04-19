import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ChevronLeft, Calendar, X, ArrowLeftCircle, Wallet, Tag, MessageSquareText } from "lucide-react";
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

const incomeCategories = ["Gaji", "Bonus", "Investasi", "Lainnya"];
const expenseCategories = ["Belanja", "Makanan", "Transport", "Lainnya"];

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
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);

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
  });

  const watchAmount = form.watch("amount");
  const watchCategory = form.watch("category");
  const watchWalletId = form.watch("wallet_id");
  const watchSourceWallet = form.watch("source_wallet");
  const watchDestWallet = form.watch("destination_wallet");
  const watchSourceFee = form.watch("source_fee");
  const watchDestFee = form.watch("destination_fee");

  useEffect(() => {
    fetchWallets();
    
    // Play bell sound on component mount to preload
    const audio = new Audio("/bell-sound.mp3");
    audio.volume = 0.5;
    audio.load();
  }, []);

  const fetchWallets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id);
        
      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      console.error("Error fetching wallets:", error);
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

  const onSubmit = async (data: TransactionFormData) => {
    if (!user) return;
    setLoading(true);
    
    try {
      let transactionData: any = {};

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
        
        if (sourceWallet.balance < data.amount) {
          toast({
            title: "Saldo Tidak Cukup",
            description: "Saldo di wallet sumber tidak mencukupi",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        // Calculate total fees
        const totalFees = (data.source_fee || 0) + (data.destination_fee || 0);
        
        // Create transfer transaction
        const { data: transferData, error: transferError } = await supabase
          .from("transactions")
          .insert({
          title: data.title || `Transfer dari ${sourceWallet.name} ke ${destWallet.name}`,
          amount: data.amount,
          type: "transfer",
          date: data.date,
          category: "Transfer",
          description: data.description,
          user_id: user.id,
            wallet_id: sourceWallet.id,
            destination_wallet_id: destWallet.id,
            fee: totalFees
          })
            .select()
            .single();
          
          if (transferError) throw transferError;
        
        // Update source wallet (deduct)
          await supabase
            .from("wallets")
            .update({ 
              balance: sourceWallet.balance - data.amount 
            })
            .eq("id", sourceWallet.id);
          
        // Update destination wallet (add)
          await supabase
            .from("wallets")
            .update({ 
              balance: destWallet.balance + (data.amount - totalFees)
            })
            .eq("id", destWallet.id);
          
        transactionData = transferData;
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
          .insert({
          title: data.title || (type === "income" ? "Pemasukan" : "Pengeluaran"),
          amount: data.amount,
          type: type,
          date: data.date,
          category: data.category,
          description: data.description,
          user_id: user.id,
            wallet_id: data.wallet_id
          })
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
          
          transactionData = txData;
      }
      
      // Play success sound
      const audio = new Audio("/bell-sound.mp3");
      audio.volume = 0.5;
      audio.play();
      
      // Show success screen
      setTransaction(transactionData);
      setShowSuccess(true);
      
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      toast({
        title: "Gagal Menyimpan",
        description: error.message || "Terjadi kesalahan saat menyimpan transaksi",
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
              <span className="font-medium">{transaction.category}</span>
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
          <h2 className="font-semibold">{getPageTitle()}</h2>
          <div className="w-8"></div> {/* Spacer for centering */}
        </div>
      </div>

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
                      <FormLabel className="text-gray-500 text-sm">Nominal</FormLabel>
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
                        <Select
                          onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
                            <FormControl>
                              <SelectTrigger className="border-0 p-0 h-auto focus:ring-0">
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                            </FormControl>
                          <SelectContent>
                              {(type === "income" ? incomeCategories : expenseCategories).map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
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
                          <FormLabel className="text-xs text-gray-500">Wallet</FormLabel>
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
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            
              {/* Judul transaksi */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200">
                      <MessageSquareText className="h-4 w-4 text-gray-500 mt-2" />
                      <div className="flex-1">
                        <FormLabel className="text-xs text-gray-500">Judul Transaksi</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={type === "income" ? "Contoh: Gaji Bulanan" : type === "expense" ? "Contoh: Belanja Bulanan" : "Contoh: Transfer ke BCA"}
                            {...field}
                            className="border-0 p-0 h-auto mt-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </FormControl>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
              {/* Deskripsi */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200">
                      <MessageSquareText className="h-4 w-4 text-gray-500 mt-2" />
                      <div className="flex-1">
                        <FormLabel className="text-xs text-gray-500">Deskripsi</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Deskripsi transaksi (opsional)" 
                            {...field}
                            className="border-0 p-0 h-auto mt-1 min-h-[40px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
                      <span className="font-medium">- {formatCurrency((watchSourceFee || 0) + (watchDestFee || 0))}</span>
                    </div>
                    <div className="border-t border-blue-200 my-2 pt-2"></div>
                    <div className="flex justify-between font-medium">
                      <span>Total Diterima:</span>
                      <span className="font-medium">{formatCurrency(watchAmount - (watchSourceFee || 0) - (watchDestFee || 0))}</span>
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
            {loading ? "Menyimpan..." : type === "transfer" ? "Transfer" : "Simpan"}
              </Button>
            </div>
      </div>
    </div>
  );
};

export default TransactionPage;
