import React, { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Plus, Building, Wallet, HelpCircle, CircleDollarSign, PieChart, ArrowUpRight, Lock, BarChart2, Sparkles, Star } from "lucide-react"
import { Asset } from "@/types"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { AssetCard } from "@/components/assets/AssetCard"
import Layout from "@/components/Layout"
import { Progress } from "@/components/ui/progress"
import { hasProAccess, UserSubscriptionProfile } from "@/utils/subscription"

interface WalletData {
  id: string;
  name: string;
  balance: number;
  user_id: string;
}

export default function AssetsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [assets, setAssets] = useState<Asset[]>([])
  const [wallets, setWallets] = useState<WalletData[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserSubscriptionProfile | null>(null)

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user])

  useEffect(() => {
    // Setelah profil pengguna dimuat, periksa apakah memiliki akses Pro
    // Jika ya, muat data aset; jika tidak, tampilkan layar promo fitur
    if (userProfile) {
      const hasProFeature = hasProAccess(userProfile);
      
      if (hasProFeature) {
        fetchData();
      } else {
        // Untuk pengguna free, cukup akhiri loading
        setLoading(false);
      }
    }
  }, [userProfile])

  const fetchUserProfile = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data as UserSubscriptionProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setLoading(false);
    }
  };

  // Memeriksa apakah pengguna memiliki akses Pro (baik Pro berbayar atau Trial Pro)
  const isProUser = userProfile ? hasProAccess(userProfile) : false;

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch assets
      const { data: assetData, error: assetError } = await supabase
        .from("assets")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (assetError) throw assetError
      
      // Fetch wallets
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user?.id)

      if (walletError) throw walletError
      
      // Menggunakan casting untuk mengatasi masalah tipe data
      const typedAssets = assetData as unknown as Asset[];
      setAssets(typedAssets || [])
      
      setWallets(walletData as WalletData[] || [])
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat memuat data";
      toast({
        title: "Error",
        description: "Gagal memuat data kekayaan",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddAsset = () => {
    if (!isProUser) {
      navigate('/upgrade');
      return;
    }
    
    navigate("/assets/add");
  };

  const handleUpgrade = () => {
    navigate('/upgrade');
  };

  const totalAssetValue = assets.reduce((sum, asset) => sum + asset.current_value, 0)
  const totalWalletBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  const totalWealth = totalAssetValue + totalWalletBalance

  // Calculate percentages for the pie chart
  const assetPercentage = totalWealth > 0 ? (totalAssetValue / totalWealth) * 100 : 0
  const walletPercentage = totalWealth > 0 ? (totalWalletBalance / totalWealth) * 100 : 0

  // Group assets by category
  const assetsByCategory = assets.reduce((acc, asset) => {
    const category = asset.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "property":
        return <Building className="h-4 w-4" />;
      case "gold":
        return <Wallet className="h-4 w-4" />;
      case "vehicle":
        return <Wallet className="h-4 w-4" />;
      case "stock":
        return <Wallet className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "property":
        return "Properti";
      case "gold":
        return "Emas";
      case "vehicle":
        return "Kendaraan";
      case "stock":
        return "Saham";
      default:
        return "Lainnya";
    }
  };

  // Render tampilan Pro Features untuk pengguna free
  const renderProFeatures = () => (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200 shadow-md mb-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
          <Building className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Lacak Semua Aset Anda</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Upgrade ke Pro untuk melacak semua aset Anda dan memantau pertumbuhan kekayaan bersih secara real-time.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
          <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mb-3">
            <Building className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="font-semibold mb-1">Properti</h3>
          <p className="text-xs text-gray-500">Lacak nilai rumah, apartemen, dan properti lainnya</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
          <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mb-3">
            <Wallet className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="font-semibold mb-1">Emas & Logam</h3>
          <p className="text-xs text-gray-500">Pantau nilai investasi emas dan logam mulia</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
          <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mb-3">
            <Star className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="font-semibold mb-1">Kendaraan</h3>
          <p className="text-xs text-gray-500">Kelola nilai mobil, motor, dan kendaraan lainnya</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
          <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mb-3">
            <BarChart2 className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="font-semibold mb-1">Saham & Investasi</h3>
          <p className="text-xs text-gray-500">Monitor portofolio investasi Anda</p>
        </div>
      </div>

      <Button 
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-6 rounded-xl shadow-md"
        onClick={handleUpgrade}
      >
        <Sparkles className="mr-2 h-5 w-5" />
        <span className="font-medium">Upgrade ke Pro Sekarang</span>
      </Button>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-xl">
        <div className="flex items-center mb-6">
          <Link to="/settings" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Aset</h1>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8 bg-white rounded-lg shadow-sm">
            <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Memuat data aset...</p>
          </div>
        ) : !isProUser ? (
          // Tampilan untuk pengguna free - tampilkan langsung fitur pro
          renderProFeatures()
        ) : assets.length > 0 ? (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-white/80" />
                    <h2 className="font-medium">Total Kekayaan</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => navigate("/assets/transactions")} 
                      size="sm" 
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                      Transaksi
                    </Button>
                    <Button 
                      onClick={handleAddAsset} 
                      size="sm" 
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Tambah
                    </Button>
                  </div>
                </div>
                <p className="text-3xl font-bold mb-2">{formatCurrency(totalWealth)}</p>
                
                <div className="flex items-center text-xs text-white/80 mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                  <span>Total dari nilai aset dan saldo dompet</span>
                </div>
              </div>
              
              {/* Breakdown */}
              <div className="p-4 divide-y">
                <div className="pb-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
                      <span className="text-sm font-medium">Nilai Aset</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{formatCurrency(totalAssetValue)}</span>
                      <span className="text-xs text-gray-500">{assetPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <Progress value={assetPercentage} className="h-1.5 bg-gray-100" indicatorClassName="bg-indigo-400" />
                </div>
                
                <div className="pt-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                      <span className="text-sm font-medium">Saldo Dompet</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{formatCurrency(totalWalletBalance)}</span>
                      <span className="text-xs text-gray-500">{walletPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <Progress value={walletPercentage} className="h-1.5 bg-gray-100" indicatorClassName="bg-purple-400" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {Object.keys(assetsByCategory).map((category) => (
                <div key={category} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-purple-100 p-1.5 rounded-full">
                      {getCategoryIcon(category)}
                    </div>
                    <h2 className="font-medium">{getCategoryLabel(category)}</h2>
                  </div>
                  <div className="space-y-3">
                    {assetsByCategory[category].map((asset) => (
                      <AssetCard key={asset.id} asset={asset} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center bg-white rounded-lg shadow-sm p-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-medium mb-2">Belum ada aset</h3>
            <p className="text-sm text-gray-500 mb-4">
              Tambahkan aset untuk memantau kekayaan Anda
            </p>
            <Button 
              onClick={handleAddAsset}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Aset Baru
            </Button>
          </div>
        )}
      </div>
    </Layout>
  )
}
