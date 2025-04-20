import React from 'react';
import { Category, Wallet } from "@/types";
import { WalletTransactionsChart } from './analysis/charts/WalletTransactionsChart';
import { DailyExpensesChart } from './analysis/charts/DailyExpensesChart';
import { CategoryDistributionChart } from './analysis/charts/CategoryDistributionChart';
import { TransactionChart } from './analysis/charts/TransactionChart';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
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
import { DateRange } from "react-day-picker";

// Definisikan TransactionWithNames karena tidak diekspor dari types
interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  date: string;
  description?: string;
  category?: string;
  wallet_id?: string;
  destination_wallet_id?: string;
}

interface TransactionWithNames extends Transaction {
  category_name?: string;
  wallet_name?: string;
  category_data?: Category;
  wallet_data?: Wallet;
  destination_wallet?: Wallet | null;
}

interface FinancialSummaryProps {
  transactions: TransactionWithNames[];
  categories?: Category[];
  wallets?: Wallet[];
  showWalletData?: boolean;
  dateRange?: DateRange;
}

const FinancialSummary = ({ 
  transactions, 
  categories = [],
  wallets = [],
  showWalletData = true,
  dateRange 
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
    .map(([name, value]) => ({ name, value: value as number }));

  // Time-based spending (morning, afternoon, evening, night)
  const timeBasedSpending = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: Record<string, number>, transaction) => {
      // Lihat format tanggal yang disimpan
      // Format: "2025-04-18T00:00:00.000Z" atau "2025-04-17T00:00:00.000Z"
      const originalDate = transaction.date;
      console.log("Transaksi:", transaction.title);
      console.log("  Original date:", originalDate);
      
      // Cek apakah format tanggal mengandung waktu atau hanya tanggal
      let hours = 0;
      
      // Jika tanggal berakhiran "T00:00:00.000Z", berarti tidak ada info waktu
      // Dalam kasus ini, kita gunakan waktu berdasarkan field lain jika ada,
      // atau waktu saat ini jika transaksi dibuat hari ini
      if (originalDate.includes("T00:00:00")) {
        // Tidak ada info waktu, kita asumsikan waktu transaksi adalah saat ini
        const now = new Date();
        hours = now.getHours();
        console.log("  Tidak ada info waktu, menggunakan waktu saat ini:", hours);
      } else {
        // Ada info waktu, gunakan waktu dari tanggal
        const date = new Date(originalDate);
        hours = date.getHours();
        console.log("  Parsed date:", date.toLocaleString());
      }
      
      console.log("  Hours:", hours);
      
      let timeSlot: string;
      // Kategori waktu:
      // Pagi: 05:00 - 11:59 (5-11)
      // Siang: 12:00 - 16:59 (12-16)
      // Sore: 17:00 - 20:59 (17-20)
      // Malam: 21:00 - 04:59 (21-4)
      if (hours >= 5 && hours < 12) {
        timeSlot = 'Pagi';
      } else if (hours >= 12 && hours < 17) {
        timeSlot = 'Siang';
      } else if (hours >= 17 && hours < 21) {
        timeSlot = 'Sore';
      } else {
        timeSlot = 'Malam';
      }
      
      console.log("  Kategori waktu:", timeSlot);
      
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

  // Prepare wallet-based data for transactions
  const walletData = showWalletData ? transactions
    .reduce((acc: Record<string, {income: number, expense: number}>, transaction) => {
      const walletName = transaction.wallet_name || 
                        (transaction.wallet_data?.name) || 
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

  // Prepare wallet distribution data based on current balances
  const walletDistributionData = showWalletData ? wallets
    .filter(wallet => wallet.balance > 0)
    .map(wallet => {
      // Find wallet color or create a color based on the wallet name
      const color = wallet.color || `hsl(${wallet.name.charCodeAt(0) % 360}, 70%, 50%)`;
      return {
        name: wallet.name,
        value: wallet.balance,
        color: color,
        percentage: 0 // Will be calculated below
      };
    })
    .sort((a, b) => b.value - a.value) : [];

  // Calculate total balance and percentages
  const totalWalletBalance = walletDistributionData.reduce((sum, wallet) => sum + wallet.value, 0);
  
  // Add percentages to each wallet
  if (totalWalletBalance > 0) {
    walletDistributionData.forEach(wallet => {
      wallet.percentage = (wallet.value / totalWalletBalance) * 100;
    });
  }

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
        <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 text-sm">Tingkat Penghematan</p>
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

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 text-sm">Selisih</p>
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
        <CategoryDistributionChart 
          transactions={transactions} 
          categories={categories} 
          wallets={wallets} 
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tren Transaksi</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-4 h-[290px] sm:h-[300px] overflow-hidden">
            <TransactionChart 
              transactions={transactions}
              wallets={wallets}
              dateRange={dateRange}
              formatCurrencyFn={formatToRupiah}
            />
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
                  Pagi: { color: "#fbbf24" },
                  Siang: { color: "#0ea5e9" },
                  Sore: { color: "#f97316" },
                  Malam: { color: "#7c3aed" },
                }}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          const value = data.value as number;
                          return (
                            <div className="bg-white p-3 rounded-md shadow-md border border-gray-100 text-xs">
                              <p className="font-medium mb-1">{data.name}</p>
                              <p>{formatToRupiah(value)}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {((value / totalExpense) * 100).toFixed(1)}% dari total
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={timeSpendingData.map(item => ({
                        ...item,
                        fill: item.name === "Pagi" ? "#fbbf24" :
                              item.name === "Siang" ? "#0ea5e9" :
                              item.name === "Sore" ? "#f97316" :
                              "#7c3aed",
                      }))}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {timeSpendingData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.name === "Pagi" ? "#fbbf24" :
                            entry.name === "Siang" ? "#0ea5e9" :
                            entry.name === "Sore" ? "#f97316" :
                            "#7c3aed"
                          }
                        />
                      ))}
                    </Pie>
                    <ChartLegend layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Belum cukup data untuk ditampilkan</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full mb-2">
              {timeSpendingData.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ 
                    backgroundColor: 
                      item.name === "Pagi" ? "#fbbf24" : 
                      item.name === "Siang" ? "#0ea5e9" : 
                      item.name === "Sore" ? "#f97316" : 
                      "#7c3aed"
                  }} />
                  <span className="text-xs whitespace-nowrap">
                    {item.name}: {formatToRupiah(item.value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 font-medium leading-none">
              <span>Total pengeluaran: {formatToRupiah(totalExpense)}</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="leading-none text-muted-foreground">
              Waktu pengeluaran terbanyak: {
                timeSpendingData.length > 0 
                  ? timeSpendingData.sort((a, b) => b.value - a.value)[0].name 
                  : '-'
              }
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Wallet Transactions Chart */}
      {showWalletData && walletChartData.length > 0 && (
        <WalletTransactionsChart walletChartData={walletDistributionData} />
      )}
    </div>
  );
};

export default FinancialSummary;
