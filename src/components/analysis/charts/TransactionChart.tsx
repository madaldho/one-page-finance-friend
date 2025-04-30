"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "@/types";
import { DateRange } from "react-day-picker";
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval, isSameDay, addDays } from "date-fns";
import { id } from "date-fns/locale";
import { TrendingUp, TrendingDown } from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps
} from "recharts";

// Definisikan TransactionWithNames karena tidak ada di types
interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  date: string;
  category_id?: string;
  wallet_id?: string;
}

interface TransactionWithNames extends Transaction {
  category_name?: string;
  wallet_name?: string;
}

interface TransactionChartProps {
  transactions: TransactionWithNames[];
  wallets: Wallet[];
  dateRange?: DateRange;
  formatCurrencyFn?: (amount: number) => string;
}

export function TransactionChart({ 
  transactions, 
  wallets, 
  dateRange,
  formatCurrencyFn 
}: TransactionChartProps) {
  const [localDateRange, setLocalDateRange] = useState<DateRange | undefined>(dateRange);

  // Listen for global date range changes
  useEffect(() => {
    // Update local date range when the component receives new props
    if (dateRange) {
      setLocalDateRange(dateRange);
    }
  }, [dateRange]);

  // Listen for global date range changes from event
  useEffect(() => {
    const handleGlobalDateRangeChange = (event: CustomEvent) => {
      if (event.detail) {
        setLocalDateRange({
          from: event.detail.from,
          to: event.detail.to,
        });
      }
    };

    window.addEventListener("globalDateRangeChanged", handleGlobalDateRangeChange as EventListener);

    return () => {
      window.removeEventListener("globalDateRangeChanged", handleGlobalDateRangeChange as EventListener);
    };
  }, []);

  // Use passed formatCurrency function or fallback to the imported one
  const formatCurrencyValue = formatCurrencyFn || formatCurrency;

  // Generate chart data from transactions
  const chartData = useMemo(() => {
    if (!localDateRange?.from) {
      // Default to last 30 days if no date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      // Create an array with 30 days
      const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
      });
      
      // Initialize data for each day
      const intervalData = days.map(day => ({
        date: format(day, "d MMM", { locale: id }),
        income: 0,
        expense: 0,
        balance: 0,
      }));
      
      // Aggregate transaction data by day
      transactions.forEach(transaction => {
        const transactionDate = parseISO(transaction.date);
        const dayIndex = days.findIndex(day => isSameDay(day, transactionDate));
        
        if (dayIndex !== -1) {
          if (transaction.type === "income") {
            intervalData[dayIndex].income += transaction.amount;
          } else if (transaction.type === "expense") {
            intervalData[dayIndex].expense += transaction.amount;
          }
        }
      });
      
      // Calculate running balance
      let runningBalance = wallets.reduce((total, wallet) => total + wallet.balance, 0);
      
      for (let i = intervalData.length - 1; i >= 0; i--) {
        intervalData[i].balance = runningBalance;
        runningBalance -= intervalData[i].income;
        runningBalance += intervalData[i].expense;
      }
      
      return intervalData;
    }

    // Ensure we have a valid date range
    const startDate = startOfDay(localDateRange.from);
    const endDate = localDateRange.to ? endOfDay(localDateRange.to) : endOfDay(localDateRange.from);

    // If the date range is too large, aggregate by week instead of by day
    const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const aggregateByWeek = daysDifference > 31;

    // Create an array of all days/weeks in the date range
    const intervals = aggregateByWeek
      ? eachDayOfInterval({
          start: startDate,
          end: endDate,
        }).filter((date, index) => index % 7 === 0) // Take every 7th day for weekly intervals
      : eachDayOfInterval({
          start: startDate,
          end: endDate,
        });

    // Initialize data for each interval
    const intervalData = intervals.map((intervalStart, index) => {
      const intervalEnd =
        aggregateByWeek && index < intervals.length - 1
          ? addDays(intervalStart, 6) // End of week
          : intervalStart; // Same day for daily aggregation

      const label = aggregateByWeek
        ? `${format(intervalStart, "d MMM", { locale: id })}`
        : format(intervalStart, "d MMM", { locale: id });

      return {
        date: label,
        income: 0,
        expense: 0,
        balance: 0,
      };
    });

    // Aggregate transaction data by interval
    transactions.forEach((transaction) => {
      const transactionDate = parseISO(transaction.date);

      // Find the appropriate interval
      const intervalIndex = intervals.findIndex((intervalStart, index) => {
        const intervalEnd = aggregateByWeek && index < intervals.length - 1
          ? addDays(intervalStart, 6)
          : intervalStart;
          
        return aggregateByWeek
          ? transactionDate >= intervalStart && transactionDate <= intervalEnd
          : isSameDay(intervalStart, transactionDate);
      });

      if (intervalIndex !== -1) {
        if (transaction.type === "income") {
          intervalData[intervalIndex].income += transaction.amount;
        } else if (transaction.type === "expense") {
          intervalData[intervalIndex].expense += transaction.amount;
        }
      }
    });

    // Calculate running balance
    let runningBalance = wallets.reduce((total, wallet) => total + wallet.balance, 0);

    // Adjust for transactions outside the date range
    const transactionsAfterEndDate = transactions.filter((t) => {
      const transactionDate = parseISO(t.date);
      return transactionDate > endDate;
    });

    transactionsAfterEndDate.forEach((t) => {
      if (t.type === "income") {
        runningBalance -= t.amount;
      } else if (t.type === "expense") {
        runningBalance += t.amount;
      }
    });

    // Calculate balance for each interval, starting from the end
    for (let i = intervalData.length - 1; i >= 0; i--) {
      intervalData[i].balance = runningBalance;
      runningBalance -= intervalData[i].income;
      runningBalance += intervalData[i].expense;
    }

    return intervalData;
  }, [localDateRange, transactions, wallets]);

  // Calculate summary data for footer
  const summaryData = useMemo(() => {
    if (chartData.length === 0) return null;

    const totalIncome = chartData.reduce((sum, item) => sum + item.income, 0);
    const totalExpense = chartData.reduce((sum, item) => sum + item.expense, 0);
    const netChange = totalIncome - totalExpense;
    const percentChange = totalIncome > 0 ? (netChange / totalIncome) * 100 : 0;
    const isPositive = netChange >= 0;

    return {
      totalIncome,
      totalExpense,
      netChange,
      percentChange,
      isPositive,
    };
  }, [chartData]);

  // Define chart colors
  const colors = {
    income: "#4ade80", // Green
    expense: "#ef4444", // Red
    balance: "#3b82f6", // Blue
  };

  // Custom tooltip untuk chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-md shadow-md border border-gray-100 text-xs">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}: {formatCurrencyValue(entry.value as number)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Jika tidak ada data, tampilkan pesan
  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="mb-4">Tidak ada data transaksi untuk periode ini</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full flex-1">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 5,
              left: -15,
              bottom: 10,
            }}
          >
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.income} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.income} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.expense} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.expense} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.balance} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.balance} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 10 }}
              height={30}
              minTickGap={5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              name="Pemasukan"
              stroke={colors.income}
              fill="url(#colorIncome)"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="Pengeluaran"
              stroke={colors.expense}
              fill="url(#colorExpense)"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="balance"
              name="Saldo"
              stroke={colors.balance}
              fill="url(#colorBalance)"
              fillOpacity={0.4}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center items-center gap-3 mt-2">
          <div className="flex items-center gap-1 text-xs">
            <div 
              className="w-2.5 h-2.5 rounded-sm" 
              style={{ backgroundColor: colors.income }}
            />
            <span>Pemasukan</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div 
              className="w-2.5 h-2.5 rounded-sm" 
              style={{ backgroundColor: colors.expense }}
            />
            <span>Pengeluaran</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div 
              className="w-2.5 h-2.5 rounded-sm" 
              style={{ backgroundColor: colors.balance }}
            />
            <span>Saldo</span>
          </div>
        </div>
        
        {summaryData && (
          <div className="mt-2 flex flex-col w-full text-xs">
            <div className="flex items-center gap-1 font-medium">
              {summaryData.isPositive ? (
                <>
                  <span>Tren positif {summaryData.percentChange.toFixed(1)}%</span>
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                </>
              ) : (
                <>
                  <span>Tren negatif {Math.abs(summaryData.percentChange).toFixed(1)}%</span>
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                </>
              )}
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-x-2">
              <span>Pemasukan: {formatCurrencyValue(summaryData.totalIncome)}</span>
              <span>Pengeluaran: {formatCurrencyValue(summaryData.totalExpense)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 