import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'
import { ChevronLeft, Loader2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import Layout from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'

type Category = Database['public']['Tables']['categories']['Row']

const formSchema = z.object({
  name: z.string().min(1, 'Nama kategori harus diisi'),
  type: z.enum(['income', 'expense']),
  color: z.string().min(1, 'Warna harus dipilih'),
  icon: z.string().min(1, 'Icon harus dipilih'),
})

const icons = [
  { value: 'dollar', label: 'Dollar' },
  { value: 'shopping-cart', label: 'Shopping Cart' },
  { value: 'car', label: 'Car' },
  { value: 'home', label: 'Home' },
  { value: 'utensils', label: 'Food' },
  { value: 'graduation-cap', label: 'Education' },
  { value: 'heart', label: 'Health' },
  { value: 'gamepad', label: 'Entertainment' },
  { value: 'gift', label: 'Gift' },
  { value: 'plane', label: 'Travel' },
  { value: 'briefcase', label: 'Work' },
  { value: 'bus', label: 'Transport' },
  { value: 'tshirt', label: 'Clothing' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'calendar', label: 'Events' },
  { value: 'piggy-bank', label: 'Saving' },
  { value: 'credit-card', label: 'Credit Card' },
  { value: 'money-bill', label: 'Money' },
  { value: 'hand-holding-usd', label: 'Income' },
  { value: 'shopping-bag', label: 'Shopping' },
  { value: 'medkit', label: 'Medical' },
  { value: 'book', label: 'Education' },
  { value: 'mobile-alt', label: 'Mobile' },
  { value: 'wifi', label: 'Internet' },
  { value: 'university', label: 'Bank' },
]

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function CategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [success, setSuccess] = useState(false);

  const isEditing = !!id;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'expense' as const,
      color: '#6E59A5',
      icon: 'dollar',
    },
  });

  const selectedIcon = form.watch('icon');
  const selectedColor = form.watch('color');
  const selectedType = form.watch('type');

  useEffect(() => {
    if (isEditing && id) {
      fetchCategory(id);
    }
  }, [id]);

  const fetchCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      if (data) {
        setCategory(data);
        form.reset({
          name: data.name,
          type: data.type as 'income' | 'expense',
          color: data.color || '#6E59A5',
          icon: data.icon || 'dollar',
        });
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      toast({
        title: 'Gagal memuat kategori',
        description: 'Kategori tidak ditemukan',
        variant: 'destructive',
      });
      navigate('/categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submitError) {
      setSubmitError(null);
    }
  }, [form.watch(), submitError]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      const userData = await supabase.auth.getUser();
      if (!userData.data.user) {
        throw new Error('User not found');
      }

      const userId = userData.data.user.id;
      
      const data = {
        name: values.name,
        type: values.type,
        color: values.color,
        icon: values.icon,
        user_id: userId,
      };

      let result;

      if (isEditing && id) {
        const { data: updatedData, error } = await supabase
          .from('categories')
          .update(data)
          .eq('id', id)
          .select('*')
          .single();
        
        if (error) {
          console.error('Error updating category:', error);
          throw new Error(error.message);
        }
        
        result = updatedData;
      } else {
        const newCategoryData = {
          id: generateUUID(),
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: newData, error } = await supabase
          .from('categories')
          .insert(newCategoryData)
          .select('*')
          .single();
        
        if (error) {
          console.error('Error creating category:', error);
          throw new Error(error.message);
        }
        
        result = newData;
      }

      setSuccess(true);

      toast({
        title: 'Berhasil',
        description: `Kategori "${result.name}" berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}`,
      });
      
      // Redirect setelah 1.5 detik agar user bisa melihat pesan sukses
      setTimeout(() => {
        navigate('/categories');
      }, 1500);
      
    } catch (error: unknown) {
      console.error('Error saving category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan kategori';
      setSubmitError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const colors = [
    '#6E59A5', // Purple
    '#4CAF50', // Green
    '#F44336', // Red
    '#2196F3', // Blue
    '#FF9800', // Orange
    '#009688', // Teal
    '#E91E63', // Pink
    '#FF5722', // Deep Orange
    '#607D8B', // Blue Grey
    '#9E9E9E', // Grey
    '#3F51B5', // Indigo
    '#CDDC39', // Lime
  ];

  return (
    <Layout>
      <div className="container mx-auto py-2 px-2 md:px-6 max-w-lg pt-6 md:pt-4">
        {/* Header dengan glassmorphism effect */}
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md border border-white/30"
              onClick={() => navigate('/categories')}
              aria-label="Kembali"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">{isEditing ? 'Edit Kategori' : 'Tambah Kategori'}</h1>
              <p className="text-xs text-gray-500">Form kategori transaksi</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            <p className="mt-4 text-muted-foreground">Memuat data kategori...</p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center justify-center py-12 bg-card rounded-lg">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Berhasil!</h3>
            <p className="text-muted-foreground text-center mb-4">
              Kategori telah berhasil {isEditing ? 'diperbarui' : 'ditambahkan'}. 
              Kembali ke halaman kategori...
            </p>
          </div>
        ) : (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20">
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: selectedColor }}
            >
              <i className={`fas fa-${selectedIcon} text-lg`}></i>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">
                {form.watch('name') || 'Nama Kategori'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {selectedType === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                        <FormLabel className="text-sm font-medium">Nama Kategori</FormLabel>
                  <FormControl>
                          <Input 
                            placeholder="Masukkan nama kategori" 
                            {...field} 
                            className="h-9 rounded-md"
                          />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                        <FormLabel className="text-sm font-medium">Tipe</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                            <SelectTrigger className="h-9 rounded-md">
                        <SelectValue placeholder="Pilih tipe kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                            <SelectItem value="income" className="flex items-center text-sm">
                        <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>Pemasukan</span>
                        </div>
                      </SelectItem>
                            <SelectItem value="expense" className="flex items-center text-sm">
                        <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span>Pengeluaran</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
  </div>

        <Card className="p-4">
                <h3 className="font-medium text-sm mb-4">Kustomisasi</h3>
                <div className="space-y-5">
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                        <FormLabel className="text-sm font-medium">Warna</FormLabel>
                  <FormControl>
                          <div className="space-y-3">                            
                            <div className="grid grid-cols-6 gap-2">
                              {colors.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className={cn(
                                    "w-full aspect-square rounded-full border-2", 
                                    color === field.value ? "border-black shadow-sm" : "border-transparent"
                                  )}
                                  style={{ backgroundColor: color }}
                                  onClick={() => field.onChange(color)}
                                  aria-label={`Pilih warna ${color}`}
                                />
                              ))}
                            </div>
                            
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="color" 
                        {...field} 
                                className="w-8 h-8 p-0.5 rounded-md cursor-pointer"
                                title="Pilih warna kustom"
                      />
                      <Input 
                        type="text" 
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                                className="flex-1 h-8 text-xs"
                        placeholder="#000000"
                      />
                            </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                        <FormLabel className="text-sm font-medium">Icon</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                            <SelectTrigger className="h-9">
                        <SelectValue placeholder="Pilih icon">
                                <span className="flex items-center gap-2 text-sm">
                                  <i className={`fas fa-${field.value} text-sm`}></i>
                            {icons.find(i => i.value === field.value)?.label}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[200px]">
                            <div className="grid grid-cols-2 gap-1 p-1">
                      {icons.map((icon) => (
                                <SelectItem key={icon.value} value={icon.value} className="text-sm p-2">
                          <span className="flex items-center gap-2">
                                    <i className={`fas fa-${icon.value} text-xs`}></i>
                                    <span className="text-xs">{icon.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                            </div>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {submitError && (
                <div className="text-red-500 text-sm p-3 bg-red-50 rounded-md border border-red-200">
                  {submitError}
          </div>
        )}

              <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
                  onClick={() => navigate('/categories')}
            type="button"
                  className="flex-1"
                  disabled={submitting}
          >
            Batal
          </Button>
          <Button 
            type="submit" 
                  disabled={submitting}
            className={cn(
                    "flex-1",
                    submitting && "opacity-80"
            )}
          >
                  {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                      {isEditing ? 'Memperbarui...' : 'Menyimpan...'}
              </span>
                  ) : isEditing ? (
              'Perbarui'
            ) : (
                    'Simpan'
            )}
          </Button>
        </div>
      </form>
    </Form>
        )}
      </div>
    </Layout>
  );
}
