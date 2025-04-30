import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CircleDollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Asset } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";

interface AssetUpdateFormProps {
  asset: Asset;
}

export function AssetUpdateForm({ asset }: AssetUpdateFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [newValue, setNewValue] = useState<number>(asset.current_value);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newValue) {
      toast({
        title: "Nilai tidak boleh kosong",
        description: "Mohon masukkan nilai terbaru aset",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
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
        description: "Terjadi kesalahan saat memperbarui nilai aset",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 pb-32 max-w-md">
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

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Perbarui Nilai Aset</CardTitle>
          <CardDescription>
            Silakan masukkan nilai terbaru dari aset Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="currentValue" className="text-sm">Nilai Sebelumnya</Label>
              <div className="bg-gray-50 p-3 rounded-md flex items-center gap-3">
                <CircleDollarSign className="text-gray-400 h-5 w-5" />
                <span className="font-medium">{formatCurrency(asset.current_value)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value" className="text-sm">Nilai Terbaru</Label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5 z-10" />
                <CurrencyInput
                  id="value"
                  value={newValue}
                  onChange={setNewValue}
                  className="pl-10"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm">Tanggal Update</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
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
                className="w-full bg-purple-600 hover:bg-purple-700" 
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
        </CardContent>
      </Card>
    </div>
  );
}
