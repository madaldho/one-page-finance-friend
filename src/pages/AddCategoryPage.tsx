import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Search, Sparkles, Coffee, ShoppingBag, Car, Home, Utensils, GraduationCap, Heart, Gamepad2, Gift, Plane, Briefcase, Bus, Shirt, Calendar, PiggyBank, CreditCard, DollarSign, Book, Smartphone, Wifi, Building2, Zap } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNavigate, Link } from 'react-router-dom';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import ColorPicker from '@/components/ColorPicker';

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
};

// Icon mapping untuk display
const iconMap = {
  Utensils, Coffee, ShoppingBag, Car, Home, GraduationCap, Heart, Gamepad2, Gift, 
  Plane, Briefcase, Bus, Shirt, Calendar, PiggyBank, CreditCard, DollarSign, 
  Book, Smartphone, Wifi, Building2, Zap
};

// Daftar icon yang tersedia untuk manual selection
const availableIcons = [
  { name: 'Utensils', icon: Utensils },
  { name: 'Coffee', icon: Coffee },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Car', icon: Car },
  { name: 'Home', icon: Home },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Heart', icon: Heart },
  { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'Gift', icon: Gift },
  { name: 'Plane', icon: Plane },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Bus', icon: Bus },
  { name: 'Shirt', icon: Shirt },
  { name: 'Calendar', icon: Calendar },
  { name: 'PiggyBank', icon: PiggyBank },
  { name: 'CreditCard', icon: CreditCard },
  { name: 'DollarSign', icon: DollarSign },
  { name: 'Book', icon: Book },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Wifi', icon: Wifi },
  { name: 'Building2', icon: Building2 },
  { name: 'Zap', icon: Zap }
];

const AddCategoryPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    color: '#FF6B6B',
    icon: 'Utensils'
  });
  const [loading, setLoading] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(smartSuggestions.expense.slice(0, 5));
  const [showManualForm, setShowManualForm] = useState(false);

  // Update filtered suggestions when name or type changes
  useEffect(() => {
    const suggestions = smartSuggestions[formData.type];
    if (formData.name.trim() === '') {
      setFilteredSuggestions(suggestions.slice(0, 5));
    } else {
      const filtered = suggestions.filter(suggestion =>
        suggestion.name.toLowerCase().includes(formData.name.toLowerCase())
      ).slice(0, 5);
      setFilteredSuggestions(filtered);
    }
  }, [formData.name, formData.type]);

  const handleQuickAdd = async (suggestion: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          name: suggestion.name,
          type: formData.type,
          color: suggestion.color,
          icon: suggestion.icon,
          user_id: user!.id
        });

      if (error) throw error;

      toast({
        title: "Kategori Berhasil Ditambahkan",
        description: `Kategori "${suggestion.name}" telah ditambahkan`,
      });

      navigate('/categories');
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast({
        title: "Gagal Menambahkan Kategori",
        description: error.message || "Terjadi kesalahan saat menambahkan kategori",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Nama Kategori Diperlukan",
        description: "Silakan masukkan nama kategori",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          name: formData.name.trim(),
          type: formData.type,
          color: formData.color,
          icon: formData.icon,
          user_id: user!.id
        });

      if (error) throw error;

      toast({
        title: "Kategori Berhasil Ditambahkan",
        description: `Kategori "${formData.name}" telah ditambahkan`,
      });

      navigate('/categories');
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast({
        title: "Gagal Menambahkan Kategori",
        description: error.message || "Terjadi kesalahan saat menambahkan kategori",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || Utensils;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full mix-blend-multiply filter blur-xl"></div>
        </div>
        
        <div className="container mx-auto py-2 px-2 md:px-6 max-w-xl relative z-10 pt-6 md:pt-4">
          {/* Header dengan glassmorphism effect */}
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
            <div className="flex items-center gap-3">
              <Link 
                to="/categories"
                className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md border border-white/30"
                aria-label="Kembali"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Tambah Kategori</h1>
                <p className="text-xs text-gray-500">Buat kategori baru untuk transaksi</p>
              </div>
            </div>
          </div>

          {/* Type Selection */}
          <Card className="p-6 mb-6 backdrop-blur-sm bg-white/90 border-white/20 shadow-sm">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Jenis Kategori</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value: 'income' | 'expense') => setFormData({ ...formData, type: value })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="expense" />
                <Label htmlFor="expense" className="text-red-600 font-medium">Pengeluaran</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="income" />
                <Label htmlFor="income" className="text-green-600 font-medium">Pemasukan</Label>
              </div>
            </RadioGroup>
          </Card>

          {/* Search/Name Input */}
          <Card className="p-6 mb-6 backdrop-blur-sm bg-white/90 border-white/20 shadow-sm">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              <Search className="w-4 h-4 inline mr-2" />
              Cari atau Buat Kategori
            </Label>
            <Input
              placeholder="Ketik nama kategori..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full"
            />
          </Card>

          {/* Smart Suggestions */}
          {filteredSuggestions.length > 0 && (
            <Card className="p-6 mb-6 backdrop-blur-sm bg-white/90 border-white/20 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <Label className="text-sm font-medium text-gray-700">Saran Pintar</Label>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredSuggestions.map((suggestion, index) => {
                  const IconComponent = getIconComponent(suggestion.icon);
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto p-4 border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200"
                      onClick={() => handleQuickAdd(suggestion)}
                      disabled={loading}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: suggestion.color }}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-800">{suggestion.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{formData.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</p>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Manual Form Toggle */}
          <Card className="p-6 mb-6 backdrop-blur-sm bg-white/90 border-white/20 shadow-sm">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowManualForm(!showManualForm)}
            >
              {showManualForm ? 'Sembunyikan' : 'Buat'} Kategori Kustom
            </Button>
          </Card>

          {/* Manual Form */}
          {showManualForm && (
            <Card className="p-6 mb-6 backdrop-blur-sm bg-white/90 border-white/20 shadow-sm">
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Nama Kategori</Label>
                  <Input
                    placeholder="Masukkan nama kategori..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Pilih Warna</Label>
                  <ColorPicker
                    selectedColor={formData.color}
                    onColorSelect={(color) => setFormData({ ...formData, color })}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Pilih Icon</Label>
                  <div className="grid grid-cols-6 gap-3 max-h-48 overflow-y-auto p-1">
                    {availableIcons.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Button
                          key={item.name}
                          type="button"
                          variant={formData.icon === item.name ? "default" : "outline"}
                          className={`aspect-square p-3 ${
                            formData.icon === item.name 
                              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setFormData({ ...formData, icon: item.name })}
                        >
                          <IconComponent className="w-5 h-5" />
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/categories')}
                    disabled={loading}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || !formData.name.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Kategori'}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AddCategoryPage;
