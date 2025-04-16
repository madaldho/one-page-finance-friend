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
  FileDown
} from "lucide-react";
import FeatureToggle from "@/components/FeatureToggle";

interface UserSettingsForm {
  showBudgeting: boolean;
  showSavings: boolean;
  showLoans: boolean;
}

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<UserSettingsForm>({
    showBudgeting: true,
    showSavings: true,
    showLoans: true,
  });

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
          return;
        }
        
        setUser(session.user);
        
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
      }
    };
    
    fetchSettings();
  }, [toast]);
  
  const handleToggleChange = async (setting: keyof UserSettingsForm) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };
  
  const handleExportData = async () => {
    try {
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
    }
  };
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Berhasil Keluar",
        description: "Kamu telah berhasil keluar dari akun",
      });
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Gagal Keluar",
        description: "Terjadi kesalahan saat proses keluar",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-2xl">
        <h1 className="text-xl font-bold mb-6">Pengaturan</h1>
        
        <section className="mb-8 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-[#6E59A5] flex items-center justify-center mr-3">
              <span className="text-white text-lg font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium">{user?.email || 'User'}</p>
              <p className="text-sm text-gray-500">Akun Personal</p>
            </div>
          </div>
          <Button 
            variant="link" 
            className="text-[#6E59A5] p-0 h-auto font-medium"
            onClick={() => toast({ 
              title: "Coming Soon", 
              description: "Fitur edit profil akan segera tersedia" 
            })}
          >
            Edit Profile
          </Button>
        </section>
        
        <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
          <h2 className="font-semibold p-4 border-b border-gray-100">Fitur</h2>
          
          <FeatureToggle
            icon={<DollarSign className="w-4 h-4 text-blue-600" />}
            title="Budgeting"
            checked={settings.showBudgeting}
            onToggle={() => handleToggleChange('showBudgeting')}
            managementLink="/budgets"
          />
          
          <FeatureToggle
            icon={<PiggyBank className="w-4 h-4 text-green-600" />}
            title="Tabungan"
            checked={settings.showSavings}
            onToggle={() => handleToggleChange('showSavings')}
            managementLink="/savings"
          />
          
          <FeatureToggle
            icon={<CreditCard className="w-4 h-4 text-red-600" />}
            title="Hutang & Piutang"
            checked={settings.showLoans}
            onToggle={() => handleToggleChange('showLoans')}
            managementLink="/loans"
          />
        </section>
        
        <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-4 h-auto hover:bg-gray-50"
            onClick={handleExportData}
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
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              <span>Keluar</span>
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
