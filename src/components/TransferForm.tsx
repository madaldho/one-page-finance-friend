import React, { useState, useEffect } from "react";
import { ArrowDownUp, AlertCircle } from "lucide-react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "./ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Transaction } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { Separator } from "./ui/separator";

const transferSchema = z.object({
  amount: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
  date: z.string(),
  sourceWallet: z.string().min(1, "Wallet asal harus dipilih"),
  destinationWallet: z.string().min(1, "Wallet tujuan harus dipilih"),
  description: z.string().optional(),
  sourceFee: z.coerce.number().min(0, "Biaya admin tidak boleh negatif").default(0),
  destinationFee: z.coerce.number().min(0, "Biaya admin tidak boleh negatif").default(0),
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface TransferFormProps {
  onAddTransaction: (transaction: Transaction) => void;
  onClose?: () => void;
}

const TransferForm = ({ onAddTransaction, onClose }: TransferFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
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
      sourceFee: 0,
      destinationFee: 0,
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

  const handleNavigateToTransferPage = () => {
    setIsOpen(false);
    if (onClose) {
      setTimeout(() => {
        navigate('/transaction/transfer', { 
          state: { 
            enableSeparateFees: true 
          } 
        });
      }, 300);
    }
  };

  // Instead of handling the transfer directly, we'll redirect to the transaction page
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ArrowDownUp className="w-5 h-5" />
            Transfer Antar Wallet
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 mb-2 px-1">
          <Card className="bg-amber-50 border-amber-200 p-3">
            <div className="flex gap-2">
              <AlertCircle className="text-amber-500 h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Biaya Admin Terpisah</p>
                <p className="text-xs text-amber-700 mt-1">
                  Anda dapat mencatat biaya admin untuk masing-masing wallet secara terpisah.
                  Misalnya, biaya admin OVO 2.000 dan biaya admin BCA 3.000.
                </p>
              </div>
            </div>
          </Card>
        </div>
        <Separator className="my-4" />
        <div className="mt-4 flex flex-col items-center justify-center">
          <img src="/placeholder.svg" alt="Transfer illustration" className="w-32 h-32 mb-4" />
          <h3 className="text-lg font-medium mb-2">Lakukan Transfer Antar Wallet</h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            Transfer dana antar wallet Anda dengan mudah dan pantau setiap pergerakan dana dengan biaya admin yang terpisah.
          </p>
          <Button 
            onClick={handleNavigateToTransferPage}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Lanjutkan ke Transfer
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="w-full mt-2"
          >
            Batal
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TransferForm;
