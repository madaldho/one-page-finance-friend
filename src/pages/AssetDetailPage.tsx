import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  PencilLine, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Trash2, 
  CircleDollarSign,
  Building2,
  Car,
  Coins,
  BarChart3,
  Package,
  Calendar,
  Clock
} from "lucide-react";
import { Asset, AssetValueHistory } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { AssetValueChart } from "@/components/assets/AssetValueChart";
import { formatCurrency } from "@/lib/utils";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [historyData, setHistoryData] = useState<AssetValueHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user && id) {
      fetchAssetDetails();
    }
  }, [user, id]);

  const fetchAssetDetails = async () => {
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

      // Fetch asset value history
      const { data: historyData, error: historyError } = await supabase
        .from("asset_value_history")
        .select("*")
        .eq("asset_id", id)
        .eq("user_id", user?.id)
        .order("date", { ascending: true });

      if (historyError) throw historyError;
      setHistoryData(historyData || []);
      
    } catch (error: unknown) {
      console.error("Error fetching asset details:", error);
      toast({
        title: "Gagal memuat data",
        description: "Terjadi kesalahan saat memuat detail aset",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: Asset["category"]) => {
    const labels = {
      property: "Properti",
      vehicle: "Kendaraan",
      gold: "Emas",
      stock: "Saham",
      other: "Lainnya"
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category: Asset["category"]) => {
    switch (category) {
      case "property":
        return <Building2 className="h-5 w-5" />;
      case "vehicle":
        return <Car className="h-5 w-5" />;
      case "gold":
        return <Coins className="h-5 w-5" />;
      case "stock":
        return <BarChart3 className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  // Calculate percentage change
  const percentageChange = asset 
    ? ((asset.current_value - asset.initial_value) / asset.initial_value) * 100
    : 0;
  const isPositive = percentageChange >= 0;

  const handleDeleteAsset = async () => {
    try {
      setIsDeleting(true);
      
      // Hapus riwayat nilai aset terlebih dahulu
      const { error: historyError } = await supabase
        .from("asset_value_history")
        .delete()
        .eq("asset_id", asset?.id)
        .eq("user_id", user?.id);
        
      if (historyError) throw historyError;
      
      // Hapus aset
      const { error: assetError } = await supabase
        .from("assets")
        .delete()
        .eq("id", asset?.id)
        .eq("user_id", user?.id);
        
      if (assetError) throw assetError;
      
      toast({
        title: "Aset berhasil dihapus",
        description: `Aset ${asset?.name} telah dihapus`,
      });
      
      navigate("/assets");
    } catch (error: unknown) {
      console.error("Error deleting asset:", error);
      toast({
        title: "Gagal menghapus aset",
        description: "Terjadi kesalahan saat menghapus aset",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 pb-32 max-w-md">
        <div className="text-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Memuat detail aset...</p>
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

  // Compute initial date based on purchase date or year
  const initialDate = asset.purchase_date || `${asset.purchase_year}-01-01`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
      </div>

      <div className="container mx-auto py-2 px-2 md:px-6 max-w-5xl lg:max-w-6xl relative z-10 pt-6 md:pt-4 pb-32">
        {/* Header dengan glassmorphism effect */}
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/assets")}
              className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl transition-all duration-200 hover:shadow-md border border-white/30"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-800">{asset.name}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {getCategoryIcon(asset.category)}
                <span>{getCategoryLabel(asset.category)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Two Column */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Left Column - Value & Info */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card Nilai dengan design yang modern */}
            <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg overflow-hidden border border-white/20">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                <div className="mb-2 text-white/80 text-sm font-medium">Nilai Saat Ini</div>
                <div className="text-4xl font-bold mb-4 break-words">
                  {formatCurrency(asset.current_value)}
                </div>
                
                <div className="flex items-center gap-3 text-sm bg-white/10 p-3 rounded-xl">
                  <Badge 
                    className={`${
                      isPositive 
                      ? "bg-green-500 hover:bg-green-600 border-none px-2.5 py-1" 
                      : "bg-red-500 hover:bg-red-600 border-none px-2.5 py-1"
                    } font-medium`}
                  >
                    {isPositive ? <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> : <TrendingDown className="h-3.5 w-3.5 mr-1.5" />}
                    {isPositive ? "+" : ""}{percentageChange.toFixed(2)}%
                  </Badge>
                  <div>
                    <div className="opacity-90 text-xs">Sejak pembelian</div>
                    <div className="font-medium text-sm">{formatCurrency(asset.initial_value)}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant="outline"
                    className="h-12 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                    onClick={() => navigate(`/assets/edit/${asset.id}`)}
                  >
                    <PencilLine className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-12 bg-white border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200 font-medium"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                  </Button>
                  <Button 
                    className="h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                    onClick={() => navigate(`/assets/sell/${asset.id}`)}
                  >
                    <CircleDollarSign className="h-4 w-4 mr-2" />
                    Jual
                  </Button>
                </div>
              </div>
            </div>

            {/* Informasi Aset */}
            <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-purple-100 p-2 rounded-xl">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">Informasi Aset</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="text-gray-400 h-4 w-4" />
                        <span className="text-sm text-gray-500 font-medium">Kategori</span>
                      </div>
                      <p className="font-semibold text-gray-800">{getCategoryLabel(asset.category)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="text-gray-400 h-4 w-4" />
                        <span className="text-sm text-gray-500 font-medium">Tahun Pembelian</span>
                      </div>
                      <p className="font-semibold text-gray-800">{asset.purchase_year}</p>
                    </div>
                  </div>
                  
                  {asset.purchase_date && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-gray-400 h-4 w-4" />
                        <span className="text-sm text-gray-500 font-medium">Tanggal Pembelian</span>
                      </div>
                      <p className="font-semibold text-gray-800">{formatDate(asset.purchase_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Chart & History */}
          <div className="lg:col-span-7">
            <Tabs 
              defaultValue="overview" 
              className="mb-4"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-2 w-full mb-6 h-12 bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl">
                <TabsTrigger value="overview" className="h-10 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Perkembangan Nilai</TabsTrigger>
                <TabsTrigger value="history" className="h-10 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Riwayat Nilai</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0">
                <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-indigo-100 p-2 rounded-xl">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800">Perkembangan Nilai</h2>
                    </div>
                    
                    <AssetValueChart 
                      historyData={historyData} 
                      initialValue={asset.initial_value}
                      initialDate={initialDate}
                    />
                    
                    <div className="mt-6">
                      <Button
                        onClick={() => navigate(`/assets/update-value/${asset.id}`)}
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Update Nilai Aset
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* History Tab */}
              <TabsContent value="history" className="mt-0">
                <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-purple-100 p-2 rounded-xl">
                        <Clock className="h-5 w-5 text-purple-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800">Riwayat Perubahan Nilai</h2>
                    </div>
                    
                    {historyData.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-gray-100">
                        <div className="grid grid-cols-3 text-sm text-gray-600 py-4 px-6 font-semibold bg-gray-50">
                          <div>Tanggal</div>
                          <div>Nilai</div>
                          <div>Perubahan</div>
                        </div>
                        
                        <div className="divide-y divide-gray-100">
                          {/* Initial value entry */}
                          <div className="grid grid-cols-3 py-4 px-6 bg-white hover:bg-gray-50 transition-colors">
                            <div className="text-sm font-medium text-gray-700">{formatDate(initialDate)}</div>
                            <div className="text-sm font-semibold text-gray-900">{formatCurrency(asset.initial_value)}</div>
                            <div className="text-sm text-gray-500 font-medium">Pembelian awal</div>
                          </div>
                          
                          {/* History entries */}
                          {historyData
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((entry) => {
                              // Find previous value to calculate change percentage
                              let prevValue = asset.initial_value;
                              const entryDate = new Date(entry.date).getTime();
                              
                              // Find the most recent value before this entry
                              for (const h of historyData) {
                                const histDate = new Date(h.date).getTime();
                                if (histDate < entryDate && h.id !== entry.id) {
                                  prevValue = h.value;
                                  break;
                                }
                              }
                              
                              const changePercent = ((entry.value - prevValue) / prevValue) * 100;
                              const isValuePositive = changePercent >= 0;
                              
                              return (
                                <div key={entry.id} className="grid grid-cols-3 py-4 px-6 bg-white hover:bg-gray-50 transition-colors">
                                  <div className="text-sm font-medium text-gray-700">{formatDate(entry.date)}</div>
                                  <div className="text-sm font-semibold text-gray-900">{formatCurrency(entry.value)}</div>
                                  <div className={`text-sm font-semibold flex items-center gap-1 ${isValuePositive ? "text-green-600" : "text-red-600"}`}>
                                    {isValuePositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                    {isValuePositive ? "+" : ""}{changePercent.toFixed(2)}%
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Clock className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2 text-gray-800">Belum ada riwayat nilai</h3>
                        <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                          Mulai update nilai aset untuk melihat perkembangan investasi Anda
                        </p>
                        <Button 
                          onClick={() => navigate(`/assets/update-value/${asset.id}`)}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Update Nilai Aset
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Mobile Layout - Single Column */}
        <div className="lg:hidden space-y-6">
          {/* Card Nilai untuk mobile */}
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg overflow-hidden border border-white/20">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white">
              <div className="mb-2 text-white/80 text-sm">Nilai Saat Ini</div>
              <div className="text-3xl font-bold mb-4 break-words">
                {formatCurrency(asset.current_value)}
              </div>
              
              <div className="flex items-center gap-2 text-sm bg-white/10 p-2 rounded-lg">
                <Badge 
                  className={
                    isPositive 
                    ? "bg-green-500 hover:bg-green-600 border-none px-1.5 py-0.5" 
                    : "bg-red-500 hover:bg-red-600 border-none px-1.5 py-0.5"
                  }
                >
                  {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {isPositive ? "+" : ""}{percentageChange.toFixed(2)}%
                </Badge>
                <span className="opacity-90">
                  Sejak pembelian ({formatCurrency(asset.initial_value)})
                </span>
              </div>
            </div>

            {/* Action Buttons untuk mobile */}
            <div className="p-4 bg-gray-50/50 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-10 bg-white border-gray-200 hover:bg-gray-50 text-xs"
                  onClick={() => navigate(`/assets/edit/${asset.id}`)}
                >
                  <PencilLine className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-10 bg-white border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Hapus
                </Button>
                <Button 
                  size="sm"
                  className="h-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs"
                  onClick={() => navigate(`/assets/sell/${asset.id}`)}
                >
                  <CircleDollarSign className="h-3.5 w-3.5 mr-1" />
                  Jual
                </Button>
              </div>
            </div>
          </div>

          {/* Informasi Aset untuk mobile */}
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-purple-100 p-1.5 rounded-full">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
                <h2 className="font-semibold text-gray-800">Informasi Aset</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Package className="text-gray-400 h-3.5 w-3.5" />
                    <span className="text-xs text-gray-500">Kategori</span>
                  </div>
                  <p className="font-medium text-sm">{getCategoryLabel(asset.category)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="text-gray-400 h-3.5 w-3.5" />
                    <span className="text-xs text-gray-500">Tahun Pembelian</span>
                  </div>
                  <p className="font-medium text-sm">{asset.purchase_year}</p>
                </div>
                
                {asset.purchase_date && (
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="text-gray-400 h-3.5 w-3.5" />
                      <span className="text-xs text-gray-500">Tanggal Pembelian</span>
                    </div>
                    <p className="font-medium text-sm">{formatDate(asset.purchase_date)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs untuk mobile */}
          <Tabs 
            defaultValue="overview" 
            className="mb-4"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-2 w-full mb-4 h-10 bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl">
              <TabsTrigger value="overview" className="h-8 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Perkembangan</TabsTrigger>
              <TabsTrigger value="history" className="h-8 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Riwayat</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab untuk mobile */}
            <TabsContent value="overview" className="mt-0">
              <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-indigo-100 p-1.5 rounded-full">
                      <TrendingUp className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h2 className="font-semibold text-gray-800">Perkembangan Nilai</h2>
                  </div>
                  
                  <AssetValueChart 
                    historyData={historyData} 
                    initialValue={asset.initial_value}
                    initialDate={initialDate}
                  />
                  
                  <div className="mt-4">
                    <Button
                      onClick={() => navigate(`/assets/update-value/${asset.id}`)}
                      className="w-full h-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Update Nilai Aset
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* History Tab untuk mobile */}
            <TabsContent value="history" className="mt-0">
              <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-purple-100 p-1.5 rounded-full">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    <h2 className="font-semibold text-gray-800">Riwayat Perubahan</h2>
                  </div>
                  
                  {historyData.length > 0 ? (
                    <div className="space-y-3">
                      {/* Initial value entry */}
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-xs text-gray-500">Pembelian awal</div>
                            <div className="text-sm font-medium">{formatDate(initialDate)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{formatCurrency(asset.initial_value)}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* History entries */}
                      {historyData
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((entry) => {
                          // Find previous value to calculate change percentage
                          let prevValue = asset.initial_value;
                          const entryDate = new Date(entry.date).getTime();
                          
                          // Find the most recent value before this entry
                          for (const h of historyData) {
                            const histDate = new Date(h.date).getTime();
                            if (histDate < entryDate && h.id !== entry.id) {
                              prevValue = h.value;
                              break;
                            }
                          }
                          
                          const changePercent = ((entry.value - prevValue) / prevValue) * 100;
                          const isValuePositive = changePercent >= 0;
                          
                          return (
                            <div key={entry.id} className="bg-white rounded-xl p-3 border border-gray-100">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-xs text-gray-500">Update nilai</div>
                                  <div className="text-sm font-medium">{formatDate(entry.date)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold">{formatCurrency(entry.value)}</div>
                                  <div className={`text-xs font-medium flex items-center justify-end gap-1 ${isValuePositive ? "text-green-600" : "text-red-600"}`}>
                                    {isValuePositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {isValuePositive ? "+" : ""}{changePercent.toFixed(2)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="font-medium mb-1 text-gray-800">Belum ada riwayat</h3>
                      <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
                        Update nilai aset untuk melihat perkembangan investasi
                      </p>
                      <Button 
                        onClick={() => navigate(`/assets/update-value/${asset.id}`)}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm px-4 py-2 rounded-xl"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Update Nilai Aset
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAsset}
        title="Hapus Aset"
        description="Apakah Anda yakin ingin menghapus aset"
        itemName={asset?.name || ""}
      />
    </div>
  );
}
