
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Asset } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

interface AssetFormProps {
  asset?: Asset;
  mode?: 'create' | 'edit';
}

const formSchema = z.object({
  name: z.string().min(1, 'Nama aset tidak boleh kosong'),
  category: z.enum(['property', 'vehicle', 'gold', 'stock', 'other']),
  initial_value: z.coerce.number().min(1, 'Nilai aset harus lebih dari 0'),
  purchase_date: z.date().optional(),
  purchase_year: z.coerce.number().min(1900).max(new Date().getFullYear()).optional(),
});

export function AssetForm({ asset, mode = 'create' }: AssetFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: asset?.name || '',
      category: asset?.category || 'property',
      initial_value: asset?.initial_value || 0,
      purchase_date: asset?.purchase_date ? new Date(asset.purchase_date) : undefined,
      purchase_year: asset?.purchase_year || new Date().getFullYear(),
    },
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 124 }, (_, i) => currentYear - i);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Anda harus login terlebih dahulu",
          variant: "destructive",
        });
        return;
      }

      // Convert date to ISO string if provided
      const purchase_date = values.purchase_date 
        ? format(values.purchase_date, 'yyyy-MM-dd') 
        : null;

      if (mode === 'create') {
        const newAsset = {
          user_id: user.id,
          name: values.name,
          category: values.category,
          initial_value: values.initial_value,
          current_value: values.initial_value, // Initial value equals current value on creation
          purchase_date,
          purchase_year: values.purchase_year,
        };

        const { data, error } = await supabase
          .from('assets')
          .insert(newAsset)
          .select('id')
          .single();

        if (error) throw error;

        // Also add the initial value to the history
        await supabase
          .from('asset_value_history')
          .insert({
            asset_id: data.id,
            user_id: user.id,
            value: values.initial_value,
            date: purchase_date || new Date().toISOString().substring(0, 10),
          });

        toast({
          title: "Berhasil",
          description: "Aset baru berhasil ditambahkan",
        });
        navigate('/assets');
      } else {
        // Update functionality for future use
        if (!asset) return;

        const { error } = await supabase
          .from('assets')
          .update({
            name: values.name,
            category: values.category,
            initial_value: values.initial_value,
            purchase_date,
            purchase_year: values.purchase_year,
          })
          .eq('id', asset.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Aset berhasil diperbarui",
        });
        navigate(`/assets/${asset.id}`);
      }
    } catch (error: any) {
      console.error('Error saving asset:', error);
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat menyimpan aset",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">
            {mode === 'create' ? 'Tambah Aset Baru' : 'Edit Aset'}
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Kembali
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Aset</FormLabel>
                    <FormControl>
                      <Input placeholder="contoh: Rumah Jakarta" {...field} />
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
                    <FormLabel>Kategori Aset</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori aset" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="property">Properti</SelectItem>
                        <SelectItem value="vehicle">Kendaraan</SelectItem>
                        <SelectItem value="gold">Emas</SelectItem>
                        <SelectItem value="stock">Saham</SelectItem>
                        <SelectItem value="other">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initial_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nilai Awal</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Beli (Opsional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
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

              <FormField
                control={form.control}
                name="purchase_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun Beli</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tahun pembelian" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Aset'
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}
