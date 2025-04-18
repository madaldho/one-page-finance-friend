
import React from 'react';
import { TrendingUp, TrendingDown, WalletIcon, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StatisticCardsProps {
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
  incomeTransactions: number;
  expenseTransactions: number;
}

export function StatisticCards({
  totalIncome,
  totalExpense,
  savingsRate,
  incomeTransactions,
  expenseTransactions
}: StatisticCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
            <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {incomeTransactions} transactions
          </p>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
            <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalExpense)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {expenseTransactions} transactions
          </p>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
              <WalletIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalIncome - totalExpense)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalIncome > totalExpense ? 'Surplus' : 'Deficit'}
          </p>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium text-muted-foreground">Savings Rate</CardTitle>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-full">
              <PieChart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{savingsRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs improvement'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
