
import { useState } from 'react';
import { ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import { Transaction } from '@/types';

interface TransactionItemProps {
  transaction: Transaction & {
    wallet_name?: string;
    destination_wallet_name?: string;
    category_name?: string;
  };
  onDeleted?: () => void;
}

export function TransactionItem({ transaction, onDeleted }: TransactionItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();
  
  // Format date to localized format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  // Transaction type badge styles
  const getTypeBadgeClasses = () => {
    switch (transaction.type) {
      case 'income':
        return 'bg-green-100 text-green-800';
      case 'expense':
        return 'bg-red-100 text-red-800';
      case 'transfer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format transaction amount with + or - prefix
  const getFormattedAmount = () => {
    if (transaction.type === 'income') {
      return `+${formatCurrency(transaction.amount)}`;
    } else if (transaction.type === 'expense') {
      return `-${formatCurrency(transaction.amount)}`;
    } else {
      return formatCurrency(transaction.amount);
    }
  };

  // Format transaction amount with colored text
  const getAmountTextColor = () => {
    switch (transaction.type) {
      case 'income':
        return 'text-green-600';
      case 'expense':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  // Handle edit transaction
  const handleEdit = () => {
    navigate(`/transactions/edit/${transaction.id}`);
  };

  // Handle delete transaction
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Mark transaction as deleted instead of physical delete to avoid trigger issues
      const { error } = await supabase
        .from('transactions')
        .update({ is_deleted: true })
        .eq('id', transaction.id);

      if (error) throw error;
      
      toast.success('Transaksi berhasil dihapus');
      setShowDeleteDialog(false);
      if (onDeleted) onDeleted();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Gagal menghapus transaksi');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border-b border-gray-100 py-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <div className="font-medium">{transaction.title}</div>
            <div className={cn('font-semibold', getAmountTextColor())}>
              {getFormattedAmount()}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center text-sm text-gray-500">
              <span>{formatDate(transaction.date)}</span>
              <span className="mx-1">•</span>
              <span>{transaction.wallet_name || 'Unknown wallet'}</span>
              
              {transaction.type === 'transfer' && transaction.destination_wallet_name && (
                <div className="flex items-center">
                  <ArrowRight className="h-3 w-3 mx-1" />
                  <span>{transaction.destination_wallet_name}</span>
                </div>
              )}
              
              {transaction.category && (
                <>
                  <span className="mx-1">•</span>
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-sm text-xs',
                    getTypeBadgeClasses()
                  )}>
                    {transaction.category_name || transaction.category}
                  </span>
                </>
              )}
            </div>
            
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleEdit}>
                <Pencil className="h-3 w-3" />
              </Button>
              
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini akan menghapus transaksi ini dan tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete} 
                      className="bg-red-500 hover:bg-red-600"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Menghapus...' : 'Hapus'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          
          {transaction.description && (
            <p className="text-xs text-gray-500 mt-1">{transaction.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
