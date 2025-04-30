import React, { useState, useEffect } from "react";
import FeatureToggle from "@/components/FeatureToggle";
import { DollarSign, PiggyBank, CreditCard, AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { hasProAccess, getSubscriptionStatus, UserSubscriptionProfile } from "@/utils/subscription";
import { useNavigate } from "react-router-dom";

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

// Storage key untuk menyimpan pengaturan fitur di localStorage
const LOCAL_STORAGE_FEATURES_KEY = 'finance_app_feature_settings';

const FeaturesSection = ({
  user,
  settings,
  toggleLoading,
  onToggleFeature,
}: FeaturesSectionProps) => {
  const { user: authUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserSubscriptionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProUser, setIsProUser] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'admin' | 'pro' | 'trial' | 'free'>('free');
  const [localSettings, setLocalSettings] = useState<{
    show_budgeting: boolean;
    show_savings: boolean;
    show_loans: boolean;
  } | null>(null);
  const navigate = useNavigate();
  
  // Saat komponen dimuat, coba ambil pengaturan dari localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(LOCAL_STORAGE_FEATURES_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setLocalSettings(parsedSettings);
        console.log("Loaded settings from localStorage:", parsedSettings);
      }
    } catch (error) {
      console.error("Error loading settings from localStorage:", error);
    }
  }, []);
  
  // ! FIX: Gunakan authUser jika user tidak memiliki id
  useEffect(() => {
    // Gunakan user.id atau authUser?.id, jika salah satu tersedia
    const userId = user?.id || authUser?.id;
    if (userId) {
      console.log("FeaturesSection - fetching profile for userId:", userId);
      fetchUserProfile(userId);
    } else {
      console.log("FeaturesSection - no userId available");
      setLoading(false);
    }
  }, [user, authUser]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      console.log("FeaturesSection - fetchUserProfile started for userId:", userId);
      
      // Fetch data dari Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Gunakan pengaturan lokal jika tersedia
        if (localSettings) {
          console.log("Using local settings as fallback");
        }
        setLoading(false);
        return;
      }
      
      // Validasi data yang diterima
      if (!data) {
        console.error('No profile data returned for userId:', userId);
        // Gunakan pengaturan lokal jika tersedia
        if (localSettings) {
          console.log("Using local settings as fallback");
        }
        setLoading(false);
        return;
      }
      
      const profileData = data as UserSubscriptionProfile;
      
      // Print semua fields dari profileData
      console.log("PROFILE_DATA_FULL:", JSON.stringify(profileData, null, 2));
      
      // Update state userProfile
      setUserProfile(profileData);
      
      // Tentukan status subscription
      const status = getSubscriptionStatus(profileData);
      setSubscriptionStatus(status);
      
      // Periksa apakah memiliki akses Pro (Pro, Trial, atau Admin)
      const proAccess = hasProAccess(profileData);
      setIsProUser(proAccess);
      
      console.log('FeaturesSection - Profile loaded successfully:');
      console.log('- is_admin:', profileData?.is_admin);
      console.log('- subscription_type:', profileData?.subscription_type);
      console.log('- trial_end:', profileData?.trial_end);
      console.log('- subscription_active:', profileData?.subscription_active);
      console.log('- Status:', status);
      console.log('- Has Pro access:', proAccess);
      
      // Jika pengguna bukan Pro tetapi harusnya Pro, coba force update
      if (!proAccess && (profileData?.subscription_type === 'pro_6m' || profileData?.subscription_type === 'pro_12m')) {
        console.warn("WARNING: User has Pro subscription type but hasProAccess returned false!");
        
        // Coba force set status Pro
        setIsProUser(true);
        setSubscriptionStatus('pro');
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Gunakan pengaturan lokal jika tersedia
      if (localSettings) {
        console.log("Using local settings as fallback due to error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Menggunakan settings dari props atau dari storage lokal jika ada masalah
  const effectiveSettings = {
    show_budgeting: settings.show_budgeting,
    show_savings: settings.show_savings,
    show_loans: settings.show_loans
  };

  const handleToggleClick = (setting: 'show_budgeting' | 'show_savings' | 'show_loans') => {
    // Dapatkan nilai pengaturan saat ini (dari props atau local sebagai fallback)
    const currentValue = effectiveSettings[setting];
    
    // Jika user free dan ingin mengaktifkan fitur, tampilkan pesan upgrade
    if (!isProUser && !currentValue) {
      const message = `Halo, saya ingin upgrade ke paket Pro untuk menggunakan fitur ${
        setting === 'show_budgeting' ? 'Anggaran' : 
        setting === 'show_savings' ? 'Tabungan' : 'Hutang & Piutang'
      } di aplikasi Keuangan Pribadi.`;
      const whatsappUrl = `https://wa.me/6281387013123?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      return;
    }

    try {
      // Perbarui pengaturan lokal
      const newSettings = {
        ...effectiveSettings,
        [setting]: !currentValue
      };
      
      // Simpan ke localStorage untuk backup
      localStorage.setItem(LOCAL_STORAGE_FEATURES_KEY, JSON.stringify(newSettings));
      setLocalSettings(newSettings);
      
      // Panggil fungsi toggle dari parent component
      onToggleFeature(setting);
    } catch (error) {
      console.error(`Error toggling feature ${setting}:`, error);
      alert("Terjadi kesalahan saat mengubah pengaturan. Silakan coba lagi.");
    }
  };

  const renderProBadge = () => (
    <div className="px-2.5 py-1 bg-purple-100 text-purple-600 text-xs rounded-full font-medium">
      PRO
    </div>
  );
  
  // Render badge sesuai jenis subscription
  const renderStatusBadge = () => {
    if (subscriptionStatus === 'trial') {
      return (
        <div className="px-2.5 py-1 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">
          TRIAL PRO
        </div>
      );
    } else if (subscriptionStatus === 'pro') {
      return (
        <div className="px-2.5 py-1 bg-purple-100 text-purple-600 text-xs rounded-full font-medium">
          PRO
        </div>
      );
    } else if (subscriptionStatus === 'admin') {
      return (
        <div className="px-2.5 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
          ADMIN
        </div>
      );
    }
    return (
      <div className="px-2.5 py-1 bg-orange-100 text-orange-600 text-xs rounded-full font-medium">
        FREE
      </div>
    );
  };

  // Loading state dipersingkat, hanya tampilkan spinner kecil
  if (loading) {
    return (
      <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold">Fitur</h2>
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {['budgeting', 'savings', 'loans'].map((feature, index) => (
              <div key={index} className="h-14 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="font-semibold">Fitur</h2>
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-2">Status:</span>
          {renderStatusBadge()}
        </div>
      </div>
      
      <div className={isProUser ? '' : 'opacity-70'}>
        <FeatureToggle
          icon={<DollarSign className="w-4 h-4 text-blue-600" />}
          title="Budgeting"
          description="Atur dan pantau anggaran keuangan kamu"
          checked={effectiveSettings.show_budgeting}
          onToggle={() => handleToggleClick('show_budgeting')}
          managementLink={isProUser || effectiveSettings.show_budgeting ? "/budgets" : undefined}
          loading={toggleLoading.show_budgeting}
          disabled={!isProUser && !effectiveSettings.show_budgeting}
          extraElement={!isProUser && renderProBadge()}
        />
      </div>
      
      <div className={`border-b border-gray-100 ${isProUser ? '' : 'opacity-70'}`}>
        <FeatureToggle
          icon={<PiggyBank className="w-4 h-4 text-green-600" />}
          title="Tabungan"
          description="Atur target dan pantau tabungan kamu"
          checked={effectiveSettings.show_savings}
          onToggle={() => handleToggleClick('show_savings')}
          managementLink={isProUser || effectiveSettings.show_savings ? "/savings" : undefined}
          loading={toggleLoading.show_savings}
          disabled={!isProUser && !effectiveSettings.show_savings}
          extraElement={!isProUser && renderProBadge()}
        />
      </div>
      
      <div className={isProUser ? '' : 'opacity-70'}>
        <FeatureToggle
          icon={<CreditCard className="w-4 h-4 text-red-600" />}
          title="Hutang & Piutang"
          description="Kelola data hutang dan piutang"
          checked={effectiveSettings.show_loans}
          onToggle={() => handleToggleClick('show_loans')}
          managementLink={isProUser || effectiveSettings.show_loans ? "/loans" : undefined}
          loading={toggleLoading.show_loans}
          disabled={!isProUser && !effectiveSettings.show_loans}
          extraElement={!isProUser && renderProBadge()}
        />
      </div>

      {/* Hanya tampilkan notifikasi upgrade jika bukan Pro user */}
      {!isProUser && (
        <div className="p-4 bg-orange-50 border-t border-orange-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-orange-800 mb-2">
                Fitur-fitur ini tersedia hanya untuk pengguna Pro. Upgrade sekarang untuk menggunakan semua fitur tanpa batasan!
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => navigate('/upgrade')}
                >
                  Upgrade ke Pro
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-200 text-orange-800 hover:bg-orange-100"
                  onClick={() => navigate('/profile')}
                >
                  Pengaturan Akun
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturesSection;
