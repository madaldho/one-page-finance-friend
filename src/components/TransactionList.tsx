import React, { useState, useEffect } from "react";
import { Transaction } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, MoreVertical, Trash2, Edit2, Calendar } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
}

interface Wallet {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  gradient?: string | null;
  balance: number;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  is_default?: boolean;
}

interface TransactionListProps {
  transactions: (Transaction & { wallet_name?: string })[];
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
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction;
    direction: 'asc' | 'desc';
  }>({ key: 'date', direction: 'desc' });
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Fetch categories and wallets
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*');
        
        if (categoriesError) throw categoriesError;
        
        const categoryMap = categoriesData.reduce((acc, cat) => {
          acc[cat.id] = cat;
          return acc;
        }, {} as Record<string, Category>);
        
        setCategories(categoryMap);

        // Fetch wallets
        const { data: walletsData, error: walletsError } = await supabase
          .from('wallets')
          .select('*');
        
        if (walletsError) throw walletsError;
        
        const walletMap = walletsData.reduce((acc, wallet) => {
          acc[wallet.id] = wallet;
          return acc;
        }, {} as Record<string, Wallet>);
        
        setWallets(walletMap);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Handle sort
  const handleSort = (key: keyof Transaction) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sort transactions
  const sortedTransactions = [...transactions].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    }
    
    return 0;
  });

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onFilter(query);
  };

  // Get transaction type color
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'expense':
        return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
      case 'transfer':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  // Get category badge style
  const getCategoryBadgeStyle = (categoryId: string) => {
    const category = categories[categoryId];
    if (!category) return {};
    
    return {
      backgroundColor: `${category.color}15`,
      color: category.color,
      borderColor: `${category.color}30`
    };
  };

  // Get wallet badge style
  const getWalletBadgeStyle = (walletId: string) => {
    const wallet = wallets[walletId];
    if (!wallet) return {};
    
    if (wallet.gradient) {
      return {
        background: `linear-gradient(to right, ${wallet.gradient})`,
        color: 'white'
      };
    }
    
    if (wallet.color) {
      return {
        backgroundColor: `${wallet.color}15`,
        color: wallet.color,
        borderColor: `${wallet.color}30`
      };
    }

    return {};
  };

  // Desktop view
  const DesktopView = () => (
    <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead onClick={() => handleSort('date')} className="cursor-pointer font-medium">
              Tanggal {sortConfig.key === 'date' && 
                <ChevronDown className={cn(
                  "inline h-4 w-4 transition-transform",
                  sortConfig.direction === 'desc' && "rotate-180"
                )} />
              }
          </TableHead>
            <TableHead onClick={() => handleSort('category')} className="cursor-pointer font-medium">
              Kategori {sortConfig.key === 'category' && 
                <ChevronDown className={cn(
                  "inline h-4 w-4 transition-transform",
                  sortConfig.direction === 'desc' && "rotate-180"
                )} />
              }
          </TableHead>
            <TableHead onClick={() => handleSort('wallet_id')} className="cursor-pointer font-medium">
              Dompet {sortConfig.key === 'wallet_id' && 
                <ChevronDown className={cn(
                  "inline h-4 w-4 transition-transform",
                  sortConfig.direction === 'desc' && "rotate-180"
                )} />
              }
          </TableHead>
            <TableHead className="font-medium">Deskripsi</TableHead>
            <TableHead onClick={() => handleSort('amount')} className="cursor-pointer text-right font-medium">
              Jumlah {sortConfig.key === 'amount' && 
                <ChevronDown className={cn(
                  "inline h-4 w-4 transition-transform",
                  sortConfig.direction === 'desc' && "rotate-180"
                )} />
              }
          </TableHead>
            <TableHead className="w-[100px] text-center font-medium">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
          {sortedTransactions.map((transaction) => {
            const wallet = wallets[transaction.wallet_id];
            
            return (
              <TableRow key={transaction.id} className="group hover:bg-muted/50">
                <TableCell className="font-medium">
                  {format(new Date(transaction.date), "dd/MM/yyyy", { locale: id })}
                </TableCell>
            <TableCell>
                  <Badge 
                    variant="outline"
                    className={cn(
                      "rounded-md font-normal transition-colors",
                      getTransactionTypeColor(transaction.type)
                    )}
                    style={getCategoryBadgeStyle(transaction.category)}
                  >
                    <span className="flex items-center gap-1.5">
                      {categories[transaction.category]?.icon && (
                        <i className={`fas fa-${categories[transaction.category].icon} text-xs`}></i>
                      )}
                      {categories[transaction.category]?.name || transaction.category}
                    </span>
                  </Badge>
            </TableCell>
            <TableCell>
                  <Badge 
                    variant="outline"
                    className="rounded-md font-normal"
                    style={getWalletBadgeStyle(transaction.wallet_id)}
                  >
                    {wallet?.name || transaction.wallet_name || '-'}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {transaction.description || "-"}
            </TableCell>
                <TableCell className={cn(
                  "text-right font-medium",
                  transaction.type === "income" && "text-emerald-600",
                  transaction.type === "expense" && "text-rose-600",
                transaction.type === "transfer" && "text-blue-600"
              )}>
                {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                {formatCurrency(transaction.amount)}
            </TableCell>
            <TableCell>
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(transaction)}
                      className="h-8 w-8 hover:bg-background"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete([transaction.id])}
                      className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
            );
          })}
      </TableBody>
    </Table>
    </div>
  );

  // Mobile view
  const MobileView = () => (
    <div className="space-y-2">
      {sortedTransactions.map((transaction) => {
        const isExpanded = expandedTransaction === transaction.id;
        const wallet = wallets[transaction.wallet_id];

        return (
        <div
          key={transaction.id}
            className="bg-card rounded-lg border overflow-hidden transition-all duration-200"
          >
            <div 
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedTransaction(isExpanded ? null : transaction.id)}
        >
          <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Badge 
                    variant="outline"
                    className={cn(
                      "rounded-md font-normal",
                      getTransactionTypeColor(transaction.type)
                    )}
                    style={getCategoryBadgeStyle(transaction.category)}
                  >
                    <span className="flex items-center gap-1.5">
                      {categories[transaction.category]?.icon && (
                        <i className={`fas fa-${categories[transaction.category].icon} text-xs`}></i>
                      )}
                      {categories[transaction.category]?.name || transaction.category}
              </span>
                  </Badge>
                  
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transaction.date), "dd/MM/yyyy", { locale: id })}
                    </p>
                    <span className="text-muted-foreground/30">•</span>
                    <Badge 
                      variant="outline"
                      className="rounded-md font-normal"
                      style={getWalletBadgeStyle(transaction.wallet_id)}
                    >
                      {wallet?.name || transaction.wallet_name || '-'}
                    </Badge>
                  </div>
            </div>
                <div className={cn(
                "font-medium",
                  transaction.type === "income" && "text-emerald-600",
                  transaction.type === "expense" && "text-rose-600",
                transaction.type === "transfer" && "text-blue-600"
              )}>
                {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                {formatCurrency(transaction.amount)}
                </div>
              </div>

              {transaction.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {transaction.description}
                </p>
              )}
            </div>
            
            <div 
              className={cn(
                "grid transition-all duration-200",
                isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="flex items-center justify-end gap-2 p-3 border-t bg-muted/50">
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(transaction);
                    }}
                    className="h-8"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                    </Button>
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete([transaction.id]);
                    }}
                    className="h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                    </Button>
                  </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <DateRangePicker
            onChange={onDateRangeChange}
            className="w-full md:w-auto"
          />
          </div>
        </div>
      )}

      {isDesktop ? <DesktopView /> : <MobileView />}
    </div>
  );
};

export default TransactionList;
