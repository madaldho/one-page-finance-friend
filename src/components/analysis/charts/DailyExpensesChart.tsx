
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency } from "@/lib/utils";

interface DailyExpensesChartProps {
  dayOfWeekChartData: Array<{
    name: string;
    value: number;
  }>;
}

const COLORS = [
  '#4CAF50', '#FFA000', '#F44336', '#2196F3', 
  '#9C27B0', '#00BCD4', '#8884d8'
];

export function DailyExpensesChart({ dayOfWeekChartData }: DailyExpensesChartProps) {
  if (!dayOfWeekChartData.length) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-muted-foreground">No daily expenses data available</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pengeluaran per Hari</CardTitle>
        <CardDescription>
          Identifikasi pola pengeluaran berdasarkan hari
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ChartContainer
          config={{
            value: { color: "#8b5cf6" },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={dayOfWeekChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                width={60}
              />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
              <Bar 
                dataKey="value" 
                name="Pengeluaran"
                maxBarSize={50}
              >
                {dayOfWeekChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
