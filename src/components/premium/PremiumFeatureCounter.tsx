import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { hasProAccess, UserSubscriptionProfile } from "@/utils/subscription";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PremiumFeatureCounterProps {
  children: React.ReactNode;
  feature: "analysis" | "wallet_detail";
  walletId?: string; // Opsional, untuk wallet_detail
  userProfile: UserSubscriptionProfile | null;
  fallback?: React.ReactNode;
  maxDailyCount: number;
}

const PremiumFeatureCounter = ({ 
  children, 
  feature, 
  walletId, 
  userProfile, 
  fallback,
  maxDailyCount 
}: PremiumFeatureCounterProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [redirectingToUpgrade, setRedirectingToUpgrade] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [userProfile]);

  const checkAccess = () => {
    setIsLoading(true);

    // Debug log untuk status userProfile
    console.log("PremiumFeatureCounter - userProfile:", userProfile);
    
    // Periksa apakah userProfile sudah ada
    if (!userProfile) {
      console.log("PremiumFeatureCounter - userProfile belum tersedia");
      setIsLoading(false);
      return;
    }

    // Periksa apakah pengguna adalah Pro
    const isPro = hasProAccess(userProfile);
    console.log("PremiumFeatureCounter - isPro:", isPro, "userProfile:", userProfile);
    
    if (isPro) {
      console.log(`PremiumFeatureCounter - User memiliki akses Pro ke ${feature}`);
      setHasAccess(true);
      setIsLoading(false);
      return;
    }

    // Jika bukan Pro, periksa counter harian
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    const storageKey = feature === "wallet_detail" && walletId 
      ? `${feature}_${walletId}_${today}` 
      : `${feature}_${today}`;
    
    // Ambil data dari localStorage
    const storedCount = localStorage.getItem(storageKey);
    const count = storedCount ? parseInt(storedCount, 10) : 0;
    
    console.log(`PremiumFeatureCounter - Akses ${feature} hari ini: ${count}/${maxDailyCount}`);
    
    if (count < maxDailyCount) {
      // Masih dalam batas, tingkatkan counter
      localStorage.setItem(storageKey, (count + 1).toString());
      setHasAccess(true);
      console.log(`PremiumFeatureCounter - Akses diberikan, counter ditingkatkan ke ${count + 1}`);
    } else {
      // Sudah melebihi batas
      setHasAccess(false);
      console.log(`PremiumFeatureCounter - Batas akses tercapai untuk ${feature}`);
      
      // Tampilkan toast
      toast({
        title: "Batas Harian Tercapai",
        description: `Upgrade ke Pro untuk akses ${feature === "analysis" ? "Analisis" : "Detail Dompet"} tanpa batas`,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleUpgrade = () => {
    setRedirectingToUpgrade(true);
    navigate("/upgrade");
  };

  // Jika sedang loading, tampilkan loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-10 w-10 bg-gray-200 rounded-full mb-2"></div>
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Jika userProfile belum ada, tampilkan children (asumsi pengguna berhak akses)
  if (!userProfile) {
    console.log("PremiumFeatureCounter - Rendering children karena userProfile belum tersedia");
    return <>{children}</>;
  }

  // Jika tidak memiliki akses, tampilkan fallback atau pesan default
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Tampilkan fallback default
    return (
      <div className="bg-orange-50 p-4 rounded-lg mb-6 border border-orange-100">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-orange-800 mb-1">Batas Harian Tercapai</h3>
            <p className="text-sm text-orange-700 mb-3">
              {feature === "analysis" 
                ? "Anda telah mencapai batas 1x melihat Analisis hari ini. Upgrade ke Pro untuk akses tanpa batas."
                : `Anda telah mencapai batas ${maxDailyCount}x melihat Detail Dompet hari ini. Upgrade ke Pro untuk akses tanpa batas.`}
            </p>
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleUpgrade}
            >
              Upgrade ke Pro
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Jika memiliki akses, tampilkan konten
  return <>{children}</>;
};

export default PremiumFeatureCounter; 