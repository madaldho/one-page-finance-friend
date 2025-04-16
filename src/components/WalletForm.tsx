
import { useState, useEffect } from "react";
import { Wallet } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const walletTypes = [
  { id: "cash", name: "Cash" },
  { id: "bank", name: "Bank" },
  { id: "ewallet", name: "E-Wallet" },
  { id: "other", name: "Lainnya" },
];

const colorOptions = [
  { id: "green", name: "Hijau", class: "bg-green-500" },
  { id: "blue", name: "Biru", class: "bg-blue-500" },
  { id: "purple", name: "Ungu", class: "bg-purple-500" },
  { id: "pink", name: "Pink", class: "bg-pink-500" },
  { id: "orange", name: "Oranye", class: "bg-orange-500" },
  { id: "yellow", name: "Kuning", class: "bg-yellow-500" },
  { id: "red", name: "Merah", class: "bg-red-500" },
];

interface WalletFormProps {
  wallet?: Wallet;
  onClose: () => void;
  onSuccess?: () => void;
}

const WalletForm = ({ wallet, onClose, onSuccess }: WalletFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(wallet?.name || "");
  const [type, setType] = useState(wallet?.type || "cash");
  const [balance, setBalance] = useState(wallet?.balance.toString() || "0");
  const [color, setColor] = useState(wallet?.color || "green");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Nama tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const walletData = {
        name,
        type,
        balance: parseFloat(balance) || 0,
        color,
        user_id: user?.id,
      };
      
      if (wallet) {
        // Update existing wallet
        const { error } = await supabase
          .from('wallets')
          .update(walletData)
          .eq('id', wallet.id);
          
        if (error) throw error;
        
        toast({
          title: "Dompet diperbarui",
          description: `${name} berhasil diperbarui`,
        });
      } else {
        // Create new wallet
        const { error } = await supabase
          .from('wallets')
          .insert(walletData);
          
        if (error) throw error;
        
        toast({
          title: "Dompet ditambahkan",
          description: `${name} berhasil ditambahkan`,
        });
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Gagal menyimpan dompet",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{wallet ? "Edit Dompet" : "Tambah Dompet"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="color" className="block font-medium">
              Warna
            </label>
            <div className="grid grid-cols-7 gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`h-10 rounded-md ${option.class} ${
                    color === option.id ? "ring-2 ring-offset-2 ring-black" : ""
                  }`}
                  onClick={() => setColor(option.id)}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="name" className="block font-medium">
              Nama
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama dompet"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="type" className="block font-medium">
              Tipe
            </label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe dompet" />
              </SelectTrigger>
              <SelectContent>
                {walletTypes.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="balance" className="block font-medium">
              Saldo
            </label>
            <Input
              id="balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
            />
          </div>
          
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {wallet ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WalletForm;
