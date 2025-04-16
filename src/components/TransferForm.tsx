
import React, { useState, useEffect } from "react";
import { ArrowDownUp } from "lucide-react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wallet } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const transferSchema = z.object({
  amount: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
  date: z.string(),
  sourceWallet: z.string().min(1, "Wallet asal harus dipilih"),
  destinationWallet: z.string().min(1, "Wallet tujuan harus dipilih"),
  description: z.string().optional(),
  fee: z.coerce.number().min(0, "Biaya admin tidak boleh negatif").default(0),
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface TransferFormProps {
  onAddTransaction: (transaction: any) => void;
  onClose?: () => void;
}

const TransferForm = ({ onAddTransaction, onClose }: TransferFormProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      sourceWallet: "",
      destinationWallet: "",
      description: "",
      fee: 0,
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      setTimeout(onClose, 300); // Allow animation to complete
    }
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
      } catch (error) {
        console.error("Error fetching wallets:", error);
        toast({
          title: "Gagal memuat wallet",
          description: "Terjadi kesalahan saat mengambil data wallet",
          variant: "destructive",
        });
      }
    };

    fetchWallets();
  }, [toast]);

  const onSubmit = async (data: TransferFormValues) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "Anda harus login terlebih dahulu",
          variant: "destructive"
        });
        return;
      }

      const sourceWallet = wallets.find(w => w.id === data.sourceWallet);
      const destWallet = wallets.find(w => w.id === data.destinationWallet);

      if (!sourceWallet || !destWallet) {
        toast({
          title: "Error",
          description: "Wallet tidak ditemukan",
          variant: "destructive"
        });
        return;
      }

      const actualTransferAmount = data.amount - data.fee;

      // First, check if source wallet has enough balance
      if (sourceWallet.balance < data.amount) {
        toast({
          title: "Saldo tidak cukup",
          description: `Saldo di ${sourceWallet.name} tidak mencukupi`,
          variant: "destructive"
        });
        return;
      }

      // Update source wallet (subtract amount)
      const { error: sourceWalletError } = await supabase
        .from('wallets')
        .update({ balance: sourceWallet.balance - data.amount })
        .eq('id', data.sourceWallet);

      if (sourceWalletError) throw sourceWalletError;

      // Update destination wallet (add amount minus fee)
      const { error: destWalletError } = await supabase
        .from('wallets')
        .update({ balance: destWallet.balance + actualTransferAmount })
        .eq('id', data.destinationWallet);

      if (destWalletError) throw destWalletError;

      // Record the transfer transaction
      const transferData = {
        user_id: session.user.id,
        title: `Transfer dari ${sourceWallet.name} ke ${destWallet.name}`,
        amount: data.amount,
        type: "transfer",
        category: "Transfer",
        description: data.description || `Transfer dengan biaya admin Rp ${data.fee.toLocaleString()}`,
        date: data.date,
        wallet: data.sourceWallet,
        destination_wallet: data.destinationWallet,
        fee: data.fee,
      };

      const { data: insertedData, error } = await supabase
        .from('transactions')
        .insert(transferData)
        .select();

      if (error) throw error;

      // Call onAddTransaction with the new transaction data
      onAddTransaction({
        ...transferData,
        id: insertedData[0].id,
      });

      toast({
        title: "Transfer berhasil",
        description: `Transfer dari ${sourceWallet.name} ke ${destWallet.name} sebesar Rp ${actualTransferAmount.toLocaleString()} berhasil`,
      });

      // Play a bell sound effect
      const audio = new Audio("/bell-sound.mp3");
      audio.play().catch(e => console.log("Sound play error:", e));

      form.reset();
      handleClose();
    } catch (error) {
      console.error("Error processing transfer:", error);
      toast({
        title: "Gagal melakukan transfer",
        description: "Terjadi kesalahan saat memproses transfer",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ArrowDownUp className="w-5 h-5" />
            Transfer Antar Wallet
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="sourceWallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Asal</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih wallet asal" />
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
                name="destinationWallet"
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
                        {wallets
                          .filter(w => w.id !== form.getValues("sourceWallet"))
                          .map(wallet => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                              {wallet.name} (Rp {wallet.balance.toLocaleString()})
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Transfer (Rp)</FormLabel>
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
                name="fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biaya Admin (Rp)</FormLabel>
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi (Opsional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="Deskripsi transfer" 
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="bg-blue-50 p-3 rounded-lg mt-4">
                <p className="text-sm font-medium">Ringkasan Transfer</p>
                <div className="text-sm mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Jumlah Transfer:</span>
                    <span>Rp {form.getValues("amount").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biaya Admin:</span>
                    <span>- Rp {form.getValues("fee").toLocaleString()}</span>
                  </div>
                  <div className="border-t border-blue-200 my-1"></div>
                  <div className="flex justify-between font-medium">
                    <span>Total Diterima:</span>
                    <span>Rp {(form.getValues("amount") - form.getValues("fee")).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Proses Transfer
                </button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TransferForm;
