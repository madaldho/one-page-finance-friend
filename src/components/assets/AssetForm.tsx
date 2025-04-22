import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { CurrencyInput } from "@/components/ui/currency-input";
import Layout from "@/components/Layout";

interface AssetFormProps {
  isEditing?: boolean;
  assetId?: string;
  defaultValues?: {
    name: string;
    category: "property" | "vehicle" | "gold" | "stock" | "other";
    initial_value: number;
    purchase_date?: string;
    purchase_year: number;
  };
}

export function AssetForm({ isEditing = false, assetId, defaultValues }: AssetFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(defaultValues?.name || "");
  const [category, setCategory] = useState<"property" | "vehicle" | "gold" | "stock" | "other">(
    defaultValues?.category || "property"
  );
  const [initialValue, setInitialValue] = useState<number>(defaultValues?.initial_value || 0);
  const [purchaseDate, setPurchaseDate] = useState(defaultValues?.purchase_date || "");
  const [purchaseYear, setPurchaseYear] = useState(defaultValues?.purchase_year?.toString() || new Date().getFullYear().toString());

  // Generate years for dropdown (past 50 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 51 }, (_, i) => (currentYear - i).toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || initialValue <= 0 || (!purchaseDate && !purchaseYear)) {
      toast({
        title: "Pengisian tidak lengkap",
        description: "Mohon lengkapi data yang diperlukan",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      if (initialValue <= 0) {
        toast({
          title: "Nilai tidak valid",
          description: "Nilai aset harus berupa angka positif",
          variant: "destructive",
        });
        return;
      }

      const data = {
        name,
        category,
        initial_value: initialValue,
        current_value: initialValue, // Initial value is the current value for new assets
        purchase_date: purchaseDate || null,
        purchase_year: parseInt(purchaseYear),
        user_id: user?.id,
      };

      let result;
      
      if (isEditing && assetId) {
        // Update existing asset
        result = await supabase
          .from("assets")
          .update(data)
          .eq("id", assetId)
          .eq("user_id", user?.id);
      } else {
        // Create new asset
        result = await supabase
          .from("assets")
          .insert({
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

      if (result.error) throw result.error;

      // For new assets, create an initial value history entry
      if (!isEditing) {
        const { data: assetData } = await supabase
          .from("assets")
          .select("id")
          .eq("name", name)
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (assetData) {
          await supabase.from("asset_value_history").insert({
            asset_id: assetData.id,
            user_id: user?.id,
            value: initialValue,
            date: new Date().toISOString().split("T")[0],
          });
        }
      }

      toast({
        title: isEditing ? "Aset diperbarui" : "Aset ditambahkan",
        description: isEditing
          ? "Data aset telah berhasil diperbarui"
          : "Aset baru telah berhasil ditambahkan",
      });

      navigate("/assets");
    } catch (error: unknown) {
      console.error("Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast({
        title: "Gagal menyimpan data",
        description: errorMessage || "Terjadi kesalahan saat menyimpan data aset",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { value: "property", label: "Properti" },
    { value: "vehicle", label: "Kendaraan" },
    { value: "gold", label: "Emas" },
    { value: "stock", label: "Saham" },
    { value: "other", label: "Lainnya" },
  ];

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-xl">
        <div className="flex items-center mb-6">
          <Link to="/assets" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">
            {isEditing ? "Edit Aset" : "Tambah Aset Baru"}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium mb-1">Nama Aset</Label>
              <Input
                id="name"
                placeholder="Contoh: Rumah Jakarta"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="category" className="block text-sm font-medium mb-1">Kategori Aset</Label>
              <Select
                value={category}
                onValueChange={(value: "property" | "vehicle" | "gold" | "stock" | "other") => setCategory(value)}
                required
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Pilih kategori aset" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="initialValue" className="block text-sm font-medium mb-1">Nilai Awal</Label>
              <CurrencyInput
                showPrefix={true}
                value={initialValue}
                onChange={(value) => setInitialValue(value)}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="purchaseDate" className="block text-sm font-medium mb-1">Tanggal Pembelian (Opsional)</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="purchaseYear" className="block text-sm font-medium mb-1">Tahun Pembelian</Label>
              <Select
                value={purchaseYear}
                onValueChange={(value) => setPurchaseYear(value)}
                required
              >
                <SelectTrigger id="purchaseYear" className="w-full">
                  <SelectValue placeholder="Pilih tahun pembelian" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/assets")}
                disabled={loading}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : isEditing ? (
                  "Perbarui Aset"
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
