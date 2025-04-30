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
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(
    defaultValues?.purchase_date ? new Date(defaultValues.purchase_date) : undefined
  );
  const [purchaseYear, setPurchaseYear] = useState(defaultValues?.purchase_year?.toString() || '');
  const navigate = useNavigate();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validasi data
      if (!name || !category || initialValue <= 0 || currentValue <= 0) {
        toast.error("Mohon lengkapi semua field yang diperlukan");
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
      <div className="container mx-auto p-4 pb-32 max-w-md">
        <div className="flex items-center mb-6">
          <Link to="/assets" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">
            {isEditing ? "Edit Aset" : "Tambah Aset Baru"}
          </h1>
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
                  onValueChange={setCategory}
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
                  type="number"
                  id="purchaseYear"
                  value={purchaseYear}
                  onChange={(e) => setPurchaseYear(e.target.value)}
                  min="1900"
                  max={new Date().getFullYear()}
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
