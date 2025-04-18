import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { format, subDays, subMonths, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { Transaction, Category, Wallet } from "@/types";
import { AnalysisHeader } from "@/components/analysis/AnalysisHeader";
import { AnalysisFilters } from "@/components/analysis/AnalysisFilters";
import { StatisticCards } from "@/components/analysis/StatisticCards";
import FinancialSummary from "@/components/FinancialSummary";

interface TransactionWithNames extends Transaction {
  wallet_name?: string;
  category_name?: string;
  category_data?: Category;
  wallet_data?: Wallet;
}

const Analysis = () => {
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

  useEffect(() => {
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

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-24 max-w-7xl">
        <AnalysisHeader
          onRefresh={handleRefresh}
          onExport={handleExportCSV}
        />

        <AnalysisFilters
          period={period}
          setPeriod={setPeriod}
          dateRange={dateRange}
          setDateRange={setDateRange}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          transactionCount={filteredTransactions.length}
        />

        <StatisticCards
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          savingsRate={savingsRate}
          incomeTransactions={incomeTransactions}
          expenseTransactions={expenseTransactions}
        />

        <FinancialSummary
          transactions={filteredTransactions}
          categories={categories}
          wallets={wallets}
          showWalletData={true}
        />
      </div>
    </Layout>
  );
};

export default Analysis;
