
import React from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/utils";
import { Transaction, Category, Wallet } from "@/types/index";

interface TransactionListItemProps {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isBulkMode: boolean;
  onLongPress: () => void;
  categories: Record<string, Category>;
  wallets: Record<string, Wallet>;
}

export function TransactionListItem({
  transaction,
  isSelected,
  onSelect,
  isBulkMode,
  onLongPress,
  categories,
  wallets
}: TransactionListItemProps) {
  const [pressTimer, setPressTimer] = React.useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      onLongPress();
      onSelect(transaction.id);
    }, 500);
    setPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'expense':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'transfer':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const category = categories[transaction.category || ''];
  const wallet = wallets[transaction.wallet_id || ''];

  return (
    <div
      className={`p-4 border-b transition-colors ${
        isSelected ? 'bg-muted' : 'hover:bg-muted/50'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onClick={() => isBulkMode && onSelect(transaction.id)}
    >
      <div className="flex items-start gap-3">
        {isBulkMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(transaction.id)}
            className="mt-1"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <Badge 
                variant="outline"
                className={`rounded-full text-xs font-normal ${
                  category ? '' : getTransactionTypeColor(transaction.type)
                }`}
              >
                {category?.name || transaction.type}
              </Badge>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{format(new Date(transaction.date), "dd MMM yyyy", { locale: id })}</span>
                <span>•</span>
                <Badge variant="outline" className="rounded-full text-xs font-normal">
                  {wallet?.name || 'Unknown Wallet'}
                </Badge>
              </div>
            </div>
            
            <span className={`font-medium whitespace-nowrap ${
              transaction.type === 'income' 
                ? 'text-emerald-600' 
                : transaction.type === 'expense' 
                  ? 'text-rose-600' 
                  : 'text-blue-600'
            }`}>
              {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
              {formatCurrency(transaction.amount)}
            </span>
          </div>
          
          {transaction.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {transaction.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
