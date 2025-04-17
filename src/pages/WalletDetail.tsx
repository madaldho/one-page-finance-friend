
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Transaction } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, Search, Filter, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const WalletDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "income" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  
  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch wallet details
        const { data: walletData, error: walletError } = await supabase
          .from("wallets")
          .select("*")
          .eq("id", id)
          .single();
          
        if (walletError) throw walletError;
        setWallet(walletData as Wallet);
        
        // Fetch transactions for this wallet
        const { data: txData, error: txError } = await supabase
          .from("transactions")
          .select("*")
          .eq("wallet", id)
          .order("date", { ascending: false });
          
        if (txError) throw txError;
        setTransactions(txData as Transaction[]);
      } catch (error) {
        console.error("Error fetching wallet data:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data dompet",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, toast]);
  
  // Group transactions by month/date
  const groupedTransactions = transactions
    .filter(tx => {
      // Filter by search query
      if (searchQuery) {
        return tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
               tx.category.toLowerCase().includes(searchQuery.toLowerCase());
      }
      
      // Filter by tab
      if (activeTab === "income") return tx.type === "income";
      if (activeTab === "expense") return tx.type === "expense";
      return true;
    })
    .sort((a, b) => {
      // Sort by date
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sort === "newest" ? dateB - dateA : dateA - dateB;
    })
    .reduce((groups: Record<string, Transaction[]>, tx) => {
      // Group by month
      const date = new Date(tx.date);
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthKey = `${year}-${month}`;
      
      // For current month, use "BULAN INI"
      const now = new Date();
      const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();
      const groupKey = isCurrentMonth ? "BULAN INI" : format(date, "MMM yy", { locale: id }).toUpperCase();
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(tx);
      return groups;
    }, {});
  
  // Get the background color based on wallet color
  const getWalletBgColor = () => {
    if (!wallet) return "bg-green-500";
    if (wallet.color?.startsWith("#")) {
      return `bg-[${wallet.color}]`;
    }
    
    switch (wallet.color) {
      case "green": return "bg-green-500";
      case "blue": return "bg-blue-500";
      case "purple": return "bg-purple-500";
      case "pink": return "bg-pink-500";
      case "orange": return "bg-orange-500";
      case "yellow": return "bg-yellow-500";
      case "red": return "bg-red-500";
      default: return "bg-green-500";
    }
  };
  
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString()}`;
  };
  
  const getRunningBalance = (tx: Transaction, index: number, group: Transaction[]) => {
    // Calculate running balance for this transaction
    // If it's the first transaction, use the current wallet balance
    // and add/subtract from there for each transaction
    if (index === 0 && Object.keys(groupedTransactions)[0] === "BULAN INI") {
      return wallet?.balance || 0;
    }
    
    // For other transactions, calculate based on previous transactions
    const txsToConsider = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const txIndex = txsToConsider.findIndex(t => t.id === tx.id);
    const nextTxs = txsToConsider.slice(0, txIndex);
    
    let balance = wallet?.balance || 0;
    nextTxs.forEach(t => {
      if (t.type === "income") balance -= t.amount;
      else if (t.type === "expense") balance += t.amount;
    });
    
    return balance;
  };
  
  // Get category badge color
  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      "BONUS": "bg-green-400 text-white",
      "Cicilan": "bg-cyan-400 text-white",
      "Terima dari Minjem": "bg-gray-400 text-white",
      "Kasih Minjemin": "bg-gray-400 text-white",
      "TABUNGAN": "bg-gray-400 text-white",
      "Gaji": "bg-green-400 text-white",
      "Makan/Jajan": "bg-yellow-400 text-white",
      "CONVERT": "bg-gray-400 text-white",
      // Add more category mappings as needed
    };
    
    return colors[category] || "bg-gray-400 text-white";
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }
  
  if (!wallet) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Dompet tidak ditemukan</p>
          <Button variant="link" onClick={() => navigate(-1)}>Kembali</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className={`${getWalletBgColor()} text-white p-4`}>
        <div className="container mx-auto">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center mb-4 text-white"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span>Kembali</span>
          </button>
          
          <div className="mb-8">
            <h1 className="text-xl font-bold uppercase">{wallet.name}</h1>
            <p className="text-sm opacity-80 mt-1">Saldo Saat Ini</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(wallet.balance)}</p>
          </div>
          
          <div className="flex justify-between text-sm">
            <div>
              <p className="opacity-80">Total Pemasukan</p>
              <p className="font-semibold">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="text-right">
              <p className="opacity-80">Total Pengeluaran</p>
              <p className="font-semibold">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs & Content */}
      <div className="flex-1 bg-gray-50">
        <div className="container mx-auto">
          <Tabs 
            defaultValue="all" 
            className="w-full" 
            onValueChange={(value) => setActiveTab(value as "all" | "income" | "expense")}
          >
            <TabsList className="w-full grid grid-cols-3 rounded-none bg-white">
              <TabsTrigger value="all" className="rounded-none">Semua</TabsTrigger>
              <TabsTrigger value="income" className="rounded-none">Pemasukan</TabsTrigger>
              <TabsTrigger value="expense" className="rounded-none">Pengeluaran</TabsTrigger>
            </TabsList>
            
            <div className="p-4 flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Cari transaksi..."
                  className="pl-10 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <span className="mr-1">Terbaru</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSort("newest")}>
                    Terbaru
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSort("oldest")}>
                    Terlama
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <TabsContent value="all" className="m-0">
              <div className="bg-white">
                {Object.entries(groupedTransactions).map(([group, txs]) => (
                  <div key={group}>
                    <div className="px-4 py-2 bg-gray-100 font-semibold text-sm">
                      {group}
                    </div>
                    
                    <div>
                      {txs.map((tx, index) => (
                        <div key={tx.id} className="px-4 py-3 border-b flex items-center">
                          <div className="flex-1">
                            <div className="flex gap-2 items-center mb-1">
                              <div className="text-sm text-gray-500">
                                {format(new Date(tx.date), "d MMM yyyy", { locale: id })}
                              </div>
                              <Badge className={`${getCategoryBadgeColor(tx.category)} text-xs py-0 h-5`}>
                                {tx.category}
                              </Badge>
                            </div>
                            <div className="font-medium">{tx.title}</div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                              {tx.type === "income" ? "+" : "-"} {formatCurrency(tx.amount)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatCurrency(getRunningBalance(tx, index, txs))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {Object.keys(groupedTransactions).length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>Tidak ada transaksi yang sesuai dengan filter</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="income" className="m-0">
              {/* Income tab content - Same layout but filtered */}
              <div className="bg-white">
                {Object.entries(groupedTransactions).map(([group, txs]) => (
                  <div key={group}>
                    <div className="px-4 py-2 bg-gray-100 font-semibold text-sm">
                      {group}
                    </div>
                    
                    <div>
                      {txs.map((tx, index) => (
                        <div key={tx.id} className="px-4 py-3 border-b flex items-center">
                          <div className="flex-1">
                            <div className="flex gap-2 items-center mb-1">
                              <div className="text-sm text-gray-500">
                                {format(new Date(tx.date), "d MMM yyyy", { locale: id })}
                              </div>
                              <Badge className={`${getCategoryBadgeColor(tx.category)} text-xs py-0 h-5`}>
                                {tx.category}
                              </Badge>
                            </div>
                            <div className="font-medium">{tx.title}</div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              + {formatCurrency(tx.amount)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatCurrency(getRunningBalance(tx, index, txs))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {Object.keys(groupedTransactions).length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>Tidak ada transaksi pemasukan</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="expense" className="m-0">
              {/* Expense tab content - Same layout but filtered */}
              <div className="bg-white">
                {Object.entries(groupedTransactions).map(([group, txs]) => (
                  <div key={group}>
                    <div className="px-4 py-2 bg-gray-100 font-semibold text-sm">
                      {group}
                    </div>
                    
                    <div>
                      {txs.map((tx, index) => (
                        <div key={tx.id} className="px-4 py-3 border-b flex items-center">
                          <div className="flex-1">
                            <div className="flex gap-2 items-center mb-1">
                              <div className="text-sm text-gray-500">
                                {format(new Date(tx.date), "d MMM yyyy", { locale: id })}
                              </div>
                              <Badge className={`${getCategoryBadgeColor(tx.category)} text-xs py-0 h-5`}>
                                {tx.category}
                              </Badge>
                            </div>
                            <div className="font-medium">{tx.title}</div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-semibold text-red-600">
                              - {formatCurrency(tx.amount)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatCurrency(getRunningBalance(tx, index, txs))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {Object.keys(groupedTransactions).length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>Tidak ada transaksi pengeluaran</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default WalletDetail;
