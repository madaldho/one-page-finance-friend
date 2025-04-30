"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, Tooltip, Cell } from 'recharts';
import { formatCurrency } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface WalletTransactionsChartProps {
  walletChartData: Array<{
    name: string;
    value: number;
    color?: string;
    percentage: number;
  }>;
}

export function WalletTransactionsChart({ walletChartData }: WalletTransactionsChartProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null);

  if (!walletChartData.length) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center min-h-[350px]">
          <p className="text-muted-foreground">Tidak ada data dompet tersedia</p>
        </CardContent>
      </Card>
    );
  }

  const totalBalance = walletChartData.reduce((acc, curr) => acc + curr.value, 0);

  // Urutkan data berdasarkan value (saldo)
  const chartData = walletChartData
    .map(wallet => ({
      name: wallet.name,
      saldo: wallet.value,
      color: wallet.color || `hsl(${wallet.name.charCodeAt(0) % 360}, 70%, 50%)`,
      percentage: wallet.percentage,
    }))
    .sort((a, b) => b.saldo - a.saldo);

  // Fungsi untuk menangani pengurutan
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Urutkan data untuk tabel
  const sortedWallets = [...chartData];
  if (sortConfig !== null) {
    sortedWallets.sort((a, b) => {
      if (sortConfig.key === "percentage") {
        if (a.percentage < b.percentage) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a.percentage > b.percentage) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      } else if (sortConfig.key === "saldo") {
        if (a.saldo < b.saldo) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a.saldo > b.saldo) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      }
      return 0;
    });
  }

  // Toggle fungsi untuk detail section
  const toggleDetail = () => {
    setIsDetailOpen(!isDetailOpen);
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Distribusi Dompet</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col w-full">
          {/* Chart Section */}
          <div className="bg-white rounded-t-lg overflow-hidden border shadow-sm">
            <div className="h-[300px] p-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
                  data={chartData} 
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                    dataKey="name" 
                axisLine={false}
                tickLine={false}
                    tickMargin={10} 
                    fontSize={11}
                    tickFormatter={(value) => (value.length > 10 ? `${value.slice(0, 10)}...` : value)}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-md shadow-md border border-gray-100 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></div>
                              <p className="font-medium">{data.name}</p>
                            </div>
                            <p className="font-medium mt-1">{formatCurrency(data.saldo)} ({data.percentage.toFixed(1)}%)</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="saldo" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
            </BarChart>
          </ResponsiveContainer>
            </div>
          </div>

          {/* Expandable Details Section */}
          <div className="bg-white rounded-b-lg border-x border-b shadow-sm overflow-hidden">
            <div
              className="p-2 bg-gray-50 border-t flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={toggleDetail}
            >
              <span className="text-xs font-medium text-gray-600">Detail Dompet</span>
              <ChevronDown 
                className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isDetailOpen ? "" : "rotate-180"}`} 
              />
            </div>

            <div className={`overflow-hidden transition-all duration-300 ${isDetailOpen ? "h-auto" : "h-0"}`}>
              <div className="p-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                        Dompet
                      </th>
                      <th
                        scope="col"
                        className="px-2 py-2 text-right text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-50"
                        onClick={() => requestSort("percentage")}
                      >
                        % {sortConfig?.key === "percentage" && (sortConfig.direction === "ascending" ? "↑" : "↓")}
                      </th>
                      <th
                        scope="col"
                        className="px-2 py-2 text-right text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-50"
                        onClick={() => requestSort("saldo")}
                      >
                        Nominal {sortConfig?.key === "saldo" && (sortConfig.direction === "ascending" ? "↑" : "↓")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedWallets.map((wallet, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: wallet.color }}></div>
                            <div className="text-sm text-gray-700">{wallet.name}</div>
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-right">
                          <span className="text-xs text-gray-600">{wallet.percentage.toFixed(1)}%</span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                          {formatCurrency(wallet.saldo)}
                        </td>
                      </tr>
                    ))}
                    {/* Baris total */}
                    <tr className="border-t border-gray-300 font-medium bg-gray-50">
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-800">Total</div>
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-right">
                        <span className="text-xs text-gray-800">100%</span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-right text-gray-800">
                        {formatCurrency(totalBalance)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}
