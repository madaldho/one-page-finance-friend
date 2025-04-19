
import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransactionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeTab: string;
  onTabChange: (value: string) => void;
  selectedWallet: string;
  walletName: string;
  onWalletChange: (value: string) => void;
  onResetFilters: () => void;
  wallets: { id: string; name: string }[];
}

export function TransactionFilters({
  searchTerm,
  onSearchChange,
  activeTab,
  onTabChange,
  selectedWallet,
  walletName,
  onWalletChange,
  onResetFilters,
  wallets
}: TransactionFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Cari transaksi..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {activeTab !== 'all' && (
          <Badge variant="outline" className="bg-primary/5">
            {activeTab === 'income' ? 'Pemasukan' : activeTab === 'expense' ? 'Pengeluaran' : 'Transfer'}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
              onClick={() => onTabChange('all')}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        
        {selectedWallet !== 'all' && (
          <Badge variant="outline" className="bg-primary/5">
            {walletName}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
              onClick={() => onWalletChange('all')}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        <Select value={selectedWallet} onValueChange={onWalletChange}>
          <SelectTrigger className="h-8 w-[180px]">
            <SelectValue placeholder="Pilih Dompet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Dompet</SelectItem>
            {wallets.map((wallet) => (
              <SelectItem key={wallet.id} value={wallet.id}>
                {wallet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={onResetFilters}
          className="h-8"
        >
          <Filter className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
}
