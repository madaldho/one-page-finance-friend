import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  FileDown,
  HelpCircle,
  LogOut
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ActionSectionProps {
  loading: boolean;
  handleExportData: () => Promise<void>;
}

const ActionSection = ({ loading, handleExportData }: ActionSectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
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
    }
  };
  
  const handleSendEmail = () => {
    const emailAddress = "keuanganribadi@gmail.com";
    const subject = "Bantuan Aplikasi Keuangan Pribadi";
    const body = "Halo Tim Keuangan Pribadi,\n\nSaya membutuhkan bantuan terkait:";
    
    window.location.href = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    toast({
      title: "Membuka Aplikasi Email",
      description: "Mengarahkan ke aplikasi email untuk mengirim pesan",
    });
  };
  
  return (
    <section className="mb-8">
      <div className="backdrop-blur-sm bg-white/80 rounded-xl shadow-sm border border-white/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100/50">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
              <FileDown className="w-3 h-3 text-white" />
            </div>
            Aksi
          </h2>
          <p className="text-sm text-gray-500 mt-1">Ekspor data dan kelola akun</p>
        </div>
        
        <div className="divide-y divide-gray-100/50">
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-5 h-auto hover:bg-gray-50/50 rounded-none"
            onClick={handleExportData}
            disabled={loading}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <FileDown className="w-4 h-4 text-gray-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">Export Data</p>
                <p className="text-sm text-gray-500">Unduh data transaksi dalam format CSV</p>
              </div>
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-5 h-auto hover:bg-gray-50/50 rounded-none"
            onClick={handleSendEmail}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">Bantuan</p>
                <p className="text-sm text-gray-500">Hubungi tim support untuk bantuan</p>
              </div>
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-5 h-auto hover:bg-red-50/50 text-red-600 rounded-none"
            onClick={handleLogout}
            disabled={loading}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-red-600 text-sm">{loading ? "Sedang Keluar..." : "Keluar"}</p>
                <p className="text-sm text-red-500">Keluar dari akun saat ini</p>
              </div>
            </div>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ActionSection;
