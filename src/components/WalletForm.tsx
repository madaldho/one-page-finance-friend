import React, { useState, useEffect, memo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  CreditCard, 
  PiggyBank, 
  Banknote,
  Landmark,
  ChevronLeft,
  Lock
} from 'lucide-react';
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
import { Wallet } from '@/types';
import Layout from '@/components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurrencyInput } from '@/components/ui/currency-input';
import { hasProAccess, UserSubscriptionProfile } from '@/utils/subscription';
import { FileUpload } from '@/components/FileUpload';

// Warna preset untuk dompet
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

// Preset gradien
const GRADIENTS = [
  { id: 'blue-purple', start: '#3b82f6', end: '#8b5cf6', label: 'Biru-Ungu' },
  { id: 'green-blue', start: '#10b981', end: '#3b82f6', label: 'Hijau-Biru' },
  { id: 'orange-red', start: '#f59e0b', end: '#ef4444', label: 'Oranye-Merah' },
  { id: 'purple-pink', start: '#8b5cf6', end: '#ec4899', label: 'Ungu-Pink' },
  { id: 'teal-purple', start: '#14b8a6', end: '#8b5cf6', label: 'Teal-Ungu' },
];

const formSchema = z.object({
  name: z.string().min(1, "Nama dompet harus diisi"),
  type: z.enum(["cash", "bank", "investment", "savings"]),
  balance: z.coerce.number().min(0, "Saldo tidak boleh negatif"),
  color: z.string().min(1, "Warna harus dipilih"),
  useGradient: z.boolean().default(false),
  gradientStart: z.string().optional(),
  gradientEnd: z.string().optional(),
  logoUrl: z.string().optional(),
});

const WalletForm = memo(() => { 
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const [customColor, setCustomColor] = useState("#6E59A5");
  const [selectedColorOption, setSelectedColorOption] = useState<string | null>(null);
  const [colorTab, setColorTab] = useState<'solid' | 'gradient'>('solid');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
  const [userProfile, setUserProfile] = useState<UserSubscriptionProfile | null>(null);
  const [isPro, setIsPro] = useState(false);
  
  // Logo upload state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: "cash",
      balance: 0,
      color: WALLET_COLORS[0],
      useGradient: false,
      gradientStart: GRADIENTS[0].start,
      gradientEnd: GRADIENTS[0].end,
      logoUrl: '',
    },
  });

  const watchType = form.watch('type');
  const watchName = form.watch('name');
  const watchBalance = form.watch('balance');
  const watchColor = form.watch('color');
  const watchUseGradient = form.watch('useGradient');
  const watchGradientStart = form.watch('gradientStart');
  const watchGradientEnd = form.watch('gradientEnd');

  useEffect(() => {
    if (id) {
      fetchWallet(id);
    }
    
    // Fetch user profile untuk cek status Pro
    fetchUserProfile();
  }, [id]);

  const fetchUserProfile = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      const profileData = data as UserSubscriptionProfile;
      setUserProfile(profileData);
      
      // Set status Pro berdasarkan hasProAccess
      const hasProStatus = hasProAccess(profileData);
      setIsPro(hasProStatus);
      
      console.log("WalletForm - userProfile:", profileData, "isPro:", hasProStatus);
      
      // Jika pengguna bukan Pro dan tab yang aktif adalah gradient, 
      // kembalikan ke tab solid
      if (!hasProStatus && colorTab === 'gradient') {
        setColorTab('solid');
        form.setValue('useGradient', false);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchWallet = async (walletId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single();
      
      if (error) throw error;
      if (data) {
        setWallet(data);
        form.reset({
          name: data.name || '',
          type: (data.type as "cash" | "bank" | "investment" | "savings") || "cash",
          balance: data.balance || 0,
          color: data.color || WALLET_COLORS[0],
          useGradient: !!data.gradient,
          gradientStart: data.gradient ? data.color : GRADIENTS[0].start,
          gradientEnd: data.gradient || GRADIENTS[0].end,
          logoUrl: data.logo_url || '',
        });

        // Set logo preview if exists
        if (data.logo_url) {
          setLogoPreview(data.logo_url);
        }

        if (data.gradient) {
          // Hanya set colorTab ke gradient jika pengguna adalah Pro
          if (isPro) {
            setColorTab('gradient');
            // Cek apakah ada gradient yang mendekati
            const colorParts = data.gradient.split(',');
            if (colorParts.length > 1) {
              const endColor = colorParts[1].trim();
              const matchingGradient = GRADIENTS.find(g => g.end === endColor);
              if (matchingGradient) {
                setSelectedGradient(matchingGradient);
              }
            }
          } else {
            // Jika bukan Pro tapi wallet punya gradient (mungkin dibuat saat masih Pro)
            // tetap gunakan solid color saja
            setColorTab('solid');
            form.setValue('useGradient', false);
          }
        } else if (data.color && !WALLET_COLORS.includes(data.color)) {
          setCustomColor(data.color);
          setSelectedColorOption('custom');
        }
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengambil data dompet",
      });
    } finally {
      setLoading(false);
    }
  };

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

      // Jika bukan Pro dan mencoba menggunakan gradient, kembalikan ke solid
      const useGradient = isPro ? formValues.useGradient : false;

      const walletData = {
        name: formValues.name,
        type: formValues.type,
        balance: formValues.balance,
        color: useGradient ? formValues.gradientStart : (formValues.color === 'custom' ? customColor : formValues.color),
        gradient: useGradient ? `${formValues.gradientStart}, ${formValues.gradientEnd}` : null,
        logo_url: formValues.logoUrl || null,
        user_id: user.id,
      };

      let error;

      if (id && wallet) {
        const { error: updateError } = await supabase
          .from('wallets')
          .update(walletData)
          .eq('id', id);
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
        description: id ? "Dompet berhasil diperbarui" : "Dompet baru berhasil ditambahkan",
      });

      navigate('/home');
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

  // Logo upload functions
  const uploadLogo = async (file: File) => {
    try {
      setLogoUploading(true);
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const filename = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `wallet-logos/${filename}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('wallet-logos') // Use dedicated wallet-logos bucket
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('wallet-logos')
        .getPublicUrl(filePath);

      // Update form and preview
      form.setValue('logoUrl', data.publicUrl);
      setLogoPreview(data.publicUrl);
      
      toast({
        title: "Logo Diunggah",
        description: "Logo dompet berhasil diunggah",
      });
    } catch (error: unknown) {
      console.error('Error uploading logo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunggah logo';
      toast({
        title: "Gagal Mengunggah Logo",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const clearLogo = () => {
    form.setValue('logoUrl', '');
    setLogoPreview(null);
  };

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'bank':
        return <Landmark className="h-4 w-4" />;
      case 'investment':
        return <CreditCard className="h-4 w-4" />;
      case 'savings':
        return <PiggyBank className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  const handleColorChange = (color: string) => {
    form.setValue('color', color);
    setSelectedColorOption(color);
  };

  const handleGradientChange = (gradient: typeof GRADIENTS[0]) => {
    setSelectedGradient(gradient);
    form.setValue('gradientStart', gradient.start);
    form.setValue('gradientEnd', gradient.end);
  };

  // Handler untuk perubahan tab color
  const handleColorTabChange = (value: string) => {
    if (value === 'gradient' && !isPro) {
      // Jika pengguna bukan Pro dan mencoba mengakses tab gradient
      toast({
        title: "Fitur Pro",
        description: "Gradient warna hanya tersedia untuk pengguna Pro",
        variant: "destructive",
      });
      return;
    }
    
    setColorTab(value as 'solid' | 'gradient');
    form.setValue('useGradient', value === 'gradient');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4 flex justify-center items-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-xl">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{id ? 'Edit Dompet' : 'Tambah Dompet'}</h1>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Preview Card */}
            <Card
              className={cn(
                  "p-4 transition-all duration-300 mb-4",
                  watchUseGradient && "bg-gradient-to-r"
              )}
              style={{
                  background: watchUseGradient 
                    ? `linear-gradient(135deg, ${watchGradientStart}, ${watchGradientEnd})`
                    : watchColor === 'custom' ? customColor : watchColor,
                color: 'white'
              }}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    {logoPreview ? (
                      <div className="relative">
                        <img 
                          src={logoPreview} 
                          alt="Logo" 
                          className="h-6 w-6 rounded-lg object-cover shadow-sm border border-white/30"
                        />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                        {getWalletIcon(watchType)}
                      </div>
                    )}
                    <h3 className="font-medium">{watchName || "Nama Dompet"}</h3>
                </div>
                <div>
                  <p className="text-sm opacity-80">Saldo</p>
                  <p className="text-xl font-bold">
                      {formatCurrency(watchBalance)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Nama Dompet */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Dompet</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Dompet Harian" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipe Dompet */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Dompet</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe dompet" />
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
                          <Landmark className="h-4 w-4" />
                          <span>Rekening Bank</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="investment">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>E-Wallet</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="savings">
                        <div className="flex items-center gap-2">
                          <PiggyBank className="h-4 w-4" />
                          <span>Lainnya</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Saldo Awal */}
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo {id ? 'Saat Ini' : 'Awal'}</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      placeholder="0"
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Logo Dompet (Opsional)</Label>
              <FileUpload
                onFileSelect={uploadLogo}
                preview={logoPreview}
                onClearPreview={clearLogo}
                uploading={logoUploading}
                disabled={isSubmitting}
                placeholder="Unggah logo dompet"
                maxSize={2}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Logo akan ditampilkan pada kartu dompet Anda. Format yang didukung: JPG, PNG, GIF (maks. 2MB)
              </p>
            </div>

            {/* Tabs for color selection */}
            <div className="space-y-3">
              <FormLabel className="text-sm font-medium">Warna</FormLabel>
              <Tabs value={colorTab} onValueChange={handleColorTabChange}>
                <TabsList className="grid w-full grid-cols-2 h-9 rounded-full p-0.5 mb-4">
                  <TabsTrigger value="solid" className="rounded-full text-xs h-8">Solid</TabsTrigger>
                  <TabsTrigger 
                    value="gradient" 
                    className="rounded-full text-xs h-8" 
                    disabled={!isPro}
                  >
                    {!isPro && <Lock className="h-3.5 w-3.5 mr-1" />}
                    Gradient
                    {!isPro && (
                      <span className="ml-1 text-[10px] bg-orange-100 text-orange-700 px-1 rounded-full">Pro</span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {colorTab === 'solid' ? (
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-3">
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
                              {WALLET_COLORS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className={cn(
                                    "w-full aspect-square rounded-full border-2 transition-all duration-200", 
                                    field.value === color ? "border-black shadow-md scale-110" : "border-transparent hover:border-gray-300"
                                  )}
                                  style={{ backgroundColor: color }}
                                  onClick={() => handleColorChange(color)}
                                  aria-label={`Pilih warna ${color}`}
                                  title={`Warna ${color}`}
                                />
                              ))}
                              
                              <button
                                type="button"
                                className={cn(
                                  "w-full aspect-square rounded-full border-2 overflow-hidden relative transition-all duration-200", 
                                  field.value === 'custom' ? "border-black shadow-md scale-110" : "border-transparent hover:border-gray-300"
                                )}
                                onClick={() => handleColorChange('custom')}
                                aria-label="Pilih warna kustom"
                                title="Warna kustom"
                              >
                                <div 
                                  className="w-full h-full absolute top-0 left-0"
                                  style={{ 
                                    background: field.value === 'custom' 
                                      ? customColor 
                                      : "linear-gradient(45deg, #ff0000, #ff9a00, #d0de21, #4fdc4a, #3fdad8, #2fc9e2, #1c7fee, #5f15f2, #ba0cf8, #fb07d9)" 
                                  }}
                                ></div>
                                {field.value === 'custom' && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-1/2 w-1/2 rounded-full" style={{ backgroundColor: customColor }}></div>
                                  </div>
                                )}
                              </button>
                            </div>
                            
                            {field.value === 'custom' && (
                              <div className="flex gap-2 items-center mt-3">
                                <Input 
                                  type="color" 
                                  value={customColor}
                                  onChange={(e) => {
                                    setCustomColor(e.target.value);
                                  }}
                                  className="w-10 h-10 p-1 rounded-lg cursor-pointer border-2"
                                />
                                <Input
                                  type="text"
                                  value={customColor}
                                  onChange={(e) => {
                                    setCustomColor(e.target.value);
                                  }}
                                  className="flex-1 h-10 text-sm"
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
                ) : (
                  <>
                    {isPro ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {GRADIENTS.map((gradient) => (
                            <button
                              key={gradient.id}
                              type="button"
                              className={cn(
                                "h-10 rounded-md cursor-pointer border-2",
                                selectedGradient.id === gradient.id 
                                ? "border-black shadow-sm" 
                                : "border-transparent"
                              )}
                              style={{
                                background: `linear-gradient(to right, ${gradient.start}, ${gradient.end})` 
                              }}
                              onClick={() => {
                                handleGradientChange(gradient);
                                // Nonaktifkan pengaturan warna solid kustom
                                if (watchColor === 'custom') {
                                  form.setValue('color', WALLET_COLORS[0]);
                                }
                              }}
                              aria-label={`Pilih gradient ${gradient.label}`}
                              title={gradient.label}
                            />
                          ))}
                        </div>
                        
                        <div className="flex gap-3">
                          <div className="flex-1 space-y-2">
                            <Label className="text-xs">Warna Awal</Label>
                            <div className="flex gap-2 items-center">
                              <Input 
                                type="color" 
                                value={watchGradientStart}
                                onChange={(e) => {
                                  form.setValue('gradientStart', e.target.value);
                                  // Tandai sebagai custom gradient
                                  setSelectedGradient({...GRADIENTS[0], id: 'custom'});
                                }}
                                className="w-8 h-8 p-0.5 rounded-md cursor-pointer"
                              />
                              <Input 
                                type="text" 
                                value={watchGradientStart}
                                onChange={(e) => {
                                  form.setValue('gradientStart', e.target.value);
                                  // Tandai sebagai custom gradient
                                  setSelectedGradient({...GRADIENTS[0], id: 'custom'});
                                }}
                                className="flex-1 h-8 text-xs"
                              />
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <Label className="text-xs">Warna Akhir</Label>
                            <div className="flex gap-2 items-center">
                              <Input 
                                type="color" 
                                value={watchGradientEnd}
                                onChange={(e) => {
                                  form.setValue('gradientEnd', e.target.value);
                                  // Tandai sebagai custom gradient
                                  setSelectedGradient({...GRADIENTS[0], id: 'custom'});
                                }}
                                className="w-8 h-8 p-0.5 rounded-md cursor-pointer"
                              />
                              <Input 
                                type="text" 
                                value={watchGradientEnd}
                                onChange={(e) => {
                                  form.setValue('gradientEnd', e.target.value);
                                  // Tandai sebagai custom gradient
                                  setSelectedGradient({...GRADIENTS[0], id: 'custom'});
                                }}
                                className="flex-1 h-8 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-orange-50 border border-orange-100 rounded-md">
                        <div className="flex items-start gap-2">
                          <Lock className="h-4 w-4 text-orange-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-orange-800">Fitur Pro</p>
                            <p className="text-xs text-orange-700">
                              Gradient warna untuk dompet hanya tersedia bagi pengguna Pro. 
                              Upgrade sekarang untuk mengakses semua fitur premium!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Tabs>
            </div>

            {/* Submit buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || logoUploading} 
                className="w-full sm:flex-1 order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </span>
                ) : logoUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengunggah logo...
                  </span>
                ) : id ? (
                  'Simpan Perubahan'
                ) : (
                  'Tambah Dompet'
                )}
              </Button>
            </div>
          </form>
        </Form>
        </div>
      </div>
    </Layout>
  );
});

WalletForm.displayName = "WalletForm";
export default WalletForm;
