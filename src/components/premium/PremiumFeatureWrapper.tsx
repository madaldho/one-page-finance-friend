import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock } from "lucide-react";
import { hasProAccess, UserSubscriptionProfile } from "@/utils/subscription";

interface PremiumFeatureWrapperProps {
  children: React.ReactNode;
  feature: "budget" | "loan" | "saving" | "analysis" | "assets";
  fallback?: React.ReactNode;
  checkOnMount?: boolean;
}

const PremiumFeatureWrapper = ({
  children,
  feature,
  fallback,
  checkOnMount = true,
}: PremiumFeatureWrapperProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [userProfile, setUserProfile] = useState<UserSubscriptionProfile | null>(null);

  useEffect(() => {
    if (checkOnMount) {
      checkPremiumStatus();
    }
  }, [checkOnMount]);

  const checkPremiumStatus = async () => {
    try {
      setIsLoading(true);
      
      // Dapatkan user saat ini
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Jika tidak ada user, arahkan ke login
        navigate("/login");
        return;
      }
      
      // Dapatkan profil user
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) throw error;
      
      // Simpan profil pengguna
      setUserProfile(profile as UserSubscriptionProfile);
      
      // Periksa apakah pengguna memiliki akses pro (premium atau trial)
      const hasPremiumAccess = hasProAccess(profile as UserSubscriptionProfile);
      
      setIsPremium(hasPremiumAccess);
      
      // Jika tidak premium dan checkOnMount true, arahkan ke halaman upgrade
      if (!hasPremiumAccess && checkOnMount) {
        navigate("/upgrade");
      }
    } catch (error) {
      console.error("Error checking premium status:", error);
      toast({
        title: "Terjadi kesalahan",
        description: "Tidak dapat memeriksa status langganan Anda",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate("/upgrade");
  };

  const getFeatureName = (featureKey: string) => {
    switch (featureKey) {
      case "budget":
        return "Budget Management";
      case "loan":
        return "Hutang & Piutang";
      case "saving":
        return "Tabungan";
      case "analysis":
        return "Analisis Keuangan";
      case "assets":
        return "Aset";
      default:
        return "Fitur Premium";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Tampilkan custom fallback jika disediakan
  if (!isPremium && fallback) {
    return fallback;
  }

  // Tampilkan fallback default jika tidak premium dan tidak ada fallback yang disediakan
  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 border border-gray-200">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">Fitur Premium</h2>
        <p className="text-gray-600 text-center mb-6 max-w-md">
          Fitur {getFeatureName(feature)} hanya tersedia untuk pengguna premium.
          Upgrade sekarang untuk mengakses semua fitur!
        </p>
        <button
          onClick={handleUpgrade}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Upgrade ke Premium
        </button>
      </div>
    );
  }

  // Tampilkan konten utama jika pengguna premium
  return <>{children}</>;
};

export default PremiumFeatureWrapper; 