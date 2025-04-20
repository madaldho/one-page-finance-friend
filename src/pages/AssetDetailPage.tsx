
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Asset, AssetValueHistory } from '@/types';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { AssetUpdateForm } from '@/components/assets/AssetUpdateForm';
import { AssetValueChart } from '@/components/assets/AssetValueChart';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Home, Car, DollarSign, TrendingUp, Package, Pencil, Plus, Trash2, Loader2, ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [valueHistory, setValueHistory] = useState<AssetValueHistory[]>([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchAssetDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Tidak Terautentikasi",
            description: "Silakan login untuk melihat detail aset",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        
        // Fetch asset details
        const { data: assetData, error: assetError } = await supabase
          .from('assets')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (assetError) throw assetError;
        
        setAsset(assetData);
        
        // Fetch value history
        const { data: historyData, error: historyError } = await supabase
          .from('asset_value_history')
          .select('*')
          .eq('asset_id', id)
          .order('date', { ascending: true });
          
        if (historyError) throw historyError;
        
        setValueHistory(historyData || []);
      } catch (error: any) {
        console.error('Error fetching asset details:', error);
        toast({
          title: "Gagal Memuat Data",
          description: error.message || "Terjadi kesalahan saat mengambil detail aset",
          variant: "destructive"
        });
        navigate('/assets');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssetDetails();
  }, [id, toast, navigate]);

  const refreshData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Fetch asset details
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();
        
      if (assetError) throw assetError;
      
      setAsset(assetData);
      
      // Fetch value history
      const { data: historyData, error: historyError } = await supabase
        .from('asset_value_history')
        .select('*')
        .eq('asset_id', id)
        .order('date', { ascending: true });
        
      if (historyError) throw historyError;
      
      setValueHistory(historyData || []);
    } catch (error: any) {
      console.error('Error refreshing asset data:', error);
    } finally {
      setLoading(false);
      setShowUpdateForm(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!asset || !id) return;
    
    try {
      setLoading(true);
      
      // First delete all history entries
      const { error: historyError } = await supabase
        .from('asset_value_history')
        .delete()
        .eq('asset_id', id);
        
      if (historyError) throw historyError;
      
      // Then delete the asset
      const { error: assetError } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);
        
      if (assetError) throw assetError;
      
      toast({
        title: "Aset Dihapus",
        description: "Aset telah berhasil dihapus",
      });
      
      navigate('/assets');
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      toast({
        title: "Gagal Menghapus",
        description: error.message || "Terjadi kesalahan saat menghapus aset",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = () => {
    if (!asset) return <Package className="w-6 h-6" />;
    
    switch (asset.category) {
      case 'property':
        return <Home className="w-6 h-6 text-indigo-500" />;
      case 'vehicle':
        return <Car className="w-6 h-6 text-blue-500" />;
      case 'gold':
        return <DollarSign className="w-6 h-6 text-yellow-500" />;
      case 'stock':
        return <TrendingUp className="w-6 h-6 text-green-500" />;
      default:
        return <Package className="w-6 h-6 text-gray-500" />;
    }
  };

  const getCategoryLabel = () => {
    if (!asset) return 'Lainnya';
    
    switch (asset.category) {
      case 'property':
        return 'Properti';
      case 'vehicle':
        return 'Kendaraan';
      case 'gold':
        return 'Emas';
      case 'stock':
        return 'Saham';
      default:
        return 'Lainnya';
    }
  };

  if (loading && !asset) {
    return (
      <Layout>
        <div className="container mx-auto p-4 flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!asset) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">
            <h2 className="text-xl font-bold mb-2">Aset Tidak Ditemukan</h2>
            <p className="text-gray-500 mb-4">Aset yang Anda cari tidak ditemukan atau telah dihapus.</p>
            <Button onClick={() => navigate('/assets')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Aset
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const valueChange = asset.current_value - asset.initial_value;
  const percentChange = (valueChange / asset.initial_value) * 100;
  const isPositive = valueChange >= 0;

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-4xl">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/assets')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center">
                {getCategoryIcon()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {asset.name}
                </h1>
                <span className="text-sm text-gray-500">
                  {getCategoryLabel()}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/assets/edit/${asset.id}`)}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Hapus
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nilai Awal</h3>
                  <p className="text-xl font-semibold mt-1">{formatCurrency(asset.initial_value)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tanggal/Tahun Pembelian</h3>
                  <p className="text-lg mt-1">
                    {asset.purchase_date ? 
                      format(parseISO(asset.purchase_date), 'dd MMMM yyyy', { locale: id }) : 
                      asset.purchase_year ? 
                        `Tahun ${asset.purchase_year}` : 
                        'Tidak diketahui'
                    }
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Kategori</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getCategoryIcon()}
                    <span>{getCategoryLabel()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">Nilai Terkini</h3>
                <p className="text-2xl font-bold mt-1">{formatCurrency(asset.current_value)}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5" />
                  )}
                  <span className="font-medium text-lg">
                    {percentChange.toFixed(1)}%
                  </span>
                </div>
                <span className="text-gray-500">
                  ({isPositive ? '+' : ''}{formatCurrency(valueChange)})
                </span>
              </div>
              
              <Button 
                variant="default" 
                className="w-full mt-4"
                onClick={() => setShowUpdateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Update Nilai Aset
              </Button>
            </div>
          </div>
        </div>
        
        {showUpdateForm && (
          <div className="mb-6">
            <AssetUpdateForm 
              asset={asset}
              onCancel={() => setShowUpdateForm(false)}
              onSuccess={refreshData}
            />
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Grafik Perubahan Nilai</h2>
          
          {valueHistory.length > 0 ? (
            <AssetValueChart 
              history={valueHistory}
              initialValue={asset.initial_value}
              initialDate={asset.purchase_date}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              Belum ada data histori perubahan nilai
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Histori Perubahan Nilai</h2>
          </div>
          
          {valueHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead className="text-right">Perubahan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...valueHistory]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((entry, index, array) => {
                      const prevValue = index < array.length - 1 ? array[index + 1].value : asset.initial_value;
                      const change = entry.value - prevValue;
                      const percentChange = (change / prevValue) * 100;
                      const isPositive = change >= 0;
                      
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {format(new Date(entry.date), 'dd MMM yyyy', { locale: id })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(entry.value)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={`flex items-center justify-end gap-1 ${
                              isPositive ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {isPositive ? (
                                <ArrowUpRight className="w-4 h-4" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4" />
                              )}
                              <span>
                                {percentChange.toFixed(1)}%
                              </span>
                              <span className="text-xs opacity-80">
                                ({isPositive ? '+' : ''}{formatCurrency(change)})
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Belum ada data histori perubahan nilai
            </div>
          )}
        </div>
        
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteAsset}
          title="Hapus Aset"
          description="Apakah Anda yakin ingin menghapus aset"
          itemName={asset.name}
          confirmLabel="Hapus"
          cancelLabel="Batal"
        />
      </div>
    </Layout>
  );
}
