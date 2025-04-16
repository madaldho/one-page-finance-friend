
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from './ui/chart';

interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  category: string;
  wallet?: string;
}

interface FinancialSummaryProps {
  transactions: Transaction[];
  walletMap?: Record<string, string>;
  showWalletData?: boolean;
}

const FinancialSummary = ({ transactions, walletMap = {}, showWalletData = true }: FinancialSummaryProps) => {
  // Calculate category totals for expenses
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: Record<string, number>, transaction) => {
      const { category, amount } = transaction;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += amount;
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
    } else {
      monthlyData[month].expense += transaction.amount;
    }
  });
  
  const trendData = Object.entries(monthlyData)
    .sort()
    .slice(-10)
    .map(([month, data]) => ({
      name: month,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense
    }));

  // Prepare wallet-based data if wallet info is available
  const walletData = showWalletData ? transactions
    .reduce((acc: Record<string, {income: number, expense: number}>, transaction) => {
      if (!transaction.wallet) return acc;
      
      const walletId = transaction.wallet;
      const walletName = walletMap[walletId] || `Wallet ${walletId.slice(0, 4)}`;
      
      if (!acc[walletName]) {
        acc[walletName] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        acc[walletName].income += transaction.amount;
      } else {
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

  const COLORS = ['#4CAF50', '#FFA000', '#F44336', '#2196F3', '#9C27B0', '#00BCD4', '#8884d8'];

  const formatToRupiah = (value: number) => {
    return `Rp ${value.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Analisis Keuangan</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribusi Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {categoryChartData.length > 0 ? (
              <ChartContainer
                config={{
                  income: { color: "#22c55e" },
                  expense: { color: "#ef4444" },
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
                    <Legend formatter={(value, entry) => `${value}: Rp ${(entry.payload as any).value.toLocaleString()}`} />
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
            <CardTitle className="text-base">Tren Bulanan</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {trendData.length > 0 ? (
              <ChartContainer
                config={{
                  income: { color: "#22c55e" },
                  expense: { color: "#ef4444" },
                  net: { color: "#6E59A5" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${(value / 1000)}K`} />
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

      {showWalletData && walletChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaksi per Wallet</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{
                income: { color: "#22c55e" },
                expense: { color: "#ef4444" },
                net: { color: "#6E59A5" },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={walletChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(value) => formatToRupiah(value)} />
                  <YAxis dataKey="name" type="category" width={80} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatToRupiah(value as number)} />} />
                  <Legend />
                  <Bar dataKey="income" name="Pemasukan" fill="#22c55e" />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialSummary;
