
import React, { useState, useEffect } from "react";
import { PlusCircle, MinusCircle } from "lucide-react";
import { Input } from "./ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { CategoryBadge } from "./CategoryBadge";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Wallet } from "@/types";

const transactionSchema = z.object({
  title: z.string().min(1, "Deskripsi tidak boleh kosong"),
  amount: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
  date: z.string(),
  type: z.enum(["income", "expense"]),
  category: z.string().optional(),
  wallet: z.string().min(1, "Wallet harus dipilih"),
  description: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onAddTransaction: (transaction: any) => void;
  type: "income" | "expense";
  onClose?: () => void;
}

const TransactionForm = ({ onAddTransaction, type, onClose }: TransactionFormProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      title: "",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      type: type,
      category: "",
      wallet: "",
      description: "",
    },
  });

  const categories = {
    income: ["Gaji", "Bonus", "Investasi", "Penjualan", "Hadiah"],
    expense: ["Makanan", "Transportasi", "Tagihan", "Belanja", "Hiburan", "Kesehatan"]
  };
  
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const { data, error } = await supabase
          .from("wallets")
          .select("*")
          .order("name");

        if (error) {
          throw error;
        }

        setWallets(data || []);
        
        // Set default wallet if available
        if (data && data.length > 0) {
          form.setValue("wallet", data[0].id);
        }
      } catch (error) {
        console.error("Error fetching wallets:", error);
        toast({
          title: "Gagal memuat wallet",
          description: "Terjadi kesalahan saat mengambil data wallet",
          variant: "destructive",
        });
      }
    };

    if (isOpen) {
      fetchWallets();
    }
  }, [isOpen, form, toast]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      setTimeout(onClose, 300); // Allow animation to complete
    }
  };
  
  const onSubmit = async (data: TransactionFormValues) => {
    try {
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "Anda harus login terlebih dahulu",
          variant: "destructive"
        });
        return;
      }

      // Get the wallet
      const wallet = wallets.find(w => w.id === data.wallet);
      if (!wallet) {
        toast({
          title: "Error",
          description: "Wallet tidak ditemukan",
          variant: "destructive"
        });
        return;
      }

      // For expense, check if wallet has enough balance
      if (type === "expense" && wallet.balance < data.amount) {
        toast({
          title: "Saldo tidak cukup",
          description: `Saldo di ${wallet.name} tidak mencukupi`,
          variant: "destructive"
        });
        return;
      }

      // Update wallet balance
      const newBalance = type === "income"
        ? wallet.balance + data.amount
        : wallet.balance - data.amount;

      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', data.wallet);

      if (walletError) {
        throw walletError;
      }

      // Prepare the transaction data for Supabase
      const transactionData = {
        user_id: session.user.id,
        title: data.title,
        amount: data.amount,
        type: data.type,
        category: data.category || (data.type === "income" ? "Lainnya" : "Lainnya"),
        date: new Date(data.date).toISOString().slice(0, 10),
        wallet: data.wallet,
        description: data.description,
      };

      // Insert transaction into Supabase
      const { data: insertedData, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select();

      if (error) {
        throw error;
      }

      // Call the onAddTransaction prop with the new transaction
      onAddTransaction({
        ...transactionData,
        id: insertedData[0].id,
        date: new Date(data.date).toLocaleDateString('id-ID', { 
          day: "numeric", 
          month: "short", 
          year: "numeric" 
        }),
      });

      toast({
        title: "Transaksi berhasil ditambahkan",
        description: `${data.type === "income" ? "Pemasukan" : "Pengeluaran"} ${data.title} sebesar Rp${data.amount.toLocaleString()}`,
      });

      // Play a bell sound effect
      const audio = new Audio("/bell-sound.mp3");
      audio.play().catch(e => console.log("Sound play error:", e));

      form.reset();
      handleClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Gagal menambahkan transaksi",
        description: "Terjadi kesalahan saat menyimpan transaksi",
        variant: "destructive"
      });
    }
  };

  // If getting called from a button (not the floating action button)
  if (!onClose) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
            type === "income" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
          }`} onClick={handleOpen}>
            {type === "income" ? (
              <>
                <PlusCircle className="inline-block w-4 h-4 mr-1" />
                Input Pemasukan
              </>
            ) : (
              <>
                <MinusCircle className="inline-block w-4 h-4 mr-1" />
                Input Pengeluaran
              </>
            )}
          </button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {type === "income" ? "Input Pemasukan Baru" : "Input Pengeluaran Baru"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={
                            type === "income" 
                              ? "Contoh: Gaji Bulanan" 
                              : "Contoh: Belanja Bulanan"
                          } 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah (Rp)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="wallet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih wallet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets.map(wallet => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                              {wallet.name} (Rp {wallet.balance.toLocaleString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {categories[type].map((category) => (
                          <div 
                            key={category}
                            onClick={() => field.onChange(category)}
                            className={`cursor-pointer ${
                              field.value === category 
                                ? 'ring-2 ring-offset-1 ring-offset-background' 
                                : ''
                            }`}
                          >
                            <CategoryBadge category={category} />
                          </div>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan (Opsional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Catatan tambahan" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                      type === "income" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    Simpan Transaksi
                  </button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // If being used by the floating action button
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {type === "income" ? "Input Pemasukan Baru" : "Input Pengeluaran Baru"}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Same form fields as above */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={
                          type === "income" 
                            ? "Contoh: Gaji Bulanan" 
                            : "Contoh: Belanja Bulanan"
                        } 
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah (Rp)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="wallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih wallet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.map(wallet => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name} (Rp {wallet.balance.toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {categories[type].map((category) => (
                        <div 
                          key={category}
                          onClick={() => field.onChange(category)}
                          className={`cursor-pointer ${
                            field.value === category 
                              ? 'ring-2 ring-offset-1 ring-offset-background' 
                              : ''
                          }`}
                        >
                          <CategoryBadge category={category} />
                        </div>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Catatan tambahan" 
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                    type === "income" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TransactionForm;
