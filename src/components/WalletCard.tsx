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
      return <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />;
    case "savings":
      return <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5" />;
    case "cash":
    default:
      return <Banknote className="h-4 w-4 sm:h-5 sm:w-5" />;
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
      <div className="relative">
        <Card 
          className={cn(
            "relative p-4 sm:p-6 overflow-hidden group cursor-pointer",
            "hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1", 
            "transition-all duration-300 ease-out",
            "border-0 backdrop-blur-sm",
            "before:content-[''] before:absolute before:inset-0 before:bg-white/10 before:opacity-0", 
            "hover:before:opacity-100 before:transition-opacity before:duration-300"
          )}
          style={cardStyle}
          onClick={handleCardClick}
        >
          <div className="flex justify-between items-start mb-3 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 max-w-[70%] text-white">
              {wallet.logo_url ? (
                <div className="relative">
                  <img 
                    src={wallet.logo_url} 
                    alt="Logo" 
                    className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg object-cover shadow-md border border-white/20"
                  />
                </div>
              ) : (
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  {getWalletIcon(wallet.type || "cash")}
                </div>
              )}
              <div className="flex flex-col">
                <h3 className="text-sm sm:text-lg font-bold truncate leading-tight">{wallet.name}</h3>
                {wallet.is_default && (
                  <span className="bg-white/30 text-[10px] sm:text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium mt-1 w-fit">
                    Default
                  </span>
                )}
              </div>
            </div>
            <div className="z-10 relative" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 sm:h-10 sm:w-10 p-0 text-white hover:bg-white/30 rounded-lg transition-all duration-200"
                    size="icon"
                    aria-label="Menu dompet"
                  >
                    <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="shadow-xl border-gray-200">
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onEdit) onEdit(wallet);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50 transition-colors"
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

          <div className="space-y-1 sm:space-y-2">
            <p className="text-lg sm:text-3xl font-bold leading-tight break-words text-white drop-shadow-sm">
              {formatCurrency(wallet.balance)}
            </p>
            <p className="text-xs sm:text-sm opacity-90 text-white font-medium">
              {wallet.type === "bank" ? "Rekening Bank" : 
               wallet.type === "savings" ? "Tabungan" : 
               wallet.type === "investment" ? "E-Wallet" : "Uang Tunai"}
            </p>
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
