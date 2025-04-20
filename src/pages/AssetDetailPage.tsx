
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, PencilLine, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Asset, AssetValueHistory } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AssetValueChart } from "@/components/assets/AssetValueChart";
import { formatCurrency } from "@/lib/utils";

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [historyData, setHistoryData] = useState<AssetValueHistory[]>([]);
  const [loading, setLoading] = useState(true);

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
      
    } catch (error: any) {
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

  if (loading) {
    return (
      <div className="container mx-auto p-4 pb-32 max-w-2xl">
        <div className="text-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Memuat detail aset...</p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="container mx-auto p-4 pb-32 max-w-2xl">
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
    <div className="container mx-auto p-4 pb-32 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/assets")}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Detail Aset</h1>
          <p className="text-sm text-gray-500">{asset.name}</p>
        </div>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => navigate(`/assets/edit/${asset.id}`)}
        >
          <PencilLine className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Kategori</p>
            <p className="font-medium">{getCategoryLabel(asset.category)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Tahun Pembelian</p>
            <p className="font-medium">{asset.purchase_year}</p>
          </div>
          {asset.purchase_date && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Tanggal Pembelian</p>
              <p className="font-medium">{formatDate(asset.purchase_date)}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Nilai Awal</p>
            <p className="font-medium">{formatCurrency(asset.initial_value)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Nilai Terkini</p>
            <p className="font-medium">{formatCurrency(asset.current_value)}</p>
          </div>
        </div>

        <div className={`flex items-center mt-2 ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}>
          {isPositive ? (
            <TrendingUp className="w-5 h-5 mr-1" />
          ) : (
            <TrendingDown className="w-5 h-5 mr-1" />
          )}
          <span className="font-medium">
            {isPositive ? "+" : ""}{percentageChange.toFixed(2)}% sejak pembelian
          </span>
        </div>
        
        <Button
          onClick={() => navigate(`/assets/${asset.id}/update`)}
          className="w-full mt-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          Update Nilai Aset
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h2 className="font-semibold mb-4">Grafik Perkembangan Nilai</h2>
        <AssetValueChart 
          historyData={historyData} 
          initialValue={asset.initial_value}
          initialDate={initialDate}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="font-semibold mb-4">Riwayat Nilai</h2>
        {historyData.length > 0 ? (
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-3 text-sm text-gray-500 py-2">
              <div>Tanggal</div>
              <div>Nilai</div>
              <div>Perubahan</div>
            </div>
            
            {/* Initial value entry */}
            <div className="grid grid-cols-3 py-3">
              <div>{formatDate(initialDate)}</div>
              <div>{formatCurrency(asset.initial_value)}</div>
              <div className="text-gray-500">-</div>
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
                    <div>{formatDate(entry.date)}</div>
                    <div>{formatCurrency(entry.value)}</div>
                    <div className={isValuePositive ? "text-green-600" : "text-red-600"}>
                      {isValuePositive ? "+" : ""}{changePercent.toFixed(2)}%
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Belum ada riwayat nilai. Klik tombol "Update Nilai Aset" untuk menambahkan.
          </div>
        )}
      </div>
    </div>
  );
}
