
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Search, ChevronDown, Trash2 } from 'lucide-react';
import { TransactionFilters } from './transactions/TransactionFilters';
import { TransactionListItem } from './transactions/TransactionListItem';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/use-media-query";
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
import { Transaction, Category, Wallet } from "@/types";

interface TransactionListProps {
  transactions: Transaction[];
  onFilter: (query: string) => void;
  onDelete: (ids: string[]) => Promise<void>;
  onEdit: (transaction: Transaction) => void;
  categories: Record<string, Category>;
  wallets: Record<string, Wallet>;
}

export function TransactionList({
  transactions,
  onFilter,
  onDelete,
  onEdit,
  categories,
  wallets
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const handleDelete = async () => {
    try {
      await onDelete(selectedIds);
      toast({
        title: "Berhasil",
        description: `${selectedIds.length} transaksi telah dihapus`,
      });
      setSelectedIds([]);
      setIsBulkMode(false);
      setShowDeleteDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus transaksi",
        variant: "destructive",
      });
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSelection = prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id];
      
      if (newSelection.length === 0) {
        setIsBulkMode(false);
      }
      
      return newSelection;
    });
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-background pt-4 pb-2 border-b">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <TransactionFilters
              searchTerm={searchTerm}
              onSearchChange={(value) => {
                setSearchTerm(value);
                onFilter(value);
              }}
              // ... pass other required props
            />
          </div>
          
          {isBulkMode && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsBulkMode(false);
                  setSelectedIds([]);
                }}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={selectedIds.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus ({selectedIds.length})
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="divide-y border rounded-lg overflow-hidden bg-card">
        {transactions.map((transaction) => (
          <TransactionListItem
            key={transaction.id}
            transaction={transaction}
            isSelected={selectedIds.includes(transaction.id)}
            onSelect={toggleSelection}
            isBulkMode={isBulkMode}
            onLongPress={() => setIsBulkMode(true)}
            categories={categories}
            wallets={wallets}
          />
        ))}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {selectedIds.length} transaksi yang dipilih? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
