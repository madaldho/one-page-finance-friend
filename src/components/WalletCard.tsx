import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "@/types";
import { 
  MoreVertical,
  Pencil,
  Trash2,
  CreditCard,
  PiggyBank,
  Banknote
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

interface WalletCardProps {
  wallet: Wallet;
  onEdit?: (wallet: Wallet) => void;
  onDelete?: (id: string) => void;
  onSuccess?: () => void;
  isBalanceVisible?: boolean; // Tambah prop untuk visibility saldo
}

// Function to get the appropriate wallet icon based on type
export function getWalletIcon(type: string) {
  switch (type) {
    case "bank":
      return <CreditCard className="h-5 w-5" />;
    case "savings":
      return <PiggyBank className="h-5 w-5" />;
    case "cash":
    default:
      return <Banknote className="h-5 w-5" />;
  }
}

export function WalletCard({ wallet, onEdit, onDelete, onSuccess, isBalanceVisible = true }: WalletCardProps) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = useToast();

  // Fungsi untuk format saldo dengan visibility
  const formatBalanceWithVisibility = (amount: number) => {
    if (isBalanceVisible) {
      return formatCurrency(amount);
    } else {
      // Ganti dengan bintang berdasarkan panjang nominalnya
      const formatted = formatCurrency(amount);
      return formatted.replace(/\d/g, '*');
    }
  };

  const cardStyle = (wallet as unknown as { gradient?: string }).gradient 
    ? { background: `linear-gradient(135deg, ${(wallet as unknown as { gradient?: string }).gradient})` }
    : { backgroundColor: wallet.color || '#4F46E5' };

  const handleCardClick = () => {
    navigate(`/wallet/${wallet.id}`);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      if (onDelete) {
        await onDelete(wallet.id);
      }
      
      toast({
        title: "Dompet berhasil dihapus",
        description: `Dompet ${wallet.name} telah dihapus`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error deleting wallet:', error);
      toast({
        variant: "destructive",
        title: "Gagal menghapus dompet",
        description: "Terjadi kesalahan saat menghapus dompet",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className="relative group">
        <Card 
          className={cn(
            "relative p-3 sm:p-5 overflow-hidden cursor-pointer",
            "hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1", 
            "transition-all duration-300 ease-out",
            "border-0 backdrop-blur-sm rounded-xl sm:rounded-2xl",
            "min-h-[120px] sm:min-h-[140px]",
            "before:content-[''] before:absolute before:inset-0 before:bg-white/10 before:opacity-0", 
            "hover:before:opacity-100 before:transition-opacity before:duration-300",
            "after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/20 after:to-transparent after:opacity-0",
            "hover:after:opacity-100 after:transition-opacity after:duration-300"
          )}
          style={{
            background: `linear-gradient(135deg, ${wallet.color || '#4F46E5'}, ${wallet.color || '#4F46E5'}dd)`,
            ...cardStyle
          }}
          onClick={handleCardClick}
        >
          {/* Decorative elements - lebih kecil di mobile */}
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-20 sm:h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6 sm:-translate-y-10 sm:translate-x-10 transition-transform group-hover:scale-110 duration-300"></div>
          <div className="absolute bottom-0 left-0 w-10 h-10 sm:w-16 sm:h-16 bg-white/5 rounded-full translate-y-5 -translate-x-5 sm:translate-y-8 sm:-translate-x-8 transition-transform group-hover:scale-110 duration-300"></div>
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex justify-between items-start mb-2 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3 max-w-[70%] text-white">
                {wallet.logo_url ? (
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl overflow-hidden shadow-md border border-white/30 group-hover:scale-105 transition-transform duration-200">
                      <img 
                        src={wallet.logo_url} 
                        alt="Logo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm flex items-center justify-center shadow-md border border-white/30 group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                    <div className="scale-75 sm:scale-100">
                      {getWalletIcon(wallet.type || "cash")}
                    </div>
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold truncate leading-tight drop-shadow-sm">{wallet.name}</h3>
                  {wallet.is_default && (
                    <span className="bg-white/30 text-[9px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full whitespace-nowrap font-medium mt-0.5 w-fit backdrop-blur-sm border border-white/30">
                      ⭐ Default
                    </span>
                  )}
                </div>
              </div>
              <div className="z-10 relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/30 rounded-lg sm:rounded-xl transition-all duration-200 backdrop-blur-sm"
                      size="icon"
                      aria-label="Menu dompet"
                    >
                      <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="shadow-xl border-gray-200 rounded-xl">
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        if (onEdit) onEdit(wallet);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowDeleteDialog(true);
                      }}
                      disabled={wallet.is_default}
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-1 flex-1 flex flex-col justify-end">
              <p className="text-sm sm:text-lg lg:text-xl font-bold leading-tight break-words text-white drop-shadow-lg">
                {formatBalanceWithVisibility(wallet.balance)}
              </p>
              <div className="flex items-center gap-1">
                <p className="text-[10px] sm:text-xs opacity-90 text-white font-medium">
                  {wallet.type === "bank" ? "💳 Bank" : 
                   wallet.type === "savings" ? "🐷 Tabungan" : 
                   wallet.type === "investment" ? "📱 E-Wallet" : "💵 Tunai"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Hapus Dompet"
        description="Apakah Anda yakin ingin menghapus dompet"
        itemName={wallet.name}
      />
    </>
  );
}
