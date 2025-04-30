import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { hasProAccess, UserSubscriptionProfile } from "@/utils/subscription";

interface ProtectedProRouteProps {
  children: React.ReactNode;
  feature: "budget" | "loan" | "saving" | "analysis" | "assets";
}

/**
 * Komponen untuk memproteksi routes yang hanya boleh diakses oleh pengguna Pro
 * Untuk pengguna non-Pro, akan mengarahkan ke halaman upgrade
 */
const ProtectedProRoute: React.FC<ProtectedProRouteProps> = ({ children, feature }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasPro, setHasPro] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Dapatkan profil user
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
          
        if (error) throw error;
        
        // Periksa apakah user memiliki akses Pro
        const userHasProAccess = hasProAccess(profile as UserSubscriptionProfile);
        setHasPro(userHasProAccess);
        
        // Jika user tidak memiliki akses pro, arahkan ke halaman upgrade
        if (!userHasProAccess) {
          navigate('/upgrade');
        }
      } catch (error) {
        console.error("Error checking pro access:", error);
        setHasPro(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, navigate]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Jika user tidak login, arahkan ke halaman login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render konten jika user memiliki akses Pro
  return <>{children}</>;
};

export default ProtectedProRoute; 