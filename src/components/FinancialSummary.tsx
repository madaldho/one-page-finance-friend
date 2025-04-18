import React from 'react';
import { TransactionWithNames, Category, Wallet } from "@/types";
import { WalletTransactionsChart } from './analysis/charts/WalletTransactionsChart';
import { DailyExpensesChart } from './analysis/charts/DailyExpensesChart';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { 
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, 
  Legend, Pie, PieChart, ResponsiveContainer, Tooltip, 
  XAxis, YAxis, Treemap, RadialBarChart, RadialBar
} from "recharts";
import { 
  ChartContainer, 
  ChartLegend, 
  ChartLegendContent, 
  ChartTooltip, 
  ChartTooltipContent 
} from './ui/chart';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, TrendingUp, TrendingDown, DollarSign, CalendarClock } from "lucide-react";
import { format, subDays } from "date-fns";

interface FinancialSummaryProps {
  transactions: TransactionWithNames[];
  categories?: Category[];
  wallets?: Wallet[];
  showWalletData?: boolean;
}

const FinancialSummary = ({ 
  transactions, 
  categories = [],
  wallets = [],
  showWalletData = true 
}: FinancialSummaryProps) => {
  // Mengambil data kategori untuk pewarnaan
  const categoryColors = categories.reduce<Record<string, string>>((acc, cat) => {
    if (cat.color) acc[cat.id] = cat.color;
    return acc;
  }, {});

  // Calculate category totals for expenses
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: Record<string, number>, transaction) => {
      const categoryName = transaction.category_name || "Lainnya";
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += transaction.amount;
      return acc;
    }, {});

  // Convert to array for charts
  const categoryChartData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  // Prepare data for monthly trend chart
  const monthlyData: Record<string, { income: number; expense: number }> = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const month = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expense: 0 };
    }
    
    if (transaction.type === 'income') {
      monthlyData[month].income += transaction.amount;
    } else if (transaction.type === 'expense') {
      monthlyData[month].expense += transaction.amount;
    }
  });
  
  const trendData = Object.entries(monthlyData)
    .sort()
    .slice(-8)
    .map(([month, data]) => ({
      name: month,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense
    }));

  // Day of week analysis
  const dayOfWeekData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: Record<string, number>, transaction) => {
      const date = new Date(transaction.date);
      const day = date.toLocaleDateString('id-ID', { weekday: 'short' });
      
      if (!acc[day]) {
        acc[day] = 0;
      }
      
      acc[day] += transaction.amount;
      return acc;
    }, {});

  const dayOfWeekChartData = Object.entries(dayOfWeekData)
    .map(([name, value]) => ({ name, value }));

  // Time-based spending (morning, afternoon, evening, night)
  const timeBasedSpending = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: Record<string, number>, transaction) => {
      const date = new Date(transaction.date);
      const hour = date.getHours();
      
      let timeSlot: string;
      if (hour >= 5 && hour < 12) {
        timeSlot = 'Pagi';
      } else if (hour >= 12 && hour < 17) {
        timeSlot = 'Siang';
      } else if (hour >= 17 && hour < 21) {
        timeSlot = 'Sore';
      } else {
        timeSlot = 'Malam';
      }
      
      if (!acc[timeSlot]) {
        acc[timeSlot] = 0;
      }
      
      acc[timeSlot] += transaction.amount;
      return acc;
    }, {});

  const timeSpendingData = Object.entries(timeBasedSpending)
    .map(([name, value], index) => ({ 
      name, 
      value,
      fill: `hsl(${index * 90}, 70%, 50%)`
    }));

  // Prepare wallet-based data if wallet info is available
  const walletData = showWalletData ? transactions
    .reduce((acc: Record<string, {income: number, expense: number}>, transaction) => {
      const walletName = transaction.wallet_name || 
                        (transaction.wallet_data?.name) || 
                        walletMap[transaction.wallet_id || ""] || 
                        "Dompet Lainnya";
      
      if (!acc[walletName]) {
        acc[walletName] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        acc[walletName].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        acc[walletName].expense += transaction.amount;
      }
      
      return acc;
    }, {}) : {};

  const walletChartData = Object.entries(walletData).map(([name, data]) => ({
    name,
    income: data.income,
    expense: data.expense,
    net: data.income - data.expense
  }));

  // Savings rate calculation
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const savingsRate = totalIncome > 0 
    ? ((totalIncome - totalExpense) / totalIncome) * 100 
    : 0;

  // Weekly spending trend
  const last7DaysData: Record<string, number> = {};
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    const dateString = format(date, 'dd/MM');
    last7DaysData[dateString] = 0;
  }
  
  transactions
    .filter(t => t.type === 'expense' && new Date(t.date) >= subDays(today, 7))
    .forEach(transaction => {
      const date = new Date(transaction.date);
      const dateString = format(date, 'dd/MM');
      
      if (last7DaysData[dateString] !== undefined) {
        last7DaysData[dateString] += transaction.amount;
      }
    });
    
  const weeklySpendingData = Object.entries(last7DaysData)
    .map(([date, amount]) => ({
      date,
      amount
    }));

  const COLORS = [
    '#4CAF50', '#FFA000', '#F44336', '#2196F3', 
    '#9C27B0', '#00BCD4', '#8884d8', '#FF5722',
    '#607D8B', '#8BC34A', '#E91E63', '#03A9F4'
  ];

  const formatToRupiah = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  // Spending breakdown
  const highestCategory = categoryChartData.length > 0 
    ? categoryChartData[0].name 
    : '-';
    
  const highestExpenseAmount = categoryChartData.length > 0 
    ? categoryChartData[0].value 
    : 0;

  return (
    <div className="space-y-6">
      {/* Financial Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 text-sm">Tingkat Tabungan</p>
                <p className="text-2xl font-bold mt-1">
                  {savingsRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white/20 p-2 rounded-full">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="mt-2 text-sm text-white/80">
              {savingsRate >= 20 ? (
                <span>Sangat Baik</span>
              ) : savingsRate >= 10 ? (
                <span>Baik</span>
              ) : savingsRate >= 0 ? (
                <span>Cukup</span>
              ) : (
                <span>Perlu Perhatian</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 text-sm">Total Pemasukan</p>
                <p className="text-2xl font-bold mt-1">
                  {formatToRupiah(totalIncome)}
                </p>
              </div>
              <div className="bg-white/20 p-2 rounded-full">
                <ArrowUpRight size={20} />
              </div>
            </div>
            <div className="mt-2 text-sm text-white/80">
              {transactions.filter(t => t.type === 'income').length} transaksi
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 text-sm">Total Pengeluaran</p>
                <p className="text-2xl font-bold mt-1">
                  {formatToRupiah(totalExpense)}
                </p>
              </div>
              <div className="bg-white/20 p-2 rounded-full">
                <TrendingDown size={20} />
              </div>
            </div>
            <div className="mt-2 text-sm text-white/80">
              {transactions.filter(t => t.type === 'expense').length} transaksi
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 text-sm">Saldo Bersih</p>
                <p className="text-2xl font-bold mt-1">
                  {formatToRupiah(totalIncome - totalExpense)}
                </p>
              </div>
              <div className="bg-white/20 p-2 rounded-full">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="mt-2 text-sm text-white/80">
              {totalIncome > totalExpense ? 'Surplus' : 'Defisit'}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribusi Pengeluaran</CardTitle>
            <CardDescription>
              Kategori pengeluaran terbesar: {highestCategory} ({formatToRupiah(highestExpenseAmount)})
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {categoryChartData.length > 0 ? (
              <ChartContainer
                config={{
                  income: { color: "#22c55e" },
                  expense: { color: "#ef4444" },
                  net: { color: "#6E59A5" }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatToRupiah(value as number)} />} />
                    <Legend 
                      formatter={(value, entry) => {
                        const payload = entry?.payload as unknown as { name: string, value: number };
                        return `${value}: ${formatToRupiah(payload.value)}`;
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Belum cukup data untuk ditampilkan</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tren Bulanan</CardTitle>
            <CardDescription>
              Pemasukan vs Pengeluaran selama 8 bulan terakhir
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {trendData.length > 0 ? (
              <ChartContainer
                config={{
                  income: { color: "#22c55e" },
                  expense: { color: "#ef4444" },
                  net: { color: "#6E59A5" }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}Jt`} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatToRupiah(value as number)} />} />
                    <Bar dataKey="income" name="Pemasukan" fill="#22c55e" />
                    <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Belum cukup data untuk ditampilkan</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Daily Expenses Chart */}
        <DailyExpensesChart dayOfWeekChartData={dayOfWeekChartData} />

        {/* Time-based Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pengeluaran Berdasarkan Waktu</CardTitle>
            <CardDescription>
              Distribusi pengeluaran berdasarkan waktu hari
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {timeSpendingData.length > 0 ? (
              <ChartContainer
                config={{
                  value: { color: "#8b5cf6" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="30%" 
                    outerRadius="90%" 
                    barSize={20} 
                    data={timeSpendingData}
                  >
                    <RadialBar
                      background
                      dataKey="value"
                      label={{ position: 'insideStart', fill: '#fff', fontWeight: 'bold', fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatToRupiah(value as number)} />} />
                    <Legend 
                      iconSize={10} 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      formatter={(value, entry) => {
                        const payload = entry?.payload as unknown as { name: string, value: number };
                        return `${value}: ${formatToRupiah(payload.value)}`;
                      }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Belum cukup data untuk ditampilkan</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wallet Transactions Chart */}
      {showWalletData && walletChartData.length > 0 && (
        <WalletTransactionsChart walletChartData={walletChartData} />
      )}
    </div>
  );
};

export default FinancialSummary;
