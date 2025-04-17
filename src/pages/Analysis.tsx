
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Transaction, Wallet } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays, subMonths, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Download, RefreshCw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import FinancialSummary from "@/components/FinancialSummary";

const COLORS = ['#4CAF50', '#FFA000', '#F44336', '#2196F3', '#9C27B0', '#00BCD4', '#8884d8'];

const Analysis = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<"week" | "month" | "year" | "custom">("month");
  const [chartType, setChartType] = useState<"category" | "wallet">("category");
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get a Map of wallet IDs to names
  const walletMap = wallets.reduce((acc: Record<string, string>, wallet) => {
    acc[wallet.id] = wallet.name;
    return acc;
  }, {});

  const formatToRupiah = (value: number) => {
    return `Rp ${value.toLocaleString()}`;
  };

  // Filter transactions based on selected period
  useEffect(() => {
    if (transactions.length === 0) return;
    
    const now = new Date();
    let startDate: Date;
    
    if (period === "custom" && dateRange.from) {
      startDate = startOfDay(dateRange.from);
      const endDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(now);
      
      const filtered = transactions.filter(t => {
        const txDate = new Date(t.date);
        return isAfter(txDate, startDate) && isBefore(txDate, endDate);
      });
      
      setFilteredTransactions(filtered);
    } else {
      if (period === "week") {
        startDate = subDays(now, 7);
      } else if (period === "month") {
        startDate = subDays(now, 30);
      } else {
        startDate = subMonths(now, 12);
      }
      
      const filtered = transactions.filter(t => {
        const txDate = new Date(t.date);
        return isAfter(txDate, startDate);
      });
      
      setFilteredTransactions(filtered);
    }
  }, [period, transactions, dateRange, refreshKey]);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        
        // Fetch wallets for reference
        const { data: walletsData, error: walletsError } = await supabase
          .from('wallets')
          .select('id, name, color, balance, type');
          
        if (walletsError) throw walletsError;
        setWallets(walletsData || []);
        
        // Fetch transactions
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast({
          title: "Gagal Memuat Data",
          description: "Terjadi kesalahan saat mengambil data transaksi",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [toast]);

  // Prepare data for charts
  const categoryData = filteredTransactions
    .filter(t => t.type === "expense")
    .reduce((acc: Record<string, number>, transaction) => {
      const { category, amount } = transaction;
      const key = category || "Lainnya";
      acc[key] = (acc[key] || 0) + amount;
      return acc;
    }, {});
  
  const categoryChartData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  const incomeVsExpense = [
    { name: 'Pemasukan', value: filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0) },
    { name: 'Pengeluaran', value: filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0) },
  ];
  
  const dailyData = filteredTransactions.reduce((acc: Record<string, {income: number, expense: number}>, t) => {
    const date = t.date.slice(0, 10);
    
    if (!acc[date]) {
      acc[date] = { income: 0, expense: 0 };
    }
    
    if (t.type === "income") {
      acc[date].income += t.amount;
    } else if (t.type === "expense") {
      acc[date].expense += t.amount;
    }
    
    return acc;
  }, {});
  
  const dailyChartData = Object.entries(dailyData)
    .map(([date, data]) => ({
      name: format(new Date(date), "d MMM", { locale: id }),
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense
    }))
    .sort((a, b) => {
      const dateA = new Date(a.name.split(' ').reverse().join(' '));
      const dateB = new Date(b.name.split(' ').reverse().join(' '));
      return dateA.getTime() - dateB.getTime();
    })
    .slice(-10);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  const handleExportCSV = () => {
    // Headers for the CSV
    const headers = [
      'Date', 'Title', 'Amount', 'Type', 'Category', 'Wallet'
    ];
    
    // Map transactions to CSV format
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.date,
        `"${t.title.replace(/"/g, '""')}"`,
        t.amount,
        t.type,
        t.category,
        walletMap[t.wallet || ''] || ''
      ].join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dompetku-analisis-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Data Berhasil Diekspor",
      description: "File CSV telah diunduh",
    });
  };

  // Get statistics
  const totalIncome = filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const averageExpense = filteredTransactions.filter(t => t.type === "expense").length > 0
    ? totalExpense / filteredTransactions.filter(t => t.type === "expense").length
    : 0;
  const maxTransaction = filteredTransactions.reduce((max, t) => Math.max(max, t.amount), 0);
  const topCategory = categoryChartData.length > 0 ? categoryChartData[0].name : 'Tidak ada data';

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Analisis Keuangan</h1>
          
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Periode</label>
                <ToggleGroup type="single" variant="outline" value={period} onValueChange={(value) => value && setPeriod(value as any)}>
                  <ToggleGroupItem value="week">7 Hari</ToggleGroupItem>
                  <ToggleGroupItem value="month">30 Hari</ToggleGroupItem>
                  <ToggleGroupItem value="year">1 Tahun</ToggleGroupItem>
                  <ToggleGroupItem value="custom">Kustom</ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              {period === "custom" && (
                <div className="flex flex-wrap items-center gap-2">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Dari Tanggal</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-[140px] justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            format(dateRange.from, "dd MMM yyyy")
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Sampai Tanggal</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-[140px] justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? (
                            format(dateRange.to, "dd MMM yyyy")
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                          disabled={(date) => dateRange.from ? isBefore(date, dateRange.from) : false}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Total Pemasukan</p>
              <p className="text-xl font-semibold text-green-600">
                {formatToRupiah(totalIncome)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Total Pengeluaran</p>
              <p className="text-xl font-semibold text-red-600">
                {formatToRupiah(totalExpense)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Saldo</p>
              <p className={`text-xl font-semibold ${(totalIncome - totalExpense) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatToRupiah(totalIncome - totalExpense)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Transaksi</p>
              <p className="text-xl font-semibold">
                {filteredTransactions.length}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="charts" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="charts">Grafik</TabsTrigger>
            <TabsTrigger value="statistics">Statistik</TabsTrigger>
          </TabsList>
          
          <TabsContent value="charts">
            <FinancialSummary 
              transactions={filteredTransactions as any} 
              walletMap={walletMap}
              showWalletData={true}
            />
          </TabsContent>
          
          <TabsContent value="statistics">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistik Transaksi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Rata-rata Pengeluaran</p>
                    <p className="text-lg font-semibold">
                      {formatToRupiah(averageExpense)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Transaksi Tertinggi</p>
                    <p className="text-lg font-semibold">
                      {formatToRupiah(maxTransaction)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kategori Terbesar</p>
                    <p className="text-lg font-semibold truncate">
                      {topCategory}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pengeluaran Harian Rata-rata</p>
                    <p className="text-lg font-semibold">
                      {formatToRupiah(totalExpense / (filteredTransactions.length > 0 ? Math.max(1, Math.ceil((dateRange.to?.getTime() || new Date().getTime()) - (dateRange.from?.getTime() || 0)) / (1000 * 60 * 60 * 24)) : 1))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pemasukan Harian Rata-rata</p>
                    <p className="text-lg font-semibold">
                      {formatToRupiah(totalIncome / (filteredTransactions.length > 0 ? Math.max(1, Math.ceil((dateRange.to?.getTime() || new Date().getTime()) - (dateRange.from?.getTime() || 0)) / (1000 * 60 * 60 * 24)) : 1))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rasio Pengeluaran</p>
                    <p className="text-lg font-semibold">
                      {totalIncome > 0 ? `${Math.round((totalExpense / totalIncome) * 100)}%` : '0%'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Transaksi Harian</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value) => formatToRupiah(value as number)} />
                  <Legend />
                  <Bar dataKey="income" name="Pemasukan" fill="#10b981" />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Belum cukup data untuk ditampilkan</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Analysis;
