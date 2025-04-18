
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency } from "@/lib/utils";
import { TransactionWithNames } from "@/types";
import { Wallet } from "@/types";

interface WalletTransactionsChartProps {
  walletChartData: Array<{
    name: string;
    income: number;
    expense: number;
    net: number;
  }>;
}

export function WalletTransactionsChart({ walletChartData }: WalletTransactionsChartProps) {
  if (!walletChartData.length) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-muted-foreground">No wallet data available</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Transaksi per Dompet</CardTitle>
        <CardDescription>
          Perbandingan pemasukan dan pengeluaran antar dompet
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
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
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                tickFormatter={(value) => formatCurrency(value)}
                domain={['auto', 'auto']}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
              <Legend />
              <Bar 
                dataKey="income" 
                name="Pemasukan" 
                fill="#22c55e" 
                radius={[0, 4, 4, 0]}
              />
              <Bar 
                dataKey="expense" 
                name="Pengeluaran" 
                fill="#ef4444" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
