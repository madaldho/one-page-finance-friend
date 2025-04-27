import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2,  ChevronRight, Blocks, House } from "lucide-react";
import ProfileSection from "@/components/settings/ProfileSection";
import FeaturesSection from "@/components/settings/FeaturesSection";
import ActionSection from "@/components/settings/ActionSection";
import Footer from "@/components/settings/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [settings, setSettings] = useState<UserSettingsForm>({
    show_budgeting: false,
    show_savings: false,
    show_loans: false,
  });
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
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
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
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
          .eq('user_id', session.user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setSettings({
            show_budgeting: data.show_budgeting || false,
            show_savings: data.show_savings || false,
            show_loans: data.show_loans || false,
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: "Gagal Memuat Pengaturan",
          description: "Terjadi kesalahan saat mengambil data pengaturan",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [toast, navigate]);
  
  const handleToggleChange = async (setting: keyof UserSettingsForm) => {
    try {
      setToggleLoading({...toggleLoading, [setting]: true});
      
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
      
      const { data, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (data) {
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({
            [setting]: !settings[setting]
          })
          .eq('user_id', session.user.id);
          
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: session.user.id,
            show_budgeting: setting === 'show_budgeting' ? !settings.show_budgeting : settings.show_budgeting,
            show_savings: setting === 'show_savings' ? !settings.show_savings : settings.show_savings,
            show_loans: setting === 'show_loans' ? !settings.show_loans : settings.show_loans,
          });
          
        if (insertError) throw insertError;
      }
      
      toast({
        title: "Pengaturan Berhasil Disimpan",
        description: "Pengaturan kamu telah diperbarui",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
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
      setToggleLoading({...toggleLoading, [setting]: false});
    }
  };
  
  const handleExportData = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4 pb-32 max-w-2xl">
          <h1 className="text-xl font-bold mb-6">Pengaturan</h1>
          
          {/* Profile Section Skeleton */}
          <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-semibold">Profil</h2>
            </div>
            <div className="p-4 flex items-center">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="ml-4 flex-1">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </section>
          
          {/* Features Section Skeleton */}
          <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-semibold">Fitur</h2>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </section>
          
          {/* Configuration Section Skeleton */}
          <section className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
            <h2 className="font-semibold p-4 border-b border-gray-100">Konfigurasi</h2>
            {[1, 2].map((index) => (
              <div key={index} className="border-b border-gray-100">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </div>
            ))}
          </section>
          
          {/* Action Section Skeleton */}
          <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
            <h2 className="font-semibold p-4 border-b border-gray-100">Tindakan</h2>
            <div className="p-4">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </section>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-2xl">
        <h1 className="text-xl font-bold mb-6">Pengaturan</h1>
        
        <ProfileSection user={user} />
        
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
        
        <ActionSection handleExportData={handleExportData} loading={loading} />
        
        <Footer />
      </div>
    </Layout>
  );
};

export default Settings;
