
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

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
  const [initialValue, setInitialValue] = useState(defaultValues?.initial_value?.toString() || "");
  const [purchaseDate, setPurchaseDate] = useState(defaultValues?.purchase_date || "");
  const [purchaseYear, setPurchaseYear] = useState(defaultValues?.purchase_year?.toString() || new Date().getFullYear().toString());

  // Generate years for dropdown (past 50 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 51 }, (_, i) => (currentYear - i).toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !initialValue || (!purchaseDate && !purchaseYear)) {
      toast({
        title: "Pengisian tidak lengkap",
        description: "Mohon lengkapi data yang diperlukan",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const initial_value = parseFloat(initialValue);
      
      if (isNaN(initial_value) || initial_value <= 0) {
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
        initial_value,
        current_value: initial_value, // Initial value is the current value for new assets
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
            value: initial_value,
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
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Gagal menyimpan data",
        description: error.message || "Terjadi kesalahan saat menyimpan data aset",
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
    <div className="container mx-auto p-4 pb-32 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">
          {isEditing ? "Edit Aset" : "Tambah Aset Baru"}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nama Aset</Label>
            <Input
              id="name"
              placeholder="Contoh: Rumah Jakarta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Kategori Aset</Label>
            <Select
              value={category}
              onValueChange={(value: "property" | "vehicle" | "gold" | "stock" | "other") => setCategory(value)}
              required
            >
              <SelectTrigger id="category">
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
            <Label htmlFor="initialValue">Nilai Awal</Label>
            <div className="relative">
              <Input
                id="initialValue"
                type="number"
                placeholder="0"
                min="0"
                step="1000"
                value={initialValue}
                onChange={(e) => setInitialValue(e.target.value)}
                required
                className="pl-8"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                Rp
              </span>
            </div>
            {initialValue && !isNaN(parseFloat(initialValue)) && (
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(parseFloat(initialValue))}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="purchaseDate">Tanggal Pembelian (Opsional)</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div>
            <Label htmlFor="purchaseYear">Tahun Pembelian</Label>
            <Select
              value={purchaseYear}
              onValueChange={(value) => setPurchaseYear(value)}
              required
            >
              <SelectTrigger id="purchaseYear">
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : isEditing ? (
              "Perbarui Aset"
            ) : (
              "Tambah Aset"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
