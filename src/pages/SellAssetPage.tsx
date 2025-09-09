import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CircleDollarSign, CreditCard, Wallet, Calculator } from "lucide-react";
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
  color?: string;
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
        .select("id, name, balance, type, is_default, color")
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
        </div>

        <div className="container mx-auto py-2 px-2 md:px-6 max-w-2xl relative z-10 pt-6 md:pt-4 pb-32">
          <div className="flex flex-col items-center justify-center text-gray-500 py-12 backdrop-blur-sm bg-white/80 rounded-2xl shadow-sm border border-white/20">
            <div className="animate-spin w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full mb-4"></div>
            <p className="text-base font-medium">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
        </div>

        <div className="container mx-auto py-2 px-2 md:px-6 max-w-2xl relative z-10 pt-6 md:pt-4 pb-32">
          <div className="text-center py-12 backdrop-blur-sm bg-white/80 rounded-2xl shadow-sm border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CircleDollarSign className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-800">Aset tidak ditemukan</h3>
            <p className="text-gray-500 text-sm mb-6">Data aset yang Anda cari tidak tersedia.</p>
            <Button 
              onClick={() => navigate("/assets")}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium"
            >
              Kembali ke daftar aset
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  const netAmount = sellAmount - adminFee;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
      </div>

      <div className="container mx-auto py-2 px-2 md:px-6 max-w-2xl lg:max-w-3xl relative z-10 pt-6 md:pt-4 pb-32">
        {/* Header dengan glassmorphism effect */}
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/assets/${asset.id}`)}
              className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl transition-all duration-200 hover:shadow-md border border-white/30"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Jual Aset</h1>
              <p className="text-xs text-gray-500">{asset.name} ({getCategoryLabel(asset.category)})</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Card Detail Penjualan */}
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 mb-6">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-2 rounded-xl">
                  <CircleDollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Detail Penjualan</h2>
                  <p className="text-sm text-gray-500">Masukkan informasi penjualan aset Anda</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Nilai Jual */}
                <div className="space-y-3">
                  <Label htmlFor="sell-amount" className="text-sm font-semibold text-gray-700">Nilai Jual</Label>
                  <div className="relative">
                    <CircleDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                    <CurrencyInput
                      id="sell-amount"
                      className="pl-12 h-12 bg-white/80 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 font-medium"
                      placeholder="0"
                      value={sellAmount}
                      onChange={setSellAmount}
                      showPrefix={false}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-500">
                      Nilai aset saat ini: <span className="font-medium text-gray-700">{formatCurrency(asset.current_value)}</span>
                    </span>
                  </div>
                </div>
                
                {/* Biaya Admin */}
                <div className="space-y-3">
                  <Label htmlFor="admin-fee" className="text-sm font-semibold text-gray-700">Biaya Admin/Pajak</Label>
                  <div className="relative">
                    <CircleDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                    <CurrencyInput
                      id="admin-fee"
                      className="pl-12 h-12 bg-white/80 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium"
                      placeholder="0"
                      value={adminFee}
                      onChange={setAdminFee}
                      showPrefix={false}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Masukkan biaya administrasi atau pajak yang dikenakan</p>
                </div>
                
                {/* Pilih Wallet */}
                <div className="space-y-3">
                  <Label htmlFor="wallet" className="text-sm font-semibold text-gray-700">Masukkan Dana ke Dompet</Label>
                  <Select
                    value={selectedWalletId}
                    onValueChange={setSelectedWalletId}
                  >
                    <SelectTrigger id="wallet" className="h-12 bg-white/80 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200">
                      <SelectValue placeholder="Pilih dompet" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg">
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id} className="cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                              style={{ backgroundColor: wallet.color || '#6366f1' }}
                            >
                              <Wallet className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{wallet.name}</div>
                              <div className="text-xs text-gray-500">Saldo: {formatCurrency(wallet.balance)}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Catatan */}
                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">Catatan (Opsional)</Label>
                  <Input
                    id="notes"
                    placeholder="Catatan tentang penjualan"
                    className="h-12 bg-white/80 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Ringkasan Penjualan - Card terpisah */}
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 mb-6">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 p-2 rounded-xl">
                  <Calculator className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Ringkasan Penjualan</h3>
                  <p className="text-sm text-gray-500">Rincian total yang akan diterima</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Total Penjualan</span>
                  </div>
                  <span className="font-semibold text-lg text-gray-900">{formatCurrency(sellAmount)}</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Biaya Admin/Pajak</span>
                  </div>
                  <span className="font-semibold text-lg text-red-600">-{formatCurrency(adminFee)}</span>
                </div>
                
                <div className="flex justify-between items-center py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl px-4 border border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-base font-semibold text-gray-800">Jumlah Diterima</span>
                  </div>
                  <span className="font-bold text-2xl text-green-600">{formatCurrency(netAmount)}</span>
                </div>
              </div>
            </div>
            
         
          
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={!selectedWalletId || sellAmount <= 0 || submitting}
          >
            {submitting ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Memproses penjualan...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CircleDollarSign className="h-5 w-5" />
                Jual Aset
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
} 