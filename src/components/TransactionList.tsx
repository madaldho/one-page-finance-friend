import React, { useState, useEffect, useRef, useMemo } from "react";
import { Transaction } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, MoreVertical, Trash2, Edit2, Calendar, CheckCircle2, Check, ArrowUpDown, ChevronRight } from "lucide-react";
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
import { DateRange } from "react-day-picker";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { Skeleton } from "@/components/ui/skeleton";

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

// Memperbaiki interface untuk Transaction dengan properti lengkap
interface ExtendedTransaction extends Omit<Transaction, 'category_id'> {
  category?: string;
  category_id?: string;
  category_name?: string;
  wallet_name?: string;
}

interface TransactionListProps {
  transactions: ExtendedTransaction[];
  onFilter: (query: string) => void;
  onDelete: (ids: string[]) => Promise<void>;
  onEdit: (transaction: ExtendedTransaction) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  hideHeader?: boolean;
  isLoading?: boolean;
}

const TransactionList = ({ 
  transactions, 
  onFilter, 
  onDelete,
  onEdit,
  onDateRangeChange,
  hideHeader = false,
  isLoading = false
}: TransactionListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ExtendedTransaction | 'category' | 'wallet_name';
    direction: 'asc' | 'desc';
  }>({ key: 'created_at', direction: 'desc' });
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string[]>([]);
  // Menambahkan state untuk lazy loading
  const [displayLimit, setDisplayLimit] = useState(40);
  const [hasMore, setHasMore] = useState(true);
  // Menambahkan state untuk mengontrol apakah data sudah siap ditampilkan
  const [dataIsReady, setDataIsReady] = useState(false);

  // Fetch categories and wallets with caching
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Coba ambil data dari cache terlebih dahulu
        const cachedCategories = localStorage.getItem('finance_categories');
        const cachedWallets = localStorage.getItem('finance_wallets');
        const cacheTimestamp = localStorage.getItem('finance_cache_timestamp');
        
        const now = Date.now();
        const cacheExpired = !cacheTimestamp || (now - parseInt(cacheTimestamp)) > 15 * 60 * 1000; // Cache valid for 15 minutes
        
        let categoryMap: Record<string, Category> = {};
        let walletMap: Record<string, Wallet> = {};
        
        // Jika cache masih valid dan tersedia, gunakan itu
        if (!cacheExpired && cachedCategories && cachedWallets) {
          categoryMap = JSON.parse(cachedCategories);
          walletMap = JSON.parse(cachedWallets);
          
          setCategories(categoryMap);
          setWallets(walletMap);
          setDataIsReady(true);
        } else {
          // Fetch categories
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('*');
          
          if (categoriesError) throw categoriesError;
          
          categoryMap = categoriesData.reduce((acc, cat) => {
            acc[cat.id] = cat as Category;
            return acc;
          }, {} as Record<string, Category>);
          
          setCategories(categoryMap);
          
          // Fetch wallets
          const { data: walletsData, error: walletsError } = await supabase
            .from('wallets')
            .select('*');
          
          if (walletsError) throw walletsError;
          
          walletMap = walletsData.reduce((acc, wallet) => {
            acc[wallet.id] = wallet;
            return acc;
          }, {} as Record<string, Wallet>);
          
          setWallets(walletMap);
          
          // Simpan ke cache
          localStorage.setItem('finance_categories', JSON.stringify(categoryMap));
          localStorage.setItem('finance_wallets', JSON.stringify(walletMap));
          localStorage.setItem('finance_cache_timestamp', now.toString());
          
          setDataIsReady(true);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Jika ada error, tetap tandai sebagai siap agar UI tidak macet
        setDataIsReady(true);
      }
    };

    fetchData();
    
    // Hapus cache saat ada perubahan signifikan pada transaksi
    return () => {
      // Tidak perlu menghapus cache di sini, akan dihapus di waktu lain
    };
  }, []);

  // Fungsi untuk memperbarui cache jika ada perubahan pada kategori atau dompet
  const invalidateCache = () => {
    localStorage.removeItem('finance_cache_timestamp');
  };

  // Run invalidateCache ketika komponen di-mount untuk memastikan data fresh saat navigasi
  useEffect(() => {
    // Invalidate cache hanya jika transaksi berubah
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        invalidateCache();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Optimize transaction sorting with useMemo
  const sortedTransactions = useMemo(() => {
    // Data belum siap, tampilkan array kosong
    if (!dataIsReady && !isLoading) {
      return [];
    }
    
    return [...transactions].sort((a, b) => {
      // Tambahkan special case untuk category
      if (sortConfig.key === 'category') {
        const aCategory = categories[a.category_id || a.category || '']?.name || '';
        const bCategory = categories[b.category_id || b.category || '']?.name || '';
        
        return sortConfig.direction === 'asc'
          ? aCategory.localeCompare(bCategory)
          : bCategory.localeCompare(aCategory);
      }
      
      // Tambahkan special case untuk wallet_name
      if (sortConfig.key === 'wallet_name') {
        const aWallet = a.wallet_name || wallets[a.wallet_id]?.name || '';
        const bWallet = b.wallet_name || wallets[b.wallet_id]?.name || '';
        
        return sortConfig.direction === 'asc'
          ? aWallet.localeCompare(bWallet)
          : bWallet.localeCompare(aWallet);
      }
      
      // Untuk key lainnya
      const aValue = a[sortConfig.key as keyof ExtendedTransaction];
      const bValue = b[sortConfig.key as keyof ExtendedTransaction];
      
      // Special case for created_at which might be undefined
      if (sortConfig.key === 'created_at') {
        // Fallback to date if created_at is not available
        const aCreatedAt = a.created_at ? new Date(a.created_at).getTime() : new Date(a.date).getTime();
        const bCreatedAt = b.created_at ? new Date(b.created_at).getTime() : new Date(b.date).getTime();
        
        return sortConfig.direction === 'asc' 
          ? aCreatedAt - bCreatedAt
          : bCreatedAt - aCreatedAt;
      }
      
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
  }, [transactions, sortConfig, categories, wallets, dataIsReady, isLoading]);

  // Terapkan batasan jumlah transaksi yang ditampilkan (lazy loading)
  useEffect(() => {
    // Reset display limit ketika data transaksi berubah
    setDisplayLimit(40);
    // Set hasMore berdasarkan jumlah transaksi yang tersedia
    setHasMore(sortedTransactions.length > 40);
  }, [sortedTransactions]);
  
  // Batasi jumlah transaksi yang ditampilkan
  const visibleTransactions = useMemo(() => {
    return sortedTransactions.slice(0, displayLimit);
  }, [sortedTransactions, displayLimit]);
  
  // Fungsi untuk memuat lebih banyak transaksi
  const loadMoreTransactions = () => {
    const newLimit = displayLimit + 40;
    setDisplayLimit(newLimit);
    setHasMore(newLimit < sortedTransactions.length);
  };

  // Kondisi loading yang diperbarui - menampilkan loading saat data belum siap atau explicitly isLoading
  const showLoading = isLoading || !dataIsReady;
  
  // Fungsi untuk mendapatkan tampilan kategori
  const getCategoryDisplay = (transaction: ExtendedTransaction): React.ReactNode => {
    // Periksa apakah transaksi memiliki category_id atau category
    const categoryId = transaction.category_id || transaction.category;
    
    // Jika tidak ada ID kategori sama sekali
    if (!categoryId) return "-";
    
    // Coba dapatkan kategori dari daftar yang telah di-fetch
    const category = categories[categoryId];
    
    // Jika kategori ditemukan, tampilkan dengan format normal
    if (category) {
      return (
        <span className="flex items-center gap-1.5">
          {category.icon && (
            <i className={`fas fa-${category.icon} text-xs`}></i>
          )}
          {category.name}
        </span>
      );
    }
    
    // Fallback: jika category sudah ada tapi sebagai string (dari data asli)
    if (typeof transaction.category === 'string' && transaction.category.length > 0) {
      return transaction.category;
    }
    
    // Fallback: jika category_name tersedia
    if (transaction.category_name) {
      return transaction.category_name;
    }
    
    // Fallback paling akhir: tampilkan sebagian ID kategori
    return categoryId.slice(0, 6);
  };

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
  const getCategoryBadgeStyle = (transaction: ExtendedTransaction) => {
    const categoryId = transaction.category_id || transaction.category;
    if (!categoryId) return {};
    
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

  const handleToggleSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => 
      selected ? [...prev, id] : prev.filter(itemId => itemId !== id)
    );
    
    if (selected && !selectionMode) {
      setSelectionMode(true);
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(sortedTransactions.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
    setSelectionMode(selected);
  };

  const handleLongPress = (id: string) => {
    handleToggleSelect(id, !selectedIds.includes(id));
  };

  const handleTouchStart = (id: string) => {
    touchStartTimeRef.current = Date.now();
    longPressTimeoutRef.current = setTimeout(() => {
      handleLongPress(id);
    }, 2000); // Increased to 5 seconds (5000ms) for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length > 0) {
      setTransactionToDelete(selectedIds);
      setShowDeleteDialog(true);
    }
  };

  const confirmDelete = async () => {
    if (transactionToDelete.length > 0) {
      await onDelete(transactionToDelete);
      setSelectedIds([]);
      setSelectionMode(false);
      setTransactionToDelete([]);
      setShowDeleteDialog(false);
    }
  };

  const exitSelectionMode = () => {
    setSelectedIds([]);
    setSelectionMode(false);
  };

  // Skeleton untuk tampilan mobile
  const MobileSkeletonView = () => {
    const months = ['APR 25', 'MAR 25']; // Contoh bulan untuk skeleton
    
    return (
      <div className="space-y-4 animate-pulse">
        {months.map((month, monthIndex) => (
          <div key={month} className="space-y-px">
            {/* Skeleton Month Header */}
            <div className="bg-slate-700/20 text-transparent font-medium text-sm px-4 py-2 rounded-lg mb-1">
              {month}
            </div>
            
            {/* Skeleton Transactions */}
            {Array.from({ length: monthIndex === 0 ? 3 : 2 }).map((_, index) => (
              <div
                key={`skeleton-${monthIndex}-${index}`}
                className="bg-card border rounded-lg border-t-0 first:border-t p-3"
              >
                <div className="flex justify-between items-start">
                  {/* Left Side Skeleton */}
                  <div className="flex flex-col gap-1.5 max-w-[65%]">
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-4 w-20" /> {/* Date */}
                      <Skeleton className="h-5 w-16 rounded-md" /> {/* Category */}
                    </div>
                    <Skeleton className="h-3 w-32" /> {/* Description */}
                  </div>
                  
                  {/* Right Side Skeleton */}
                  <div className="flex flex-col items-end gap-1.5">
                    <Skeleton className="h-5 w-20" /> {/* Amount */}
                    <Skeleton className="h-4 w-12 rounded-sm" /> {/* Wallet */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Desktop Skeleton View
  const DesktopSkeletonView = () => (
    <div className="rounded-lg border bg-card animate-pulse">
      <div className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`skeleton-desktop-${index}`} className="flex items-center gap-4">
              <Skeleton className="h-4 w-4 rounded-full" /> {/* Checkbox */}
              <Skeleton className="h-4 w-20" /> {/* Date */}
              <Skeleton className="h-6 w-24 rounded-md" /> {/* Category */}
              <Skeleton className="h-6 w-24 rounded-md" /> {/* Wallet */}
              <Skeleton className="h-4 w-32 flex-1" /> {/* Description */}
              <Skeleton className="h-4 w-20" /> {/* Amount */}
              <Skeleton className="h-8 w-16" /> {/* Actions */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Desktop view
  const DesktopView = () => (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px]">
              <div 
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border cursor-pointer transition-all",
                  sortedTransactions.length > 0 && selectedIds.length === sortedTransactions.length
                    ? "border-primary bg-primary text-primary-foreground" 
                    : "border-muted-foreground/30 hover:border-primary"
                )}
                onClick={() => handleSelectAll(!(sortedTransactions.length > 0 && selectedIds.length === sortedTransactions.length))}
              >
                {sortedTransactions.length > 0 && selectedIds.length === sortedTransactions.length && (
                  <Check className="h-3 w-3" />
                )}
              </div>
            </TableHead>
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
          {visibleTransactions.map((transaction) => {
            const wallet = wallets[transaction.wallet_id];
            const isSelected = selectedIds.includes(transaction.id);
            
            return (
              <TableRow 
                key={transaction.id} 
                className={cn(
                  "group hover:bg-muted/50",
                  isSelected && "bg-primary/5"
                )}
              >
                <TableCell className="p-2 w-[40px]">
                  <div 
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border transition-all cursor-pointer",
                      isSelected 
                        ? "border-primary bg-primary text-primary-foreground" 
                        : "border-muted-foreground/30 hover:border-primary"
                    )}
                    onClick={() => handleToggleSelect(transaction.id, !isSelected)}
                  >
                    {isSelected && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                </TableCell>
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
                    style={getCategoryBadgeStyle(transaction)}
                  >
                    {getCategoryDisplay(transaction)}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setTransactionToDelete([transaction.id]);
                        setShowDeleteDialog(true);
                      }}
                      className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {visibleTransactions.length === 0 && !showLoading && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <div className="mb-2">
                    <Search className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <p>Tidak ada transaksi yang ditemukan</p>
                  <p className="text-sm">Coba ubah filter pencarian</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  // Mobile view
  const MobileView = () => {
    // Group transactions by month and year
    const groupedTransactions = useMemo(() => {
      const grouped: Record<string, ExtendedTransaction[]> = {};
      
      visibleTransactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const month = date.getMonth(); // 0-11
        const year = date.getFullYear();
        
        // Format: "MMM YY" -> "MAR 25" for March 2025
        const monthLabel = new Intl.DateTimeFormat('en', { month: 'short' }).format(date);
        const twoDigitYear = (year % 100).toString();
        const key = `${monthLabel} ${twoDigitYear}`.toUpperCase();
        
        if (!grouped[key]) {
          grouped[key] = [];
        }
        
        grouped[key].push(transaction);
      });
      
      return grouped;
    }, [visibleTransactions]);
    
    const sortLabels: Record<string, string> = {
      'created_at': 'Waktu',
      'date': 'Tanggal',
      'amount': 'Nominal',
      'category': 'Kategori',
      'wallet_id': 'Dompet'
    };
    
    return (
      <div>
      {!selectionMode && (
        <div className="mb-4 mt-1">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Menampilkan {visibleTransactions.length} {sortedTransactions.length > visibleTransactions.length ? `dari ${sortedTransactions.length}` : ""} transaksi
            </div>
            
            <div 
              className="flex items-center gap-1.5 text-xs text-foreground/70 cursor-pointer" 
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              <span>{sortLabels[sortConfig.key] || sortConfig.key}</span>
              <ArrowUpDown className="h-3 w-3" />
            </div>
          </div>
          
          {showSortMenu && (
            <div 
              className="fixed inset-0 z-[100] flex items-end justify-center bg-black/20 animate-in fade-in-0 duration-150"
              onClick={() => setShowSortMenu(false)}
            >
              <div 
                className="w-full max-w-md bg-background rounded-t-xl shadow-lg animate-in slide-in-from-bottom duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 bg-muted-foreground/20 rounded-full"></div>
                </div>
                
                <div className="p-3 space-y-2">
                  <div className="text-sm font-medium px-2">Urutkan</div>
                  
                  <div className="grid grid-cols-1 gap-px bg-border rounded-lg overflow-hidden">
                    {Object.entries(sortLabels).map(([key, label]) => (
                      <button
                        key={key}
                        className={cn(
                          "flex items-center justify-between py-3 px-4 bg-card",
                          sortConfig.key === key && "bg-muted"
                        )}
                        onClick={() => {
                          setSortConfig({
                            key: key as keyof ExtendedTransaction | 'category' | 'wallet_name',
                            direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc'
                          });
                          setShowSortMenu(false);
                        }}
                      >
                        <span className="text-sm">{label}</span>
                        {sortConfig.key === key && (
                          <span className="text-primary">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Sticky selection counter */}
      {selectionMode && selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-primary text-primary-foreground py-1.5 px-3 rounded-full shadow-lg text-sm flex items-center gap-2">
            <span className="font-medium">{selectedIds.length}</span>
            <span>Terpilih</span>
          </div>
        </div>
      )}
      
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([monthYear, monthTransactions], monthIndex) => (
            <div key={monthYear} className="space-y-px">
              {/* Month Header */}
              <div className="bg-slate-800 text-white font-medium text-sm px-4 py-2 rounded-lg mb-1">
                {monthYear}
              </div>
              
              {/* Transactions for this month */}
              {monthTransactions.map((transaction, index) => {
                const isExpanded = expandedTransaction === transaction.id;
                const wallet = wallets[transaction.wallet_id];
                const isSelected = selectedIds.includes(transaction.id);
                
                // Determine if transaction is first or last in its group
                const isFirst = index === 0;
                const isLast = index === monthTransactions.length - 1;

                return (
                  <div
                    key={transaction.id}
                    className={cn(
                      "bg-card border border-t-0 first:border-t transition-all duration-200",
                      isSelected && "bg-primary/5 border-primary border-opacity-50",
                      isFirst && "rounded-t-lg", 
                      isLast && "rounded-b-lg",
                      !isFirst && !isLast && "rounded-none"
                    )}
                    onTouchStart={() => handleTouchStart(transaction.id)}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                  >
                    <div 
                      className="p-3 cursor-pointer hover:bg-muted/30 transition-colors relative"
                      onClick={() => {
                        if (selectionMode) {
                          handleToggleSelect(transaction.id, !isSelected);
                        } else {
                          setExpandedTransaction(isExpanded ? null : transaction.id);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        {/* Left Side */}
                        <div className="flex flex-col gap-1.5 max-w-[65%]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(transaction.date), "dd/MM/yyyy")}
                            </span>
                  
                            <Badge 
                              variant="outline"
                              className={cn(
                                "rounded-md font-normal text-xs",
                                getTransactionTypeColor(transaction.type)
                              )}
                              style={getCategoryBadgeStyle(transaction)}
                            >
                              {getCategoryDisplay(transaction)}
                            </Badge>
                          </div>
                
                          {/* Description */}
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {transaction.description || transaction.title || "-"}
                          </p>
                        </div>
                        
                        {/* Right Side */}
                        <div className="flex flex-col items-end gap-1.5">
                          <div className={cn(
                            "font-medium",
                            transaction.type === "income" && "text-emerald-600",
                            transaction.type === "expense" && "text-rose-600",
                            transaction.type === "transfer" && "text-blue-600"
                          )}>
                            {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                            {formatCurrency(transaction.amount)}
                          </div>
                          
                          <Badge 
                            variant="outline"
                            className="rounded-sm text-[10px] py-0 px-1.5 font-normal"
                            style={getWalletBadgeStyle(transaction.wallet_id)}
                          >
                            {wallet?.name || transaction.wallet_name || '-'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-2 left-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
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
                            className="h-8 text-xs"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTransactionToDelete([transaction.id]);
                              setShowDeleteDialog(true);
                            }}
                            className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

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
          
          {selectionMode && (
        <div className="flex items-center gap-2 w-full md:w-auto animate-in slide-in-from-right duration-300">
              <Button
                variant="outline"
                size="sm"
                onClick={exitSelectionMode}
                className="h-9 rounded-full shadow-sm hover:shadow transition-all"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="h-9 rounded-full shadow-sm hover:shadow transition-all"
                disabled={selectedIds.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
              </Button>
            </div>
          )}
          </div>
      )}

      {showLoading 
        ? (isDesktop ? <DesktopSkeletonView /> : <MobileSkeletonView />)
        : (isDesktop ? <DesktopView /> : <MobileView />)
      }

      {/* Tombol Load More */}
      {hasMore && !showLoading && (
        <div className="flex justify-center mt-4">
          <button 
            onClick={loadMoreTransactions}
            className="text-sm text-primary font-medium flex items-center gap-1 hover:underline focus:outline-none bg-primary/5 px-4 py-2 rounded-md"
          >
            <span>Muat Lebih Banyak</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="Hapus Transaksi"
        description={`Apakah Anda yakin ingin menghapus ${transactionToDelete.length > 1 ? `${transactionToDelete.length} transaksi` : 'transaksi ini'}?`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
      />
    </div>
  );
};

export default TransactionList;

