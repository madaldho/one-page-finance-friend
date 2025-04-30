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
        onClick={handleSendEmail}
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
  );
};

export default ActionSection;
