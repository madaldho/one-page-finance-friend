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
    <div className="container mx-auto p-4 pb-32 max-w-md">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/assets")}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{asset.name}</h1>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            {getCategoryIcon(asset.category)}
            <span>{getCategoryLabel(asset.category)}</span>
          </div>
        </div>
      </div>

      {/* Nilai Card */}
      <Card className="mb-4 shadow-sm border-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-5">
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
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <Button 
          variant="outline"
          size="sm"
          className="flex-1 bg-white shadow-sm border-0"
          onClick={() => navigate(`/assets/edit/${asset.id}`)}
        >
          <PencilLine className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button 
          variant="outline"
          size="sm"
          className="flex-1 bg-white shadow-sm border-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Hapus
        </Button>
        <Button 
          variant="default"
          size="sm"
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={() => navigate(`/assets/sell/${asset.id}`)}
        >
          <CircleDollarSign className="h-4 w-4 mr-2" />
          Jual
        </Button>
      </div>

      {/* Tabs */}
      <Tabs 
        defaultValue="overview" 
        className="mb-4"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-2 w-full mb-3">
          <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
          <TabsTrigger value="history">Riwayat Nilai</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-0">
          <Card className="shadow-sm border-0 mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Informasi Aset</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
          <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="text-gray-400 h-4 w-4" />
                    <span className="text-sm text-gray-500">Kategori</span>
                  </div>
            <p className="font-medium">{getCategoryLabel(asset.category)}</p>
          </div>
          <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="text-gray-400 h-4 w-4" />
                    <span className="text-sm text-gray-500">Tahun Pembelian</span>
                  </div>
            <p className="font-medium">{asset.purchase_year}</p>
          </div>
                
          {asset.purchase_date && (
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="text-gray-400 h-4 w-4" />
                      <span className="text-sm text-gray-500">Tanggal Pembelian</span>
                    </div>
              <p className="font-medium">{formatDate(asset.purchase_date)}</p>
            </div>
          )}
        </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Perkembangan Nilai</CardTitle>
            </CardHeader>
            <CardContent>
              <AssetValueChart 
                historyData={historyData} 
                initialValue={asset.initial_value}
                initialDate={initialDate}
              />
              
              <div className="mt-4 text-center">
        <Button
          onClick={() => navigate(`/assets/${asset.id}/update`)}
                  className="w-full"
                  variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Update Nilai Aset
        </Button>
      </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history" className="mt-0">
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Riwayat Perubahan Nilai</CardTitle>
            </CardHeader>
            <CardContent>
        {historyData.length > 0 ? (
          <div className="divide-y divide-gray-100">
                  <div className="grid grid-cols-3 text-sm text-gray-500 py-2 font-medium">
              <div>Tanggal</div>
              <div>Nilai</div>
              <div>Perubahan</div>
            </div>
            
            {/* Initial value entry */}
            <div className="grid grid-cols-3 py-3">
                    <div className="text-sm">{formatDate(initialDate)}</div>
                    <div className="text-sm font-medium">{formatCurrency(asset.initial_value)}</div>
                    <div className="text-sm text-gray-500">-</div>
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
                  <div key={entry.id} className="grid grid-cols-3 py-3">
                          <div className="text-sm">{formatDate(entry.date)}</div>
                          <div className="text-sm font-medium">{formatCurrency(entry.value)}</div>
                          <div className={`text-sm ${isValuePositive ? "text-green-600" : "text-red-600"} font-medium`}>
                      {isValuePositive ? "+" : ""}{changePercent.toFixed(2)}%
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-3">Belum ada riwayat nilai.</p>
                  <Button 
                    onClick={() => navigate(`/assets/${asset.id}/update`)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Update Nilai Aset
                  </Button>
          </div>
        )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
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
