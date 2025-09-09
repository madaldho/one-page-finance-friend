import React, { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Plus, Building, Wallet, HelpCircle, CircleDollarSign, PieChart, ArrowUpRight, Lock, BarChart2, Sparkles, Star, Car, TrendingUp } from "lucide-react"
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
        return <Building className="h-5 w-5" />;
      case "gold":
        return <Wallet className="h-5 w-5" />;
      case "vehicle":
        return <Car className="h-5 w-5" />;
      case "stock":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <HelpCircle className="h-5 w-5" />;
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

  // Render tampilan Pro Features untuk pengguna free - UI yang lebih modern
  const renderProFeatures = () => (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <Building className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-800">Lacak Semua Aset Anda</h2>
          <p className="text-gray-600 max-w-md mx-auto text-sm sm:text-base">
            Upgrade ke Pro untuk melacak semua aset Anda dan memantau pertumbuhan kekayaan secara real-time.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-purple-100 transition-all hover:shadow-md hover:border-purple-200">
            <div className="bg-purple-100 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-2 sm:mb-3">
              <Building className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base mb-1">Properti</h3>
            <p className="text-xs text-gray-500">Lacak nilai rumah, apartemen, dan properti lainnya</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-purple-100 transition-all hover:shadow-md hover:border-purple-200">
            <div className="bg-purple-100 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-2 sm:mb-3">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base mb-1">Emas & Logam</h3>
            <p className="text-xs text-gray-500">Pantau nilai investasi emas dan logam mulia</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-purple-100 transition-all hover:shadow-md hover:border-purple-200">
            <div className="bg-purple-100 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-2 sm:mb-3">
              <Car className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base mb-1">Kendaraan</h3>
            <p className="text-xs text-gray-500">Kelola nilai mobil, motor, dan kendaraan lainnya</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-purple-100 transition-all hover:shadow-md hover:border-purple-200">
            <div className="bg-purple-100 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-2 sm:mb-3">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base mb-1">Saham & Investasi</h3>
            <p className="text-xs text-gray-500">Monitor portofolio investasi Anda</p>
          </div>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-5 sm:py-6 rounded-xl shadow-sm hover:shadow-md transition-all"
          onClick={handleUpgrade}
        >
          <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-medium">Upgrade ke Pro Sekarang</span>
        </Button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto py-2 px-2 md:px-6 max-w-xl pt-6 md:pt-4">
        {/* Header dengan glassmorphism effect */}
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
          <div className="flex items-center gap-3">
            <Link 
              to="/settings"
              className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md border border-white/30"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Aset</h1>
              <p className="text-xs text-gray-500">Kelola portofolio aset & kekayaan</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center text-gray-500 py-8 bg-white rounded-xl shadow-sm">
            <div className="animate-spin w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full mb-3"></div>
            <p className="text-sm">Memuat data aset...</p>
          </div>
        ) : !isProUser ? (
          // Tampilan untuk pengguna free - tampilkan langsung fitur pro
          renderProFeatures()
        ) : assets.length > 0 ? (
          <>
            {/* Card Total Kekayaan dengan desain yang lebih modern */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-5">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <PieChart className="w-5 h-5 text-white/80 mr-2" />
                    <h2 className="font-medium">Total Kekayaan</h2>
                  </div>
                  
                  <p className="text-3xl font-bold">{formatCurrency(totalWealth)}</p>
                  
                  <div className="flex items-center text-xs text-white/80">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    <span>Total dari nilai aset dan saldo dompet</span>
                  </div>
                </div>
              </div>
              
              {/* Breakdown dengan animasi hover */}
              <div className="p-4 divide-y">
                <div className="pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                      <span className="text-sm font-medium">Nilai Aset</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{formatCurrency(totalAssetValue)}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {assetPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={assetPercentage} className="h-2 bg-gray-100" indicatorClassName="bg-indigo-500" />
                </div>
                
                <div className="pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm font-medium">Saldo Dompet</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{formatCurrency(totalWalletBalance)}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {walletPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={walletPercentage} className="h-2 bg-gray-100" indicatorClassName="bg-purple-500" />
                </div>
              </div>
              
              {/* Action Buttons yang lebih jelas dan responsif */}
              <div className="p-3 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => navigate("/assets/transactions")} 
                    variant="outline"
                    className="h-10 text-xs border-gray-200 bg-white hover:bg-gray-50"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
                    Lihat Transaksi
                  </Button>
                  <Button 
                    onClick={handleAddAsset} 
                    className="h-10 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Tambah Aset
                  </Button>
                </div>
              </div>
            </div>

            {/* Daftar kategori aset dengan card yang lebih modern */}
            <div className="space-y-5">
              {Object.keys(assetsByCategory).map((category) => (
                <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center">
                    <div className="bg-purple-100 p-1.5 rounded-full mr-2">
                      {getCategoryIcon(category)}
                    </div>
                    <h2 className="font-medium text-gray-800">
                      {getCategoryLabel(category)}
                    </h2>
                    <div className="ml-auto">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {assetsByCategory[category].length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    {assetsByCategory[category].map((asset) => (
                      <div key={asset.id} className="p-3 hover:bg-gray-50 transition-colors">
                        <AssetCard asset={asset} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // State kosong yang lebih menarik
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-medium mb-2 text-gray-800">Belum ada aset</h3>
            <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
              Tambahkan aset untuk memantau pertumbuhan kekayaan Anda secara real-time
            </p>
            <Button 
              onClick={handleAddAsset}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
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
