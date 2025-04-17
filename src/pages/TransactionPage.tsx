
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ChevronLeft, Calendar, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";

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

const incomeCategories = ["Gaji", "Bonus", "Investasi", "Lainnya"];
const expenseCategories = ["Belanja", "Makanan", "Transport", "Lainnya"];

const TransactionPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);

  const form = useForm({
    defaultValues: {
      title: "",
      amount: 0,
      category: "",
      date: new Date().toISOString().split("T")[0],
      wallet: "",
      description: "",
      source_wallet: "",
      destination_wallet: "",
      source_fee: 0,
      destination_fee: 0,
    },
  });

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
        return "Tambah Pemasukan Baru";
      case "expense":
        return "Tambah Pengeluaran Baru";
      case "transfer":
        return "Convert Saldo";
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

  const getSuccessCardColor = () => {
    switch (type) {
      case "income":
        return "bg-green-500";
      case "expense":
        return "bg-red-500";
      case "transfer":
        return "bg-blue-500";
      default:
        return "bg-primary";
    }
  };

  const getSuccessIcon = () => {
    switch (type) {
      case "income":
        return "↑";
      case "expense":
        return "↓";
      case "transfer":
        return "↔";
      default:
        return "✓";
    }
  };

  const onSubmit = async (data: any) => {
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
            user_id: user.id
          })
          .select()
          .single();
          
        if (transferError) throw transferError;
        
        // Update source wallet (deduct)
        await supabase
          .from("wallets")
          .update({ 
            balance: sourceWallet.balance - data.amount - (data.source_fee || 0) 
          })
          .eq("id", sourceWallet.id);
          
        // Update destination wallet (add)
        await supabase
          .from("wallets")
          .update({ 
            balance: destWallet.balance + data.amount - (data.destination_fee || 0) 
          })
          .eq("id", destWallet.id);
          
        transactionData = transferData;
      } else {
        // Handle income or expense transaction
        const wallet = wallets.find(w => w.id === data.wallet);
        
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
            user_id: user.id
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
    navigate("/");
  };

  // Show success screen
  if (showSuccess && transaction) {
    const date = new Date();
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className={`w-full max-w-md overflow-hidden ${getSuccessCardColor()} text-white`}>
          <div className="flex justify-between items-center p-4">
            <h2 className="font-semibold text-lg">Transaksi Berhasil</h2>
            <button onClick={handleClose} className="text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 flex flex-col items-center">
            <div className="rounded-full bg-white/20 p-4 mb-4 w-16 h-16 flex items-center justify-center">
              <div className="text-3xl font-bold">{getSuccessIcon()}</div>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold">{formatCurrency(transaction.amount)}</h3>
              <p className="text-white/80">
                {type === "income" ? "Pemasukan" : type === "expense" ? "Pengeluaran" : "Transfer"}
              </p>
            </div>
          </div>
          
          <div className="bg-white/10 p-4">
            <div className="flex justify-between mb-2">
              <span className="text-white/80">Tanggal</span>
              <span>{new Date(transaction.date).toLocaleDateString('id-ID')}</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-white/80">Kategori</span>
              <span>{transaction.category}</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-white/80">Wallet</span>
              <span>{form.getValues().wallet ? wallets.find(w => w.id === form.getValues().wallet)?.name : "-"}</span>
            </div>
            
            <div className="mt-4 text-xs text-center text-white/60">
              <div>ID: {transaction.id}</div>
              <div>Terima kasih telah menggunakan aplikasi ini</div>
            </div>
          </div>
          
          <div className="p-4">
            <Button 
              onClick={handleClose} 
              className="w-full bg-white text-gray-800 hover:bg-white/90">
              Tutup
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex flex-col z-50">
      <div className="bg-white rounded-t-xl flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between border-b p-4">
          <button onClick={handleClose} className="p-1">
            <X className="h-5 w-5" />
          </button>
          <h2 className="font-semibold">{getPageTitle()}</h2>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>
        
        <div className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="date" 
                          {...field}
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none h-4 w-4" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {type !== "transfer" && (
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={`Pilih kategori ${type === "income" ? "pemasukan" : "pengeluaran"}`} />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {type !== "transfer" ? (
                <FormField
                  control={form.control}
                  name="wallet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Transaksi</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Dompet" />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="source_wallet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wallet Sumber</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="destination_wallet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wallet Tujuan</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih wallet tujuan" />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nominal</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {type === "transfer" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="source_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biaya Admin Sumber</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={e => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="destination_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biaya Admin Tujuan</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={e => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Deskripsi transaksi (opsional)" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}>
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  className={getButtonColor()}
                  disabled={loading}>
                  {loading ? "Menyimpan..." : type === "transfer" ? "Konversi" : "Simpan"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default TransactionPage;
