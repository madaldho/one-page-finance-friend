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

interface FeaturesSectionProps {
  settings: {
    show_budgeting: boolean;
    show_savings: boolean;
    show_loans: boolean;
  };
  toggleLoading: Record<string, boolean>;
  onToggleChange: (setting: 'show_budgeting' | 'show_savings' | 'show_loans') => void;
}

const FeaturesSection = ({ 
  settings, 
  toggleLoading, 
  onToggleChange 
}: FeaturesSectionProps) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const isProUser = userProfile?.subscription_type === 'pro_6m' || userProfile?.subscription_type === 'pro_12m';

  const handleToggleClick = (setting: 'show_budgeting' | 'show_savings' | 'show_loans') => {
    // Jika user free dan ingin mengaktifkan fitur, tampilkan pesan
    if (!isProUser && !settings[setting]) {
      const message = `Halo, saya ingin upgrade ke paket Pro untuk menggunakan fitur ${
        setting === 'show_budgeting' ? 'Anggaran' : 
        setting === 'show_savings' ? 'Tabungan' : 'Hutang & Piutang'
      } di aplikasi Keuangan Pribadi.`;
      const whatsappUrl = `https://wa.me/6281387013123?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      return;
    }

    // Jika pro user atau ingin menonaktifkan fitur, lanjutkan seperti biasa
    onToggleChange(setting);
  };

  const renderProBadge = () => (
    <div className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full font-medium">
      PRO
    </div>
  );

  return (
    <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
      <h2 className="font-semibold p-4 border-b border-gray-100">Fitur</h2>
      
      <div className={`border-b border-gray-100 ${!isProUser ? 'opacity-70' : ''}`}>
        <FeatureToggle
          icon={<DollarSign className="w-4 h-4 text-blue-600" />}
          title="Budgeting"
          description="Atur dan pantau anggaran keuangan kamu"
          checked={settings.show_budgeting}
          onToggle={() => handleToggleClick('show_budgeting')}
          managementLink={isProUser ? "/budgets" : undefined}
          loading={toggleLoading.show_budgeting}
          disabled={!isProUser}
          extraElement={!isProUser && renderProBadge()}
        />
      </div>
      
      <div className={`border-b border-gray-100 ${!isProUser ? 'opacity-70' : ''}`}>
        <FeatureToggle
          icon={<PiggyBank className="w-4 h-4 text-green-600" />}
          title="Tabungan"
          description="Atur target dan pantau tabungan kamu"
          checked={settings.show_savings}
          onToggle={() => handleToggleClick('show_savings')}
          managementLink={isProUser ? "/savings" : undefined}
          loading={toggleLoading.show_savings}
          disabled={!isProUser}
          extraElement={!isProUser && renderProBadge()}
        />
      </div>
      
      <div className={`${!isProUser ? 'opacity-70' : ''}`}>
        <FeatureToggle
          icon={<CreditCard className="w-4 h-4 text-red-600" />}
          title="Hutang & Piutang"
          description="Kelola data hutang dan piutang"
          checked={settings.show_loans}
          onToggle={() => handleToggleClick('show_loans')}
          managementLink={isProUser ? "/loans" : undefined}
          loading={toggleLoading.show_loans}
          disabled={!isProUser}
          extraElement={!isProUser && renderProBadge()}
        />
      </div>

      {!isProUser && (
        <div className="p-4 bg-orange-50 border-t border-orange-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-orange-800 mb-2">
                Fitur-fitur ini tersedia hanya untuk pengguna Pro. Upgrade sekarang untuk menggunakan semua fitur tanpa batasan!
              </p>
              <Button 
                size="sm" 
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => {
                  const message = "Halo, saya ingin upgrade ke paket Pro untuk aplikasi Keuangan Pribadi.";
                  const whatsappUrl = `https://wa.me/6281387013123?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
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

export default FeaturesSection;
