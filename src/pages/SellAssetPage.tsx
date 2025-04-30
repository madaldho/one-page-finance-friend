import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CircleDollarSign, CreditCard } from "lucide-react";
import { Asset } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { CurrencyInput } from "@/components/ui/currency-input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: string;
  is_default?: boolean;
}

export default function SellAssetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form fields
  const [sellAmount, setSellAmount] = useState<number>(0);
  const [adminFee, setAdminFee] = useState<number>(0);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  
  useEffect(() => {
    if (user && id) {
      fetchData();
    }
  }, [user, id]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch asset data
      const { data: assetData, error: assetError } = await supabase
        .from("assets")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (assetError) throw assetError;
      
      if (!assetData) {
        toast({
          title: "Aset tidak ditemukan",
          description: "Data aset yang Anda cari tidak ditemukan",
          variant: "destructive"
        });
        navigate("/assets");
        return;
      }
      
      setAsset(assetData);
      setSellAmount(assetData.current_value);
      
      // Fetch wallets
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("id, name, balance, type, is_default")
        .eq("user_id", user?.id);
        
      if (walletError) throw walletError;
      setWallets(walletData || []);
      
      // Set default wallet if available
      if (walletData && walletData.length > 0) {
        const defaultWallet = walletData.find(w => w.is_default);
        setSelectedWalletId(defaultWallet ? defaultWallet.id : walletData[0].id);
      }
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Gagal memuat data",
        description: "Terjadi kesalahan saat memuat data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getCategoryLabel = (category: string) => {
    const labels = {
      property: "Properti",
      vehicle: "Kendaraan",
      gold: "Emas",
      stock: "Saham",
      other: "Lainnya"
    };
    return labels[category as keyof typeof labels] || category;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!asset || !user || !selectedWalletId) return;
    
    try {
      setSubmitting(true);
      
      const netAmount = sellAmount - adminFee;
      const date = new Date().toISOString();
      
      // 1. Get current wallet balance
      const { data: walletData, error: walletFetchError } = await supabase
        .from("wallets")
        .select("balance")
        .eq("id", selectedWalletId)
        .single();
        
      if (walletFetchError) throw walletFetchError;
      
      // 2. Calculate new balance
      const newBalance = walletData ? parseFloat(walletData.balance.toString()) + netAmount : netAmount;
      
      // 3. Create transaction for asset sale
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          title: `Penjualan ${asset.name}`,
          amount: netAmount,
          type: "income",
          date: date,
          category: "asset_sale",
          wallet_id: selectedWalletId,
          description: notes || `Penjualan aset: ${asset.name} (${getCategoryLabel(asset.category)})`,
          fee: adminFee > 0 ? adminFee : null
        })
        .select("id")
        .single();
        
      if (transactionError) throw transactionError;
      
      // 4. Update wallet balance manually instead of using RPC increment
      const { error: walletUpdateError } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", selectedWalletId);
        
      if (walletUpdateError) throw walletUpdateError;
      
      // 5. Create asset_transactions table if it doesn't exist yet (optional)
      try {
        // Check if the table exists first by attempting a select
        const { count, error: checkTableError } = await supabase
          .from('asset_transactions')
          .select('*', { count: 'exact', head: true });
        
        // If table doesn't exist, create it
        if (checkTableError && checkTableError.code === '42P01') { // PostgreSQL error code for undefined_table
          // Create table via SQL (need admin rights for this)
          // In practice, this should be done via migrations or backend setup
          console.log("The asset_transactions table doesn't exist yet");
        } else {
          // Table exists, insert the record
          await supabase
            .from("asset_transactions")
            .insert({
              user_id: user.id,
              asset_id: asset.id,
              transaction_id: transactionData.id,
              amount: sellAmount,
              admin_fee: adminFee,
              net_amount: netAmount,
              type: "sale",
              date: date,
              notes: notes
            });
        }
      } catch (error) {
        console.log("Error with asset_transactions table:", error);
        // Continue anyway as this is not critical
      }
      
      // 6. Delete asset
      const { error: assetDeleteError } = await supabase
        .from("assets")
        .delete()
        .eq("id", asset.id)
        .eq("user_id", user.id);
        
      if (assetDeleteError) throw assetDeleteError;
      
      // 7. Delete asset history
      const { error: historyDeleteError } = await supabase
        .from("asset_value_history")
        .delete()
        .eq("asset_id", asset.id);
        
      if (historyDeleteError) {
        console.error("Error deleting asset history:", historyDeleteError);
        // Continue anyway as this is not critical
      }
      
      toast({
        title: "Aset berhasil dijual",
        description: `${asset.name} telah dijual dengan nilai ${formatCurrency(sellAmount)}`,
      });
      
      navigate("/assets");
      
    } catch (error) {
      console.error("Error selling asset:", error);
      toast({
        title: "Gagal menjual aset",
        description: "Terjadi kesalahan saat memproses penjualan aset",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4 pb-32 max-w-md">
        <div className="text-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Memuat data...</p>
        </div>
      </div>
    );
  }
  
  if (!asset) {
    return (
      <div className="container mx-auto p-4 pb-32 max-w-md">
        <div className="text-center my-12">
          <p className="text-gray-500">Aset tidak ditemukan.</p>
          <Button 
            variant="link" 
            onClick={() => navigate("/assets")}
            className="mt-2"
          >
            Kembali ke daftar aset
          </Button>
        </div>
      </div>
    );
  }
  
  const netAmount = sellAmount - adminFee;
  
  return (
    <div className="container mx-auto p-4 pb-32 max-w-md">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/assets/${asset.id}`)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Jual Aset</h1>
          <p className="text-sm text-gray-500">{asset.name} ({getCategoryLabel(asset.category)})</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card className="mb-6 shadow-sm border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Detail Penjualan</CardTitle>
            <CardDescription>
              Masukkan informasi penjualan aset Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nilai Jual */}
            <div className="space-y-2">
              <Label htmlFor="sell-amount">Nilai Jual</Label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5 z-10" />
                <CurrencyInput
                  id="sell-amount"
                  className="pl-10"
                  placeholder="0"
                  value={sellAmount}
                  onChange={setSellAmount}
                  showPrefix={false}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Nilai aset saat ini: {formatCurrency(asset.current_value)}
              </p>
            </div>
            
            {/* Biaya Admin */}
            <div className="space-y-2">
              <Label htmlFor="admin-fee">Biaya Admin/Pajak</Label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5 z-10" />
                <CurrencyInput
                  id="admin-fee"
                  className="pl-10"
                  placeholder="0"
                  value={adminFee}
                  onChange={setAdminFee}
                  showPrefix={false}
                />
              </div>
            </div>
            
            {/* Pilih Wallet */}
            <div className="space-y-2">
              <Label htmlFor="wallet">Masukkan Dana ke Dompet</Label>
              <Select
                value={selectedWalletId}
                onValueChange={setSelectedWalletId}
              >
                <SelectTrigger id="wallet" className="w-full">
                  <SelectValue placeholder="Pilih dompet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        {wallet.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Catatan */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Input
                id="notes"
                placeholder="Catatan tentang penjualan"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start pt-0">
            <div className="w-full px-4 py-3 bg-gray-50 -mx-4 -mb-6 rounded-b-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total Penjualan</span>
                <span className="font-semibold">{formatCurrency(sellAmount)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-500">Biaya Admin</span>
                <span className="font-semibold text-red-600">-{formatCurrency(adminFee)}</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                <span className="text-sm font-medium">Jumlah Diterima</span>
                <span className="font-bold text-lg text-green-600">{formatCurrency(netAmount)}</span>
              </div>
            </div>
          </CardFooter>
        </Card>
        
        <Button 
          type="submit" 
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          disabled={!selectedWalletId || sellAmount <= 0 || submitting}
        >
          {submitting ? "Memproses..." : "Jual Aset"}
        </Button>
      </form>
    </div>
  );
} 