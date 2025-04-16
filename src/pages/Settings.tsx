
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  PiggyBank,
  CreditCard,
  User,
  FileText,
  HelpCircle,
  LogOut,
  FileDown,
  Loader2,
  Shield
} from "lucide-react";
import FeatureToggle from "@/components/FeatureToggle";
import { useNavigate } from "react-router-dom";

interface UserSettingsForm {
  showBudgeting: boolean;
  showSavings: boolean;
  showLoans: boolean;
}

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<UserSettingsForm>({
    showBudgeting: true,
    showSavings: true,
    showLoans: true,
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
        
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileData) {
          // Just store the profile data, it will be used later
          setUser(prev => ({
            ...prev,
            profile: profileData
          }));
        }
        
        // Fetch user settings
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
            showBudgeting: data.show_budgeting || false,
            showSavings: data.show_savings || false,
            showLoans: data.show_loans || false,
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
      
      // Optimistically update UI
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
            [setting === 'showBudgeting' ? 'show_budgeting' : 
              setting === 'showSavings' ? 'show_savings' : 'show_loans']: !settings[setting]
          })
          .eq('user_id', session.user.id);
          
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: session.user.id,
            show_budgeting: setting === 'showBudgeting' ? !settings.showBudgeting : settings.showBudgeting,
            show_savings: setting === 'showSavings' ? !settings.showSavings : settings.showSavings,
            show_loans: setting === 'showLoans' ? !settings.showLoans : settings.showLoans,
          });
          
        if (insertError) throw insertError;
      }
      
      toast({
        title: "Pengaturan Berhasil Disimpan",
        description: "Pengaturan kamu telah diperbarui",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      // Revert the optimistic update
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
      a.download = `dompetku-transaksi-${new Date().toISOString().slice(0, 10)}.csv`;
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
  
  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      toast({
        title: "Berhasil Keluar",
        description: "Kamu telah berhasil keluar dari akun",
      });
      
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Gagal Keluar",
        description: "Terjadi kesalahan saat proses keluar",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditProfile = () => {
    navigate('/profile');
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4 pb-32 max-w-2xl flex items-center justify-center h-full min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-gray-500">Memuat pengaturan...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-2xl">
        <h1 className="text-xl font-bold mb-6">Pengaturan</h1>
        
        <section className="mb-8 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-[#6E59A5] flex items-center justify-center mr-3 overflow-hidden">
              {user?.profile?.avatar_url ? (
                <img 
                  src={user.profile.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-lg font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium">
                {user?.profile?.name || user?.email || 'User'}
              </p>
              <p className="text-sm text-gray-500">Akun Personal</p>
            </div>
          </div>
          <Button 
            variant="link" 
            className="text-[#6E59A5] p-0 h-auto font-medium"
            onClick={handleEditProfile}
          >
            Edit Profile
          </Button>
        </section>
        
        <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
          <h2 className="font-semibold p-4 border-b border-gray-100">Fitur</h2>
          
          <FeatureToggle
            icon={<DollarSign className="w-4 h-4 text-blue-600" />}
            title="Budgeting"
            description="Atur dan pantau anggaran keuangan kamu"
            checked={settings.showBudgeting}
            onToggle={() => handleToggleChange('showBudgeting')}
            managementLink="/budgets"
            loading={toggleLoading.showBudgeting}
          />
          
          <FeatureToggle
            icon={<PiggyBank className="w-4 h-4 text-green-600" />}
            title="Tabungan"
            description="Atur target dan pantau tabungan kamu"
            checked={settings.showSavings}
            onToggle={() => handleToggleChange('showSavings')}
            managementLink="/savings"
            loading={toggleLoading.showSavings}
          />
          
          <FeatureToggle
            icon={<CreditCard className="w-4 h-4 text-red-600" />}
            title="Hutang & Piutang"
            description="Kelola data hutang dan piutang"
            checked={settings.showLoans}
            onToggle={() => handleToggleChange('showLoans')}
            managementLink="/loans"
            loading={toggleLoading.showLoans}
          />
        </section>
        
        <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-4 h-auto hover:bg-gray-50"
            onClick={handleExportData}
            disabled={loading}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                <FileDown className="w-4 h-4 text-gray-600" />
              </div>
              <span>Export Data</span>
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-4 h-auto hover:bg-gray-50 border-t border-gray-100"
            onClick={() => navigate("/profile")}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <span>Profil</span>
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-4 h-auto hover:bg-gray-50 border-t border-gray-100"
            onClick={() => toast({ 
              title: "Coming Soon", 
              description: "Fitur ini akan segera tersedia" 
            })}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                <Shield className="w-4 h-4 text-gray-600" />
              </div>
              <span>Privasi & Keamanan</span>
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-4 h-auto hover:bg-gray-50 border-t border-gray-100"
            onClick={() => toast({ 
              title: "Coming Soon", 
              description: "Fitur ini akan segera tersedia" 
            })}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                <FileText className="w-4 h-4 text-gray-600" />
              </div>
              <span>Syarat dan Ketentuan</span>
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-4 h-auto hover:bg-gray-50 border-t border-gray-100"
            onClick={() => toast({ 
              title: "Coming Soon", 
              description: "Fitur ini akan segera tersedia" 
            })}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                <HelpCircle className="w-4 h-4 text-gray-600" />
              </div>
              <span>Bantuan</span>
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-4 h-auto hover:bg-gray-50 border-t border-gray-100 text-red-600"
            onClick={handleLogout}
            disabled={loading}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              <span>{loading ? "Sedang Keluar..." : "Keluar"}</span>
            </div>
          </Button>
        </section>
        
        <div className="text-center text-gray-500 text-sm">
          <p>DompetKu v1.0.0</p>
          <p>&copy; 2025 All rights reserved</p>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
