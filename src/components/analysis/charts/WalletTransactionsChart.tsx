
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, WalletCards } from "lucide-react";
import type { Wallet } from "@/types";

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
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expense: {
    label: "Expense",
    color: "hsl(var(--chart-2))",
  },
  net: {
    label: "Net",
    color: "hsl(var(--chart-3))",
  }
};

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Wallet Analysis</CardTitle>
            <CardDescription>
              Compare income and expenses across wallets
            </CardDescription>
          </div>
          <WalletCards className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="min-h-[350px]">
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
                    indicator="dot"
                  />
                }
              />
              <Bar 
                dataKey="income" 
                name="Income" 
                fill="var(--color-income)"
                radius={[0, 4, 4, 0]}
                barSize={24}
              />
              <Bar 
                dataKey="expense" 
                name="Expense" 
                fill="var(--color-expense)"
                radius={[0, 4, 4, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm border-t">
        <div className="flex items-center gap-2 font-medium">
          {isPositiveChange ? (
            <>
              Net positive {Math.abs(percentChange).toFixed(1)}% 
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </>
          ) : (
            <>
              Net negative {Math.abs(percentChange).toFixed(1)}%
              <TrendingDown className="h-4 w-4 text-destructive" />
            </>
          )}
        </div>
        <div className="text-muted-foreground grid gap-1">
          <span>Total Income: {formatCurrency(totalIncome)}</span>
          <span>Total Expense: {formatCurrency(totalExpense)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
