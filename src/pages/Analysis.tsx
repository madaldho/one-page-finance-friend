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
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl p-8 md:p-12 text-center max-w-2xl w-full relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl translate-x-16 translate-y-16"></div>
        
        <div className="relative z-10">
          {/* Icon with badge */}
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
              3/3
            </div>
          </div>
          
          {/* Main content */}
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Batas Analisis Tercapai! 🚀
            </h2>
            
            <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
              Anda sudah menggunakan <span className="font-semibold text-indigo-600">3 analisis gratis</span> hari ini. 
              <span className="font-semibold"> Upgrade ke Pro</span> untuk analisis tanpa batas!
            </p>
          </div>
          
          {/* Feature comparison */}
          <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-2xl p-6 mb-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-left">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-bold text-indigo-600">Dengan Pro</span>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    <span className="text-gray-700">✨ Analisis <strong>lengkap</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    <span className="text-gray-700">📊 Laporan detail lengkap</span>
                  </li>
               
                </ul>
              </div>
              
              <div className="text-left">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-bold text-gray-500">Versi Gratis</span>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-500">🔒 Hanya 3x per hari</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-500">📋 Fitur dasar saja</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-500">⏳ Reset besok pagi</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/upgrade')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
            >
              🚀 Upgrade ke Pro Sekarang
            </button>
            
            <p className="text-xs text-gray-500">
              Mulai dari <span className="font-semibold text-indigo-600">Rp20.000/bulan</span> • Batalkan kapan saja
            </p>
          </div>
        </div>
      </div>
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
