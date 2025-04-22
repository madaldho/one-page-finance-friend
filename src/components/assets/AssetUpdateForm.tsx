import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Asset } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatNumberWithSeparator, parseFormattedNumber } from "@/lib/utils";

interface AssetUpdateFormProps {
  asset: Asset;
}

export function AssetUpdateForm({ asset }: AssetUpdateFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formattedValue, setFormattedValue] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    if (numericValue) {
      const formattedVal = formatNumberWithSeparator(numericValue);
      setFormattedValue(formattedVal);
    } else {
      setFormattedValue("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formattedValue) {
      toast({
        title: "Nilai tidak boleh kosong",
        description: "Mohon masukkan nilai terbaru aset",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const newValue = parseFormattedNumber(formattedValue);
      
      if (isNaN(newValue) || newValue <= 0) {
        toast({
          title: "Nilai tidak valid",
          description: "Nilai aset harus berupa angka positif",
          variant: "destructive",
        });
        return;
      }

      // Add new value history entry
      const { error: historyError } = await supabase
        .from("asset_value_history")
        .insert({
          asset_id: asset.id,
          user_id: user?.id,
          value: newValue,
          date: date,
        });

      if (historyError) throw historyError;

      // Update asset current value
      const { error: updateError } = await supabase
        .from("assets")
        .update({
          current_value: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", asset.id)
        .eq("user_id", user?.id);

      if (updateError) throw updateError;

      toast({
        title: "Nilai aset diperbarui",
        description: "Nilai aset telah berhasil diperbarui",
      });

      navigate(`/assets/${asset.id}`);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Gagal memperbarui nilai",
        description: error.message || "Terjadi kesalahan saat memperbarui nilai aset",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
        <div>
          <h1 className="text-xl font-bold">Update Nilai Aset</h1>
          <p className="text-sm text-gray-500">{asset.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="currentValue" className="text-sm font-medium">Nilai Sebelumnya</Label>
            <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center">
              <span className="text-gray-500 mr-1">Rp</span>
              <span>{formatCurrency(asset.current_value).replace('Rp', '').trim()}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="value" className="text-sm font-medium">Nilai Terbaru</Label>
            <div className="relative mt-1">
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  Rp
                </span>
                <Input
                  id="value"
                  type="text"
                  placeholder="0"
                  value={formattedValue}
                  onChange={handleValueChange}
                  required
                  className="rounded-l-none"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="date" className="text-sm font-medium">Tanggal Update</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => navigate(-1)}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Update Nilai"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
