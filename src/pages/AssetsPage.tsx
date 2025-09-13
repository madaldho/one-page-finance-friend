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
      
      // Fetch assets - only get active assets (not sold)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
        </div>

        <div className="container mx-auto py-2 px-2 md:px-6 max-w-6xl lg:max-w-7xl relative z-10 pt-6 md:pt-4 pb-32">
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
                <h1 className="text-lg font-bold text-gray-800">Manajemen Aset</h1>
                <p className="text-xs text-gray-500">Kelola portofolio aset & pantau kekayaan</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center text-gray-500 py-12 backdrop-blur-sm bg-white/80 rounded-2xl shadow-sm border border-white/20">
              <div className="animate-spin w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full mb-4"></div>
              <p className="text-base font-medium">Memuat data aset...</p>
            </div>
          ) : !isProUser ? (
            // Tampilan untuk pengguna free - tampilkan langsung fitur pro
            <div className="max-w-4xl mx-auto">
              {renderProFeatures()}
            </div>
          ) : assets.length > 0 ? (
            <div className="space-y-6">
              {/* Desktop Layout - Two Column */}
              <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
                {/* Left Column - Stats & Summary */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Card Total Kekayaan dengan desain yang lebih modern */}
                  <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg overflow-hidden border border-white/20">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center">
                          <PieChart className="w-6 h-6 text-white/80 mr-3" />
                          <h2 className="font-semibold text-lg">Total Kekayaan</h2>
                        </div>
                        
                        <p className="text-4xl font-bold">{formatCurrency(totalWealth)}</p>
                        
                        <div className="flex items-center text-sm text-white/80">
                          <ArrowUpRight className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>Total dari nilai aset dan saldo dompet</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Breakdown dengan animasi hover */}
                    <div className="p-6 space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                            <span className="font-medium text-gray-700">Nilai Aset</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-gray-900">{formatCurrency(totalAssetValue)}</span>
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
                              {assetPercentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <Progress value={assetPercentage} className="h-3 bg-gray-100" indicatorClassName="bg-indigo-500" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                            <span className="font-medium text-gray-700">Saldo Dompet</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-gray-900">{formatCurrency(totalWalletBalance)}</span>
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
                              {walletPercentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <Progress value={walletPercentage} className="h-3 bg-gray-100" indicatorClassName="bg-purple-500" />
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4">
                        <Button 
                          onClick={() => navigate("/assets/transactions")} 
                          variant="outline"
                          className="h-12 font-medium border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                        >
                          <BarChart2 className="w-4 h-4 mr-2" />
                          Lihat Transaksi
                        </Button>
                        <Button 
                          onClick={handleAddAsset} 
                          className="h-12 font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Aset
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Asset List */}
                <div className="lg:col-span-7">
                  <div className="space-y-4">
                    {Object.keys(assetsByCategory).map((category) => (
                      <div key={category} className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg overflow-hidden border border-white/20">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center">
                          <div className="bg-purple-100 p-2 rounded-xl mr-3">
                            {getCategoryIcon(category)}
                          </div>
                          <h2 className="font-semibold text-gray-800 text-lg">
                            {getCategoryLabel(category)}
                          </h2>
                          <div className="ml-auto">
                            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                              {assetsByCategory[category].length} item
                            </span>
                          </div>
                        </div>
                        
                        <div className="divide-y divide-gray-100">
                          {assetsByCategory[category].map((asset) => (
                            <div key={asset.id} className="p-4 hover:bg-gray-50/50 transition-colors duration-200">
                              <AssetCard asset={asset} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Layout - Single Column */}
              <div className="lg:hidden space-y-6">
                {/* Card Total Kekayaan untuk mobile */}
                <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg overflow-hidden border border-white/20">
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
                  
                  {/* Breakdown */}
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
                  
                  {/* Action Buttons */}
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

                {/* Daftar kategori aset untuk mobile */}
                <div className="space-y-5">
                  {Object.keys(assetsByCategory).map((category) => (
                    <div key={category} className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg overflow-hidden border border-white/20">
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
              </div>
            </div>
          ) : (
            // State kosong yang lebih menarik
            <div className="max-w-md mx-auto">
              <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg p-8 text-center border border-white/20">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="font-semibold text-xl mb-3 text-gray-800">Belum ada aset</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed">
                  Mulai tambahkan aset untuk memantau pertumbuhan kekayaan Anda secara real-time
                </p>
                <Button 
                  onClick={handleAddAsset}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Tambah Aset Pertama
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
