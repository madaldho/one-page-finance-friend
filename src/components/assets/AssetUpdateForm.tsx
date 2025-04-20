
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
import { formatCurrency } from "@/lib/utils";

interface AssetUpdateFormProps {
  asset: Asset;
}

export function AssetUpdateForm({ asset }: AssetUpdateFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!value) {
      toast({
        title: "Nilai tidak boleh kosong",
        description: "Mohon masukkan nilai terbaru aset",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const newValue = parseFloat(value);
      
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

      <div className="bg-white rounded-lg shadow-sm p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentValue">Nilai Sebelumnya</Label>
            <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center">
              <span className="text-gray-500 mr-1">Rp</span>
              <span>{formatCurrency(asset.current_value, false)}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="value">Nilai Terbaru</Label>
            <div className="relative">
              <Input
                id="value"
                type="number"
                placeholder="0"
                min="0"
                step="1000"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                className="pl-8"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                Rp
              </span>
            </div>
            {value && !isNaN(parseFloat(value)) && (
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(parseFloat(value))}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="date">Tanggal Update</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Update Nilai Aset"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
