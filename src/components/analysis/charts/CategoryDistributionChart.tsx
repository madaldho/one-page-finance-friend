"use client"

import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Transaction, TransactionWithNames } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Category, Wallet } from '@/types';
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO } from "date-fns";
import { ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryDistributionChartProps {
  transactions: TransactionWithNames[];
  categories: Category[];
  wallets: Wallet[];
  dateRange?: DateRange;
}

export function CategoryDistributionChart({ 
  transactions, 
  categories, 
  wallets,
  dateRange
}: CategoryDistributionChartProps) {
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [viewType, setViewType] = useState<"category" | "wallet">("category");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null);
  const [detailsData, setDetailsData] = useState<Array<{
    name: string;
    value: number;
    color: string;
    percentage: string;
  }>>([]);

  const filteredTransactions = useMemo(() => {
    if (!dateRange || !dateRange.from) {
      return transactions;
    }

    return transactions.filter(transaction => {
      const transactionDate = parseISO(transaction.date);
      
      if (dateRange.to) {
        return isWithinInterval(transactionDate, {
          start: dateRange.from,
          end: dateRange.to
        });
      } else {
        const from = dateRange.from;
        return (
          transactionDate.getDate() === from.getDate() &&
          transactionDate.getMonth() === from.getMonth() &&
          transactionDate.getFullYear() === from.getFullYear()
        );
      }
    });
  }, [transactions, dateRange]);

  const chartData = useMemo(() => {
    // Daftar warna preset yang cerah dan berbeda untuk kategori
    const categoryColors = [
      "#FF6384", // Pink
      "#36A2EB", // Biru
      "#FFCE56", // Kuning
      "#4BC0C0", // Teal
      "#9966FF", // Ungu
      "#FF9F40", // Oranye
      "#2ECC71", // Hijau
      "#E74C3C", // Merah
      "#3498DB", // Biru Muda
      "#9B59B6", // Ungu Tua
      "#1ABC9C", // Turquoise
      "#F1C40F", // Kuning Tua
      "#E67E22", // Oranye Tua
      "#95A5A6", // Abu-abu
      "#34495E", // Navy
      "#7F8C8D", // Abu-abu Tua
      "#D35400", // Oranye Gelap
      "#27AE60", // Hijau Tua
      "#C0392B", // Merah Tua
      "#8E44AD"  // Ungu Gelap
    ];
    
    // Simpan indeks warna yang sudah digunakan
    const usedColorIndexes = new Set<number>();
    
    if (viewType === "category") {
      const dataMap = new Map<string, { value: number, color: string, id: string }>();
      let colorIndex = 0;
      
      filteredTransactions.forEach(transaction => {
        if (
          (activeTab === "expense" && transaction.type === "expense") || 
          (activeTab === "income" && transaction.type === "income")
        ) {
          const categoryName = transaction.category_name || "Lainnya";
          const categoryId = transaction.category_id || "";
          
          const category = categories.find(cat => cat.id === categoryId);
          
          // Jika kategori belum ada di dataMap, tentukan warnanya
          if (!dataMap.has(categoryName)) {
            let color;
            
            // Prioritas 1: Gunakan warna dari database jika tersedia
            if (category?.color) {
              color = category.color;
            } 
            // Prioritas 2: Gunakan warna preset yang belum digunakan
            else {
              // Cari indeks warna yang belum digunakan
              while (usedColorIndexes.has(colorIndex) && usedColorIndexes.size < categoryColors.length) {
                colorIndex = (colorIndex + 1) % categoryColors.length;
              }
              
              // Tambahkan ke daftar warna yang sudah digunakan
              usedColorIndexes.add(colorIndex);
              
              // Gunakan warna dari preset
              color = categoryColors[colorIndex];
              
              // Persiapkan untuk kategori berikutnya
              colorIndex = (colorIndex + 1) % categoryColors.length;
            }
            
            dataMap.set(categoryName, { value: 0, color, id: categoryId });
          }
          
          dataMap.set(categoryName, { 
            value: dataMap.get(categoryName)!.value + transaction.amount,
            color: dataMap.get(categoryName)!.color,
            id: categoryId
          });
        }
      });
      
      return Array.from(dataMap.entries())
        .map(([name, { value, color, id }]) => ({
          name,
          value,
          color,
          id
        }))
        .sort((a, b) => b.value - a.value);
    } else {
      // Daftar warna preset untuk dompet
      const walletColors = [
        "#4CAF50", // Hijau
        "#2196F3", // Biru
        "#FFC107", // Kuning
        "#9C27B0", // Ungu
        "#E91E63", // Pink
        "#F44336", // Merah
        "#00BCD4", // Biru Muda
        "#795548", // Coklat
        "#607D8B", // Biru Abu-abu
        "#FF5722", // Oranye Dalam
        "#CDDC39", // Hijau Lime
        "#673AB7", // Deep Purple
        "#3F51B5", // Indigo
        "#03A9F4", // Light Blue
        "#009688", // Teal
        "#8BC34A", // Light Green
        "#FFEB3B", // Yellow
        "#FF9800", // Orange
        "#9E9E9E", // Grey
        "#000000"  // Black
      ];
      
      const dataMap = new Map<string, { value: number, color: string, id: string }>();
      let colorIndex = 0;
      
      filteredTransactions.forEach(transaction => {
        if (
          (activeTab === "expense" && transaction.type === "expense") || 
          (activeTab === "income" && transaction.type === "income")
        ) {
          const walletName = transaction.wallet_name || "Lainnya";
          const walletId = transaction.wallet_id || "";
          
          const wallet = wallets.find(w => w.id === walletId);
          
          if (!dataMap.has(walletName)) {
            let color;
            
            // Prioritas 1: Gunakan warna dari database
            if (wallet?.color) {
              color = wallet.color;
            } 
            // Prioritas 2: Gunakan gradient dari wallet jika ada
            else if (wallet?.gradient) {
              // Ambil warna pertama dari gradient
              const gradientColors = wallet.gradient.split(',');
              color = gradientColors[0].trim();
            } 
            // Prioritas 3: Gunakan warna preset
            else {
              // Cari indeks warna yang belum digunakan
              while (usedColorIndexes.has(colorIndex) && usedColorIndexes.size < walletColors.length) {
                colorIndex = (colorIndex + 1) % walletColors.length;
              }
              
              // Tambahkan ke daftar warna yang sudah digunakan
              usedColorIndexes.add(colorIndex);
              
              // Gunakan warna dari preset
              color = walletColors[colorIndex];
              
              // Persiapkan untuk dompet berikutnya
              colorIndex = (colorIndex + 1) % walletColors.length;
            }
            
            dataMap.set(walletName, { value: 0, color, id: walletId });
          }
          
          dataMap.set(walletName, { 
            value: dataMap.get(walletName)!.value + transaction.amount,
            color: dataMap.get(walletName)!.color,
            id: walletId
          });
        }
      });
      
      return Array.from(dataMap.entries())
        .map(([name, { value, color, id }]) => ({
          name,
          value,
          color,
          id
        }))
        .sort((a, b) => b.value - a.value);
    }
  }, [filteredTransactions, categories, wallets, activeTab, viewType]);

  const totalAmount = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  useEffect(() => {
    if (chartData.length > 0) {
      const details = chartData.map(item => ({
        name: item.name,
        value: item.value,
        color: item.color,
        percentage: totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(1) : "0"
      }));
      
      setDetailsData(details);
    }
  }, [chartData, totalAmount]);

  const sortedDetailsData = useMemo(() => {
    const sortableItems = [...detailsData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === "percentage") {
          const aPercentage = Number.parseFloat(a.percentage);
          const bPercentage = Number.parseFloat(b.percentage);
          
          if (aPercentage < bPercentage) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (aPercentage > bPercentage) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        } else if (sortConfig.key === "value") {
          if (a.value < b.value) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (a.value > b.value) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [detailsData, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const toggleDetail = () => {
    setIsDetailOpen(!isDetailOpen);
  };

  const walletTypeTotals = useMemo(() => {
    if (viewType !== "wallet") return null;
    
    const result: Record<string, { income: number, expense: number }> = {};
    
    wallets.forEach(wallet => {
      const walletName = wallet.name;
      if (!result[walletName]) {
        result[walletName] = { income: 0, expense: 0 };
      }
    });
    
    filteredTransactions.forEach(transaction => {
      const walletName = transaction.wallet_name || "Lainnya";
      if (!result[walletName]) {
        result[walletName] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === "income") {
        result[walletName].income += transaction.amount;
      } else if (transaction.type === "expense") {
        result[walletName].expense += transaction.amount;
      }
    });
    
    return result;
  }, [filteredTransactions, wallets, viewType]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {activeTab === "expense" ? "Distribusi Pengeluaran" : "Distribusi Pemasukan"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">
            Belum ada data {activeTab === "expense" ? "pengeluaran" : "pemasukan"} untuk ditampilkan
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {activeTab === "expense" ? "Distribusi Pengeluaran" : "Distribusi Pemasukan"}
          {viewType === "wallet" ? " per Dompet" : " per Kategori"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-t-lg overflow-hidden border shadow-sm">
            <div className="h-[350px] p-6">
              <div className="h-full flex flex-col">
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                  <Tabs
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as "expense" | "income")}
                  >
                    <TabsList className="bg-gray-100 p-1 rounded-md">
                      <TabsTrigger
                        value="income"
                        className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-sm font-medium transition-all"
                      >
                        Pemasukan
                      </TabsTrigger>
                      <TabsTrigger
                        value="expense"
                        className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-sm font-medium transition-all"
                      >
                        Pengeluaran
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Select
                    value={viewType}
                    onValueChange={(value) => setViewType(value as "category" | "wallet")}
                  >
                    <SelectTrigger className="w-[140px] bg-gray-50 border border-gray-200 shadow-sm hover:bg-gray-100 transition-all duration-200 rounded-md text-xs font-medium text-gray-700 h-8 px-2">
                      <SelectValue placeholder="Tampilan" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-md rounded-md p-1 overflow-hidden">
                      <SelectItem
                        value="category"
                        className="rounded text-xs my-0.5 pl-6 pr-2 py-1 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900 relative"
                      >
                        <span className="block">Kategori</span>
                      </SelectItem>
                      <SelectItem
                        value="wallet"
                        className="rounded text-xs my-0.5 pl-6 pr-2 py-1 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900 relative"
                      >
                        <span className="block">Dompet</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex-1 min-h-[250px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={({ viewBox }) => Math.min(viewBox.width, viewBox.height) / 3}
                          innerRadius={({ viewBox }) => Math.min(viewBox.width, viewBox.height) / 4.5}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          paddingAngle={2}
                          onClick={(data) => {
                            const clickedItem = chartData.find(item => item.name === data.name);
                            if (clickedItem) {
                              const isAlreadySelected = detailsData.length === 1 && detailsData[0].name === clickedItem.name;
                              
                              if (isAlreadySelected) {
                                const allDetails = chartData.map(item => ({
                                  name: item.name,
                                  value: item.value,
                                  color: item.color,
                                  percentage: totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(1) : "0"
                                }));
                                setDetailsData(allDetails);
                              } else {
                                setDetailsData([{
                                  name: clickedItem.name,
                                  value: clickedItem.value,
                                  color: clickedItem.color,
                                  percentage: totalAmount > 0 ? ((clickedItem.value / totalAmount) * 100).toFixed(1) : "0"
                                }]);
                              }
                              
                              if (!isDetailOpen) {
                                setIsDetailOpen(true);
                              }
                            }
                          }}
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="none"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            const percentage = ((value / totalAmount) * 100).toFixed(1);
                            return [
                              `${formatCurrency(value)} (${percentage}%)`,
                              name
                            ];
                          }}
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                            border: "1px solid #eaeaea",
                            fontSize: "11px",
                            padding: "6px 10px"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-b-lg border-x border-b shadow-sm overflow-hidden">
            <div
              className="p-2 bg-gray-50 border-t flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={toggleDetail}
            >
              <span className="text-xs font-medium text-gray-600">
                {viewType === "category"
                  ? `Detail Kategori ${activeTab === "income" ? "Pemasukan" : "Pengeluaran"}`
                  : `Detail Dompet ${activeTab === "income" ? "Pemasukan" : "Pengeluaran"}`}
              </span>
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
                        {viewType === "category" ? "Kategori" : "Dompet"}
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
                        onClick={() => requestSort("value")}
                      >
                        Nominal {sortConfig?.key === "value" && (sortConfig.direction === "ascending" ? "↑" : "↓")}
                      </th>
                      {viewType === "wallet" && (
                        <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                          {activeTab === "income" ? "Total Pemasukan" : "Total Pengeluaran"}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDetailsData.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-2 h-2 rounded-full mr-2" 
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <div className="text-sm text-gray-700">{item.name}</div>
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-right">
                          <span className="text-xs text-gray-600">{item.percentage}%</span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                          {formatCurrency(item.value)}
                        </td>
                        {viewType === "wallet" && walletTypeTotals && (
                          <td className="px-2 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                            {formatCurrency(activeTab === "income" 
                              ? walletTypeTotals[item.name]?.income || 0
                              : walletTypeTotals[item.name]?.expense || 0
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
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
                        {formatCurrency(totalAmount)}
                      </td>
                      {viewType === "wallet" && (
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-right text-gray-800">
                          {formatCurrency(
                            Object.values(walletTypeTotals || {}).reduce(
                              (sum, data) => sum + (activeTab === "income" ? data.income : data.expense), 
                              0
                            )
                          )}
                        </td>
                      )}
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
