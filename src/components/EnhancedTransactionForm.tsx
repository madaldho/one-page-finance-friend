import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from './ui/card';
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
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CalendarIcon, Loader2, Plus, Sparkles, X } from 'lucide-react';
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
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getSmartCategorySuggestions, 
  getCategoryIcon, 
  createCategoryFromSuggestion,
  CategorySuggestion 
} from '@/utils/categoryUtils';
import { CurrencyInput } from './ui/currency-input';

const transactionSchema = z.object({
  title: z.string().min(1, 'Judul transaksi harus diisi'),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  type: z.enum(['income', 'expense']),
  date: z.date(),
  categoryId: z.string().min(1, 'Kategori harus dipilih'),
  walletId: z.string().min(1, 'Dompet harus dipilih'),
  description: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string;
  color?: string;
}

interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: string;
  color?: string;
}

interface EnhancedTransactionFormProps {
  transactionId?: string;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
  defaultType?: 'income' | 'expense';
}

export function EnhancedTransactionForm({
  transactionId,
  onSubmitSuccess,
  onCancel,
  defaultType = 'expense'
}: EnhancedTransactionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<CategorySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [creatingCategory, setCreatingCategory] = useState(false);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      title: '',
      amount: 0,
      type: defaultType,
      date: new Date(),
      categoryId: '',
      walletId: '',
      description: '',
    },
  });

  const watchedTitle = form.watch('title');
  const watchedAmount = form.watch('amount');
  const watchedType = form.watch('type');

  // Generate smart suggestions when title or amount changes
  const suggestions = useMemo(() => {
    if (!watchedTitle || watchedTitle.length < 3) return [];
    return getSmartCategorySuggestions(watchedTitle, watchedAmount, watchedType);
  }, [watchedTitle, watchedAmount, watchedType]);

  useEffect(() => {
    setSmartSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  }, [suggestions]);

  useEffect(() => {
    fetchInitialData();
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  const fetchInitialData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, type, icon, color')
        .eq('user_id', user?.id)
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('id, name, balance, type, color')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (walletsError) throw walletsError;
      setWallets(walletsData || []);

      // Set default wallet if available
      if (walletsData && walletsData.length > 0) {
        const defaultWallet = walletsData.find(w => w.is_default) || walletsData[0];
        form.setValue('walletId', defaultWallet.id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data awal',
        variant: 'destructive',
      });
    }
  };

  const fetchTransaction = async () => {
    if (!transactionId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) throw error;

      if (data) {
        form.reset({
          title: data.title,
          amount: data.amount,
          type: data.type as 'income' | 'expense',
          date: new Date(data.date),
          categoryId: data.category_id || '',
          walletId: data.wallet_id,
          description: data.description || '',
        });
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data transaksi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (suggestion: CategorySuggestion) => {
    if (!user) return;

    try {
      setCreatingCategory(true);
      const newCategory = await createCategoryFromSuggestion(
        suggestion,
        user.id,
        supabase
      );

      // Add to local categories and select it
      setCategories(prev => [...prev, newCategory]);
      form.setValue('categoryId', newCategory.id);
      setShowSuggestions(false);

      toast({
        title: 'Kategori Dibuat',
        description: `Kategori "${suggestion.name}" berhasil dibuat dan dipilih`,
      });
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: 'Gagal membuat kategori baru',
        variant: 'destructive',
      });
    } finally {
      setCreatingCategory(false);
    }
  };

  const onSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true);

      const transactionData = {
        title: data.title,
        amount: data.amount,
        type: data.type,
        date: format(data.date, 'yyyy-MM-dd'),
        category_id: data.categoryId,
        wallet_id: data.walletId,
        description: data.description || null,
        user_id: user?.id,
      };

      if (transactionId) {
        const { error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', transactionId);

        if (error) throw error;
        
        toast({
          title: 'Berhasil',
          description: 'Transaksi berhasil diperbarui',
        });
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert([transactionData]);

        if (error) throw error;
        
        toast({
          title: 'Berhasil',
          description: 'Transaksi berhasil ditambahkan',
        });
      }

      onSubmitSuccess?.();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan transaksi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat => cat.type === watchedType);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {transactionId ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Transaction Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Transaksi</FormLabel>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={field.value === 'income' ? 'default' : 'outline'}
                        onClick={() => field.onChange('income')}
                        className="flex-1"
                      >
                        Pemasukan
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'expense' ? 'default' : 'outline'}
                        onClick={() => field.onChange('expense')}
                        className="flex-1"
                      >
                        Pengeluaran
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Transaksi</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Makan siang di kantin"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah</FormLabel>
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

              {/* Smart Category Suggestions */}
              {showSuggestions && smartSuggestions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Saran Kategori Cerdas
                    </FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSuggestions(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {smartSuggestions.slice(0, 3).map((suggestion, index) => {
                      const IconComponent = getCategoryIcon(suggestion.icon);
                      const existingCategory = categories.find(cat => 
                        cat.name.toLowerCase() === suggestion.name.toLowerCase() && 
                        cat.type === suggestion.type
                      );

                      return (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          className="justify-start h-auto p-3"
                          onClick={() => {
                            if (existingCategory) {
                              form.setValue('categoryId', existingCategory.id);
                              setShowSuggestions(false);
                            } else {
                              handleCreateCategory(suggestion);
                            }
                          }}
                          disabled={creatingCategory}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div 
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: `${suggestion.color}20` }}
                            >
                              <IconComponent 
                                className="h-4 w-4" 
                                style={{ color: suggestion.color }}
                              />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{suggestion.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {suggestion.description}
                              </div>
                            </div>
                            {existingCategory ? (
                              <Badge variant="secondary" className="text-xs">
                                Pilih
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-xs">
                                <Plus className="h-3 w-3 mr-1" />
                                Buat
                              </Badge>
                            )}
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category Selection */}
              <FormField
                control={form.control}
                name="categoryId"
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
                        {filteredCategories.map((category) => {
                          const IconComponent = getCategoryIcon(category.icon || 'DollarSign');
                          return (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                {category.name}
                              </div>
                            </SelectItem>
                          );
                        })}
                        {filteredCategories.length === 0 && (
                          <SelectItem value="" disabled>
                            Tidak ada kategori {watchedType === 'income' ? 'pemasukan' : 'pengeluaran'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Wallet Selection */}
              <FormField
                control={form.control}
                name="walletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dompet</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih dompet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{wallet.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                Rp {wallet.balance.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal</FormLabel>
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
                              format(field.value, "PPP", { locale: { code: 'id' } })
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tambahkan catatan tentang transaksi ini..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {transactionId ? 'Perbarui' : 'Simpan'} Transaksi
                </Button>
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    Batal
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}