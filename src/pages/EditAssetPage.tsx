
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Asset } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AssetForm } from "@/components/assets/AssetForm";

export default function EditAssetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchAsset();
    }
  }, [user, id]);

  const fetchAsset = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Aset tidak ditemukan",
          description: "Data aset yang Anda cari tidak ditemukan",
          variant: "destructive"
        });
        navigate("/assets");
        return;
      }

      setAsset(data);
      
    } catch (error: any) {
      console.error("Error fetching asset:", error);
      toast({
        title: "Gagal memuat data",
        description: "Terjadi kesalahan saat memuat data aset",
        variant: "destructive"
      });
      navigate("/assets");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 pb-32 max-w-2xl">
        <div className="text-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Memuat data aset...</p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return null;
  }

  const defaultValues = {
    name: asset.name,
    category: asset.category,
    initial_value: asset.initial_value,
    purchase_date: asset.purchase_date,
    purchase_year: asset.purchase_year,
  };

  return (
    <AssetForm 
      isEditing 
      assetId={asset.id} 
      defaultValues={defaultValues} 
    />
  );
}
