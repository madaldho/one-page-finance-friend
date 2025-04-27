import React, { useState, useEffect, useCallback, memo } from "react";
import { DollarSign, PiggyBank, CreditCard, AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import FeatureItem from "./FeatureItem";
import { Badge } from "@/components/ui/badge";
import { hasProAccess, getSubscriptionStatus, UserSubscriptionProfile } from "@/utils/subscription";

interface UserWithProfile {
  id?: string;
  email?: string;
  profile?: Record<string, unknown>;
}

interface FeaturesSectionProps {
  user: UserWithProfile;
  settings: {
    show_budgeting: boolean;
    show_savings: boolean;
    show_loans: boolean;
  };
  toggleLoading: Record<string, boolean>;
  onToggleFeature: (feature: string) => void;
}

// Memoized komponen untuk mencegah rendering ulang
const FeatureStatusBadge = memo(({ status }: { status: string }) => {
  switch (status) {
    case 'trial':
      return (
        <Badge variant="outline" className="px-2 py-0.5 bg-blue-100 text-blue-600 border-blue-200 text-xs rounded-full">
          TRIAL PRO
        </Badge>
      );
    case 'pro':
      return (
        <Badge variant="outline" className="px-2 py-0.5 bg-purple-100 text-purple-600 border-purple-200 text-xs rounded-full">
          PRO
        </Badge>
      );
    case 'admin':
      return (
        <Badge variant="outline" className="px-2 py-0.5 bg-red-100 text-red-600 border-red-200 text-xs rounded-full">
          ADMIN
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="px-2 py-0.5 bg-orange-100 text-orange-600 border-orange-200 text-xs rounded-full">
          FREE
        </Badge>
      );
  }
});

const FeaturesSection = ({
  user,
  settings,
  onToggleFeature,
}: FeaturesSectionProps) => {
  const { user: authUser } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('free');
  const [isProUser, setIsProUser] = useState(false);
  const navigate = useNavigate();
  
  // Menggunakan useCallback untuk mencegah fungsi dibuat ulang pada setiap render
  const handleFeatureClick = useCallback((path: string, isEnabled: boolean) => {
    if (isEnabled) {
      navigate(path);
    }
  }, [navigate]);
  
  // Fetch profile info sekali saja saat komponen dimount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userId = user?.id || authUser?.id;
        if (!userId) return;
        
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (data) {
          const profileData = data as UserSubscriptionProfile;
          const status = getSubscriptionStatus(profileData);
          setSubscriptionStatus(status);
          setIsProUser(hasProAccess(profileData));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [user?.id, authUser?.id]);
  
  // Fungsi untuk handle toggle dari FeatureItem
  const handleToggleFeature = useCallback((feature: string) => {
    // Jika pengguna free dan ingin mengaktifkan fitur, tampilkan pesan upgrade
    if (!isProUser && !settings[feature as keyof typeof settings]) {
      navigate('/upgrade');
      return;
    }
    
    // Panggil handler dari parent
    onToggleFeature(feature);
  }, [isProUser, settings, onToggleFeature, navigate]);

  return (
    <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="font-semibold">Fitur</h2>
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-2">Status:</span>
          <FeatureStatusBadge status={subscriptionStatus} />
        </div>
      </div>
      
      {/* Budgeting */}
      <FeatureItem 
        icon={<DollarSign className="w-4 h-4 text-blue-600" />}
        title="Budgeting"
        description="Atur dan pantau anggaran keuangan kamu"
        isEnabled={settings.show_budgeting}
        isPro={isProUser}
        onClick={() => {
          if (settings.show_budgeting) {
            handleFeatureClick('/budgets', settings.show_budgeting);
          } else {
            handleToggleFeature('show_budgeting');
          }
        }}
      />
      
      {/* Tabungan */}
      <FeatureItem 
        icon={<PiggyBank className="w-4 h-4 text-green-600" />}
        title="Tabungan"
        description="Atur target dan pantau tabungan kamu"
        isEnabled={settings.show_savings}
        isPro={isProUser}
        onClick={() => {
          if (settings.show_savings) {
            handleFeatureClick('/savings', settings.show_savings);
          } else {
            handleToggleFeature('show_savings');
          }
        }}
      />
      
      {/* Hutang & Piutang */}
      <FeatureItem 
        icon={<CreditCard className="w-4 h-4 text-red-600" />}
        title="Hutang & Piutang"
        description="Kelola data hutang dan piutang"
        isEnabled={settings.show_loans}
        isPro={isProUser}
        onClick={() => {
          if (settings.show_loans) {
            handleFeatureClick('/loans', settings.show_loans);
          } else {
            handleToggleFeature('show_loans');
          }
        }}
      />

      {/* Notifikasi upgrade */}
      {!isProUser && (
        <div className="p-4 bg-orange-50 border-t border-orange-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-orange-800 mb-2">
                Fitur-fitur ini tersedia untuk pengguna Pro. Upgrade sekarang untuk menggunakan semua fitur tanpa batasan!
              </p>
              <Button 
                size="sm" 
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => navigate('/upgrade')}
              >
                Upgrade ke Pro
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Menggunakan memo untuk mencegah re-render yang tidak perlu
export default memo(FeaturesSection);
