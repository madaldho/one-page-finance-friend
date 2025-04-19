
import React, { useState } from "react";
import { Transaction } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, MoreVertical, Trash2, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onFilter: (query: string) => void;
  onDelete: (ids: string[]) => Promise<void>;
  onEdit: (transaction: Transaction) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  hideHeader?: boolean;
}

const TransactionList = ({ 
  transactions, 
  onFilter, 
  onDelete,
  onEdit,
  onDateRangeChange,
  hideHeader = false
}: TransactionListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onFilter(query);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      await onDelete(selectedIds);
      setSelectedIds([]);
      setIsBulkMode(false);
      setShowDeleteDialog(false);
      toast({
        title: "Success",
        description: `Deleted ${selectedIds.length} transactions`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete transactions",
        variant: "destructive",
      });
    }
  };

  // Toggle transaction selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        const newSelected = prev.filter(i => i !== id);
        if (newSelected.length === 0) {
          setIsBulkMode(false);
        }
        return newSelected;
      }
      return [...prev, id];
    });
  };

  // Handle long press for mobile
  const handleLongPress = (id: string) => {
    if (!isDesktop) {
      const timer = setTimeout(() => {
        setIsBulkMode(true);
        toggleSelection(id);
      }, 500);
      setLongPressTimer(timer);
    }
  };

  const handlePressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Get transaction type styling
  const getTransactionTypeStyle = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-emerald-50 text-emerald-600';
      case 'expense':
        return 'bg-rose-50 text-rose-600';
      case 'transfer':
        return 'bg-blue-50 text-blue-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  // Mobile view component
  const MobileView = () => (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <div 
          key={transaction.id}
          className={cn(
            "bg-white rounded-lg border shadow-sm overflow-hidden transition-all",
            selectedIds.includes(transaction.id) && "border-primary bg-primary/5"
          )}
          onTouchStart={() => handleLongPress(transaction.id)}
          onTouchEnd={handlePressEnd}
          onTouchMove={handlePressEnd}
          onClick={() => isBulkMode && toggleSelection(transaction.id)}
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isBulkMode && (
                    <Checkbox
                      checked={selectedIds.includes(transaction.id)}
                      onCheckedChange={() => toggleSelection(transaction.id)}
                    />
                  )}
                  <Badge 
                    variant="secondary"
                    className={cn("font-normal", getTransactionTypeStyle(transaction.type))}
                  >
                    {transaction.type === 'income' ? 'Income' : 
                     transaction.type === 'expense' ? 'Expense' : 'Transfer'}
                  </Badge>
                </div>
                <p className="font-medium">{transaction.title || '-'}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(transaction.date), "dd MMM yyyy", { locale: id })}
                </p>
              </div>
              <div className={cn(
                "text-right",
                transaction.type === 'income' ? "text-emerald-600" :
                transaction.type === 'expense' ? "text-rose-600" :
                "text-blue-600"
              )}>
                <p className="font-medium">
                  {transaction.type === 'expense' ? '-' : '+'}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            </div>
            
            {transaction.description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {transaction.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Desktop view component
  const DesktopView = () => (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {isBulkMode && (
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedIds.length === transactions.length && transactions.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedIds(transactions.map(t => t.id));
                    } else {
                      setSelectedIds([]);
                      setIsBulkMode(false);
                    }
                  }}
                />
              </TableHead>
            )}
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            {!isBulkMode && <TableHead className="w-[70px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow 
              key={transaction.id}
              className={cn(
                "group",
                selectedIds.includes(transaction.id) && "bg-primary/5"
              )}
            >
              {isBulkMode && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(transaction.id)}
                    onCheckedChange={() => toggleSelection(transaction.id)}
                  />
                </TableCell>
              )}
              <TableCell>
                {format(new Date(transaction.date), "dd MMM yyyy", { locale: id })}
              </TableCell>
              <TableCell>
                <Badge 
                  variant="secondary"
                  className={cn("font-normal", getTransactionTypeStyle(transaction.type))}
                >
                  {transaction.type === 'income' ? 'Income' : 
                   transaction.type === 'expense' ? 'Expense' : 'Transfer'}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                {transaction.title || '-'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {transaction.description || '-'}
              </TableCell>
              <TableCell className={cn(
                "text-right font-medium",
                transaction.type === 'income' ? "text-emerald-600" :
                transaction.type === 'expense' ? "text-rose-600" :
                "text-blue-600"
              )}>
                {transaction.type === 'expense' ? '-' : '+'}
                {formatCurrency(transaction.amount)}
              </TableCell>
              {!isBulkMode && (
                <TableCell>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(transaction)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-rose-600"
                          onClick={() => onDelete([transaction.id])}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header actions */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <DateRangePicker
              onChange={onDateRangeChange}
              className="w-full md:w-auto"
            />
            {isBulkMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsBulkMode(false);
                    setSelectedIds([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={selectedIds.length === 0}
                >
                  Delete ({selectedIds.length})
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Transaction list */}
      {isDesktop ? <DesktopView /> : <MobileView />}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transactions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} transaction{selectedIds.length !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TransactionList;
