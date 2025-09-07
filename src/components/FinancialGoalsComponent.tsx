import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Target,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from './ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from './ui/form';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CurrencyInput } from './ui/currency-input';

const goalSchema = z.object({
  name: z.string().min(1, 'Nama target harus diisi'),
  target_amount: z.number().positive('Target harus lebih dari 0'),
  current_amount: z.number().min(0, 'Jumlah saat ini tidak boleh negatif').default(0),
  target_date: z.date().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
});

type GoalFormData = z.infer<typeof goalSchema>;

interface FinancialGoal extends GoalFormData {
  id: string;
  user_id: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

const GOAL_CATEGORIES = [
  { value: 'emergency', label: 'Dana Darurat', color: '#ef4444' },
  { value: 'vacation', label: 'Liburan', color: '#3b82f6' },
  { value: 'education', label: 'Pendidikan', color: '#6366f1' },
  { value: 'house', label: 'Rumah', color: '#10b981' },
  { value: 'car', label: 'Kendaraan', color: '#f59e0b' },
  { value: 'business', label: 'Bisnis', color: '#8b5cf6' },
  { value: 'retirement', label: 'Pensiun', color: '#84cc16' },
  { value: 'investment', label: 'Investasi', color: '#06b6d4' },
  { value: 'other', label: 'Lainnya', color: '#6b7280' }
];

export function FinancialGoalsComponent() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      target_amount: 0,
      current_amount: 0,
      target_date: undefined,
      category: '',
      description: '',
      priority: 'medium'
    }
  });

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]); // fetchGoals is a stable function

  const fetchGoals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat target keuangan',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: GoalFormData) => {
    if (!user) return;

    try {
      setSaving(true);

      const goalData = {
        ...data,
        target_date: data.target_date ? format(data.target_date, 'yyyy-MM-dd') : null,
        user_id: user.id,
        status: 'active' as const
      };

      if (editingGoal) {
        const { error } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', editingGoal.id);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Target keuangan berhasil diperbarui'
        });
      } else {
        const { error } = await supabase
          .from('goals')
          .insert([goalData]);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Target keuangan berhasil ditambahkan'
        });
      }

      setDialogOpen(false);
      setEditingGoal(null);
      form.reset();
      fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan target keuangan',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    form.reset({
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      target_date: goal.target_date ? new Date(goal.target_date) : undefined,
      category: goal.category || '',
      description: goal.description || '',
      priority: goal.priority
    });
    setDialogOpen(true);
  };

  const handleDelete = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Target keuangan berhasil dihapus'
      });

      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus target keuangan',
        variant: 'destructive'
      });
    }
  };

  const updateGoalProgress = async (goalId: string, newAmount: number) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ current_amount: newAmount })
        .eq('id', goalId);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Progress target berhasil diperbarui'
      });

      fetchGoals();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui progress',
        variant: 'destructive'
      });
    }
  };

  const getGoalStatus = (goal: FinancialGoal) => {
    const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
    
    if (progress >= 100) return 'completed';
    if (goal.target_date && new Date(goal.target_date) < new Date()) return 'overdue';
    if (goal.target_date && new Date(goal.target_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) return 'due_soon';
    return 'on_track';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'overdue': return 'text-red-600';
      case 'due_soon': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'overdue': return AlertCircle;
      case 'due_soon': return Clock;
      default: return TrendingUp;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    if (filter === 'completed') return getGoalStatus(goal) === 'completed';
    return getGoalStatus(goal) !== 'completed';
  });

  const totalGoalsValue = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalSavedValue = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const overallProgress = totalGoalsValue > 0 ? (totalSavedValue / totalGoalsValue) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Target Keuangan</h2>
          <p className="text-muted-foreground">
            Pantau dan capai tujuan finansial Anda
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingGoal(null);
              form.reset();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Target
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? 'Edit Target Keuangan' : 'Tambah Target Baru'}
              </DialogTitle>
              <DialogDescription>
                Tetapkan target keuangan dan pantau progress Anda
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Target</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Dana Darurat" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Jumlah</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          placeholder="0"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah Saat Ini</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          placeholder="0"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GOAL_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioritas</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih prioritas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Rendah</SelectItem>
                          <SelectItem value="medium">Sedang</SelectItem>
                          <SelectItem value="high">Tinggi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Tanggal (Opsional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pilih tanggal target</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi (Opsional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Jelaskan tujuan dan rencana untuk mencapai target ini..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? (
                      <>Menyimpan...</>
                    ) : (
                      editingGoal ? 'Perbarui Target' : 'Buat Target'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={saving}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Target</p>
                <p className="text-2xl font-bold">
                  Rp {totalGoalsValue.toLocaleString('id-ID')}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Terkumpul</p>
                <p className="text-2xl font-bold text-green-600">
                  Rp {totalSavedValue.toLocaleString('id-ID')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progress Keseluruhan</p>
                <p className="text-2xl font-bold text-purple-600">
                  {overallProgress.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Semua ({goals.length})
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Aktif ({goals.filter(g => getGoalStatus(g) !== 'completed').length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Selesai ({goals.filter(g => getGoalStatus(g) === 'completed').length})
        </Button>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Belum ada target keuangan</h3>
            <p className="text-muted-foreground mb-4">
              Mulai tetapkan target untuk mencapai tujuan finansial Anda
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Buat Target Pertama
            </Button>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            const status = getGoalStatus(goal);
            const StatusIcon = getStatusIcon(status);
            const category = GOAL_CATEGORIES.find(c => c.value === goal.category);

            return (
              <Card key={goal.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      {category && (
                        <Badge variant="outline" className="mt-1">
                          {category.label}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={getPriorityColor(goal.priority)}>
                        {goal.priority === 'high' ? 'Tinggi' : 
                         goal.priority === 'medium' ? 'Sedang' : 'Rendah'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(goal)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => handleDelete(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <div className={`flex items-center gap-1 ${getStatusColor(status)}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="font-medium">{Math.min(progress, 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span>Rp {goal.current_amount.toLocaleString('id-ID')}</span>
                      <span className="text-muted-foreground">
                        Rp {goal.target_amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {goal.target_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Target: {format(new Date(goal.target_date), 'dd MMM yyyy')}</span>
                    </div>
                  )}

                  {goal.description && (
                    <p className="text-sm text-muted-foreground">
                      {goal.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const newAmount = prompt(
                          'Masukkan jumlah progress baru:',
                          goal.current_amount.toString()
                        );
                        if (newAmount && !isNaN(Number(newAmount))) {
                          updateGoalProgress(goal.id, Number(newAmount));
                        }
                      }}
                    >
                      Update Progress
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}