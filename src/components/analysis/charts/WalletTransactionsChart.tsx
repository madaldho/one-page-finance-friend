
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency } from "@/lib/utils";
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
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">No wallet data available</p>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Transaksi per Dompet</CardTitle>
        <CardDescription>
          Perbandingan pemasukan dan pengeluaran antar dompet
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full min-h-[350px] max-h-[500px]">
        <ChartContainer
          config={{
            income: { color: "#22c55e" },
            expense: { color: "#ef4444" },
            net: { color: "#6E59A5" },
          }}
          className="w-full h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={walletChartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                horizontal={true} 
                vertical={false} 
                className="stroke-gray-200 dark:stroke-gray-700"
              />
              <XAxis 
                type="number" 
                tickFormatter={(value) => formatCurrency(value)}
                domain={['auto', 'auto']}
                className="text-xs"
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120}
                tick={{ fontSize: 12 }}
                className="text-sm"
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value) => formatCurrency(value as number)} 
                  />
                } 
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle" 
                iconSize={10}
                wrapperStyle={{ paddingBottom: 10 }}
              />
              <Bar 
                dataKey="income" 
                name="Pemasukan" 
                fill="#22c55e" 
                radius={[0, 4, 4, 0]}
                barSize={30}
              />
              <Bar 
                dataKey="expense" 
                name="Pengeluaran" 
                fill="#ef4444" 
                radius={[0, 4, 4, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
