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
import { CurrencyInput } from "@/components/ui/currency-input";

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
    } catch (error: unknown) {
      console.error("Error adding savings target:", error instanceof Error ? error.message : String(error));
      toast({
        title: "Gagal Menambahkan Target",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menambahkan target tabungan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-200 to-gray-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="container mx-auto py-2 px-2 md:px-6 max-w-2xl relative z-10 pt-6 md:pt-4 pb-32">
          {/* Header dengan glassmorphism effect */}
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
            <div className="flex items-center gap-3">
              <Link 
                to="/savings"
                className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md border border-white/30"
                aria-label="Kembali"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Tambah Target Tabungan</h1>
                <p className="text-xs text-gray-500">Buat target tabungan untuk mencapai impian Anda</p>
              </div>
            </div>
          </div>

          {/* Form dengan design yang modern */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header card */}
            <div className="flex items-center gap-3 p-6 bg-orange-50/50 border-b border-gray-100">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Target Tabungan Baru</h2>
                <p className="text-sm text-gray-600">Mulai menabung untuk meraih tujuan finansial Anda</p>
              </div>
            </div>

            {/* Form content */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Jenis Tabungan */}
                <div className="space-y-3">
                  <Label htmlFor="savings_category" className="text-sm font-medium text-gray-700">Jenis Tabungan*</Label>
                  <RadioGroup
                    value={formData.savings_category}
                    onValueChange={handleRadioChange as (value: string) => void}
                    className="grid gap-3"
                  >
                    <div className={`flex items-start space-x-3 border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                      formData.savings_category === 'fisik' 
                        ? 'border-orange-400 bg-orange-50/50' 
                        : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30'
                    }`}>
                      <RadioGroupItem value="fisik" id="fisik" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-orange-100 p-1.5 rounded-lg">
                            <PiggyBank className="h-3 w-3 text-orange-600" />
                          </div>
                          <Label htmlFor="fisik" className="font-medium text-gray-800 text-sm">Celengan Fisik (Cash)</Label>
                        </div>
                        <p className="text-xs text-gray-600">Uang disimpan terpisah secara fisik - celengan, dompet lain, atau tempat khusus</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start space-x-3 border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                      formData.savings_category === 'digital' 
                        ? 'border-orange-400 bg-orange-50/50' 
                        : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30'
                    }`}>
                      <RadioGroupItem value="digital" id="digital" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-orange-100 p-1.5 rounded-lg">
                            <Calendar className="h-3 w-3 text-orange-600" />
                          </div>
                          <Label htmlFor="digital" className="font-medium text-gray-800 text-sm">Celengan Digital (Saldo)</Label>
                        </div>
                        <p className="text-xs text-gray-600">Uang tetap di rekening tetapi dipisahkan sebagai sub-balance khusus tabungan</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Nama Target */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nama Target*</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Contoh: Laptop Gaming, Liburan Bali, Dana Darurat..."
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-11 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-lg bg-white"
                    required
                  />
                  <p className="text-xs text-gray-500">Beri nama yang memotivasi untuk target tabungan Anda</p>
                </div>

                {/* Jumlah Target */}
                <div className="space-y-2">
                  <Label htmlFor="target_amount" className="text-sm font-medium text-gray-700">Jumlah Target*</Label>
                  <CurrencyInput
                    id="target_amount"
                    showPrefix={true}
                    placeholder="Masukkan jumlah target..."
                    value={Number(formData.target_amount)}
                    onChange={(value) => setFormData({...formData, target_amount: value.toString()})}
                    disabled={loading}
                    className="h-11 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-lg bg-white"
                  />
                  <p className="text-xs text-gray-500">Tentukan berapa total yang ingin Anda tabung</p>
                </div>

                {/* Tanggal Target */}
                <div className="space-y-2">
                  <Label htmlFor="target_date" className="text-sm font-medium text-gray-700">Tanggal Target (Opsional)</Label>
                  <Input
                    id="target_date"
                    name="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-11 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-lg bg-white"
                  />
                  <p className="text-xs text-gray-500">Kapan Anda ingin mencapai target ini? (opsional)</p>
                </div>

                {/* Deskripsi */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Ceritakan motivasi Anda... Untuk apa tabungan ini? Mengapa penting bagi Anda?"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={loading}
                    rows={3}
                    className="border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-lg bg-white resize-none"
                  />
                  <p className="text-xs text-gray-500">Tulis motivasi atau tujuan tabungan untuk tetap semangat</p>
                </div>

                {/* Preview Card - Tampilan target yang akan dibuat */}
                {(formData.name || formData.target_amount) && (
                  <div className="bg-gradient-to-r from-orange-50 to-gray-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-gradient-to-r from-orange-600 to-gray-700 p-2 rounded-lg">
                        <PiggyBank className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-sm font-medium text-orange-700">Preview Target Tabungan</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Nama:</span>
                        <span className="text-sm font-medium">{formData.name || "Belum diisi"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Target:</span>
                        <span className="text-sm font-medium">
                          {formData.target_amount ? `Rp ${Number(formData.target_amount).toLocaleString()}` : "Belum diisi"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Jenis:</span>
                        <span className="text-sm font-medium capitalize">{formData.savings_category}</span>
                      </div>
                      {formData.target_date && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Target Tanggal:</span>
                          <span className="text-sm font-medium">{new Date(formData.target_date).toLocaleDateString('id-ID')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col gap-3 pt-4">
                  <Button 
                    type="submit" 
                    className="h-11 font-medium bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-lg" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Menyimpan...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <PiggyBank className="h-4 w-4" />
                        Tambah Target
                      </div>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-11 font-medium border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all duration-200 rounded-lg"
                    onClick={() => navigate("/savings")}
                    disabled={loading}
                  >
                    Kembali ke Tabungan
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AddSavingsTarget;
