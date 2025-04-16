
import { useState } from "react";
import { Wallet } from "@/types";
import { Pencil, Trash2 } from "lucide-react";
import WalletForm from "./WalletForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface WalletCardProps {
  wallet: Wallet;
  onClick?: () => void;
  onDelete?: () => void;
  key?: string;
}

const WalletCard = ({ wallet, onClick, onDelete }: WalletCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  
  const colors: Record<string, string> = {
    green: "bg-green-100 border-green-200",
    pink: "bg-pink-100 border-pink-200",
    blue: "bg-blue-100 border-blue-200",
    orange: "bg-orange-100 border-orange-200",
    purple: "bg-purple-100 border-purple-200",
    yellow: "bg-yellow-100 border-yellow-200",
    red: "bg-red-100 border-red-200",
    default: "bg-gray-100 border-gray-200"
  };

  const colorClass = colors[wallet.color] || colors.default;

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', wallet.id);
        
      if (error) throw error;
      
      toast({
        title: "Dompet dihapus",
        description: `${wallet.name} berhasil dihapus`,
      });
      
      if (onDelete) onDelete();
    } catch (error: any) {
      toast({
        title: "Gagal menghapus dompet",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div 
        className={`relative rounded-lg p-3 border ${colorClass} cursor-pointer group`}
        onClick={onClick}
      >
        <div className="text-xs font-medium uppercase">{wallet.name}</div>
        <div className="font-semibold mt-1">Rp {wallet.balance.toLocaleString()}</div>
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 bg-white rounded-full shadow-sm"
          >
            <Pencil className="w-3 h-3 text-gray-600" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button 
                onClick={(e) => e.stopPropagation()}
                className="p-1 bg-white rounded-full shadow-sm"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Dompet</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus dompet ini? Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600">
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {isEditing && (
        <WalletForm 
          wallet={wallet} 
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false);
            if (onDelete) onDelete(); // Refresh the list
          }}
        />
      )}
    </>
  );
};

export default WalletCard;
