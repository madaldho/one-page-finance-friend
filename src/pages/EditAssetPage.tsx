
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Asset } from '@/types';
import { AssetForm } from '@/components/assets/AssetForm';
import Layout from '@/components/Layout';
import { Loader2 } from 'lucide-react';

export default function EditAssetPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAsset = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Tidak Terautentikasi",
            description: "Silakan login untuk mengedit aset",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        setAsset(data);
      } catch (error: any) {
        console.error('Error fetching asset:', error);
        toast({
          title: "Gagal Memuat Data",
          description: error.message || "Terjadi kesalahan saat mengambil data aset",
          variant: "destructive"
        });
        navigate('/assets');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAsset();
  }, [id, toast, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4 flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!asset) {
    return null;
  }

  return <AssetForm asset={asset} mode="edit" />;
}
