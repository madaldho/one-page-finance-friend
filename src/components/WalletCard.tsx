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

  const getCardStyle = () => {
    const style: React.CSSProperties = {
      background: wallet.gradient 
        ? `linear-gradient(135deg, ${wallet.color}, ${wallet.gradient})`
        : wallet.color,
      color: "white",
      transition: "all 0.3s ease",
    };
    return style;
  };

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
      <Card 
        className={cn(
          "relative p-3 sm:p-4 overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300",
          "before:content-[''] before:absolute before:inset-0 before:bg-black/10 before:opacity-0 group-hover:before:opacity-100 before:transition-opacity"
        )}
        style={getCardStyle()}
        onClick={handleCardClick}
      >
        <div className="flex justify-between items-start mb-2 sm:mb-4">
          <div className="flex items-center gap-1 sm:gap-2 max-w-[70%]">
            {getWalletIcon(wallet.type || "cash")}
            <h3 className="text-sm sm:text-lg font-semibold truncate">{wallet.name}</h3>
            {wallet.is_default && (
              <span className="bg-white/20 text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                Default
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20"
                size="icon"
                aria-label="Menu dompet"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEdit) onEdit(wallet);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
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

        <div className="space-y-0 sm:space-y-1">
          <p className="text-base sm:text-2xl font-bold leading-tight break-words">
            {formatCurrency(wallet.balance)}
          </p>
          <p className="text-xs sm:text-sm opacity-90">
            {wallet.type === "bank" ? "Rekening Bank" : 
             wallet.type === "savings" ? "Tabungan" : "Uang Tunai"}
          </p>
        </div>
      </Card>

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
