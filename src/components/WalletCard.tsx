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
            "hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1",
            "transition-all duration-300 ease-out",
            "border-0 backdrop-blur-sm",
            "before:content-[''] before:absolute before:inset-0 before:bg-white/5 before:opacity-0",
            "hover:before:opacity-100 before:transition-all before:duration-300"
          )}
          style={cardStyle}
          onClick={handleCardClick}
        >
          <div className="flex justify-between items-start mb-3 sm:mb-5">
            <div className="flex items-center gap-2 sm:gap-3 max-w-[70%] text-white">
              {wallet.logo_url ? (
                <div className="relative">
                  <img
                    src={wallet.logo_url}
                    alt={`${wallet.name} logo`}
                    className="h-5 w-5 sm:h-6 sm:w-6 rounded object-cover border border-white/20"
                    onError={(e) => {
                      console.error("Failed to load wallet logo");
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="p-1 rounded-lg bg-white/10">
                  {getWalletIcon(wallet.type || "cash")}
                </div>
              )}
              <h3 className="text-sm sm:text-lg font-semibold truncate">{wallet.name}</h3>
              {wallet.is_default && (
                <span className="bg-white/25 backdrop-blur-sm text-[10px] sm:text-xs px-2 py-1 rounded-full whitespace-nowrap font-medium border border-white/20">
                  Default
                </span>
              )}
            </div>
            <div className="z-10 relative" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 sm:h-10 sm:w-10 p-0 text-white hover:bg-white/20 rounded-full transition-all duration-200"
                    size="icon"
                    aria-label="Menu dompet"
                  >
                    <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onEdit) onEdit(wallet);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
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
            <p className="text-lg sm:text-2xl xl:text-3xl font-bold leading-tight text-white drop-shadow-sm">
              {formatCurrency(wallet.balance)}
            </p>
            <p className="text-xs sm:text-sm opacity-80 text-white/90 font-medium">
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
