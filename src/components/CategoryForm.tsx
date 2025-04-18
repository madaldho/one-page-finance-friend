import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

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
]

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface CategoryFormProps {
  category?: Category
  onClose: () => void
}

export function CategoryForm({ category, onClose }: CategoryFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name || '',
      type: category?.type || 'expense',
      color: category?.color || '#9DD600',
      icon: category?.icon || 'dollar',
    },
  })

  const selectedIcon = form.watch('icon')
  const selectedColor = form.watch('color')
  const selectedType = form.watch('type')

  useEffect(() => {
    if (submitError) {
      setSubmitError(null)
    }
  }, [form.watch(), submitError])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)
      setSubmitError(null)
      
      const user = await supabase.auth.getUser()
      if (!user.data.user) {
        throw new Error('User not found')
      }

      const userId = user.data.user.id
      
      const data = {
        name: values.name,
        type: values.type,
        color: values.color,
        icon: values.icon,
        user_id: userId,
      }

      let result;

      if (category) {
        const { data: updatedData, error } = await supabase
          .from('categories')
          .update(data)
          .eq('id', category.id)
          .select('*')
          .single();
        
        if (error) {
          console.error('Error updating category:', error)
          throw new Error(error.message)
        }
        
        result = updatedData;
      } else {
        const { data: newData, error } = await supabase
          .from('categories')
          .insert({
            id: generateUUID(),
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();
        
        if (error) {
          console.error('Error creating category:', error)
          throw new Error(error.message)
        }
        
        result = newData;
      }

      toast({
        title: 'Berhasil',
        description: `Kategori "${result.name}" berhasil ${category ? 'diperbarui' : 'ditambahkan'}`,
      })
      onClose()
    } catch (error: unknown) {
      console.error('Error saving category:', error)
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan kategori'
      setSubmitError(errorMessage)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-4 border-l-4" style={{ borderLeftColor: selectedColor }}>
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: selectedColor }}
            >
              <i className={`fas fa-${selectedIcon} text-xl`}></i>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-lg">
                {form.watch('name') || 'Nama Kategori'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedType === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kategori</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama kategori" {...field} className="border-gray-300" />
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
                  <FormLabel>Tipe</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Pilih tipe kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income" className="flex items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>Pemasukan</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="expense" className="flex items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
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
        </Card>

        <Card className="p-4">
          <h3 className="font-medium mb-4">Kustomisasi</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warna</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="color" 
                        {...field} 
                        className="w-12 h-12 p-1 rounded-lg cursor-pointer border-gray-300"
                      />
                      <Input 
                        type="text" 
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="flex-1 border-gray-300"
                        placeholder="#000000"
                      />
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
                  <FormLabel>Icon</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Pilih icon">
                          <span className="flex items-center gap-2">
                            <i className={`fas fa-${field.value}`}></i>
                            {icons.find(i => i.value === field.value)?.label}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[200px]">
                      {icons.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          <span className="flex items-center gap-2">
                            <i className={`fas fa-${icon.value}`}></i>
                            {icon.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {submitError && (
          <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md border border-red-200">
            Error: {submitError}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            type="button"
            disabled={loading}
          >
            Batal
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className={cn(
              "min-w-[100px]",
              loading && "opacity-80"
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </span>
            ) : category ? (
              'Perbarui'
            ) : (
              'Tambah'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
