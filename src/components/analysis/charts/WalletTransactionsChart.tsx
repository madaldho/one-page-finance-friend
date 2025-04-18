
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Wallet } from "@/types";

interface WalletTransactionsChartProps {
  walletChartData: Array<{
    name: string;
    income: number;
    expense: number;
    net: number;
  }>;
}

const chartConfig = {
  income: {
    label: "Pemasukan",
    color: "hsl(142.1 76.2% 36.3%)", // green-600
  },
  expense: {
    label: "Pengeluaran",
    color: "hsl(0 84.2% 60.2%)", // red-500
  },
} satisfies ChartConfig;

export function WalletTransactionsChart({ walletChartData }: WalletTransactionsChartProps) {
  if (!walletChartData.length) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center min-h-[350px]">
          <p className="text-muted-foreground">No wallet data available</p>
        </CardContent>
      </Card>
    );
  }

  const totalIncome = walletChartData.reduce((acc, curr) => acc + curr.income, 0);
  const totalExpense = walletChartData.reduce((acc, curr) => acc + curr.expense, 0);
  const percentChange = totalIncome > 0 
    ? ((totalIncome - totalExpense) / totalIncome) * 100 
    : 0;
  const isPositiveChange = percentChange > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Transaksi per Dompet</CardTitle>
        <CardDescription>
          Perbandingan pemasukan dan pengeluaran antar dompet
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full min-h-[350px]">
        <ChartContainer 
          config={chartConfig}
          className="w-full h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={walletChartData}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 100, bottom: 0 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                horizontal={true} 
                vertical={false} 
                className="stroke-muted/20" 
              />
              <XAxis 
                type="number" 
                tickFormatter={(value) => formatCurrency(value)}
                domain={['auto', 'auto']}
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120}
                tick={{ fontSize: 12 }}
                className="text-sm fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip 
                cursor={false}
                content={
                  <ChartTooltipContent 
                    formatter={(value) => formatCurrency(value as number)}
                    indicator="dashed" 
                  />
                } 
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle" 
                iconSize={8}
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
              <Bar 
                dataKey="income" 
                name="Pemasukan" 
                fill="var(--color-income)"
                radius={[0, 4, 4, 0]}
                barSize={24}
              />
              <Bar 
                dataKey="expense" 
                name="Pengeluaran" 
                fill="var(--color-expense)"
                radius={[0, 4, 4, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm border-t">
        <div className="flex items-center gap-2 font-medium leading-none">
          {isPositiveChange ? (
            <>
              Net positive by {Math.abs(percentChange).toFixed(1)}% 
              <TrendingUp className="h-4 w-4 text-green-500" />
            </>
          ) : (
            <>
              Net negative by {Math.abs(percentChange).toFixed(1)}%
              <TrendingDown className="h-4 w-4 text-red-500" />
            </>
          )}
        </div>
        <div className="text-muted-foreground">
          Total Income: {formatCurrency(totalIncome)} | Total Expense: {formatCurrency(totalExpense)}
        </div>
      </CardFooter>
    </Card>
  );
}
