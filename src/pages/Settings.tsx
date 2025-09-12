import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, ChevronRight, Blocks, House, Smartphone, Settings as SettingsIcon, ArrowLeft, LogOut, Clock, Globe } from "lucide-react";
import ProfileSection from "@/components/settings/ProfileSection";
import FeaturesSection from "@/components/settings/FeaturesSection";
import ActionSection from "@/components/settings/ActionSection";
import Footer from "@/components/settings/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserWithProfile {
  id?: string;
  email?: string;
  profile?: Record<string, unknown>;
}

const timezoneOptions = [
  { value: 'Asia/Jakarta', label: 'WIB (Jakarta) - GMT+7' },
  { value: 'Asia/Makassar', label: 'WITA (Makassar) - GMT+8' },
  { value: 'Asia/Jayapura', label: 'WIT (Jayapura) - GMT+9' },
  { value: 'Asia/Singapore', label: 'Singapore - GMT+8' },
  { value: 'Asia/Kuala_Lumpur', label: 'Malaysia - GMT+8' },
  { value: 'Asia/Bangkok', label: 'Thailand - GMT+7' },
  { value: 'Asia/Manila', label: 'Philippines - GMT+8' },
  { value: 'UTC', label: 'UTC - GMT+0' },
  { value: 'America/New_York', label: 'New York - GMT-5' },
  { value: 'America/Los_Angeles', label: 'Los Angeles - GMT-8' },
  { value: 'Europe/London', label: 'London - GMT+0' },
  { value: 'Europe/Paris', label: 'Paris - GMT+1' },
  { value: 'Asia/Tokyo', label: 'Tokyo - GMT+9' },
  { value: 'Australia/Sydney', label: 'Sydney - GMT+10' }
];

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
  const [timezone, setTimezone] = useState<string>('Asia/Jakarta');
  const [timezoneLoading, setTimezoneLoading] = useState(false);

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
          setTimezone((profileData as any).timezone || 'Asia/Jakarta');
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

  const handleTimezoneChange = async (newTimezone: string) => {
    try {
      setTimezoneLoading(true);
      setTimezone(newTimezone);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Tidak Terautentikasi",
          description: "Silakan login untuk mengubah pengaturan",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ timezone: newTimezone } as any)
        .eq('id', session.user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Berhasil",
        description: "Timezone berhasil diubah",
      });
    } catch (error) {
      console.error('Error updating timezone:', error);
      
      // Revert timezone state on error
      setTimezone((user?.profile as any)?.timezone || 'Asia/Jakarta');
      
      toast({
        title: "Gagal Mengubah Timezone",
        description: "Terjadi kesalahan saat mengubah timezone",
        variant: "destructive"
      });
    } finally {
      setTimezoneLoading(false);
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 animate-gradient-x"></div>
          
          <div className="container mx-auto p-4 pb-32 max-w-2xl relative z-10">
            {/* Header Skeleton */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-8 w-48" />
              </div>
              <Skeleton className="h-4 w-80 ml-13" />
            </div>
          
            {/* Profile Section Skeleton */}
            <div className="bg-white/50 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-white/30">
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="p-6 flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
            
            {/* Features Section Skeleton */}
            <div className="bg-white/50 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-white/30">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Configuration Section Skeleton */}
            <div className="bg-white/50 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-white/30">
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="divide-y divide-gray-100/50">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                        <div>
                          <Skeleton className="h-4 w-28 mb-2" />
                          <Skeleton className="h-3 w-52" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Action Section Skeleton */}
            <div className="bg-white/50 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 overflow-hidden">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-white/30">
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="p-6">
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative overflow-x-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30 overflow-hidden">
          <div className="absolute top-0 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
        </div>
        
        <div className="container mx-auto py-2 px-3 sm:px-4 md:px-6 max-w-2xl relative z-10 pt-4 sm:pt-6 md:pt-4 pb-20 sm:pb-32">
          {/* Header dengan glassmorphism effect */}
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm border border-white/20 sticky top-2 sm:top-4 z-10">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md border border-white/30 p-0 flex-shrink-0"
                aria-label="Kembali"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-bold text-gray-800 truncate">Pengaturan</h1>
                <p className="text-xs text-gray-500 truncate">Kelola preferensi dan konfigurasi aplikasi</p>
              </div>
            </div>
          </div>
        
        <ProfileSection user={user} />
        
        <FeaturesSection 
          user={user}
          settings={settings} 
          toggleLoading={toggleLoading} 
          onToggleFeature={handleToggleChange} 
        />
        
        <section className="mb-8">
          <div className="backdrop-blur-sm bg-white/80 rounded-xl shadow-sm border border-white/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100/50">
              <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Blocks className="w-3 h-3 text-white" />
                </div>
                Konfigurasi Sistem
              </h2>
              <p className="text-sm text-gray-500 mt-1">Atur komponen dan fitur aplikasi</p>
            </div>
          
            <div className="divide-y divide-gray-100/50">
              <div className="hover:bg-gray-50/50 transition-all duration-200">
                <div 
                  className="flex items-center justify-between p-5 cursor-pointer group"
                  onClick={() => navigate('/assets')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      <House className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">Manajemen Aset</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Kelola aset dan pantau nilai kekayaan Anda
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
              </div>

              <div className="hover:bg-gray-50/50 transition-all duration-200">
                <div 
                  className="flex items-center justify-between p-5 cursor-pointer group"
                  onClick={() => navigate('/categories')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      <Blocks className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">Kategori Transaksi</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Kelola kategori untuk transaksi pemasukan dan pengeluaran
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
              </div>

              <div className="hover:bg-gray-50/50 transition-all duration-200">
                <div 
                  className="flex items-center justify-between p-5 cursor-pointer group"
                  onClick={() => navigate('/trusted-devices')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      <Smartphone className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">Perangkat Terpercaya</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Kelola perangkat yang diingat untuk login otomatis
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timezone Section */}
        <section className="mb-8">
          <div className="backdrop-blur-sm bg-white/80 rounded-xl shadow-sm border border-white/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100/50">
              <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Globe className="w-3 h-3 text-white" />
                </div>
                Zona Waktu
              </h2>
              <p className="text-sm text-gray-500 mt-1">Atur zona waktu untuk analisis dan laporan yang akurat</p>
            </div>
            
            <div className="p-5">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Pilih Zona Waktu
                </label>
                <Select 
                  value={timezone} 
                  onValueChange={handleTimezoneChange}
                  disabled={timezoneLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih zona waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {timezoneLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan perubahan...
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Zona waktu akan digunakan untuk menampilkan dan menyimpan waktu transaksi dengan benar.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <ActionSection handleExportData={handleExportData} loading={loading} />
        
        <Footer />
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
