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
export function getWalletIcon(type: string, logoUrl?: string | null) {
  if (logoUrl) {
    return (
      <div className="h-4 w-4 sm:h-6 sm:w-6 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
        <img 
          src={logoUrl} 
          alt="Logo" 
          className="h-full w-full object-cover"
          onError={(e) => {
            // Hide image and show default icon on error
            const target = e.target as HTMLImageElement;
            const container = target.parentElement!;
            target.style.display = 'none';
            container.innerHTML = getDefaultWalletIconHtml(type);
          }}
        />
      </div>
    );
  }
  
  return getDefaultWalletIcon(type);
}

function getDefaultWalletIcon(type: string) {
  switch (type) {
    case "bank":
      return <CreditCard className="h-4 w-4 sm:h-6 sm:w-6" />;
    case "savings":
      return <PiggyBank className="h-4 w-4 sm:h-6 sm:w-6" />;
    case "cash":
    default:
      return <Banknote className="h-4 w-4 sm:h-6 sm:w-6" />;
  }
}

function getDefaultWalletIconHtml(type: string) {
  const iconClass = "h-4 w-4 sm:h-6 sm:w-6";
  switch (type) {
    case "bank":
      return `<svg class="${iconClass}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2h8v8H6V6z" clip-rule="evenodd"></path></svg>`;
    case "savings":
      return `<svg class="${iconClass}" fill="currentColor" viewBox="0 0 20 20"><path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"></path></svg>`;
    case "cash":
    default:
      return `<svg class="${iconClass}" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path><path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"></path></svg>`;
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
            "relative p-4 sm:p-6 overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105",
            "before:content-[''] before:absolute before:inset-0 before:bg-black/10 before:opacity-0 group-hover:before:opacity-100 before:transition-opacity"
          )}
          style={cardStyle}
          onClick={handleCardClick}
        >
          <div className="flex justify-between items-start mb-2 sm:mb-4 ">
            <div className="flex items-center gap-2 sm:gap-3 max-w-[70%] text-white">
              {getWalletIcon(wallet.type || "cash", wallet.logo_url)}
              <h3 className="text-sm sm:text-lg font-semibold truncate">{wallet.name}</h3>
              {wallet.is_default && (
                <span className="bg-white/20 text-[10px] sm:text-xs px-2 py-1 rounded-full whitespace-nowrap">
                  Default
                </span>
              )}
            </div>
            <div className="z-10 relative" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20"
                    size="icon"
                    aria-label="Menu dompet"
                  >
                    <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
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

          <div className="space-y-0 sm:space-y-1">
            <p className="text-base sm:text-2xl font-bold leading-tight break-words text-white">
              {formatCurrency(wallet.balance)}
            </p>
            <p className="text-xs sm:text-sm opacity-90 text-white">
              {wallet.type === "bank" ? "Rekening Bank" : 
               wallet.type === "savings" ? "Tabungan" : "Uang Tunai"}
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
