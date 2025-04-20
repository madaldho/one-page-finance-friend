import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { AssetValueHistory } from '@/types';

interface AssetValueChartProps {
  history: AssetValueHistory[];
  initialValue: number;
  initialDate?: string;
}

export function AssetValueChart({ history, initialValue, initialDate }: AssetValueChartProps) {
  const chartData = useMemo(() => {
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    if (initialDate) {
      const hasInitialDate = sortedHistory.some(h => h.date === initialDate);
      
      if (!hasInitialDate) {
        sortedHistory.unshift({
          id: 'initial',
          asset_id: history[0]?.asset_id || '',
          user_id: history[0]?.user_id || '',
          value: initialValue,
          date: initialDate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
    
    return sortedHistory.map(item => ({
      date: item.date,
      value: item.value,
      formattedDate: format(parseISO(item.date), 'dd MMM yyyy', { locale: id }),
    }));
  }, [history, initialValue, initialDate]);

  const formatXAxis = (tickItem: string) => {
    return format(parseISO(tickItem), 'MMM yy', { locale: id });
  };

  return (
    <div className="w-full h-72 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxis} 
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={(value) => formatCurrency(value, false)} 
            tick={{ fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            formatter={(value: number) => [formatCurrency(value), 'Nilai']}
            labelFormatter={(label) => {
              const entry = chartData.find(entry => entry.date === label);
              return entry ? entry.formattedDate : label;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#8884d8" 
            fillOpacity={1} 
            fill="url(#colorValue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
