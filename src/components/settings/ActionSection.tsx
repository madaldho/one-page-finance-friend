
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  FileDown,
  User,
  Shield,
  FileText,
  HelpCircle,
  LogOut
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ActionSectionProps {
  loading: boolean;
  onExportData: () => Promise<void>;
}

const ActionSection = ({ loading, onExportData }: ActionSectionProps) => {
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
  
  return (
    <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
      <Button 
        variant="ghost" 
        className="w-full flex items-center justify-between p-4 h-auto hover:bg-gray-50"
        onClick={onExportData}
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
  );
};

export default ActionSection;
