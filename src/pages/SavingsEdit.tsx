import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Calendar, PiggyBank } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Saving } from "@/types";
import { CurrencyInput } from "@/components/ui/currency-input";

const SavingsEdit = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    name: "",
    savings_category: "fisik" as "fisik" | "digital",
    target_amount: "",
    target_date: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    if (user && id) {
      fetchSavingData();
    }
  }, [user, id]);
  
  const fetchSavingData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("savings")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();
        
      if (error) throw error;
      
      const saving = data as Saving;
      
      setFormData({
        name: saving.name || "",
        savings_category: saving.savings_category as "fisik" | "digital" || "fisik",
        target_amount: saving.target_amount?.toString() || "",
        target_date: saving.target_date || "",
        description: saving.description || "",
      });
      
    } catch (error: any) {
      console.error("Error fetching savings data:", error.message);
      toast({
        title: "Gagal memuat data",
        description: "Tabungan tidak ditemukan atau terjadi kesalahan",
        variant: "destructive",
      });
      navigate("/savings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: "fisik" | "digital") => {
    setFormData(prev => ({ ...prev, savings_category: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Nama Target Diperlukan",
        description: "Masukkan nama untuk target tabungan Anda",
        variant: "destructive",
      });
      return;
    }

    if (!formData.target_amount || isNaN(Number(formData.target_amount)) || Number(formData.target_amount) <= 0) {
      toast({
        title: "Jumlah Target Tidak Valid",
        description: "Masukkan jumlah target yang valid",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const savingsData = {
        name: formData.name.trim(),
        target_amount: Number(formData.target_amount),
        target_date: formData.target_date || null,
        description: formData.description.trim() || null,
        savings_category: formData.savings_category,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("savings")
        .update(savingsData)
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Target Tabungan Diperbarui",
        description: "Target tabungan berhasil diperbarui",
      });

      navigate("/savings");
    } catch (error: any) {
      console.error("Error updating savings target:", error.message);
      toast({
        title: "Gagal Memperbarui Target",
        description: error.message || "Terjadi kesalahan saat memperbarui target tabungan",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4 pb-32 max-w-xl">
          <div className="flex items-center mb-6">
            <Link to="/savings" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold">Edit Target Tabungan</h1>
          </div>
          <div className="text-center py-8">
            <p>Memuat data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-xl">
        <div className="flex items-center mb-6">
          <Link to="/savings" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Edit Target Tabungan</h1>
        </div>

        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-4">
            Ubah pengaturan target tabungan Anda
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="savings_category">Jenis Tabungan*</Label>
              <RadioGroup
                value={formData.savings_category}
                onValueChange={handleRadioChange as (value: string) => void}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:border-amber-500">
                  <RadioGroupItem value="fisik" id="fisik" className="border-amber-500 text-amber-500" />
                  <div>
                    <Label htmlFor="fisik" className="font-medium">Celengan Fisik (Cash)</Label>
                    <p className="text-xs text-gray-500">Uang disimpan di tempat berbeda (celengan, dompet lain)</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:border-amber-500">
                  <RadioGroupItem value="digital" id="digital" className="border-amber-500 text-amber-500" />
                  <div>
                    <Label htmlFor="digital" className="font-medium">Celengan Digital (Saldo)</Label>
                    <p className="text-xs text-gray-500">Uang tetap di rekening tapi dipisahkan (sub-balance)</p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama Target*</Label>
              <Input
                id="name"
                name="name"
                placeholder="mis. Laptop Baru"
                value={formData.name}
                onChange={handleChange}
                disabled={submitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_amount">Jumlah Target*</Label>
              <CurrencyInput
                id="target_amount"
                showPrefix={true}
                placeholder="1000000"
                value={Number(formData.target_amount)}
                onChange={(value) => setFormData({...formData, target_amount: value.toString()})}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_date">Tanggal Target (Opsional)</Label>
              <div className="flex items-center border rounded-md">
                <Input
                  id="target_date"
                  name="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={handleChange}
                  disabled={submitting}
                  className="border-0"
                />
                <div className="px-3 text-gray-400">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Deskripsi atau catatan tentang tabungan ini"
                value={formData.description}
                onChange={handleChange}
                disabled={submitting}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate("/savings")}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                className="w-full bg-amber-500 hover:bg-amber-600" 
                disabled={submitting}
              >
                {submitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default SavingsEdit; 