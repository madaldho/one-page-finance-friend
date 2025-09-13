import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUser } from '@/hooks/useUser';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ArrowLeft } from "lucide-react"
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CurrencyInput } from '@/components/ui/currency-input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import Layout from '@/components/Layout';

// Tipe data untuk defaultValues yang lebih spesifik
interface AssetData {
  name?: string;
  category?: string;
  initial_value?: number;
  current_value?: number;
  purchase_date?: string;
  purchase_year?: number;
  quantity?: number;
  unit_type?: string;
  is_divisible?: boolean;
}

export const AssetForm = ({ isEditing, assetId, defaultValues }: {
  isEditing?: boolean;
  assetId?: string;
  defaultValues?: AssetData;
}) => {
  const [name, setName] = useState(defaultValues?.name || '');
  const [category, setCategory] = useState(defaultValues?.category || '');
  const [initialValue, setInitialValue] = useState(defaultValues?.initial_value || 0);
  const [currentValue, setCurrentValue] = useState(defaultValues?.current_value || 0);
  // Enable new fields for proper asset management
  const [quantity, setQuantity] = useState(defaultValues?.quantity || 1);
  const [unitType, setUnitType] = useState(defaultValues?.unit_type || 'unit');
  const [isDivisible, setIsDivisible] = useState(defaultValues?.is_divisible || false);
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(
    defaultValues?.purchase_date ? new Date(defaultValues.purchase_date) : undefined
  );
  const [purchaseYear, setPurchaseYear] = useState(defaultValues?.purchase_year?.toString() || '');
  const navigate = useNavigate();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  // Handle category change to auto-set divisibility and unit type
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    
    // Auto-set divisibility and unit type based on category
    switch (newCategory) {
      case 'stock':
        setIsDivisible(true);
        setUnitType('shares');
        setQuantity(1);
        break;
      case 'gold':
        setIsDivisible(true);
        setUnitType('grams');
        setQuantity(1);
        break;
      case 'property':
      case 'vehicle':
        setIsDivisible(false);
        setUnitType('unit');
        setQuantity(1);
        break;
      case 'other':
        setIsDivisible(true); // Allow divisible for flexibility
        setUnitType('unit'); // Default to unit, but can be changed
        setQuantity(1);
        break;
      default:
        setIsDivisible(false);
        setUnitType('unit');
        setQuantity(1);
        break;
    }
  };

  const getUnitLabel = (unitType: string) => {
    const labels = {
      shares: "lembar",
      grams: "gram",
      units: "unit",
      unit: "unit"
    };
    return labels[unitType as keyof typeof labels] || "unit";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validasi data dasar
      if (!name || !category || initialValue <= 0 || currentValue <= 0) {
        toast.error("Mohon lengkapi semua field yang diperlukan");
        setIsLoading(false);
        return;
      }
      
      // Validasi untuk field quantity dan unit type
      if (quantity <= 0) {
        toast.error("Jumlah asset harus lebih dari 0");
        setIsLoading(false);
        return;
      }
      
      if (category === 'other' && !unitType) {
        toast.error("Mohon pilih satuan untuk kategori lainnya");
        setIsLoading(false);
        return;
      }
      
      // Insert or update the asset
      let assetOperation;
      
      if (isEditing && assetId) {
        // Update existing asset
        assetOperation = supabase
          .from('assets')
          .update({
            name,
            category,
            initial_value: initialValue,
            current_value: currentValue,
            quantity,
            unit_type: unitType,
            is_divisible: isDivisible,
            purchase_date: purchaseDate ? purchaseDate.toISOString().split('T')[0] : null,
            purchase_year: purchaseYear ? parseInt(purchaseYear) : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', assetId)
          .select();
      } else {
        // Insert new asset
        assetOperation = supabase
          .from('assets')
          .insert({
            name,
            category,
            initial_value: initialValue,
            current_value: currentValue,
            quantity,
            unit_type: unitType,
            is_divisible: isDivisible,
            purchase_date: purchaseDate ? purchaseDate.toISOString().split('T')[0] : null,
            purchase_year: purchaseYear ? parseInt(purchaseYear) : null,
            user_id: user!.id
          })
          .select();
      }
      
      const { data: assetData, error: assetError } = await assetOperation;
      
      if (assetError) throw assetError;
      
      // Record the initial value in asset_value_history table
      if (assetData && assetData.length > 0) {
        // Create a record in asset_value_history
        const { error: historyError } = await supabase
          .from('asset_value_history')
          .insert({
            asset_id: assetData[0].id,
            value: currentValue,
            date: new Date().toISOString().split('T')[0],
            user_id: user!.id
          });
        
        if (historyError) {
          console.error("Error recording asset value history:", historyError);
          // Continue anyway since the main asset was created
        }
      }
      
      toast.success(isEditing ? "Aset berhasil diperbarui!" : "Aset berhasil ditambahkan!");
      navigate("/assets");
    } catch (error) {
      console.error("Error saving asset:", error);
      toast.error(isEditing ? "Gagal memperbarui aset" : "Gagal menambahkan aset");
    } finally {
      setIsLoading(false);
    }
  };

  const categoryOptions = [
    { value: "property", label: "Properti" },
    { value: "vehicle", label: "Kendaraan" },
    { value: "gold", label: "Emas" },
    { value: "stock", label: "Saham" },
    { value: "other", label: "Lainnya" }
  ];

  return (
    <Layout>
      <div className="container mx-auto py-2 px-2 md:px-6 max-w-md">
        {/* Header dengan glassmorphism effect */}
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
          <div className="flex items-center gap-3">
            <Link 
              to="/assets"
              className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md border border-white/30"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                {isEditing ? "Edit Aset" : "Tambah Aset Baru"}
              </h1>
              <p className="text-xs text-gray-500">
                {isEditing ? "Perbarui informasi aset" : "Tambahkan aset baru ke portofolio"}
              </p>
            </div>
          </div>
        </div>
        
        <Card className="shadow-sm border-0">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Aset</Label>
                <Input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama aset"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={category}
                  onValueChange={handleCategoryChange}
                  required
                >
                  <SelectTrigger id="category" aria-label="Pilih kategori aset">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity and Unit Type Fields */}
              {(category === 'stock' || category === 'gold' || category === 'other') && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-blue-800">
                      {category === 'stock' ? 'Informasi Saham' : 
                       category === 'gold' ? 'Informasi Emas' : 
                       'Informasi Asset'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">
                        Jumlah {category === 'stock' ? 'Lot/Lembar' : 
                                category === 'gold' ? 'Gram' :
                                category === 'other' ? (
                                  unitType === 'lot' ? 'Lot' :
                                  unitType === 'lembar' ? 'Lembar' :
                                  unitType === 'gram' ? 'Gram' :
                                  unitType === 'kg' ? 'Kilogram' :
                                  unitType === 'meter' ? 'Meter' :
                                  unitType === 'm2' ? 'Meter Persegi' :
                                  unitType === 'buah' ? 'Buah' :
                                  unitType === 'pcs' ? 'Pieces' :
                                  unitType === 'botol' ? 'Botol' :
                                  unitType === 'kotak' ? 'Kotak' :
                                  unitType === 'koin' ? 'Koin' :
                                  unitType === 'token' ? 'Token' :
                                  'Unit'
                                ) : 'Unit'}
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                        min="0.01"
                        step={category === 'stock' ? '1' : '0.01'}
                        placeholder="0"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="unitType">Satuan</Label>
                      {category === 'other' ? (
                        <Select value={unitType} onValueChange={setUnitType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih satuan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unit">Unit</SelectItem>
                            <SelectItem value="lot">Lot</SelectItem>
                            <SelectItem value="lembar">Lembar</SelectItem>
                            <SelectItem value="gram">Gram</SelectItem>
                            <SelectItem value="kg">Kilogram</SelectItem>
                            <SelectItem value="meter">Meter</SelectItem>
                            <SelectItem value="m2">Meter Persegi</SelectItem>
                            <SelectItem value="buah">Buah</SelectItem>
                            <SelectItem value="pcs">Pieces</SelectItem>
                            <SelectItem value="botol">Botol</SelectItem>
                            <SelectItem value="kotak">Kotak</SelectItem>
                            <SelectItem value="koin">Koin (Crypto)</SelectItem>
                            <SelectItem value="token">Token (Crypto)</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="unitType"
                          value={category === 'stock' ? 'lembar' : 
                                 category === 'gold' ? 'gram' : unitType}
                          disabled
                          className="bg-gray-100"
                        />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-blue-600">
                    {category === 'stock' ? 'Masukkan jumlah lot atau lembar saham yang Anda miliki' :
                     category === 'gold' ? 'Masukkan berat emas dalam gram' :
                     'Masukkan jumlah dan pilih satuan yang sesuai (unit, lot, gram, koin crypto, dll)'}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="initialValue">Nilai Awal</Label>
                <CurrencyInput
                  id="initialValue"
                  value={initialValue}
                  onChange={setInitialValue}
                  showPrefix={true}
                  placeholder="0"
                  required
                />
                <p className="text-xs text-gray-500">
                  Nilai ketika pertama kali Anda memperoleh aset ini
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentValue">Nilai Saat Ini</Label>
                <CurrencyInput
                  id="currentValue"
                  value={currentValue}
                  onChange={setCurrentValue}
                  showPrefix={true}
                  placeholder="0"
                  required
                />
                <p className="text-xs text-gray-500">
                  Perkiraan nilai aset saat ini
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Tanggal Pembelian</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !purchaseDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {purchaseDate ? (
                        format(purchaseDate, "PPP", { locale: id })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={purchaseDate}
                      onSelect={setPurchaseDate}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-gray-500">Opsional</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purchaseYear">Tahun Pembelian</Label>
                <Input
                  type="text"
                  id="purchaseYear"
                  value={purchaseYear}
                  onChange={(e) => setPurchaseYear(e.target.value)}
                  placeholder="Masukkan tahun pembelian"
                />
                <p className="text-xs text-gray-500">
                  Opsional, jika Anda tidak ingat tanggal pasti
                </p>
              </div>
              
              <div className="pt-4 grid grid-cols-2 gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/assets')}
                  disabled={isLoading}
                  className="w-full"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Memproses..." : isEditing ? "Perbarui Aset" : "Simpan Aset"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AssetForm;
