import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CircleDollarSign, CreditCard, Wallet } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
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
  const [sellQuantity, setSellQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [adminFee, setAdminFee] = useState<number>(0);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  
  // Slider states
  const [sellPercentage, setSellPercentage] = useState<number>(100); // Default 100% (sell all)
  const [sellMode, setSellMode] = useState<'percentage' | 'quantity'>('percentage');
  const [isEditingPercentage, setIsEditingPercentage] = useState<boolean>(false);
  const [isEditingQuantity, setIsEditingQuantity] = useState<boolean>(false);
  
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
      
      // Set as Asset type with fallback values for backward compatibility
      const safeAsset = {
        ...assetData,
        quantity: (assetData as any).quantity || 1,
        unit_type: (assetData as any).unit_type || (assetData.category === 'gold' ? 'grams' : assetData.category === 'stock' ? 'shares' : 'unit'),
        is_divisible: (assetData as any).is_divisible !== undefined ? (assetData as any).is_divisible : (assetData.category === 'stock' || assetData.category === 'gold')
      } as Asset;
      
      setAsset(safeAsset);
      
      // Set initial values based on asset quantity and value
      const totalQuantity = safeAsset.quantity || 1;
      const pricePerUnit = safeAsset.current_value / totalQuantity;
      
      setSellQuantity(totalQuantity); // Default sell all
      setSellPercentage(100); // Default 100%
      setUnitPrice(pricePerUnit);
      setSellAmount(safeAsset.current_value);
      
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
  
  const getUnitLabel = (unitType: string) => {
    const labels = {
      shares: "lembar",
      grams: "gram",
      unit: "unit",
      lot: "lot",
      kg: "kg",
      meter: "meter",
      m2: "m²",
      buah: "buah",
      pcs: "pcs",
      botol: "botol",
      kotak: "kotak",
      koin: "koin",
      token: "token"
    };
    return labels[unitType as keyof typeof labels] || unitType;
  };
  
  // Handler for manual percentage input
  const handleManualPercentageChange = (value: string) => {
    const percentage = parseFloat(value) || 0;
    const validPercentage = Math.min(Math.max(percentage, 0), 100);
    setSellPercentage(validPercentage);
    
    if (!asset) return;
    const totalQuantity = asset.quantity || 1;
    const newQuantity = (totalQuantity * validPercentage) / 100;
    setSellQuantity(newQuantity);
    
    const pricePerUnit = asset.current_value / totalQuantity;
    const newSellAmount = newQuantity * pricePerUnit;
    setSellAmount(newSellAmount);
    setUnitPrice(pricePerUnit);
  };

  // Handler for manual quantity input
  const handleManualQuantityChange = (value: string) => {
    const quantity = parseFloat(value) || 0;
    const maxQuantity = asset?.quantity || 1;
    const validQuantity = Math.min(Math.max(quantity, 0), maxQuantity);
    setSellQuantity(validQuantity);
    
    if (!asset) return;
    const totalQuantity = asset.quantity || 1;
    const percentage = (validQuantity / totalQuantity) * 100;
    setSellPercentage(percentage);
    
    const pricePerUnit = asset.current_value / totalQuantity;
    const newSellAmount = validQuantity * pricePerUnit;
    setSellAmount(newSellAmount);
    setUnitPrice(pricePerUnit);
  };

  // Handler for percentage slider
  const handlePercentageChange = (value: number[]) => {
    if (!asset) return;
    const percentage = value[0];
    setSellPercentage(percentage);
    
    const totalQuantity = asset.quantity || 1;
    const newQuantity = (totalQuantity * percentage) / 100;
    setSellQuantity(newQuantity);
    
    const pricePerUnit = asset.current_value / totalQuantity;
    const newSellAmount = newQuantity * pricePerUnit;
    setSellAmount(newSellAmount);
    setUnitPrice(pricePerUnit);
  };
  
  // Handler for quantity slider
  const handleQuantitySliderChange = (value: number[]) => {
    if (!asset) return;
    const quantity = value[0];
    setSellQuantity(quantity);
    
    const totalQuantity = asset.quantity || 1;
    const percentage = (quantity / totalQuantity) * 100;
    setSellPercentage(percentage);
    
    const pricePerUnit = asset.current_value / totalQuantity;
    const newSellAmount = quantity * pricePerUnit;
    setSellAmount(newSellAmount);
    setUnitPrice(pricePerUnit);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!asset) return;
    
    // Validate quantity
    const maxQuantity = asset.quantity || 1;
    const validQuantity = Math.min(Math.max(newQuantity, 0), maxQuantity);
    
    setSellQuantity(validQuantity);
    
    // Update percentage
    const percentage = (validQuantity / maxQuantity) * 100;
    setSellPercentage(percentage);
    
    // Update amount
    const pricePerUnit = asset.current_value / maxQuantity;
    setSellAmount(validQuantity * pricePerUnit);
    setUnitPrice(pricePerUnit);
  };
  
  const handleUnitPriceChange = (newUnitPrice: number) => {
    setUnitPrice(newUnitPrice);
    setSellAmount(sellQuantity * newUnitPrice);
  };  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!asset || !user || !selectedWalletId) return;
    
    // Validation (simplified for now)
    if (sellAmount <= 0) {
      toast({
        title: "Jumlah tidak valid",
        description: "Jumlah yang dijual harus lebih dari 0",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // For now, use traditional approach until migration is applied
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
      const isPartialSale = asset.is_divisible && sellQuantity < (asset.quantity || 1);
      const saleDescription = isPartialSale 
        ? `${sellQuantity.toFixed(asset.unit_type === 'shares' ? 0 : 2)} ${getUnitLabel(asset.unit_type || 'unit')} (${sellPercentage.toFixed(1)}%)`
        : '';
      
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          title: `Penjualan ${asset.name}${isPartialSale ? ` - ${saleDescription}` : ''}`,
          amount: netAmount,
          type: "income",
          date: date,
          category: "asset_sale",
          wallet_id: selectedWalletId,
          description: notes || `Penjualan aset: ${asset.name} (${getCategoryLabel(asset.category)})${isPartialSale ? ` - ${saleDescription}` : ''}`,
          fee: adminFee > 0 ? adminFee : null
        })
        .select("id")
        .single();
        
      if (transactionError) throw transactionError;
      
      // 4. Update wallet balance
      const { error: walletUpdateError } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", selectedWalletId);
        
      if (walletUpdateError) throw walletUpdateError;
      
      // 5. Create asset transaction record
      try {
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
            notes: notes,
            quantity_sold: sellQuantity,
            remaining_quantity: (asset.quantity || 1) - sellQuantity
          });
      } catch (error) {
        console.log("Error with asset_transactions table:", error);
        // Continue anyway as this is not critical for now
      }
      
      // 6. Handle asset update/deletion based on sale type
      const isFullSale = !asset.is_divisible || sellQuantity >= (asset.quantity || 1);
      
      if (isFullSale) {
        // Full sale: Delete asset completely
        const { error: assetDeleteError } = await supabase
          .from("assets")
          .delete()
          .eq("id", asset.id)
          .eq("user_id", user.id);
          
        if (assetDeleteError) throw assetDeleteError;
        
        // Delete asset history
        const { error: historyDeleteError } = await supabase
          .from("asset_value_history")
          .delete()
          .eq("asset_id", asset.id);
          
        if (historyDeleteError) {
          console.error("Error deleting asset history:", historyDeleteError);
          // Continue anyway as this is not critical
        }
      } else {
        // Partial sale: Update asset quantity and value
        const remainingQuantity = (asset.quantity || 1) - sellQuantity;
        const pricePerUnit = asset.current_value / (asset.quantity || 1);
        const newCurrentValue = remainingQuantity * pricePerUnit;
        
        const { error: assetUpdateError } = await supabase
          .from("assets")
          .update({ 
            quantity: remainingQuantity,
            current_value: newCurrentValue,
            updated_at: new Date().toISOString()
          })
          .eq("id", asset.id)
          .eq("user_id", user.id);
          
        if (assetUpdateError) throw assetUpdateError;
      }
      
      toast({
        title: "Aset berhasil dijual",
        description: isFullSale 
          ? `${asset.name} telah dijual sepenuhnya dengan nilai ${formatCurrency(sellAmount)}`
          : `${sellQuantity.toFixed(asset.unit_type === 'shares' ? 0 : 2)} ${getUnitLabel(asset.unit_type || 'unit')} ${asset.name} berhasil dijual (${sellPercentage.toFixed(1)}%) dengan nilai ${formatCurrency(sellAmount)}`,
      });
      
      // Navigate appropriately based on sale type
      if (isFullSale) {
        navigate("/assets"); // Asset is gone, go to assets list
      } else {
        navigate(`/assets/${asset.id}`); // Partial sale, go back to asset detail
      }
      
    } catch (error) {
      console.error("Error selling asset:", error);
      toast({
        title: "Gagal menjual aset",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat memproses penjualan aset",
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
                {/* Informasi Aset - Simple Design */}
                <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-medium text-gray-700 mb-3">Informasi Aset</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Jumlah Dimiliki</p>
                      <p className="font-semibold text-gray-800">
                        {asset.quantity} {getUnitLabel(asset.unit_type || 'unit')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Nilai Total</p>
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(asset.current_value)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Slider Controls for Partial Sale - Simple Design */}
                {asset.is_divisible && (
                  <div className="space-y-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-700">Jumlah Penjualan</h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSellMode('percentage')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            sellMode === 'percentage' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => setSellMode('quantity')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            sellMode === 'quantity' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {getUnitLabel(asset.unit_type || 'unit')}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 -mt-2">
                      💡 Geser slider atau klik angka untuk edit manual
                    </p>

                    {/* Percentage Mode */}
                    {sellMode === 'percentage' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Persentase</span>
                          {isEditingPercentage ? (
                            <Input
                              type="number"
                              value={sellPercentage.toFixed(1)}
                              onChange={(e) => handleManualPercentageChange(e.target.value)}
                              onBlur={() => setIsEditingPercentage(false)}
                              onKeyPress={(e) => e.key === 'Enter' && setIsEditingPercentage(false)}
                              className="w-20 h-8 text-right text-sm"
                              min="0"
                              max="100"
                              step="0.1"
                              autoFocus
                            />
                          ) : (
                            <span 
                              className="font-semibold text-gray-800 cursor-pointer hover:bg-blue-50 hover:text-blue-600 px-2 py-1 rounded transition-colors border border-transparent hover:border-blue-200"
                              onClick={() => setIsEditingPercentage(true)}
                              title="Klik untuk edit manual"
                            >
                              {sellPercentage.toFixed(1)}% ✏️
                            </span>
                          )}
                        </div>
                        <Slider
                          value={[sellPercentage]}
                          onValueChange={handlePercentageChange}
                          max={100}
                          min={1}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500">Dijual</p>
                            <p className="font-medium text-gray-800">
                              {sellQuantity.toFixed(asset.unit_type === 'shares' ? 0 : 2)} {getUnitLabel(asset.unit_type || 'unit')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Nilai</p>
                            <p className="font-medium text-gray-800">
                              {formatCurrency(sellAmount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quantity Mode */}
                    {sellMode === 'quantity' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Jumlah</span>
                          {isEditingQuantity ? (
                            <Input
                              type="number"
                              value={sellQuantity.toFixed(asset.unit_type === 'shares' ? 0 : 2)}
                              onChange={(e) => handleManualQuantityChange(e.target.value)}
                              onBlur={() => setIsEditingQuantity(false)}
                              onKeyPress={(e) => e.key === 'Enter' && setIsEditingQuantity(false)}
                              className="w-24 h-8 text-right text-sm"
                              min="0"
                              max={asset.quantity || 1}
                              step={asset.unit_type === 'shares' ? 1 : 0.01}
                              autoFocus
                            />
                          ) : (
                            <span 
                              className="font-semibold text-gray-800 cursor-pointer hover:bg-blue-50 hover:text-blue-600 px-2 py-1 rounded transition-colors border border-transparent hover:border-blue-200"
                              onClick={() => setIsEditingQuantity(true)}
                              title="Klik untuk edit manual"
                            >
                              {sellQuantity.toFixed(asset.unit_type === 'shares' ? 0 : 2)} {getUnitLabel(asset.unit_type || 'unit')} ✏️
                            </span>
                          )}
                        </div>
                        <Slider
                          value={[sellQuantity]}
                          onValueChange={handleQuantitySliderChange}
                          max={asset.quantity || 1}
                          min={asset.unit_type === 'shares' ? 1 : 0.01}
                          step={asset.unit_type === 'shares' ? 1 : 0.01}
                          className="w-full"
                        />
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500">Persentase</p>
                            <p className="font-medium text-gray-800">
                              {sellPercentage.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Nilai</p>
                            <p className="font-medium text-gray-800">
                              {formatCurrency(sellAmount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Simple info for non-divisible assets */}
                {!asset.is_divisible && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      Penjualan penuh: <span className="font-medium text-gray-800">{formatCurrency(asset.current_value)}</span>
                    </p>
                  </div>
                )}

                {/* Remove old complex fields and use clean design */}
                
                {/* Biaya Admin */}
                <div className="space-y-2">
                  <Label htmlFor="admin-fee" className="text-sm font-medium text-gray-700">Biaya Admin/Pajak</Label>
                  <CurrencyInput
                    id="admin-fee"
                    className="h-11 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    value={adminFee}
                    onChange={setAdminFee}
                    showPrefix={true}
                  />
                  <p className="text-xs text-gray-500">Biaya administrasi atau pajak yang dikenakan</p>
                </div>
                
                {/* Pilih Wallet */}
                <div className="space-y-2">
                  <Label htmlFor="wallet" className="text-sm font-medium text-gray-700">Masukkan Dana ke Dompet</Label>
                  <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                    <SelectTrigger id="wallet" className="h-11 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Pilih dompet" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center"
                              style={{ backgroundColor: wallet.color || '#6366f1' }}
                            >
                              <Wallet className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <span className="font-medium">{wallet.name}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {formatCurrency(wallet.balance)}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Catatan */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Catatan (Opsional)</Label>
                  <Input
                    id="notes"
                    placeholder="Catatan tentang penjualan"
                    className="h-11 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Summary Box - Minimalis */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nilai Jual</span>
                      <span className="font-medium">{formatCurrency(sellAmount)}</span>
                    </div>
                    {adminFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Biaya Admin</span>
                        <span className="font-medium text-red-600">-{formatCurrency(adminFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-medium text-gray-700">Total Diterima</span>
                      <span className="font-semibold text-green-600">{formatCurrency(sellAmount - adminFee)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit Button - Clean Design */}
          <Button 
            type="submit" 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            disabled={!selectedWalletId || sellAmount <= 0 || submitting}
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Memproses...
              </div>
            ) : (
              `Jual Aset - ${formatCurrency(sellAmount - adminFee)}`
            )}
          </Button>
        </form>
      </div>
    </div>
  );
} 