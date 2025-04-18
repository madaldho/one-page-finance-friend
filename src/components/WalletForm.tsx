
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Wallet as WalletIcon, 
  CreditCard, 
  PiggyBank, 
  Banknote 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import ColorPicker from '@/components/ColorPicker';
import { Wallet } from '@/types';

const GRADIENTS = [
  { id: 'blue', value: 'from-[#3b82f6] to-[#8b5cf6]', label: 'Biru-Ungu' },
  { id: 'green', value: 'from-[#10b981] to-[#3b82f6]', label: 'Hijau-Biru' },
  { id: 'orange', value: 'from-[#f59e0b] to-[#ef4444]', label: 'Oranye-Merah' },
  { id: 'purple', value: 'from-[#8b5cf6] to-[#ec4899]', label: 'Ungu-Pink' },
  { id: 'teal', value: 'from-[#14b8a6] to-[#8b5cf6]', label: 'Teal-Ungu' },
];

const formSchema = z.object({
  name: z.string().min(1, "Nama dompet harus diisi"),
  type: z.enum(["cash", "bank", "savings"]),
  balance: z.coerce.number().min(0, "Saldo tidak boleh negatif"),
  color: z.string().min(1, "Warna harus dipilih"),
  useGradient: z.boolean().default(false),
  gradient: z.string().optional(),
});

export default function WalletForm({ 
  wallet, 
  onSuccess, 
  onClose 
}: { 
  wallet?: Wallet | null, 
  onSuccess?: () => void, 
  onClose?: () => void 
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: wallet?.name || '',
      type: wallet?.type || "cash",
      balance: wallet?.balance || 0,
      color: wallet?.color || "#6E59A5",
      useGradient: !!wallet?.gradient,
      gradient: wallet?.gradient || GRADIENTS[0].value,
    },
  });

  const values = form.watch();

  const onSubmit = async (formValues: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Anda harus login terlebih dahulu",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const walletData = {
        name: formValues.name,
        type: formValues.type,
        balance: formValues.balance,
        color: formValues.color,
        gradient: formValues.useGradient ? formValues.gradient : null,
        user_id: user.id,
      };

      let error;

      if (wallet?.id) {
        const { error: updateError } = await supabase
          .from('wallets')
          .update(walletData)
          .eq('id', wallet.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('wallets')
          .insert([walletData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: wallet ? "Dompet berhasil diperbarui" : "Dompet baru berhasil ditambahkan",
      });

      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan dompet",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{wallet ? 'Edit Dompet' : 'Tambah Dompet Baru'}</DialogTitle>
          <DialogDescription>
            {wallet 
              ? 'Ubah informasi dompet Anda di bawah ini.' 
              : 'Buat dompet baru untuk melacak keuangan Anda.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Preview Card */}
            <Card
              className={cn(
                "p-4 transition-all duration-300",
                values.useGradient && "bg-gradient-to-r"
              )}
              style={{
                background: values.useGradient
                  ? `linear-gradient(135deg, ${values.color}, ${values.gradient})`
                  : values.color,
                color: 'white'
              }}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {values.type === "cash" ? (
                    <Banknote className="h-5 w-5" />
                  ) : values.type === "bank" ? (
                    <CreditCard className="h-5 w-5" />
                  ) : (
                    <PiggyBank className="h-5 w-5" />
                  )}
                  <h3 className="font-medium">{values.name || "Nama Dompet"}</h3>
                </div>
                <div>
                  <p className="text-sm opacity-80">Saldo</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(values.balance)}
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid gap-4">
              {/* Name input */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Dompet</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Contoh: Dompet Utama" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type select */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Dompet</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis dompet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4" />
                            <span>Uang Tunai</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="bank">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>Rekening Bank</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="savings">
                          <div className="flex items-center gap-2">
                            <PiggyBank className="h-4 w-4" />
                            <span>Tabungan</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Balance input */}
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo Awal</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color picker */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warna</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 items-center">
                        <ColorPicker 
                          value={field.value}
                          onChange={field.onChange}
                          showGradients={false}
                        />
                        <Input
                          type="text"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gradient toggle */}
              <FormField
                control={form.control}
                name="useGradient"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Gunakan Gradient</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Aktifkan untuk menggunakan warna gradient pada dompet
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Gradient selection */}
              {values.useGradient && (
                <FormField
                  control={form.control}
                  name="gradient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warna Gradient</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih gradient" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADIENTS.map((gradient) => (
                              <SelectItem 
                                key={gradient.id} 
                                value={gradient.value}
                              >
                                <div className="flex items-center gap-2">
                                  <div 
                                    className={`w-8 h-4 rounded bg-gradient-to-r ${gradient.value}`}
                                  ></div>
                                  <span>{gradient.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Submit buttons */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </span>
                ) : wallet ? (
                  'Simpan Perubahan'
                ) : (
                  'Tambah Dompet'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
