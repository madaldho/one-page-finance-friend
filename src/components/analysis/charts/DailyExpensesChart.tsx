import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

interface DailyExpensesChartProps {
  dayOfWeekChartData: { name: string; value: number }[];
}

export function DailyExpensesChart({ dayOfWeekChartData }: DailyExpensesChartProps) {
  // Urutkan hari dalam urutan yang benar (Senin - Minggu)
  const orderedDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  
  const sortedData = useMemo(() => {
    return [...dayOfWeekChartData].sort((a, b) => {
      return orderedDays.indexOf(a.name) - orderedDays.indexOf(b.name);
    });
  }, [dayOfWeekChartData]);
  
  // Temukan hari dengan pengeluaran tertinggi dan terendah
  const maxDay = useMemo(() => {
    return sortedData.reduce((max, day) => 
      day.value > max.value ? day : max, 
      { name: '-', value: 0 });
  }, [sortedData]);
  
  const minDay = useMemo(() => {
    return sortedData.filter(day => day.value > 0).reduce((min, day) => 
      day.value < min.value ? day : min, 
      maxDay);
  }, [sortedData, maxDay]);

  const chartConfig = {
    value: { color: "#8b5cf6" }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Pengeluaran per Hari</CardTitle>
        <CardDescription>
          Identifikasi pola pengeluaran berdasarkan hari
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pt-4 h-[290px] sm:h-[300px]">
        <ChartContainer
          config={chartConfig}
          className="w-full h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={sortedData}
              margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
              barGap={8}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false}
                opacity={0.3}
              />
              <XAxis 
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                width={36}
              />
              <ChartTooltip 
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                content={
                  <ChartTooltipContent 
                    formatter={(value) => formatCurrency(value as number)}
                    indicator="dot"
                  />
                }
              />
              <Bar 
                dataKey="value" 
                name="Pengeluaran"
                fill="var(--color-value)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-1.5 text-sm border-t px-6 py-4">
        <div className="flex items-center gap-2 font-medium">
          <span>Hari dengan pengeluaran tertinggi: <strong>{maxDay.name}</strong></span>
          <TrendingUp className="h-4 w-4 text-red-500" />
        </div>
        <div className="text-muted-foreground text-xs">
          Pengeluaran terendah pada hari {minDay.name}: {formatCurrency(minDay.value)}
        </div>
      </CardFooter>
    </Card>
  );
}
