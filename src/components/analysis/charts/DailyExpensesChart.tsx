
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface DailyExpensesChartProps {
  dayOfWeekChartData: Array<{
    name: string;
    value: number;
  }>;
}

const chartConfig = {
  value: {
    label: "Amount",
    color: "hsl(262.1 83.3% 57.8%)", // purple-500
  },
} satisfies ChartConfig;

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function DailyExpensesChart({ dayOfWeekChartData }: DailyExpensesChartProps) {
  if (!dayOfWeekChartData.length) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No daily expenses data available</p>
        </CardContent>
      </Card>
    );
  }

  const maxDay = dayOfWeekChartData.reduce((max, curr) => 
    curr.value > max.value ? curr : max
  );

  const minDay = dayOfWeekChartData.reduce((min, curr) => 
    curr.value < min.value ? curr : min
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pengeluaran per Hari</CardTitle>
        <CardDescription>
          Identifikasi pola pengeluaran berdasarkan hari
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={dayOfWeekChartData}
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false}
                className="stroke-muted/20" 
              />
              <XAxis 
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs fill-muted-foreground"
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs fill-muted-foreground"
                width={48}
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
                dataKey="value" 
                name="Pengeluaran"
                fill="var(--color-value)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm border-t">
        <div className="grid gap-2">
          <div className="flex items-center gap-2 font-medium">
            Highest spending on {maxDay.name}
            <TrendingUp className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-muted-foreground">
            Lowest spending on {minDay.name}: {formatCurrency(minDay.value)}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
