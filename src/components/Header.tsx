
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ChevronDown, LogOut, User, Settings as SettingsIcon } from "lucide-react";
import TransactionForm from "./TransactionForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onAddTransaction: (transaction: any) => void;
}

const Header = ({ onAddTransaction }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");

  const handleLogout = async () => {
    try {
      await signOut();
      
      toast({
        title: "Berhasil Keluar",
        description: "Anda telah keluar dari akun",
      });
      
      navigate('/', { replace: true });
    } catch (error: any) {
      toast({
        title: "Gagal Keluar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <header className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white shadow-sm gap-4">
      <div className="flex items-center gap-2">
        <Wallet className="w-6 h-6 text-[#6E59A5]" />
        <h1 className="text-xl font-semibold text-[#1A1F2C]">DompetKu</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex gap-2">
          <TransactionForm onAddTransaction={onAddTransaction} type="income" />
          <TransactionForm onAddTransaction={onAddTransaction} type="expense" />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              {profileAvatar ? (
                <img src={profileAvatar} alt="Profile" className="w-8 h-8 rounded-full" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <ChevronDown className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">
                {profileName || user?.email?.split('@')[0] || "User"}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Pengaturan</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
