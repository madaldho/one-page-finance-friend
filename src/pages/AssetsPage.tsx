
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Asset } from '@/types';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { AssetCard } from '@/components/assets/AssetCard';
import { Plus, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AssetsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWorth, setTotalWorth] = useState(0);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Tidak Terautentikasi",
            description: "Silakan login untuk melihat aset",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setAssets(data || []);
        
        // Calculate total net worth
        const worth = data?.reduce((sum, asset) => sum + asset.current_value, 0) || 0;
        setTotalWorth(worth);
      } catch (error: any) {
        console.error('Error fetching assets:', error);
        toast({
          title: "Gagal Memuat Data",
          description: error.message || "Terjadi kesalahan saat mengambil data aset",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssets();
  }, [toast, navigate]);

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">Aset</h1>
          <Button onClick={() => navigate('/assets/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Aset
          </Button>
        </div>
        
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-medium opacity-90 mb-1">Total Nilai Kekayaan</h2>
          <p className="text-3xl font-bold">{formatCurrency(totalWorth)}</p>
          <p className="text-sm opacity-80 mt-2">
            Total dari {assets.length} aset yang terdaftar
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : assets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Aset</h3>
            <p className="text-gray-500 mb-4">
              Anda belum menambahkan aset kekayaan apapun. Mulai tambahkan aset Anda untuk 
              melacak pertumbuhan nilai kekayaan.
            </p>
            <Button onClick={() => navigate('/assets/add')}>
              <Plus className="w-4 h-4 mr-2" /> 
              Tambah Aset Pertama
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
