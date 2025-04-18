import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ChevronLeft, Calendar, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

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

type Category = Database['public']['Tables']['categories']['Row'];
type Wallet = Database['public']['Tables']['wallets']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

interface TransactionFormData {
  title: string;
  amount: number;
  category: string;
  date: string;
  wallet_id: string;
  description?: string;
  source_wallet?: string;
  destination_wallet?: string;
  source_fee?: number;
  destination_fee?: number;
}

const TransactionPage = () => {
  const { type, id: transactionId } = useParams<{ type: string; id?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionResult, setTransactionResult] = useState<Transaction | null>(null);
  const isEditMode = !!transactionId;

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

  useEffect(() => {
    if (user) {
      setLoadingInitialData(true);
      Promise.all([fetchWallets(), fetchCategories()])
        .then(() => {
          if (isEditMode && transactionId) {
            fetchTransactionDetails(transactionId);
          }
        })
        .catch(error => {
          console.error("Error loading initial data:", error);
          toast({
            title: "Gagal memuat data",
            description: "Terjadi kesalahan saat memuat data. Silakan coba lagi.",
            variant: "destructive"
          });
        })
        .finally(() => {
          setLoadingInitialData(false);
        });
    }
    
    // Preload sound
    const audio = new Audio("/bell-sound.mp3");
    audio.volume = 0.5;
    audio.load();
  }, [transactionId, isEditMode, user]);

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
      throw error;
    }
  };

  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order('name', { ascending: true });
        
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  };

  const fetchTransactionDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data) {
        form.reset({
          title: data.title,
          amount: data.amount,
          category: data.category || "transfer", // Default ke "transfer" jika kosong
          date: data.date,
          wallet_id: data.wallet_id || '', 
          description: data.description || '',
          source_wallet: data.wallet_id || '', 
          destination_wallet: data.destination_wallet_id || '',
          source_fee: data.fee || 0,
          destination_fee: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      toast({
        title: "Gagal Memuat Detail",
        description: "Tidak dapat memuat detail transaksi untuk diedit",
        variant: "destructive"
      });
      navigate(-1);
    }
  };

  const getPageTitle = () => {
    if (isEditMode) {
      switch (type) {
        case "income": return "Edit Pemasukan";
        case "expense": return "Edit Pengeluaran";
        case "transfer": return "Edit Transfer";
        default: return "Edit Transaksi";
      }
    } else {
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

  const onSubmit = async (data: TransactionFormData) => {
    if (!user) return;
    setLoading(true);
    
    try {
      let transactionData: Transaction | null = null;
      const actionType = isEditMode ? 'diperbarui' : 'ditambahkan';

      if (type === "transfer") {
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
        
        const totalFees = (data.source_fee || 0) + (data.destination_fee || 0);
        
        const transferPayload = {
          title: data.title || `Transfer dari ${sourceWallet.name} ke ${destWallet.name}`,
          amount: data.amount,
          type: "transfer",
          date: data.date,
          category: "Transfer",
          description: data.description,
          user_id: user.id,
          wallet_id: data.source_wallet,
          destination_wallet_id: data.destination_wallet,
          fee: totalFees,
          updated_at: new Date().toISOString(),
        };

        if (isEditMode && transactionId) {
          const { data: updatedData, error } = await supabase
            .from('transactions')
            .update(transferPayload)
            .eq('id', transactionId)
            .select()
            .single();
          if (error) throw error;
          transactionData = updatedData;
          await supabase
            .from("wallets")
            .update({ 
              balance: sourceWallet.balance - data.amount 
            })
            .eq("id", sourceWallet.id);
          await supabase
            .from("wallets")
            .update({ 
              balance: destWallet.balance + (data.amount - totalFees)
            })
            .eq("id", destWallet.id);
        } else {
          const { data: transferData, error: transferError } = await supabase
            .from("transactions")
            .insert({ ...transferPayload, created_at: new Date().toISOString() })
            .select()
            .single();
          if (transferError) throw transferError;
          transactionData = transferData;
          await supabase
            .from("wallets")
            .update({ 
              balance: sourceWallet.balance - data.amount 
            })
            .eq("id", sourceWallet.id);
          await supabase
            .from("wallets")
            .update({ 
              balance: destWallet.balance + (data.amount - totalFees)
            })
            .eq("id", destWallet.id);
        }
      } else {
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
        
        if (type === "expense" && wallet.balance < data.amount) {
          toast({
            title: "Saldo Tidak Cukup",
            description: "Saldo tidak mencukupi",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        const payload = {
          title: data.title || (type === "income" ? "Pemasukan" : "Pengeluaran"),
          amount: data.amount,
          type: type,
          date: data.date,
          category: data.category,
          description: data.description,
          user_id: user.id,
          wallet_id: data.wallet_id,
          updated_at: new Date().toISOString(),
        };

        if (isEditMode && transactionId) {
          const { data: updatedData, error } = await supabase
            .from('transactions')
            .update(payload)
            .eq('id', transactionId)
            .select()
            .single();
          if (error) throw error;
          transactionData = updatedData;
          const newBalance = type === "income" 
            ? wallet.balance + data.amount 
            : wallet.balance - data.amount;
          await supabase
            .from("wallets")
            .update({ balance: newBalance })
            .eq("id", wallet.id);
        } else {
          const { data: txData, error: txError } = await supabase
            .from("transactions")
            .insert({ ...payload, created_at: new Date().toISOString() })
            .select()
            .single();
          if (txError) throw txError;
          transactionData = txData;
          const newBalance = type === "income" 
            ? wallet.balance + data.amount 
            : wallet.balance - data.amount;
          await supabase
            .from("wallets")
            .update({ balance: newBalance })
            .eq("id", wallet.id);
        }
      }
      
      const audio = new Audio("/bell-sound.mp3");
      audio.volume = 0.5;
      audio.play();
      
      setTransactionResult(transactionData);
      setShowSuccess(true);
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      console.error(`Error saving transaction:`, message);
      toast({
        title: `Gagal ${isEditMode ? 'Memperbarui' : 'Menyimpan'} Transaksi`,
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate("/home");
  };

  if (showSuccess && transactionResult) {
    const date = new Date();
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className={`w-full max-w-md overflow-hidden ${getSuccessCardColor()} text-white`}>
          <div className="flex justify-between items-center p-4">
            <h2 className="font-semibold text-lg">Transaksi Berhasil</h2>
            <button 
              onClick={handleClose} 
              className="text-white hover:text-white/80" 
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 flex flex-col items-center">
            <div className="rounded-full bg-white/20 p-4 mb-4 w-16 h-16 flex items-center justify-center">
              <div className="text-3xl font-bold">{getSuccessIcon()}</div>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold">{formatCurrency(transactionResult.amount)}</h3>
              <p className="text-white/80">
                {type === "income" ? "Pemasukan" : type === "expense" ? "Pengeluaran" : "Transfer"}
              </p>
            </div>
          </div>
          
          <div className="bg-white/10 p-4">
            <div className="flex justify-between mb-2">
              <span className="text-white/80">Tanggal</span>
              <span>{new Date(transactionResult.date).toLocaleDateString('id-ID')}</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-white/80">Kategori</span>
              <span>{categories.find(c => c.id === transactionResult.category)?.name || transactionResult.category}</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-white/80">Wallet</span>
              <span>{type === "transfer" ? 
                `${wallets.find(w => w.id === transactionResult.wallet_id)?.name} → ${wallets.find(w => w.id === transactionResult.destination_wallet_id)?.name}` : 
                wallets.find(w => w.id === transactionResult.wallet_id)?.name}</span>
            </div>
            
            {type === "transfer" && transactionResult.fee > 0 && (
              <div className="flex justify-between mb-2">
                <span className="text-white/80">Biaya Admin</span>
                <span>{formatCurrency(transactionResult.fee)}</span>
              </div>
            )}
            
            <div className="mt-4 text-xs text-center text-white/60">
              <div>ID: {transactionResult.id}</div>
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

  if (!type) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Tipe Transaksi Tidak Valid</h2>
          <p className="text-gray-600 mb-4">Silakan pilih tipe transaksi yang valid (pemasukan/pengeluaran/transfer)</p>
          <Button onClick={() => navigate('/home')}>Kembali ke Home</Button>
        </div>
      </div>
    );
  }

  const filteredCategories = categories.filter(cat => 
    type === 'transfer' ? false : cat.type === type
  );

  if (loadingInitialData && isEditMode) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="fixed top-0 left-0 right-0 z-10 bg-white shadow-sm">
        <div className="container flex items-center h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-2"
            aria-label="Kembali"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="container pt-20 pb-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-medium">
                    {type === "income"
                      ? "Pemasukan"
                      : type === "expense"
                      ? "Pengeluaran"
                      : "Transfer"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {type === "income"
                      ? "Tambahkan pemasukan baru"
                      : type === "expense"
                      ? "Catat pengeluaran baru"
                      : "Transfer antar dompet"}
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Judul</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Masukkan judul"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Jumlah</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {type !== 'transfer' && (
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Kategori</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || 'default-category'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingInitialData ? (
                              <SelectItem value="loading" disabled>Memuat kategori...</SelectItem>
                            ) : filteredCategories.length > 0 ? (
                              filteredCategories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  <div className="flex items-center gap-2">
                                    {category.icon && (
                                      <div 
                                        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px]"
                                        style={{ backgroundColor: category.color || '#666' }}
                                      >
                                        <i className={`fas fa-${category.icon}`}></i>
                                      </div>
                                    )}
                                    {category.name}
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-categories">
                                Tidak ada kategori {type === 'income' ? 'pemasukan' : 'pengeluaran'}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Tanggal</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="date"
                          {...field}
                        />
                        <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {type === "transfer" ? (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="source_wallet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dompet Sumber</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || 'default-wallet'}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih dompet sumber" />
                            </SelectTrigger>
                            <SelectContent>
                              {wallets.length > 0 ? wallets.map((wallet) => (
                                <SelectItem key={wallet.id} value={wallet.id}>
                                  {wallet.name} ({formatCurrency(wallet.balance)})
                                </SelectItem>
                              )) : (
                                <SelectItem value="no-wallets">Tidak ada dompet</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biaya Admin Sumber</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={1000}
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Biaya yang dipotong dari dompet sumber
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destination_wallet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dompet Tujuan</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || 'default-wallet'}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih dompet tujuan" />
                            </SelectTrigger>
                            <SelectContent>
                              {wallets
                                .filter(w => w.id !== form.getValues("source_wallet"))
                                .map((wallet) => (
                                  <SelectItem key={wallet.id} value={wallet.id}>
                                    {wallet.name} ({formatCurrency(wallet.balance)})
                                  </SelectItem>
                                ))}
                              {(wallets.length <= 1 || !form.getValues("source_wallet")) && (
                                <SelectItem value="no-dest-wallets">Pilih dompet sumber dulu</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
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
                            min={0}
                            step={1000}
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Biaya yang dipotong dari jumlah yang diterima dompet tujuan
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="wallet_id"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Dompet</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || 'default-wallet'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih dompet" />
                          </SelectTrigger>
                          <SelectContent>
                            {wallets.length > 0 ? wallets.map((wallet) => (
                              <SelectItem key={wallet.id} value={wallet.id}>
                                {wallet.name} ({formatCurrency(wallet.balance)})
                              </SelectItem>
                            )) : (
                              <SelectItem value="no-wallets">Tidak ada dompet</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Catatan atau informasi tambahan..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>

            <div className="fixed inset-x-0 bottom-0 p-4 bg-white border-t">
              <Button
                type="submit"
                className={`w-full ${getButtonColor()}`}
                disabled={loading || loadingInitialData}
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : isEditMode ? "Simpan Perubahan" : "Simpan"
                }
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default TransactionPage;
