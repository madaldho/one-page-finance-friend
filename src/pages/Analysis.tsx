import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@/types";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const Analysis = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [chartType, setChartType] = useState<"category" | "wallet">("category");
  
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any[]>([]);
  const [incomeVsExpense, setIncomeVsExpense] = useState<any[]>([]);
  const [dailyTransactions, setDailyTransactions] = useState<any[]>([]);

  const formatToRupiah = (value: number) => {
    return `Rp ${value.toLocaleString()}`;
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const now = new Date();
        let startDate;
        
        if (period === "week") {
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
        } else if (period === "month") {
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
        } else {
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 365);
        }
        
        const startDateStr = startDate.toISOString().slice(0, 10);
        const endDateStr = now.toISOString().slice(0, 10);

        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .gte('date', startDateStr)
          .lte('date', endDateStr)
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
      }
    };

    fetchTransactions();
  }, [toast, period]);

  useEffect(() => {
    const categorySums = transactions.reduce((acc: Record<string, number>, transaction: Transaction) => {
      if (transaction.type === "expense") {
        const key = transaction.category || "Lainnya";
        acc[key] = (acc[key] || 0) + transaction.amount;
      }
      return acc;
    }, {});
    
    const categoryChartData = Object.keys(categorySums).map(category => ({
      name: category,
      value: categorySums[category]
    }));
    setCategoryData(categoryChartData);
    
    const walletSums = transactions.reduce((acc: Record<string, {income: number, expense: number}>, transaction: Transaction) => {
      const walletId = transaction.wallet || "unknown";
      
      if (!acc[walletId]) {
        acc[walletId] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === "income") {
        acc[walletId].income += transaction.amount;
      } else if (transaction.type === "expense") {
        acc[walletId].expense += transaction.amount;
      }
      
      return acc;
    }, {});
    
    const getWalletNames = async () => {
      try {
        const { data: wallets, error } = await supabase
          .from('wallets')
          .select('id, name');
          
        if (error) throw error;
        
        const walletMap = (wallets || []).reduce((acc: Record<string, string>, wallet: any) => {
          acc[wallet.id] = wallet.name;
          return acc;
        }, {});
        
        const walletChartData = Object.keys(walletSums).map(walletId => ({
          name: walletMap[walletId] || "Unknown Wallet",
          income: walletSums[walletId].income,
          expense: walletSums[walletId].expense,
          net: walletSums[walletId].income - walletSums[walletId].expense
        }));
        
        setWalletData(walletChartData);
      } catch (error) {
        console.error('Error fetching wallet names:', error);
      }
    };
    
    getWalletNames();
    
    const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    
    setIncomeVsExpense([
      { name: 'Pemasukan', value: totalIncome },
      { name: 'Pengeluaran', value: totalExpense },
    ]);
    
    const dailyTxns = transactions.reduce((acc: Record<string, {income: number, expense: number}>, t: Transaction) => {
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
    
    const dailyChartData = Object.keys(dailyTxns)
      .sort()
      .slice(-10)
      .map(date => ({
        date: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        income: dailyTxns[date].income,
        expense: dailyTxns[date].expense
      }));
      
    setDailyTransactions(dailyChartData);
    
  }, [transactions]);

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32">
        <h1 className="text-xl font-bold mb-6">Analisis Keuangan</h1>
        
        <div className="mb-6">
          <p className="text-sm mb-2">Pilih periode:</p>
          <ToggleGroup type="single" value={period} onValueChange={(value) => value && setPeriod(value as "week" | "month" | "year")}>
            <ToggleGroupItem value="week" aria-label="Toggle week">
              Minggu ini
            </ToggleGroupItem>
            <ToggleGroupItem value="month" aria-label="Toggle month">
              30 hari
            </ToggleGroupItem>
            <ToggleGroupItem value="year" aria-label="Toggle year">
              1 tahun
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Pemasukan</p>
            <p className="text-xl font-semibold text-green-600">
              Rp {incomeVsExpense.find(i => i.name === 'Pemasukan')?.value.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Pengeluaran</p>
            <p className="text-xl font-semibold text-red-600">
              Rp {incomeVsExpense.find(i => i.name === 'Pengeluaran')?.value.toLocaleString() || 0}
            </p>
          </div>
        </div>
        
        <div className="mb-8 bg-white p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Pemasukan vs Pengeluaran</h2>
          <div className="aspect-[4/3] w-full">
            <ChartContainer className="h-full w-full" config={{ income: { color: '#10b981' }, expense: { color: '#ef4444' } }}>
              <PieChart>
                <Pie
                  data={incomeVsExpense}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {incomeVsExpense.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Pemasukan' ? '#10b981' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ChartContainer>
          </div>
        </div>
        
        <div className="mb-8 bg-white p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Transaksi Harian</h2>
          <div className="aspect-[4/3] w-full">
            <ChartContainer className="h-full w-full" config={{ income: { color: '#10b981' }, expense: { color: '#ef4444' } }}>
              <BarChart data={dailyTransactions}>
                <XAxis dataKey="date" />
                <YAxis tickFormatter={formatToRupiah} />
                <Tooltip formatter={(value) => formatToRupiah(value as number)} />
                <Legend />
                <Bar dataKey="income" name="Pemasukan" fill="#10b981" />
                <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
        
        <div className="mb-4">
          <ToggleGroup type="single" value={chartType} onValueChange={(value) => value && setChartType(value as "category" | "wallet")}>
            <ToggleGroupItem value="category" aria-label="Toggle categories">
              Berdasarkan Kategori
            </ToggleGroupItem>
            <ToggleGroupItem value="wallet" aria-label="Toggle wallets">
              Berdasarkan Wallet
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        {chartType === "category" ? (
          <div className="mb-8 bg-white p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Pengeluaran per Kategori</h2>
            <div className="aspect-[4/3] w-full">
              <ChartContainer className="h-full w-full" config={{}}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatToRupiah(value as number)} />
                  <Legend />
                </PieChart>
              </ChartContainer>
            </div>
          </div>
        ) : (
          <div className="mb-8 bg-white p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Transaksi per Wallet</h2>
            <div className="aspect-[4/3] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={walletData}>
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatToRupiah} />
                  <Tooltip formatter={(value) => formatToRupiah(value as number)} />
                  <Legend />
                  <Bar dataKey="income" name="Pemasukan" fill="#10b981" />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        <div className="mb-8 bg-white p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Statistik Transaksi</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Jumlah Transaksi</p>
              <p className="text-xl font-semibold">{transactions.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rata-rata Pengeluaran</p>
              <p className="text-xl font-semibold">
                {formatToRupiah(
                  transactions.filter(t => t.type === "expense").length > 0
                    ? transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0) / 
                      transactions.filter(t => t.type === "expense").length
                    : 0
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Transaksi Tertinggi</p>
              <p className="text-xl font-semibold">
                {formatToRupiah(
                  transactions.reduce((max, t) => Math.max(max, t.amount), 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pengeluaran Terbesar</p>
              <p className="text-xl font-semibold">
                {categoryData.length > 0
                  ? `${categoryData.sort((a, b) => b.value - a.value)[0]?.name || 'Tidak ada'}`
                  : 'Tidak ada data'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analysis;
