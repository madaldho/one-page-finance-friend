import React, { useState, useEffect, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Blocks, House } from "lucide-react";
import ProfileSection from "@/components/settings/ProfileSection";
import FeaturesSection from "@/components/settings/FeaturesSection";
import ActionSection from "@/components/settings/ActionSection";
import Footer from "@/components/settings/Footer";
import { Button } from "@/components/ui/button";
import { getCache, setCache } from "@/lib/utils";

// Deklarasi konstanta untuk caching
const SETTINGS_CACHE_KEY = 'settings_data';
const CACHE_DURATION_MINUTES = 30;

interface UserWithProfile {
  id?: string;
  email?: string;
  profile?: Record<string, unknown>;
}

interface UserSettingsForm {
  show_budgeting: boolean;
  show_savings: boolean;
  show_loans: boolean;
}

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [settings, setSettings] = useState<UserSettingsForm>({
    show_budgeting: false,
    show_savings: false,
    show_loans: false,
  });
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({});
  const [dataInitialized, setDataInitialized] = useState(false);

  // Update pengaturan di server di background
  const updateSettingInBackground = async (setting: keyof UserSettingsForm, userId: string, value: boolean) => {
    try {
      const { data, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (data) {
        await supabase
          .from('user_settings')
          .update({ [setting]: value })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            show_budgeting: setting === 'show_budgeting' ? value : settings.show_budgeting,
            show_savings: setting === 'show_savings' ? value : settings.show_savings,
            show_loans: setting === 'show_loans' ? value : settings.show_loans,
          });
      }
      
      // Update cache
      if (userId) {
        const cacheKey = `${SETTINGS_CACHE_KEY}_${userId}`;
        const newSettings = { ...settings, [setting]: value };
        
        setCache({
          key: cacheKey,
          data: newSettings,
          expiresInMinutes: CACHE_DURATION_MINUTES
        });
      }
    } catch (error) {
      console.error('Error updating setting in background:', error);
    }
  };

  // Fungsi untuk merefresh pengaturan di background tanpa blocking UI
  const refreshSettingsInBackground = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileData) {
        setUser(prev => ({
          ...prev,
          profile: profileData
        }));
      }
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        const userSettings = {
          show_budgeting: data.show_budgeting || false,
          show_savings: data.show_savings || false,
          show_loans: data.show_loans || false,
        };
        
        setSettings(userSettings);
        
        // Update cache
        const cacheKey = `${SETTINGS_CACHE_KEY}_${userId}`;
        setCache({
          key: cacheKey,
          data: userSettings,
          expiresInMinutes: CACHE_DURATION_MINUTES
        });
      }
    } catch (error) {
      console.error('Error refreshing settings:', error);
    }
  };
  
  // Fetch data pengguna dan pengaturan, digunakan saat tidak ada cache
  const fetchUserData = async (userId: string) => {
    try {
      const [profileResponse, settingsResponse] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_settings').select('*').eq('user_id', userId).single()
      ]);
      
      if (profileResponse.data) {
        setUser(prev => ({
          ...prev,
          profile: profileResponse.data
        }));
      }
      
      if (settingsResponse.data) {
        const userSettings = {
          show_budgeting: settingsResponse.data.show_budgeting || false,
          show_savings: settingsResponse.data.show_savings || false,
          show_loans: settingsResponse.data.show_loans || false,
        };
        
        setSettings(userSettings);
        
        // Cache settings untuk penggunaan selanjutnya
        const cacheKey = `${SETTINGS_CACHE_KEY}_${userId}`;
        setCache({
          key: cacheKey,
          data: userSettings,
          expiresInMinutes: CACHE_DURATION_MINUTES
        });
      }
      
      setDataInitialized(true);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setDataInitialized(true);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Tidak Terautentikasi",
            description: "Silakan login untuk melihat pengaturan",
            variant: "destructive"
          });
          navigate("/");
          return;
        }
        
        setUser(session.user);
        
        // Cek cache untuk pengaturan
        const userId = session.user.id;
        const cacheKey = `${SETTINGS_CACHE_KEY}_${userId}`;
        const cachedSettings = getCache<UserSettingsForm>(cacheKey);
        
        if (cachedSettings) {
          setSettings(cachedSettings);
          setDataInitialized(true);
          
          // Background refresh - tidak perlu menunggu hasil
          refreshSettingsInBackground(userId);
          return;
        }
        
        // Jika tidak ada cache, fetch secara normal
        await fetchUserData(userId);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    
    fetchSettings();
  }, [toast, navigate]);
  
  const handleToggleChange = async (setting: keyof UserSettingsForm) => {
    try {
      setToggleLoading({...toggleLoading, [setting]: true});
      
      // Optimistic update UI
      setSettings(prev => ({
        ...prev,
        [setting]: !prev[setting]
      }));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Tidak Terautentikasi",
          description: "Silakan login untuk mengubah pengaturan",
          variant: "destructive"
        });
        return;
      }
      
      // Background update ke server
      updateSettingInBackground(setting, session.user.id, !settings[setting]);
    } catch (error) {
      console.error('Error updating settings:', error);
      
      // Rollback UI jika error
      setSettings(prev => ({
        ...prev,
        [setting]: !prev[setting]
      }));
      
      toast({
        title: "Gagal Memperbarui Pengaturan",
        description: "Terjadi kesalahan saat menyimpan pengaturan",
        variant: "destructive"
      });
    } finally {
      // Segera hapus loading state untuk UI responsif
      setTimeout(() => {
        setToggleLoading({...toggleLoading, [setting]: false});
      }, 300);
    }
  };
  
  const handleExportData = async () => {
    try {
      // Light loading indicator
      setToggleLoading({...toggleLoading, export: true});
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Tidak Terautentikasi",
          description: "Silakan login untuk mengekspor data",
          variant: "destructive"
        });
        return;
      }
      
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id);
        
      if (txError) throw txError;
      
      const headers = [
        'id', 'date', 'title', 'amount', 'type', 'category', 
        'wallet', 'description', 'created_at'
      ];
      
      const csvContent = [
        headers.join(','),
        ...transactions.map(tx => headers.map(header => 
          tx[header as keyof typeof tx] !== undefined ? 
          `"${tx[header as keyof typeof tx]}"` : '""'
        ).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Keuangan Pribadi-transaksi-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Data Berhasil Diekspor",
        description: "File CSV telah diunduh",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Gagal Mengekspor Data",
        description: "Terjadi kesalahan saat mengekspor data",
        variant: "destructive"
      });
    } finally {
      setToggleLoading({...toggleLoading, export: false});
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-2xl">
        <h1 className="text-xl font-bold mb-6">Pengaturan</h1>
        
        {/* Skeleton loader untuk ProfileSection saat data belum diinisialisasi */}
        {!dataInitialized ? (
          <div className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-200"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-40 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </div>
            </div>
          </div>
        ) : (
          <ProfileSection user={user} />
        )}
        
        <FeaturesSection 
          user={user}
          settings={settings} 
          toggleLoading={toggleLoading} 
          onToggleFeature={handleToggleChange} 
        />
        
        <section className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
          <h2 className="font-semibold p-4 border-b border-gray-100">Konfigurasi</h2>
          
          <div className="border-b border-gray-100 hover:bg-gray-50">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => navigate('/assets')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <House className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Aset</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Kelola aset dan pantau nilai kekayaan Anda
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100 hover:bg-gray-50">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => navigate('/categories')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Blocks className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Kategori</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Kelola kategori untuk transaksi pemasukan dan pengeluaran
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </section>
        
        <ActionSection 
          handleExportData={handleExportData} 
          loading={toggleLoading.export} 
        />
        
        <Footer />
      </div>
    </Layout>
  );
};

export default Settings;
