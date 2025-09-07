import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { 
  Loader2, 
  CreditCard, 
  PiggyBank, 
  Banknote,
  Landmark,
  ChevronLeft,
  Lock,
  Image
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

export default function WalletForm() { 
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

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
        setLogoUrl(data.logo_url);
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

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      setUploadingLogo(true);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const filename = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `wallet-logos/${filename}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Using same bucket as avatars
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunggah logo';
      toast({
        title: "Gagal Mengunggah Logo",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoSelect = async (file: File) => {
    const uploadedUrl = await uploadLogo(file);
    if (uploadedUrl) {
      setLogoUrl(uploadedUrl);
      form.setValue('logoUrl', uploadedUrl);
      toast({
        title: "Logo Berhasil Diunggah",
        description: "Logo wallet telah berhasil diperbarui",
      });
    }
  };

  const handleLogoRemove = () => {
    setLogoUrl(null);
    form.setValue('logoUrl', '');
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
        logo_url: logoUrl,
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

  const getWalletIcon = (type: string, logoUrl?: string | null) => {
    if (logoUrl) {
      return (
        <div className="h-4 w-4 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="h-full w-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = getDefaultWalletIcon(type);
            }}
          />
        </div>
      );
    }
    return getDefaultWalletIcon(type);
  };

  const getDefaultWalletIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return '<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path><path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"></path></svg>';
      case 'bank':
        return '<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2h8v8H6V6z" clip-rule="evenodd"></path></svg>';
      case 'investment':
        return '<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z" clip-rule="evenodd"></path><path d="M6 4a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V4z"></path></svg>';
      case 'savings':
        return '<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"></path></svg>';
      default:
        return '<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path><path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"></path></svg>';
    }
  };

  const renderWalletIcon = (type: string, logoUrl?: string | null) => {
    if (logoUrl) {
      return (
        <div className="h-4 w-4 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="h-full w-full object-cover"
            onError={(e) => {
              // Hide image and show default icon
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.appendChild(getOriginalWalletIcon(type));
            }}
          />
        </div>
      );
    }
    return getOriginalWalletIcon(type);
  };

  const getOriginalWalletIcon = (type: string) => {
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
      <div className="container mx-auto p-4 pb-32 max-w-2xl">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-3 h-10 w-10 hover:bg-gray-100 transition-colors" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit Dompet' : 'Tambah Dompet'}</h1>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Preview Card */}
            <Card
              className={cn(
                  "p-6 transition-all duration-300 mb-6 shadow-lg",
                  watchUseGradient && "bg-gradient-to-r"
              )}
              style={{
                  background: watchUseGradient 
                    ? `linear-gradient(135deg, ${watchGradientStart}, ${watchGradientEnd})`
                    : watchColor === 'custom' ? customColor : watchColor,
                color: 'white'
              }}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    {renderWalletIcon(watchType, logoUrl)}
                    <h3 className="font-semibold text-lg">{watchName || "Nama Dompet"}</h3>
                </div>
                <div>
                  <p className="text-sm opacity-80 font-medium">Saldo</p>
                  <p className="text-2xl font-bold tracking-wide">
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
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-semibold">Nama Dompet</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Contoh: Dompet Harian" 
                      {...field} 
                      className="h-12 text-base border-2 focus:border-primary transition-colors"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Logo Upload */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                <label className="text-base font-semibold">Logo Dompet (Opsional)</label>
              </div>
              <FileUpload
                onFileSelect={handleLogoSelect}
                onFileRemove={handleLogoRemove}
                loading={uploadingLogo}
                currentFileUrl={logoUrl}
                placeholder="Pilih logo..."
                accept="image/*"
                maxSize={2}
                className="w-full"
              />
              <p className="text-sm text-gray-500">
                Upload logo kustom untuk mempersonalisasi wallet Anda
              </p>
            </div>

            {/* Tipe Dompet */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-semibold">Tipe Dompet</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 text-base border-2 focus:border-primary transition-colors">
                        <SelectValue placeholder="Pilih tipe dompet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">
                        <div className="flex items-center gap-3 py-1">
                          <Banknote className="h-5 w-5" />
                          <span className="font-medium">Uang Tunai</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="bank">
                        <div className="flex items-center gap-3 py-1">
                          <Landmark className="h-5 w-5" />
                          <span className="font-medium">Rekening Bank</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="investment">
                        <div className="flex items-center gap-3 py-1">
                          <CreditCard className="h-5 w-5" />
                          <span className="font-medium">E-Wallet</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="savings">
                        <div className="flex items-center gap-3 py-1">
                          <PiggyBank className="h-5 w-5" />
                          <span className="font-medium">Lainnya</span>
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
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-semibold">Saldo {id ? 'Saat Ini' : 'Awal'}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CurrencyInput
                        placeholder="0"
                        value={field.value}
                        onChange={(value) => field.onChange(value)}
                        className="h-12 text-base border-2 focus:border-primary transition-colors pl-12"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        Rp
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tabs for color selection */}
            <div className="space-y-4">
              <FormLabel className="text-base font-semibold">Warna & Tema</FormLabel>
              <Tabs value={colorTab} onValueChange={handleColorTabChange}>
                <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl p-1 mb-6 bg-gray-100">
                  <TabsTrigger value="solid" className="rounded-lg text-sm h-9 font-medium">Solid</TabsTrigger>
                  <TabsTrigger 
                    value="gradient" 
                    className="rounded-lg text-sm h-9 font-medium" 
                    disabled={!isPro}
                  >
                    {!isPro && <Lock className="h-4 w-4 mr-2" />}
                    Gradient
                    {!isPro && (
                      <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Pro</span>
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
                          <div className="space-y-4">
                            <div className="grid grid-cols-5 gap-3">
                              {WALLET_COLORS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className={cn(
                                    "w-full aspect-square rounded-xl border-3 transition-all duration-200 hover:scale-105", 
                                    field.value === color ? "border-gray-800 shadow-lg scale-110" : "border-transparent hover:border-gray-300"
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
                                  "w-full aspect-square rounded-xl border-3 overflow-hidden relative transition-all duration-200 hover:scale-105", 
                                  field.value === 'custom' ? "border-gray-800 shadow-lg scale-110" : "border-transparent hover:border-gray-300"
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
                                    <div className="h-1/2 w-1/2 rounded-full border-2 border-white" style={{ backgroundColor: customColor }}></div>
                                  </div>
                                )}
                              </button>
                            </div>
                            
                            {field.value === 'custom' && (
                              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                                <Label className="text-sm font-medium mb-3 block">Warna Kustom</Label>
                                <div className="flex gap-3 items-center">
                                  <Input 
                                    type="color" 
                                    value={customColor}
                                    onChange={(e) => {
                                      setCustomColor(e.target.value);
                                    }}
                                    className="w-12 h-12 p-1 rounded-lg cursor-pointer border-2"
                                  />
                                  <Input
                                    type="text"
                                    value={customColor}
                                    onChange={(e) => {
                                      setCustomColor(e.target.value);
                                    }}
                                    className="flex-1 h-12 text-base border-2"
                                    placeholder="#000000"
                                  />
                                </div>
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
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {GRADIENTS.map((gradient) => (
                            <button
                              key={gradient.id}
                              type="button"
                              className={cn(
                                "h-12 rounded-lg cursor-pointer border-3 transition-all duration-200 hover:scale-105",
                                selectedGradient.id === gradient.id 
                                ? "border-gray-800 shadow-lg scale-105" 
                                : "border-transparent hover:border-gray-300"
                              )}
                              style={{
                                background: `linear-gradient(135deg, ${gradient.start}, ${gradient.end})` 
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
                        
                        <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                          <Label className="text-sm font-medium mb-4 block">Kustomisasi Gradient</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <Label className="text-sm">Warna Awal</Label>
                              <div className="flex gap-3 items-center">
                                <Input 
                                  type="color" 
                                  value={watchGradientStart}
                                  onChange={(e) => {
                                    form.setValue('gradientStart', e.target.value);
                                    // Tandai sebagai custom gradient
                                    setSelectedGradient({...GRADIENTS[0], id: 'custom'});
                                  }}
                                  className="w-12 h-12 p-1 rounded-lg cursor-pointer border-2"
                                />
                                <Input 
                                  type="text" 
                                  value={watchGradientStart}
                                  onChange={(e) => {
                                    form.setValue('gradientStart', e.target.value);
                                    // Tandai sebagai custom gradient
                                    setSelectedGradient({...GRADIENTS[0], id: 'custom'});
                                  }}
                                  className="flex-1 h-12 text-base border-2"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <Label className="text-sm">Warna Akhir</Label>
                              <div className="flex gap-3 items-center">
                                <Input 
                                  type="color" 
                                  value={watchGradientEnd}
                                  onChange={(e) => {
                                    form.setValue('gradientEnd', e.target.value);
                                    // Tandai sebagai custom gradient
                                    setSelectedGradient({...GRADIENTS[0], id: 'custom'});
                                  }}
                                  className="w-12 h-12 p-1 rounded-lg cursor-pointer border-2"
                                />
                                <Input 
                                  type="text" 
                                  value={watchGradientEnd}
                                  onChange={(e) => {
                                    form.setValue('gradientEnd', e.target.value);
                                    // Tandai sebagai custom gradient
                                    setSelectedGradient({...GRADIENTS[0], id: 'custom'});
                                  }}
                                  className="flex-1 h-12 text-base border-2"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-orange-50 border-2 border-orange-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="bg-orange-100 p-2 rounded-lg">
                            <Lock className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-base font-semibold text-orange-800">Fitur Pro</p>
                            <p className="text-sm text-orange-700">
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

            {/* Submit buttons - Enhanced styling */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="h-12 text-base font-medium border-2 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="h-12 text-base font-medium bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Menyimpan...
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
}
