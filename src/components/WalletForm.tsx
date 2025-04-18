
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

const WALLET_COLORS = [
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
];

const GRADIENTS = [
  { id: 'blue-purple', color: '#3b82f6', gradient: '#8b5cf6', label: 'Biru-Ungu' },
  { id: 'green-blue', color: '#10b981', gradient: '#3b82f6', label: 'Hijau-Biru' },
  { id: 'orange-red', color: '#f59e0b', gradient: '#ef4444', label: 'Oranye-Merah' },
  { id: 'purple-pink', color: '#8b5cf6', gradient: '#ec4899', label: 'Ungu-Pink' },
  { id: 'teal-purple', color: '#14b8a6', gradient: '#8b5cf6', label: 'Teal-Ungu' },
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
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: wallet?.name || '',
      type: wallet?.type || "cash",
      balance: wallet?.balance || 0,
      color: wallet?.color || "#6E59A5",
      useGradient: !!wallet?.gradient,
      gradient: wallet?.gradient || '',
    },
  });

  const values = form.watch();
  const useGradient = form.watch('useGradient');

  // Initialize the gradient value when the form loads if wallet has a gradient
  React.useEffect(() => {
    if (wallet?.gradient && wallet?.color) {
      // Try to find a matching gradient from our predefined list
      const matchedGradient = GRADIENTS.find(g => g.gradient === wallet.gradient);
      if (matchedGradient) {
        setSelectedGradient(matchedGradient);
        form.setValue('gradient', matchedGradient.gradient);
      } else {
        // If no match, use the first gradient
        setSelectedGradient(GRADIENTS[0]);
        form.setValue('gradient', GRADIENTS[0].gradient);
      }
    }
  }, [wallet, form]);

  // Update gradient value when useGradient changes
  React.useEffect(() => {
    if (useGradient) {
      form.setValue('gradient', selectedGradient.gradient);
    } else {
      form.setValue('gradient', undefined);
    }
  }, [useGradient, selectedGradient, form]);

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

  const handleSelectGradient = (gradientId: string) => {
    const gradient = GRADIENTS.find(g => g.id === gradientId) || GRADIENTS[0];
    setSelectedGradient(gradient);
    form.setValue('gradient', gradient.gradient);
    
    // If selecting a gradient, ensure useGradient is true
    if (!form.getValues('useGradient')) {
      form.setValue('useGradient', true);
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
                background: values.useGradient && values.gradient
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
                        <div className="flex flex-wrap gap-2 mb-2">
                          {WALLET_COLORS.map(color => (
                            <div
                              key={color}
                              className={cn(
                                "w-8 h-8 rounded-full cursor-pointer border-2",
                                field.value === color ? "border-white shadow-md scale-110" : "border-transparent"
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => field.onChange(color)}
                            />
                          ))}
                        </div>
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
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {GRADIENTS.map((gradient) => (
                              <div
                                key={gradient.id}
                                className={cn(
                                  "w-12 h-12 rounded-lg cursor-pointer border-2 transition-all",
                                  selectedGradient.id === gradient.id 
                                    ? "border-white scale-110 shadow-md" 
                                    : "border-transparent"
                                )}
                                style={{
                                  background: `linear-gradient(135deg, ${gradient.color}, ${gradient.gradient})`
                                }}
                                onClick={() => handleSelectGradient(gradient.id)}
                              />
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm">
                              <Label>Warna Awal</Label>
                              <div 
                                className="w-full h-8 rounded mt-1"
                                style={{ backgroundColor: values.color }}
                              />
                            </div>
                            <div className="text-sm">
                              <Label>Warna Akhir</Label>
                              <div 
                                className="w-full h-8 rounded mt-1"
                                style={{ backgroundColor: selectedGradient.gradient }}
                              />
                            </div>
                          </div>
                        </div>
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
