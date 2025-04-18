
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Calendar, PiggyBank } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const AddSavingsTarget = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    savings_category: "fisik" as "fisik" | "digital",
    target_amount: "",
    target_date: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
      
      const savingsData = {
        name: formData.name.trim(),
        target_amount: Number(formData.target_amount),
        current_amount: 0,
        target_date: formData.target_date || null,
        description: formData.description.trim() || null,
        savings_category: formData.savings_category,
        user_id: user?.id,
      };

      const { error } = await supabase
        .from("savings")
        .insert(savingsData);

      if (error) throw error;

      toast({
        title: "Target Tabungan Ditambahkan",
        description: "Target tabungan baru berhasil dibuat",
      });

      navigate("/savings");
    } catch (error: any) {
      console.error("Error adding savings target:", error.message);
      toast({
        title: "Gagal Menambahkan Target",
        description: error.message || "Terjadi kesalahan saat menambahkan target tabungan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-xl">
        <div className="flex items-center mb-6">
          <Link to="/savings" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Tambah Target Tabungan</h1>
        </div>

        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-4">
            Buat target tabungan baru untuk melacak progres Anda
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
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_amount">Jumlah Target*</Label>
              <Input
                id="target_amount"
                name="target_amount"
                type="number"
                placeholder="1000000"
                value={formData.target_amount}
                onChange={handleChange}
                disabled={loading}
                required
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
                  disabled={loading}
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
                placeholder="Untuk apa Anda menabung?"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                rows={3}
              />
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-amber-500 hover:bg-amber-600" 
                disabled={loading}
              >
                {loading ? "Menyimpan..." : "Tambah Target"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddSavingsTarget;
