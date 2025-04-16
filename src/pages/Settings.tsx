import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  DollarSign,
  PiggyBank,
  User,
  FileText,
  HelpCircle,
  LogOut,
  FileDown
} from "lucide-react";

interface UserSettingsForm {
  showBudgeting: boolean;
  showSavings: boolean;
  showLoans: boolean;
}

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettingsForm>({
    showBudgeting: true,
    showSavings: true,
    showLoans: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
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
        
        // Fetch user settings
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
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
    // Update local state first for responsive UI
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
      
      // Check if settings entry exists
      const { data, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (data) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({
            [setting === 'showBudgeting' ? 'show_budgeting' : 
              setting === 'showSavings' ? 'show_savings' : 'show_loans']: !settings[setting]
          })
          .eq('user_id', session.user.id);
          
        if (updateError) throw updateError;
      } else {
        // Create new settings entry
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
      // Revert the state back if there's an error
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
      
      // Fetch transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id);
        
      if (txError) throw txError;
      
      // Create CSV
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
      
      // Create a blob and download
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
      
      // Redirect to login page after a brief delay
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
      <div className="container mx-auto p-4 pb-32">
        <h1 className="text-xl font-bold mb-6">Pengaturan</h1>
        
        {/* User profile section */}
        <section className="mb-8 bg-white p-4 rounded-lg">
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
          <button
            onClick={() => toast({ title: "Coming Soon", description: "Fitur edit profil akan segera tersedia" })}
            className="text-sm text-[#6E59A5] font-medium"
          >
            Edit Profile
          </button>
        </section>
        
        {/* Features toggle section */}
        <section className="mb-8 bg-white p-4 rounded-lg">
          <h2 className="font-semibold mb-4">Fitur</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <Label htmlFor="budgeting">Budgeting</Label>
              </div>
              <Switch
                id="budgeting"
                checked={settings.showBudgeting}
                onCheckedChange={() => handleToggleChange('showBudgeting')}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <PiggyBank className="w-4 h-4 text-green-600" />
                </div>
                <Label htmlFor="savings">Tabungan</Label>
              </div>
              <Switch
                id="savings"
                checked={settings.showSavings}
                onCheckedChange={() => handleToggleChange('showSavings')}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                  <CreditCard className="w-4 h-4 text-red-600" />
                </div>
                <Label htmlFor="loans">Hutang & Piutang</Label>
              </div>
              <Switch
                id="loans"
                checked={settings.showLoans}
                onCheckedChange={() => handleToggleChange('showLoans')}
                disabled={loading}
              />
            </div>
          </div>
        </section>
        
        {/* Other settings */}
        <section className="mb-8 bg-white rounded-lg">
          <button
            onClick={handleExportData}
            className="w-full flex items-center p-4 border-b border-gray-100"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              <FileDown className="w-4 h-4 text-gray-600" />
            </div>
            <span className="flex-1 text-left">Export Data</span>
          </button>
          
          <button
            onClick={() => toast({ title: "Coming Soon", description: "Fitur ini akan segera tersedia" })}
            className="w-full flex items-center p-4 border-b border-gray-100"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
            <span className="flex-1 text-left">Syarat dan Ketentuan</span>
          </button>
          
          <button
            onClick={() => toast({ title: "Coming Soon", description: "Fitur ini akan segera tersedia" })}
            className="w-full flex items-center p-4 border-b border-gray-100"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              <HelpCircle className="w-4 h-4 text-gray-600" />
            </div>
            <span className="flex-1 text-left">Bantuan</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-4 text-red-600"
          >
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <LogOut className="w-4 h-4 text-red-600" />
            </div>
            <span className="flex-1 text-left">Keluar</span>
          </button>
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
