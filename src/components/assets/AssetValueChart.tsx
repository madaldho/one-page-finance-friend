
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AssetValueHistory } from "@/types";
import { formatCurrency } from "@/lib/format";

interface AssetValueChartProps {
  historyData: AssetValueHistory[];
  initialValue: number;
  initialDate: string;
}

export const AssetValueChart = ({ historyData, initialValue, initialDate }: AssetValueChartProps) => {
  // Prepare data for chart
  const chartData = [
    { date: initialDate, value: initialValue },
    ...historyData.map((item) => ({
      date: item.date,
      value: item.value,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Format dates for better display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow rounded border border-gray-200">
          <p className="text-sm text-gray-600">{formatDate(label)}</p>
          <p className="text-sm font-medium">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px]">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              style={{ fontSize: '0.8rem' }}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value).replace('Rp', '').trim()}
              style={{ fontSize: '0.8rem' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          No history data available
        </div>
      )}
    </div>
  );
};

export default AssetValueChart;
