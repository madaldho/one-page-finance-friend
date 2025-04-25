import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { format, subDays, subMonths, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { Transaction, Category, Wallet } from "@/types";
import { AnalysisHeader } from "@/components/analysis/AnalysisHeader";
import { AnalysisFilters } from "@/components/analysis/AnalysisFilters";
import FinancialSummary from "@/components/FinancialSummary";
import PremiumFeatureCounter from "@/components/premium/PremiumFeatureCounter";
import { UserSubscriptionProfile } from "@/utils/subscription";

interface TransactionWithNames extends Transaction {
  wallet_name?: string;
  category_name?: string;
  category_data?: Category;
  wallet_data?: Wallet;
}

const Analysis = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionWithNames[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithNames[]>([]);
  const [period, setPeriod] = useState<string>("month");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [userProfile, setUserProfile] = useState<UserSubscriptionProfile | null>(null);

  useEffect(() => {
    fetchUserProfile();
    const fetchTransactions = async () => {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "No active user",
            description: "Please login to view your financial analysis",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        const { data: walletsData, error: walletsError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id);
          
        if (walletsError) throw walletsError;
        
        const typedWallets = walletsData?.map(wallet => ({
          ...wallet,
          type: wallet.type as "savings" | "cash" | "bank"
        })) || [];
        
        setWallets(typedWallets);
        
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true });
          
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
        
        const walletMapping = (walletsData || []).reduce((acc: Record<string, string>, wallet) => {
          acc[wallet.id] = wallet.name;
          return acc;
        }, {});
        
        const categoryMapping = (categoriesData || []).reduce((acc: Record<string, string>, category) => {
          acc[category.id] = category.name;
          return acc;
        }, {});
        
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;
        
        const transformedData = (data || []).map(transaction => {
          const txDate = new Date(transaction.date);
          return {
            ...transaction,
            date: txDate.toISOString(),
            wallet_name: walletMapping[transaction.wallet_id] || '',
            category_name: categoryMapping[transaction.category] || 'Other',
            category_data: categoriesData?.find(c => c.id === transaction.category) || null,
            wallet_data: walletsData?.find(w => w.id === transaction.wallet_id) || null,
            destination_wallet: transaction.destination_wallet_id
              ? walletsData?.find(w => w.id === transaction.destination_wallet_id)
              : null,
            type: transaction.type as "income" | "expense" | "transfer"
          };
        });
        
        setTransactions(transformedData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast({
          title: "Failed to Load Data",
          description: "An error occurred while fetching transaction data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [toast, refreshKey]);

  useEffect(() => {
    if (transactions.length === 0) return;
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(now);
    
    if (period === "custom" && dateRange.from) {
      startDate = startOfDay(dateRange.from);
      endDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(now);
    } else {
      if (period === "week") {
        startDate = subDays(now, 7);
      } else if (period === "month") {
        startDate = subDays(now, 30);
      } else if (period === "year") {
        startDate = subMonths(now, 12);
      } else {
        startDate = subDays(now, 30);
      }
    }
    
    const event = new CustomEvent("globalDateRangeChanged", {
      detail: {
        from: startDate,
        to: endDate,
      },
    });
    window.dispatchEvent(event);
      
    let filtered = transactions.filter(t => {
      const txDate = new Date(t.date);
      return isAfter(txDate, startDate) && isBefore(txDate, endDate);
    });
    
    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(search) || 
        (t.description && t.description.toLowerCase().includes(search)) ||
        (t.wallet_name && t.wallet_name.toLowerCase().includes(search)) ||
        (t.category_name && t.category_name.toLowerCase().includes(search))
      );
    }
    
    setFilteredTransactions(filtered);
  }, [period, transactions, dateRange, refreshKey, searchTerm]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Data Refreshed",
      description: "Analysis data has been updated",
    });
  };

  const handleExportCSV = () => {
    const headers = [
      'Date', 'Title', 'Amount', 'Type', 'Category', 'Wallet', 'Description'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        format(new Date(t.date), 'yyyy-MM-dd'),
        `"${t.title.replace(/"/g, '""')}"`,
        t.amount,
        t.type,
        t.category_name || '',
        t.wallet_name || '',
        t.description ? `"${t.description.replace(/"/g, '""')}"` : ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-analysis-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Data Exported Successfully",
      description: "CSV file has been downloaded",
    });
  };

  const totalIncome = filteredTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = filteredTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const savingsRate = totalIncome > 0 
    ? ((totalIncome - totalExpense) / totalIncome) * 100 
    : 0;

  const incomeTransactions = filteredTransactions.filter(t => t.type === "income").length;
  const expenseTransactions = filteredTransactions.filter(t => t.type === "expense").length;

  // Fungsi untuk mengambil profil pengguna
  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data as UserSubscriptionProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Fungsi untuk mengubah dateRange dengan type-safe
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range && range.from) {
      setDateRange(range);
    }
  };

  // Fallback content untuk pengguna free yang telah mencapai batas
  const analysisFallback = (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-2xl border border-purple-200 shadow-lg text-center max-w-2xl md:mx-auto mx-2 my-auto ">
      <div className="relative ">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        
        <div className="absolute top-0 right-0 -mr-2 -mt-2 bg-purple-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">3/3</div>
      </div>
      
      <h2 className="text-2xl font-bold mb-3 text-gray-800">Batas Analisis Tercapai</h2>
      
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Anda telah mencapai batas melihat halaman Analisis (3x) untuk hari ini.
        Upgrade ke Pro untuk akses tak terbatas ke semua fitur analisis keuangan!
      </p>
      
      <div className="grid gap-4 sm:grid-cols-2 max-w-md mx-auto mb-6">
        <div className="flex flex-col gap-1 bg-white p-4 rounded-xl shadow-sm border border-purple-100">
          <span className="text-purple-600 font-semibold">Dengan Pro</span>
          <ul className="text-left text-sm text-gray-600">
            <li className="flex items-center gap-1.5 mb-1">
              <div className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              </div>
              <span>Akses tak terbatas</span>
            </li>
            <li className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              </div>
              <span>Laporan lengkap</span>
            </li>
          </ul>
        </div>
        
        <div className="flex flex-col gap-1 bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
          <span className="text-gray-500 font-semibold">Versi Gratis</span>
          <ul className="text-left text-sm text-gray-500">
            <li className="flex items-center gap-1.5 mb-1">
              <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
              <span>Hanya 3x per hari</span>
            </li>
            <li className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
              <span>Fitur terbatas</span>
            </li>
          </ul>
        </div>
      </div>
      
      <button 
        onClick={() => navigate('/upgrade')}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium px-8 py-3 rounded-xl shadow-md transition-all duration-200 transform hover:scale-105"
      >
        Upgrade ke Pro Sekarang
      </button>
    </div>
  );

  return (
    <Layout>
      <PremiumFeatureCounter 
        feature="analysis" 
        userProfile={userProfile} 
        maxDailyCount={3}
        fallback={analysisFallback}
      >
        <div className="container mx-auto p-4 pb-24 max-w-7xl">
          <AnalysisHeader
            onRefresh={handleRefresh}
            onExport={handleExportCSV}
          />

          <AnalysisFilters
            period={period}
            setPeriod={setPeriod}
            dateRange={dateRange}
            setDateRange={handleDateRangeChange}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            transactionCount={filteredTransactions.length}
          />

          <FinancialSummary
            transactions={filteredTransactions}
            categories={categories}
            wallets={wallets}
            showWalletData={true}
            dateRange={dateRange}
          />
        </div>
      </PremiumFeatureCounter>
    </Layout>
  );
};

export default Analysis;
