
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Asset } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AssetUpdateForm } from "@/components/assets/AssetUpdateForm";

export default function UpdateAssetValuePage() {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
        </div>

        <div className="container mx-auto py-2 px-2 md:px-6 max-w-2xl relative z-10 pt-6 md:pt-4 pb-32">
          <div className="flex flex-col items-center justify-center text-gray-500 py-20 backdrop-blur-sm bg-white/80 rounded-2xl shadow-sm border border-white/20">
            <div className="animate-spin w-12 h-12 border-3 border-purple-600 border-t-transparent rounded-full mb-6"></div>
            <p className="text-lg font-medium text-gray-700">Memuat data aset...</p>
            <p className="text-sm text-gray-500 mt-2">Mohon tunggu sebentar</p>
          </div>
        </div>
      </div>
    );
  }

  if (!asset) {
    return null;
  }

  return <AssetUpdateForm asset={asset} />;
}
