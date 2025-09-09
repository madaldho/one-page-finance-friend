import React, { useState, memo } from "react";
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

export const AssetUpdateForm = memo(({ asset }: AssetUpdateFormProps) => {
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
              size="icon"
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl transition-all duration-200 hover:shadow-md border border-white/30"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Update Nilai Aset</h1>
              <p className="text-xs text-gray-500">{asset.name}</p>
            </div>
          </div>
        </div>

        {/* Form dengan design yang modern */}
        <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {/* Header card */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <CircleDollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Perbarui Nilai Aset</h2>
                <p className="text-white/80 text-sm">Masukkan nilai terbaru untuk melacak perkembangan investasi</p>
              </div>
            </div>
          </div>

          {/* Form content */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nilai sebelumnya - dengan design card yang lebih menarik */}
              <div className="space-y-3">
                <Label htmlFor="currentValue" className="text-sm font-medium text-gray-700">Nilai Sebelumnya</Label>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-200 p-2 rounded-lg">
                      <CircleDollarSign className="text-gray-600 h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Nilai saat ini</div>
                      <div className="font-semibold text-lg text-gray-800">{formatCurrency(asset.current_value)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nilai terbaru dengan design yang lebih modern */}
              <div className="space-y-3">
                <Label htmlFor="value" className="text-sm font-medium text-gray-700">Nilai Terbaru</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded-lg">
                    <CircleDollarSign className="text-white h-4 w-4" />
                  </div>
                  <CurrencyInput
                    id="value"
                    value={newValue}
                    onChange={setNewValue}
                    className="pl-16 h-14 text-lg font-medium border-2 border-gray-200 focus:border-purple-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="Masukkan nilai terbaru..."
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Masukkan nilai pasar terkini atau hasil penilaian terbaru aset Anda</p>
              </div>

              {/* Tanggal dengan design yang konsisten */}
              <div className="space-y-3">
                <Label htmlFor="date" className="text-sm font-medium text-gray-700">Tanggal Update</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="h-12 border-2 border-gray-200 focus:border-purple-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200"
                  required
                />
                <p className="text-xs text-gray-500">Pilih tanggal ketika nilai ini berlaku</p>
              </div>

              {/* Preview perubahan nilai */}
              {newValue && newValue !== asset.current_value && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-700 font-medium">Preview Perubahan:</div>
                    <div className="flex items-center gap-2">
                      {newValue > asset.current_value ? (
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                          +{formatCurrency(newValue - asset.current_value)}
                        </div>
                      ) : (
                        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                          -{formatCurrency(asset.current_value - newValue)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {newValue > asset.current_value ? 'Nilai aset naik' : 'Nilai aset turun'} sebesar {(Math.abs((newValue - asset.current_value) / asset.current_value) * 100).toFixed(2)}%
                  </div>
                </div>
              )}

              {/* Action buttons dengan design yang modern */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-12 font-medium border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  onClick={() => navigate(-1)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  className="h-12 font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CircleDollarSign className="mr-2 h-4 w-4" />
                      Update Nilai
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
});

AssetUpdateForm.displayName = "AssetUpdateForm";
