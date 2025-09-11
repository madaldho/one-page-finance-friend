import { useState, useEffect, useCallback } from 'react'
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
import { 
  ChevronLeft, 
  Loader2, 
  CheckCircle,
  DollarSign,
  ShoppingCart,
  Car,
  Home,
  Utensils,
  GraduationCap,
  Heart,
  Gamepad2,
  Gift,
  Plane,
  Briefcase,
  Bus,
  Shirt,
  Coffee,
  Calendar,
  PiggyBank,
  CreditCard,
  Banknote,
  HandHeart,
  ShoppingBag,
  Stethoscope,
  Book,
  Smartphone,
  Wifi,
  University,
  Sparkles,
  Zap,
  Building2,
  Plus,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import Layout from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Category = Database['public']['Tables']['categories']['Row']

const formSchema = z.object({
  name: z.string().min(1, 'Nama kategori harus diisi'),
  type: z.enum(['income', 'expense']),
  color: z.string().min(1, 'Warna harus dipilih'),
  icon: z.string().min(1, 'Icon harus dipilih'),
})

// Smart suggestions untuk kategori populer
const smartSuggestions = {
  expense: [
    { name: 'Makanan & Minuman', icon: 'Utensils', color: '#FF6B6B' },
    { name: 'Transport', icon: 'Car', color: '#4ECDC4' },
    { name: 'Belanja', icon: 'ShoppingBag', color: '#45B7D1' },
    { name: 'Rumah Tangga', icon: 'Home', color: '#96CEB4' },
    { name: 'Kesehatan', icon: 'Heart', color: '#FFEAA7' },
    { name: 'Pendidikan', icon: 'GraduationCap', color: '#DDA0DD' },
    { name: 'Hiburan', icon: 'Gamepad2', color: '#FFB347' },
    { name: 'Kopi & Cafe', icon: 'Coffee', color: '#8B4513' },
    { name: 'Pakaian', icon: 'Shirt', color: '#FF69B4' },
    { name: 'Internet & Pulsa', icon: 'Wifi', color: '#00CED1' },
    { name: 'Listrik & Utilitas', icon: 'Zap', color: '#FFD700' },
    { name: 'Bensin', icon: 'Car', color: '#FF4500' },
    { name: 'Olahraga', icon: 'Heart', color: '#32CD32' },
    { name: 'Hadiah', icon: 'Gift', color: '#FF1493' },
    { name: 'Perjalanan', icon: 'Plane', color: '#87CEEB' }
  ],
  income: [
    { name: 'Gaji', icon: 'Briefcase', color: '#2ECC71' },
    { name: 'Bonus', icon: 'Gift', color: '#F39C12' },
    { name: 'Investasi', icon: 'DollarSign', color: '#E74C3C' },
    { name: 'Freelance', icon: 'Briefcase', color: '#9B59B6' },
    { name: 'Bisnis', icon: 'Building2', color: '#34495E' },
    { name: 'Dividen', icon: 'DollarSign', color: '#16A085' },
    { name: 'Bunga Bank', icon: 'PiggyBank', color: '#27AE60' },
    { name: 'Penjualan', icon: 'ShoppingBag', color: '#E67E22' },
    { name: 'Komisi', icon: 'CreditCard', color: '#8E44AD' },
    { name: 'Honorarium', icon: 'Book', color: '#2980B9' }
  ]
}

const icons = [
  { value: 'DollarSign', label: 'Dollar', component: DollarSign },
  { value: 'ShoppingCart', label: 'Shopping Cart', component: ShoppingCart },
  { value: 'Car', label: 'Car', component: Car },
  { value: 'Home', label: 'Home', component: Home },
  { value: 'Utensils', label: 'Food', component: Utensils },
  { value: 'GraduationCap', label: 'Education', component: GraduationCap },
  { value: 'Heart', label: 'Health', component: Heart },
  { value: 'Gamepad2', label: 'Entertainment', component: Gamepad2 },
  { value: 'Gift', label: 'Gift', component: Gift },
  { value: 'Plane', label: 'Travel', component: Plane },
  { value: 'Briefcase', label: 'Work', component: Briefcase },
  { value: 'Bus', label: 'Transport', component: Bus },
  { value: 'Shirt', label: 'Clothing', component: Shirt },
  { value: 'Coffee', label: 'Coffee', component: Coffee },
  { value: 'Calendar', label: 'Events', component: Calendar },
  { value: 'PiggyBank', label: 'Saving', component: PiggyBank },
  { value: 'CreditCard', label: 'Credit Card', component: CreditCard },
  { value: 'Banknote', label: 'Money', component: Banknote },
  { value: 'HandHeart', label: 'Income', component: HandHeart },
  { value: 'ShoppingBag', label: 'Shopping', component: ShoppingBag },
  { value: 'Stethoscope', label: 'Medical', component: Stethoscope },
  { value: 'Book', label: 'Education', component: Book },
  { value: 'Smartphone', label: 'Mobile', component: Smartphone },
  { value: 'Wifi', label: 'Internet', component: Wifi },
  { value: 'University', label: 'Bank', component: University },
  { value: 'Zap', label: 'Electric', component: Zap },
  { value: 'Building2', label: 'Building', component: Building2 },
]

// Warna preset yang sama dengan wallet form
const CATEGORY_COLORS = [
  "#6E59A5", // Purple
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Orange
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#64748b", // Slate
  "#000000", // Black
]

export function CategoryForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [success, setSuccess] = useState(false)
  const [creationMode, setCreationMode] = useState<'suggestions' | 'manual' | null>(null)
  const [customColor, setCustomColor] = useState("#6E59A5")

  const isEditing = !!id

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'expense' as const,
      color: '#6E59A5',
      icon: 'DollarSign',
    },
  })

  const selectedIcon = form.watch('icon')
  const selectedColor = form.watch('color')
  const selectedType = form.watch('type')
  const watchName = form.watch('name')

  const fetchCategory = useCallback(async (categoryId: string) => {
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
          icon: data.icon || 'DollarSign',
        });
        
        // Set custom color if not in preset
        if (data.color && !CATEGORY_COLORS.includes(data.color)) {
          setCustomColor(data.color);
        }
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
  }, [form, toast, navigate]);

  useEffect(() => {
    if (isEditing && id) {
      fetchCategory(id);
    } else {
      // If creating new, don't show creation mode selection for editing
      setCreationMode(null);
    }
  }, [id, isEditing, fetchCategory]);

  const formValues = form.watch();
  useEffect(() => {
    if (submitError) {
      setSubmitError(null);
    }
  }, [formValues, submitError]);

  // Helper function to get icon component
  const getIconComponent = (iconName: string) => {
    const iconData = icons.find(i => i.value === iconName);
    return iconData?.component || DollarSign;
  };

  // Handle smart suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    form.setValue('name', suggestion.name);
    form.setValue('color', suggestion.color);
    form.setValue('icon', suggestion.icon);
    setCreationMode('manual'); // Switch to manual mode for customization
  };

  // Handle color change
  const handleColorChange = (color: string) => {
    form.setValue('color', color);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      // Debug: Check auth status
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.user) {
        throw new Error('Anda tidak terautentikasi. Silakan login ulang.');
      }

      const userId = session.user.id;
      console.log('🔍 Debug - User ID:', userId);
      
      let result;

      if (isEditing && id) {
        // Update existing category
        const updateData: Database['public']['Tables']['categories']['Update'] = {
          name: values.name,
          type: values.type,
          color: values.color === 'custom' ? customColor : values.color,
          icon: values.icon,
          updated_at: new Date().toISOString(),
        };

        console.log('🔍 Debug - Update data:', updateData);

        const { data: updatedData, error } = await supabase
          .from('categories')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', userId) // Ensure user owns the category
          .select('*')
          .single();
        
        if (error) {
          console.error('❌ Error updating category:', error);
          throw new Error(`Gagal memperbarui kategori: ${error.message}`);
        }
        
        result = updatedData;
      } else {
        // Create new category - database akan auto-generate id dengan gen_random_uuid()
        const insertData: Database['public']['Tables']['categories']['Insert'] = {
          name: values.name.trim(),
          type: values.type,
          color: values.color === 'custom' ? customColor : values.color,
          icon: values.icon,
          user_id: userId,
          // id tidak disertakan, biarkan database auto-generate
          // sort_order tidak disertakan, akan menggunakan DEFAULT 0
        };

        console.log('🔍 Debug - Insert data:', insertData);

        // Coba insert dengan handling error yang lebih detail
        const { data: newData, error } = await supabase
          .from('categories')
          .insert(insertData)
          .select('*');
        
        if (error) {
          console.error('❌ Database error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          
          // Handle specific error cases
          if (error.code === '23502') {
            throw new Error('Error database: Kolom required tidak terisi. Coba refresh halaman dan login ulang.');
          } else if (error.code === '42501') {
            throw new Error('Tidak memiliki izin untuk menambah kategori. Silakan login ulang.');
          } else {
            throw new Error(`Gagal menyimpan kategori: ${error.message}`);
          }
        }

        // Check if data was actually inserted
        if (!newData || newData.length === 0) {
          throw new Error('Kategori tidak berhasil disimpan. Tidak ada data yang dikembalikan.');
        }
        
        result = newData[0];
        console.log('✅ Category created successfully:', result);
      }

      setSuccess(true);

      toast({
        title: 'Berhasil!',
        description: `Kategori "${result.name}" berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}`,
      });
      
      // Redirect setelah 1.5 detik agar user bisa melihat pesan sukses
      setTimeout(() => {
        navigate('/categories');
      }, 1500);
      
    } catch (error: unknown) {
      console.error('💥 Error saving category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak dikenal saat menyimpan kategori';
      setSubmitError(errorMessage);
      
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan Kategori',
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

  const currentSuggestions = smartSuggestions[selectedType] || [];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
        </div>

        <div className="container mx-auto py-2 px-2 md:px-6 max-w-2xl relative z-10 pt-6 md:pt-4 pb-32">
          {/* Header dengan glassmorphism effect */}
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/categories')}
                className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md border border-white/30 p-0"
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
            <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-sm border border-white/20 overflow-hidden">
              <div className="relative">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100"></div>
                <div className="absolute top-0 left-0 w-32 h-32 bg-green-200/30 rounded-full -translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-200/30 rounded-full translate-x-12 translate-y-12"></div>
                
                <div className="relative z-10 flex flex-col items-center justify-center py-16 px-6 text-center">
                  {/* Success Icon with Animation */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg animate-pulse">
                      <CheckCircle className="h-10 w-10 text-white" strokeWidth={2} />
                    </div>
                    <div className="absolute -inset-2 rounded-full bg-green-400/20 animate-ping"></div>
                  </div>

                  {/* Success Content */}
                  <div className="space-y-4 max-w-md">
                    <h3 className="text-2xl font-bold text-gray-800">Berhasil!</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Kategori <span className="font-semibold text-gray-800">"{watchName}"</span> berhasil {isEditing ? 'diperbarui' : 'ditambahkan'}.
                    </p>
                    
                    {/* Category Preview */}
                    <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/40 shadow-sm">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: selectedColor === 'custom' ? customColor : selectedColor }}
                      >
                        {(() => {
                          const IconComponent = getIconComponent(selectedIcon);
                          return <IconComponent className="w-5 h-5" />;
                        })()}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-800">{watchName}</div>
                        <div className="text-sm text-gray-500">
                          {selectedType === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </div>
                      </div>
                    </div>

                    {/* Redirect Info */}
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-6">
                      <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Kembali ke halaman kategori...</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-sm">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSuccess(false);
                        form.reset({
                          name: '',
                          type: selectedType, // Keep the same type
                          color: '#6E59A5',
                          icon: 'DollarSign',
                        });
                        setCreationMode(null);
                      }}
                      className="flex-1 h-11 rounded-xl border-green-200 bg-white/60 hover:bg-white/80 text-green-700 hover:text-green-800 transition-all duration-200"
                      disabled={submitting}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Lagi
                    </Button>
                    <Button
                      onClick={() => navigate('/categories')}
                      className="flex-1 h-11 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Ke Kategori
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview Card */}
              <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-6 shadow-sm border border-white/20">
                <div className="flex items-center gap-4 mb-6">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-300"
                    style={{ backgroundColor: selectedColor === 'custom' ? customColor : selectedColor }}
                  >
                    {(() => {
                      const IconComponent = getIconComponent(selectedIcon);
                      return <IconComponent className="w-6 h-6" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800">
                      {watchName || 'Nama Kategori'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedType === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </p>
                  </div>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Type Selection */}
                  <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-6 shadow-sm border border-white/20">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-sm font-medium text-gray-700">Jenis Kategori</FormLabel>
                          <Tabs value={field.value} onValueChange={field.onChange}>
                            <TabsList className="grid w-full grid-cols-2 h-10 rounded-xl p-1 bg-gray-100">
                              <TabsTrigger value="expense" className="rounded-lg text-sm h-8 font-medium data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
                                Pengeluaran
                              </TabsTrigger>
                              <TabsTrigger value="income" className="rounded-lg text-sm h-8 font-medium data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                                Pemasukan
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Creation Mode Selection - Only for new categories */}
                  {!isEditing && !creationMode && (
                    <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-6 shadow-sm border border-white/20">
                      <div className="text-center space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Pilih Cara Membuat Kategori</h3>
                        <p className="text-sm text-gray-600">Gunakan saran pintar atau buat manual sesuai kebutuhan Anda</p>
                        
                        <div className="grid grid-cols-1 gap-3 mt-6">
                          <Button
                            onClick={() => setCreationMode('suggestions')}
                            className="w-full justify-start h-auto p-4 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                            variant="outline"
                            type="button"
                          >
                            <div className="flex items-center gap-3">
                              <Sparkles className="w-5 h-5" />
                              <div className="text-left">
                                <p className="font-medium">Gunakan Saran Pintar</p>
                                <p className="text-xs text-purple-600">Pilih dari kategori yang sudah disiapkan</p>
                              </div>
                            </div>
                          </Button>
                          
                          <Button
                            onClick={() => setCreationMode('manual')}
                            className="w-full justify-start h-auto p-4 bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                            variant="outline"
                            type="button"
                          >
                            <div className="flex items-center gap-3">
                              <Car className="w-5 h-5" />
                              <div className="text-left">
                                <p className="font-medium">Buat Manual</p>
                                <p className="text-xs text-gray-600">Buat kategori sesuai keinginan Anda</p>
                              </div>
                            </div>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Smart Suggestions Mode - Only for new categories */}
                  {!isEditing && creationMode === 'suggestions' && (
                    <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-6 shadow-sm border border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <h3 className="text-sm font-medium text-gray-700">Pilih Kategori</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCreationMode(null)}
                          className="text-gray-500"
                          type="button"
                        >
                          Kembali
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                        {currentSuggestions.map((suggestion, index) => {
                          const IconComponent = getIconComponent(suggestion.icon);
                          return (
                            <Button
                              key={index}
                              variant="outline"
                              className="w-full justify-start h-12 border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200"
                              onClick={() => handleSuggestionSelect(suggestion)}
                              disabled={submitting}
                              type="button"
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
                                  style={{ backgroundColor: suggestion.color }}
                                >
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-gray-800">{suggestion.name}</span>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Manual Form Mode - Always visible when editing or manual mode selected */}
                  {(isEditing || creationMode === 'manual') && (
                    <>
                      {/* Name Field */}
                      <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-6 shadow-sm border border-white/20">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-sm font-medium text-gray-700">Nama Kategori</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Masukkan nama kategori" 
                                  {...field} 
                                  className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Color and Icon Selection */}
                      <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-6 shadow-sm border border-white/20">
                        <div className="space-y-6">
                          {/* Color Selection */}
                          <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel className="text-sm font-medium text-gray-700">Warna</FormLabel>
                                <FormControl>
                                  <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                      {CATEGORY_COLORS.map((color) => (
                                        <button
                                          key={color}
                                          type="button"
                                          className={cn(
                                            "w-8 h-8 rounded-lg border transition-all duration-200 hover:scale-110", 
                                            field.value === color 
                                              ? "border-2 border-gray-900 shadow-md scale-110" 
                                              : "border border-gray-300 hover:border-gray-500"
                                          )}
                                          style={{ backgroundColor: color }}
                                          onClick={() => handleColorChange(color)}
                                          aria-label={`Pilih warna ${color}`}
                                        />
                                      ))}
                                      
                                      <button
                                        type="button"
                                        className={cn(
                                          "w-8 h-8 rounded-lg border overflow-hidden relative transition-all duration-200 hover:scale-110", 
                                          field.value === 'custom' 
                                            ? "border-2 border-gray-900 shadow-md scale-110" 
                                            : "border border-gray-300 hover:border-gray-500"
                                        )}
                                        onClick={() => handleColorChange('custom')}
                                        aria-label="Pilih warna kustom"
                                      >
                                        <div 
                                          className="w-full h-full absolute top-0 left-0"
                                          style={{ 
                                            background: field.value === 'custom' 
                                              ? customColor 
                                              : "conic-gradient(from 0deg, #ff0000, #ff9a00, #d0de21, #4fdc4a, #3fdad8, #2fc9e2, #1c7fee, #5f15f2, #ba0cf8, #fb07d9, #ff0000)" 
                                          }}
                                        ></div>
                                      </button>
                                    </div>
                                    
                                    {field.value === 'custom' && (
                                      <div className="flex gap-2 items-center p-2 bg-gray-50 rounded-lg border">
                                        <Input 
                                          type="color" 
                                          value={customColor}
                                          onChange={(e) => {
                                            setCustomColor(e.target.value);
                                          }}
                                          className="w-8 h-8 p-0.5 rounded border-0 cursor-pointer"
                                        />
                                        <Input
                                          type="text"
                                          value={customColor}
                                          onChange={(e) => {
                                            setCustomColor(e.target.value);
                                          }}
                                          className="flex-1 h-8 text-xs border-0 bg-transparent"
                                          placeholder="#000000"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Icon Selection */}
                          <FormField
                            control={form.control}
                            name="icon"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel className="text-sm font-medium text-gray-700">Icon</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200">
                                      <SelectValue placeholder="Pilih icon">
                                        <span className="flex items-center gap-3 text-sm">
                                          {(() => {
                                            const iconData = icons.find(i => i.value === field.value);
                                            const IconComponent = iconData?.component || DollarSign;
                                            return (
                                              <>
                                                <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                                                  <IconComponent className="w-4 h-4 text-gray-600" />
                                                </div>
                                                {iconData?.label}
                                              </>
                                            );
                                          })()}
                                        </span>
                                      </SelectValue>
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="max-h-[300px] rounded-xl border-gray-200">
                                    <div className="grid grid-cols-2 gap-1 p-2">
                                      {icons.map((icon) => {
                                        const IconComponent = icon.component;
                                        return (
                                          <SelectItem key={icon.value} value={icon.value} className="text-sm p-3 rounded-lg">
                                            <span className="flex items-center gap-3">
                                              <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <IconComponent className="w-4 h-4 text-gray-600" />
                                              </div>
                                              <span className="text-xs">{icon.label}</span>
                                            </span>
                                          </SelectItem>
                                        );
                                      })}
                                    </div>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {submitError && (
                        <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                          {submitError}
                        </div>
                      )}

                      {/* Submit buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate('/categories')}
                          className="w-full sm:w-auto order-2 sm:order-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50 transition-all duration-200"
                          disabled={submitting}
                        >
                          Batal
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={submitting}
                          className="w-full sm:flex-1 order-1 sm:order-2 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                    </>
                  )}
                </form>
              </Form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
