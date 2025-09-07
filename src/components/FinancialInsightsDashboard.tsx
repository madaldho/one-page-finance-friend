import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Calendar,
  PieChart,
  BarChart3,
  Wallet,
  Receipt,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

interface FinancialInsight {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  savingsRate: number;
  topExpenseCategory: string;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expense: number;
    net: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  budgetProgress: Array<{
    category: string;
    budgeted: number;
    spent: number;
    percentage: number;
    status: 'safe' | 'warning' | 'over';
  }>;
  upcomingBills: Array<{
    name: string;
    amount: number;
    dueDate: string;
    status: 'due' | 'overdue' | 'upcoming';
  }>;
  financialGoals: Array<{
    name: string;
    target: number;
    current: number;
    percentage: number;
    targetDate: string;
  }>;
}

interface FinancialInsightsDashboardProps {
  className?: string;
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function FinancialInsightsDashboard({ className }: FinancialInsightsDashboardProps) {
  const { user } = useAuth();
  const [insights, setInsights] = useState<FinancialInsight>({
    totalIncome: 0,
    totalExpense: 0,
    netIncome: 0,
    savingsRate: 0,
    topExpenseCategory: '',
    monthlyTrend: [],
    categoryBreakdown: [],
    budgetProgress: [],
    upcomingBills: [],
    financialGoals: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'1m' | '3m' | '6m' | '1y'>('3m');

  useEffect(() => {
    if (user) {
      fetchFinancialInsights();
    }
  }, [user, selectedPeriod]);

  const fetchFinancialInsights = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const periods = {
        '1m': 1,
        '3m': 3,
        '6m': 6,
        '1y': 12
      };
      
      const monthsBack = periods[selectedPeriod];
      const startDate = startOfMonth(subMonths(new Date(), monthsBack - 1));
      const endDate = endOfMonth(new Date());

      // Fetch transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (name, color),
          wallets (name)
        `)
        .eq('user_id', user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (transError) throw transError;

      // Fetch budgets
      const { data: budgets, error: budgetError } = await supabase
        .from('budgets')
        .select(`
          *,
          categories (name)
        `)
        .eq('user_id', user.id)
        .gte('start_date', format(startDate, 'yyyy-MM-dd'))
        .lte('end_date', format(endDate, 'yyyy-MM-dd'));

      if (budgetError) throw budgetError;

      // Fetch savings goals
      const { data: goals, error: goalsError } = await supabase
        .from('savings')
        .select('*')
        .eq('user_id', user.id);

      if (goalsError) throw goalsError;

      // Process data
      const processedInsights = processFinancialData(
        transactions || [], 
        budgets || [], 
        goals || [],
        startDate,
        endDate
      );
      
      setInsights(processedInsights);
    } catch (error) {
      console.error('Error fetching financial insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const processFinancialData = (
    transactions: any[], 
    budgets: any[], 
    goals: any[],
    startDate: Date,
    endDate: Date
  ): FinancialInsight => {
    // Calculate totals
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netIncome = income - expense;
    const savingsRate = income > 0 ? ((netIncome / income) * 100) : 0;

    // Monthly trend
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const monthlyTrend = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = transactions.filter(t => {
        const transDate = new Date(t.date);
        return transDate >= monthStart && transDate <= monthEnd;
      });
      
      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        month: format(month, 'MMM yyyy'),
        income: monthIncome,
        expense: monthExpense,
        net: monthIncome - monthExpense
      };
    });

    // Category breakdown
    const categoryMap = new Map<string, number>();
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const categoryName = t.categories?.name || 'Lainnya';
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + t.amount);
      });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([name, amount], index) => ({
        name,
        amount,
        percentage: expense > 0 ? (amount / expense) * 100 : 0,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    const topExpenseCategory = categoryBreakdown[0]?.name || '';

    // Budget progress
    const budgetProgress = budgets.map(budget => {
      const categoryExpenses = transactions
        .filter(t => t.type === 'expense' && t.category_id === budget.category_id)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percentage = budget.amount > 0 ? (categoryExpenses / budget.amount) * 100 : 0;
      
      let status: 'safe' | 'warning' | 'over' = 'safe';
      if (percentage > 100) status = 'over';
      else if (percentage > 80) status = 'warning';
      
      return {
        category: budget.categories?.name || 'Unknown',
        budgeted: budget.amount,
        spent: categoryExpenses,
        percentage: Math.min(percentage, 100),
        status
      };
    });

    // Financial goals
    const financialGoals = goals.map(goal => ({
      name: goal.name,
      target: goal.target_amount,
      current: goal.current_amount,
      percentage: goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0,
      targetDate: goal.target_date || ''
    }));

    // Mock upcoming bills (in real app, this would come from a bills table)
    const upcomingBills = [
      {
        name: 'Tagihan Listrik',
        amount: 150000,
        dueDate: '2024-01-15',
        status: 'upcoming' as const
      },
      {
        name: 'Internet',
        amount: 300000,
        dueDate: '2024-01-20',
        status: 'due' as const
      }
    ];

    return {
      totalIncome: income,
      totalExpense: expense,
      netIncome,
      savingsRate,
      topExpenseCategory,
      monthlyTrend,
      categoryBreakdown,
      budgetProgress,
      upcomingBills,
      financialGoals
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Wawasan Keuangan</h2>
        <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
          <TabsList>
            <TabsTrigger value="1m">1 Bulan</TabsTrigger>
            <TabsTrigger value="3m">3 Bulan</TabsTrigger>
            <TabsTrigger value="6m">6 Bulan</TabsTrigger>
            <TabsTrigger value="1y">1 Tahun</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pemasukan</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(insights.totalIncome)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(insights.totalExpense)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Keuntungan Bersih</p>
                <p className={`text-2xl font-bold ${insights.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(insights.netIncome)}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${insights.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tingkat Tabungan</p>
                <p className="text-2xl font-bold text-blue-600">
                  {insights.savingsRate.toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="trends">Tren</TabsTrigger>
          <TabsTrigger value="budgets">Anggaran</TabsTrigger>
          <TabsTrigger value="goals">Target</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Breakdown Pengeluaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={insights.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {insights.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Kategori Teratas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.categoryBreakdown.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(category.amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {category.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tren Bulanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insights.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="income" fill="#10b981" name="Pemasukan" />
                    <Bar dataKey="expense" fill="#ef4444" name="Pengeluaran" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Progress Anggaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.budgetProgress.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada anggaran yang ditetapkan</p>
                    <p className="text-sm">Buat anggaran untuk mulai melacak pengeluaran Anda</p>
                  </div>
                ) : (
                  insights.budgetProgress.map((budget, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{budget.category}</span>
                          <Badge 
                            variant={
                              budget.status === 'safe' ? 'default' : 
                              budget.status === 'warning' ? 'secondary' : 'destructive'
                            }
                          >
                            {budget.status === 'safe' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {budget.status === 'warning' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {budget.status === 'over' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {budget.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.budgeted)}
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(budget.percentage, 100)} 
                        className="h-2"
                      />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Target Keuangan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.financialGoals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada target keuangan</p>
                    <p className="text-sm">Tetapkan target untuk mencapai tujuan finansial Anda</p>
                  </div>
                ) : (
                  insights.financialGoals.map((goal, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{goal.name}</span>
                          {goal.targetDate && (
                            <div className="text-sm text-muted-foreground">
                              Target: {format(new Date(goal.targetDate), 'dd MMM yyyy')}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {goal.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress value={Math.min(goal.percentage, 100)} className="h-2" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}