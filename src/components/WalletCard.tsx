
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

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

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on the dropdown
    if (e.target instanceof HTMLElement && 
        (e.target.closest('.wallet-dropdown') || 
         e.target.closest('button'))) {
      return;
    }
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
          "relative p-4 overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300",
          "before:content-[''] before:absolute before:inset-0 before:bg-black/10 before:opacity-0 group-hover:before:opacity-100 before:transition-opacity"
        )}
        style={getCardStyle()}
        onClick={handleCardClick}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{wallet.name}</h3>
            {wallet.is_default && (
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                Default
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 text-white hover:bg-white/20 wallet-dropdown"
                disabled={isDeleting}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Buka menu</span>
                <MoreVertical className="h-4 w-4" />
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

        <div className="space-y-1">
          <p className="text-2xl font-bold">
            {formatCurrency(wallet.balance)}
          </p>
          <p className="text-sm opacity-90">
            {wallet.type === "bank" ? "Rekening Bank" : 
             wallet.type === "savings" ? "Tabungan" : "Uang Tunai"}
          </p>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dompet</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus dompet {wallet.name}?
              {wallet.balance > 0 && (
                <p className="mt-2 text-yellow-600">
                  Peringatan: Dompet ini masih memiliki saldo {formatCurrency(wallet.balance)}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
