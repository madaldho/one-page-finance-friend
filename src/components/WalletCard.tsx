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

export function WalletCard({ wallet, onEdit, onDelete, onSuccess }: WalletCardProps) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = useToast();

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
            "relative p-5 sm:p-6 overflow-hidden cursor-pointer",
            "hover:shadow-2xl hover:shadow-black/25 hover:-translate-y-2", 
            "transition-all duration-300 ease-out",
            "border-0 backdrop-blur-sm rounded-2xl",
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
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10 transition-transform group-hover:scale-110 duration-300"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8 transition-transform group-hover:scale-110 duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="flex items-center gap-3 max-w-[70%] text-white">
                {wallet.logo_url ? (
                  <div className="relative">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-lg border-2 border-white/30 group-hover:scale-105 transition-transform duration-200">
                      <img 
                        src={wallet.logo_url} 
                        alt="Logo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30 group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                    {getWalletIcon(wallet.type || "cash")}
                  </div>
                )}
                <div className="flex flex-col">
                  <h3 className="text-sm sm:text-lg font-bold truncate leading-tight drop-shadow-sm">{wallet.name}</h3>
                  {wallet.is_default && (
                    <span className="bg-white/30 text-[10px] sm:text-xs px-2 py-1 rounded-full whitespace-nowrap font-medium mt-1 w-fit backdrop-blur-sm border border-white/30">
                      ⭐ Default
                    </span>
                  )}
                </div>
              </div>
              <div className="z-10 relative" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 sm:h-10 sm:w-10 p-0 text-white hover:bg-white/30 rounded-xl transition-all duration-200 backdrop-blur-sm"
                      size="icon"
                      aria-label="Menu dompet"
                    >
                      <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
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

            <div className="space-y-2">
              <p className="text-xl sm:text-3xl font-bold leading-tight break-words text-white drop-shadow-lg">
                {formatCurrency(wallet.balance)}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm opacity-90 text-white font-medium">
                  {wallet.type === "bank" ? "💳 Rekening Bank" : 
                   wallet.type === "savings" ? "🐷 Tabungan" : 
                   wallet.type === "investment" ? "📱 E-Wallet" : "💵 Uang Tunai"}
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
