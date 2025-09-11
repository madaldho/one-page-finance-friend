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

// Smart suggestions untuk bank dan e-wallet Indonesia
const SMART_SUGGESTIONS = {
  'E-wallet': [
    { name: 'Dana', logo: '/Logo2/E-wallet/dana.jfif', color: '#118EEA', type: 'bank' },
    { name: 'GoPay', logo: '/Logo2/E-wallet/gopay.png', color: '#00AA13', type: 'bank' },
    { name: 'i.saku', logo: '/Logo2/E-wallet/Isaku.png', color: '#FF6B35', type: 'bank' },
    { name: 'LinkAja', logo: '/Logo2/E-wallet/Link aja.png', color: '#E30613', type: 'bank' },
    { name: 'OVO', logo: '/Logo2/E-wallet/ovo.png', color: '#4C3494', type: 'bank' },
    { name: 'ShopeePay', logo: '/Logo2/E-wallet/ShopeePay.png', color: '#EE4D2D', type: 'bank' },
  ],
  'Rekening': [
    { name: 'Bank BCA', logo: '/Logo2/Rekening/BCA.png', color: '#003399', type: 'bank' },
    { name: 'Bank Mandiri', logo: '/Logo2/Rekening/mandiri.jpg', color: '#003d79', type: 'bank' },
    { name: 'Bank BRI', logo: '/Logo2/Rekening/BRI.png', color: '#003d79', type: 'bank' },
    { name: 'Bank BNI', logo: '/Logo2/Rekening/BNI.jpg', color: '#ed8b00', type: 'bank' },
    { name: 'Bank BTN', logo: '/Logo2/Rekening/BTN.png', color: '#0066cc', type: 'bank' },
    { name: 'Bank BSI', logo: '/Logo2/Rekening/BSI.jpeg', color: '#00a651', type: 'bank' },
    { name: 'Bank CIMB Niaga', logo: '/Logo2/Rekening/CIMB_NIAGA.png', color: '#dc143c', type: 'bank' },
    { name: 'Bank Danamon', logo: '/Logo2/Rekening/DANAMON.png', color: '#005aa0', type: 'bank' },
    { name: 'Bank Jago', logo: '/Logo2/Rekening/Jago.jpg', color: '#FF6B35', type: 'bank' },
    { name: 'Jenius BTPN', logo: '/Logo2/Rekening/Jenius.png', color: '#00d4aa', type: 'bank' },
    { name: 'Bank Maybank', logo: '/Logo2/Rekening/maybank.png', color: '#ffcc00', type: 'bank' },
    { name: 'Bank Muamalat', logo: '/Logo2/Rekening/Muamalat.png', color: '#00a651', type: 'bank' },
    { name: 'Bank OCBC NISP', logo: '/Logo2/Rekening/OCBC.png', color: '#dc143c', type: 'bank' },
    { name: 'Bank Panin', logo: '/Logo2/Rekening/PANIN BANK.png', color: '#005aa0', type: 'bank' },
    { name: 'Bank Permata', logo: '/Logo2/Rekening/permata bank.png', color: '#7b68ee', type: 'bank' },
    { name: 'SeaBank', logo: '/Logo2/Rekening/SeaBank.jfif', color: '#0099ff', type: 'bank' },
    { name: 'Bank DKI', logo: '/Logo2/Rekening/bank DKI.png', color: '#ff6600', type: 'bank' },
    { name: 'Bank Jatim', logo: '/Logo2/Rekening/bank Jatim.png', color: '#006633', type: 'bank' },
    { name: 'Bank Saqu', logo: '/Logo2/Rekening/bank saqu.png', color: '#ff3366', type: 'bank' },
    { name: 'Allobank', logo: '/Logo2/Rekening/Allobank.png', color: '#6c5ce7', type: 'bank' },
    { name: 'Krom Bank', logo: '/Logo2/Rekening/krom bank.png', color: '#2d3436', type: 'bank' },
    { name: 'Superbank', logo: '/Logo2/Rekening/Superbank.png', color: '#0984e3', type: 'bank' },
  ]
};

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

  // Smart suggestions state
  const [creationMode, setCreationMode] = useState<'smart' | 'manual' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'E-wallet' | 'Rekening' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pre-upload popular bank logos on component mount (only once)
  const preUploadPopularLogos = async () => {
    try {
      // Only pre-upload if user is authenticated and this is first time
      if (!user) return;
      
      const hasPreUploaded = localStorage.getItem('logos-pre-uploaded');
      if (hasPreUploaded) return;
      
      console.log('Pre-uploading popular bank logos...');
      
      // List of most popular banks to pre-upload
      const popularBanks = [
        { name: 'Dana', logo: '/Logo2/E-wallet/dana.jfif' },
        { name: 'GoPay', logo: '/Logo2/E-wallet/gopay.png' },
        { name: 'OVO', logo: '/Logo2/E-wallet/ovo.png' },
        { name: 'Bank BCA', logo: '/Logo2/Rekening/BCA.png' },
        { name: 'Bank Mandiri', logo: '/Logo2/Rekening/mandiri.jpg' },
        { name: 'Bank BRI', logo: '/Logo2/Rekening/BRI.png' },
        { name: 'Bank BNI', logo: '/Logo2/Rekening/BNI.jpg' },
      ];
      
      // Pre-upload in background (don't wait for completion)
      popularBanks.forEach(async (bank) => {
        try {
          const sanitizedName = bank.name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          const fileExt = bank.logo.split('.').pop() || 'jpg';
          const sharedFilename = `shared-logos/${sanitizedName}.${fileExt}`;
          
          // Check if already exists
          const { data: existingFile } = await supabase.storage
            .from('wallet-logos')
            .list('shared-logos', {
              search: `${sanitizedName}.${fileExt}`
            });
          
          if (existingFile && existingFile.length > 0) {
            return; // Already exists, skip
          }
          
          // Fetch and upload
          const response = await fetch(bank.logo);
          if (response.ok) {
            const blob = await response.blob();
            await supabase.storage
              .from('wallet-logos')
              .upload(sharedFilename, blob, {
                contentType: blob.type || 'image/jpeg',
                upsert: true
              });
            console.log(`Pre-uploaded: ${bank.name}`);
          }
        } catch (error) {
          console.log(`Failed to pre-upload ${bank.name}:`, error);
        }
      });
      
      // Mark as pre-uploaded
      localStorage.setItem('logos-pre-uploaded', 'true');
    } catch (error) {
      console.log('Pre-upload failed:', error);
    }
  };

  // Filter smart suggestions based on search query and category
  const filteredSuggestions = React.useMemo(() => {
    if (!selectedCategory) return [];
    
    let filtered = SMART_SUGGESTIONS[selectedCategory] || [];
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [selectedCategory, searchQuery]);

  // Handle smart suggestion selection
  const handleSuggestionSelect = async (suggestion: typeof SMART_SUGGESTIONS['E-wallet'][0]) => {
    try {
      // Set form values first
      form.setValue('name', suggestion.name);
      form.setValue('balance', 0);
      form.setValue('color', suggestion.color);
      form.setValue('type', 'bank');
      setSelectedColorOption(suggestion.color);
      setLogoPreview(suggestion.logo);
      
      // Upload logo to Supabase storage
      await uploadLogoFromUrl(suggestion.logo, suggestion.name);
      
      setCreationMode('manual'); // Switch to manual mode for editing
    } catch (error) {
      console.error('Error selecting suggestion:', error);
      toast({
        title: "Error",
        description: "Gagal memuat logo, silakan coba lagi",
        variant: "destructive",
      });
    }
  };

  // Upload logo from URL to Supabase storage with deduplication
  const uploadLogoFromUrl = async (logoUrl: string, bankName: string) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setLogoUploading(true);
      
      // Create a consistent filename based on bank name (not user-specific)
      const sanitizedBankName = bankName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, ''); // Remove special characters
      const fileExt = logoUrl.split('.').pop() || 'jpg';
      const sharedFilename = `shared-logos/${sanitizedBankName}.${fileExt}`;
      
      // Check if shared logo already exists
      const { data: existingFile } = await supabase.storage
        .from('wallet-logos')
        .list('shared-logos', {
          search: `${sanitizedBankName}.${fileExt}`
        });
      
      let publicUrl: string;
      
      if (existingFile && existingFile.length > 0) {
        // Logo already exists, use the existing one
        const { data } = supabase.storage
          .from('wallet-logos')
          .getPublicUrl(sharedFilename);
        
        publicUrl = data.publicUrl;
        
        console.log(`Using existing shared logo for ${bankName}: ${publicUrl}`);
      } else {
        // Logo doesn't exist, upload new shared logo
        console.log(`Uploading new shared logo for ${bankName}`);
        
        // Fetch the image from local assets
        const response = await fetch(logoUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch logo');
        }
        
        const blob = await response.blob();
        
        // Upload to shared-logos folder
        const { error: uploadError } = await supabase.storage
          .from('wallet-logos')
          .upload(sharedFilename, blob, {
            contentType: blob.type || 'image/jpeg',
            upsert: true // Allow overwrite if exists
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL for the new shared logo
        const { data } = supabase.storage
          .from('wallet-logos')
          .getPublicUrl(sharedFilename);
        
        publicUrl = data.publicUrl;
      }

      // Update form with the shared logo URL
      form.setValue('logoUrl', publicUrl);
      setLogoPreview(publicUrl);
      
      toast({
        title: "Logo Berhasil Dimuat",
        description: `Logo ${bankName} berhasil disimpan`,
      });
    } catch (error: unknown) {
      console.error('Error uploading logo from URL:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengunggah logo';
      toast({
        title: "Gagal Memuat Logo",
        description: errorMessage,
        variant: "destructive",
      });
      // Keep the local preview even if upload fails
      setLogoPreview(logoUrl);
    } finally {
      setLogoUploading(false);
    }
  };

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
    
    // Pre-upload popular logos in background
    if (user) {
      preUploadPopularLogos();
    }
  }, [id, user]);

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
                onClick={() => navigate(-1)}
                className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md border border-white/30 p-0"
                aria-label="Kembali"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-800">{id ? 'Edit Dompet' : 'Tambah Dompet'}</h1>
                <p className="text-xs text-gray-500">{id ? 'Perbarui informasi dompet Anda' : 'Buat dompet baru untuk mengelola keuangan'}</p>
              </div>
            </div>
          </div>

            <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-sm border border-white/20 overflow-hidden">
            <div className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Preview Card */}
                  <div className="mb-6">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Preview Dompet</Label>
                    <Card
                      className={cn(
                          "p-5 transition-all duration-300 border-0 shadow-lg",
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
                            {logoPreview ? (
                              <div className="relative">
                                <img 
                                  src={logoPreview} 
                                  alt="Logo" 
                                  className="h-8 w-8 rounded-xl object-cover shadow-sm border border-white/30"
                                />
                              </div>
                            ) : (
                              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                {getWalletIcon(watchType)}
                              </div>
                            )}
                            <h3 className="font-semibold text-lg">{watchName || "Nama Dompet"}</h3>
                        </div>
                        <div>
                          <p className="text-sm opacity-90 mb-1">Saldo</p>
                          <p className="text-2xl font-bold">
                              {formatCurrency(watchBalance)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Smart Suggestions Mode */}
                  {!id && creationMode === null && (
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-700">Metode Pembuatan Dompet</Label>
                      <div className="grid grid-cols-1 gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCreationMode('smart')}
                          className="h-20 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 rounded-xl transition-all duration-200"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-2xl">🚀</div>
                            <div className="text-left">
                              <div className="font-medium text-gray-700 text-base">Saran Pintar</div>
                              <div className="text-sm text-gray-500">Pilih dari bank/e-wallet populer</div>
                            </div>
                          </div>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCreationMode('manual')}
                          className="h-20 bg-gradient-to-br from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 border-gray-200 rounded-xl transition-all duration-200"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-2xl">✏️</div>
                            <div className="text-left">
                              <div className="font-medium text-gray-700 text-base">Manual</div>
                              <div className="text-sm text-gray-500">Buat dengan nama kustom</div>
                            </div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Smart Suggestions Interface */}
                  {!id && creationMode === 'smart' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">Pilih Bank atau E-wallet</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCreationMode(null)}
                          className="text-xs"
                        >
                          Kembali
                        </Button>
                      </div>
                      
                      {/* Category Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant={selectedCategory === 'E-wallet' ? 'default' : 'outline'}
                          onClick={() => setSelectedCategory('E-wallet')}
                          className="h-14 rounded-xl text-base"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💳</span>
                            <span>E-wallet</span>
                          </div>
                        </Button>
                        <Button
                          type="button"
                          variant={selectedCategory === 'Rekening' ? 'default' : 'outline'}
                          onClick={() => setSelectedCategory('Rekening')}
                          className="h-14 rounded-xl text-base"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏦</span>
                            <span>Rekening</span>
                          </div>
                        </Button>
                      </div>

                      {/* Search Input */}
                      {selectedCategory && (
                        <Input
                          placeholder={`Cari ${selectedCategory.toLowerCase()}...`}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                        />
                      )}

                      {/* Suggestions Grid */}
                      {selectedCategory && (
                        <div className="space-y-3">
                          {logoUploading && (
                            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                              <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-600" />
                              <span className="text-sm text-blue-700">Menyimpan logo...</span>
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                            {filteredSuggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                type="button"
                                variant="outline"
                                onClick={() => handleSuggestionSelect(suggestion)}
                                disabled={logoUploading}
                                className="h-20 p-4 rounded-xl border-gray-200 hover:border-blue-300 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <div className="flex flex-col items-center gap-3">
                                  <img
                                    src={suggestion.logo}
                                    alt={suggestion.name}
                                    className="w-10 h-10 rounded-lg object-cover shadow-sm"
                                  />
                                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 text-center leading-tight">
                                    {suggestion.name}
                                  </span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Form Fields - Only show when in manual mode or editing */}
                  {(id || creationMode === 'manual') && (
                    <>
                      {/* Nama Dompet */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-sm font-medium text-gray-700">Nama Dompet</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Contoh: Dompet Harian" 
                                {...field} 
                                className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200" 
                              />
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
                          <FormItem className="space-y-3">
                            <FormLabel className="text-sm font-medium text-gray-700">Tipe Dompet</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200">
                                  <SelectValue placeholder="Pilih tipe dompet" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl border-gray-200">
                                <SelectItem value="cash" className="rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                      <Banknote className="h-4 w-4 text-green-600" />
                                    </div>
                                    <span>Uang Tunai</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="bank" className="rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                      <Landmark className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <span>Rekening Bank</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="investment" className="rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                      <CreditCard className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <span>E-Wallet</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="savings" className="rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                      <PiggyBank className="h-4 w-4 text-orange-600" />
                                    </div>
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
                          <FormItem className="space-y-3">
                            <FormLabel className="text-sm font-medium text-gray-700">Saldo {id ? 'Saat Ini' : 'Awal'}</FormLabel>
                            <FormControl>
                              <CurrencyInput
                                placeholder="0"
                                value={field.value}
                                onChange={(value) => field.onChange(value)}
                                className="h-12 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Logo Upload */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Logo Dompet (Opsional)</Label>
                        <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-200">
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
                          <p className="text-xs text-gray-500 mt-2">
                            Logo akan ditampilkan pada kartu dompet Anda. Format yang didukung: JPG, PNG, GIF (maks. 2MB)
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Color Selection - Show in manual mode or when editing */}
                  {(id || creationMode === 'manual') && (
                  <div className="space-y-3">
                    <FormLabel className="text-sm font-medium text-gray-700">Tema Warna</FormLabel>
                    
                    <Tabs value={colorTab} onValueChange={handleColorTabChange}>
                      <TabsList className="grid w-full grid-cols-2 h-9 rounded-lg p-0.5 mb-3 bg-gray-100">
                        <TabsTrigger value="solid" className="rounded-md text-xs h-8">Solid</TabsTrigger>
                        <TabsTrigger 
                          value="gradient" 
                          className="rounded-md text-xs h-8" 
                          disabled={!isPro}
                        >
                          {!isPro && <Lock className="h-3 w-3 mr-1" />}
                          Gradient
                          {!isPro && (
                            <span className="ml-1 text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded">Pro</span>
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
                                  <div className="flex flex-wrap gap-2">
                                    {WALLET_COLORS.map((color) => (
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
                                        title={`Warna ${color}`}
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
                                      title="Warna kustom"
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
                      ) : (
                        <>
                          {isPro ? (
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                {GRADIENTS.map((gradient) => (
                                  <button
                                    key={gradient.id}
                                    type="button"
                                    className={cn(
                                      "h-8 flex-1 rounded-lg cursor-pointer border transition-all duration-200 hover:scale-105",
                                      selectedGradient.id === gradient.id 
                                      ? "border-2 border-gray-900 shadow-md scale-105" 
                                      : "border border-gray-300 hover:border-gray-500"
                                    )}
                                    style={{
                                      background: `linear-gradient(to right, ${gradient.start}, ${gradient.end})` 
                                    }}
                                    onClick={() => {
                                      handleGradientChange(gradient);
                                      if (watchColor === 'custom') {
                                        form.setValue('color', WALLET_COLORS[0]);
                                      }
                                    }}
                                    aria-label={`Pilih gradient ${gradient.label}`}
                                    title={gradient.label}
                                  />
                                ))}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 p-2 bg-gray-50 rounded-lg border">
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-gray-600">Awal</Label>
                                  <div className="flex gap-1 items-center">
                                    <Input 
                                      type="color" 
                                      value={watchGradientStart}
                                      onChange={(e) => {
                                        form.setValue('gradientStart', e.target.value);
                                        setSelectedGradient({...GRADIENTS[0], id: 'custom'});
                                      }}
                                      className="w-6 h-6 p-0.5 rounded cursor-pointer border-0"
                                    />
                                    <Input 
                                      type="text" 
                                      value={watchGradientStart}
                                      onChange={(e) => {
                                        form.setValue('gradientStart', e.target.value);
                                        setSelectedGradient({...GRADIENTS[0], id: 'custom'});
                                      }}
                                      className="flex-1 h-6 text-xs border-0 bg-transparent"
                                    />
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-gray-600">Akhir</Label>
                                  <div className="flex gap-1 items-center">
                                    <Input 
                                      type="color" 
                                      value={watchGradientEnd}
                                      onChange={(e) => {
                                        form.setValue('gradientEnd', e.target.value);
                                        setSelectedGradient({...GRADIENTS[0], id: 'custom'});
                                      }}
                                      className="w-6 h-6 p-0.5 rounded cursor-pointer border-0"
                                    />
                                    <Input 
                                      type="text" 
                                      value={watchGradientEnd}
                                      onChange={(e) => {
                                        form.setValue('gradientEnd', e.target.value);
                                        setSelectedGradient({...GRADIENTS[0], id: 'custom'});
                                      }}
                                      className="flex-1 h-6 text-xs border-0 bg-transparent"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                  <Lock className="h-3 w-3 text-orange-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-orange-900">Fitur Pro</p>
                                  <p className="text-xs text-orange-800 mt-0.5">
                                    Gradient warna hanya tersedia untuk pengguna Pro.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </Tabs>
                  </div>
                  )}
                  
                  {/* Submit buttons - Only show when in manual mode or editing */}
                  {(id || creationMode === 'manual') && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (id) {
                            // Jika editing, kembali ke halaman sebelumnya
                            navigate(-1);
                          } else {
                            // Jika membuat baru, kembali ke home
                            navigate('/');
                          }
                        }}
                        className="w-full sm:w-auto order-2 sm:order-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50 transition-all duration-200"
                      >
                        Batal
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting || logoUploading} 
                        className="w-full sm:flex-1 order-1 sm:order-2 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                  )}

                  {/* Navigation buttons for mode selection */}
                  {!id && creationMode === null && (
                    <div className="flex justify-center pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/')}
                        className="w-full sm:w-auto h-12 rounded-xl border-gray-200 hover:bg-gray-50 transition-all duration-200"
                      >
                        Kembali ke Beranda
                      </Button>
                    </div>
                  )}
          </form>
        </Form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});

WalletForm.displayName = "WalletForm";
export default WalletForm;
