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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-300 to-yellow-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
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
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            {/* Header card */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <PiggyBank className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Target Tabungan Baru</h2>
                  <p className="text-white/80 text-sm">Mulai menabung untuk meraih tujuan finansial Anda</p>
                </div>
              </div>
            </div>

            {/* Form content */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Jenis Tabungan dengan design yang modern */}
                <div className="space-y-3">
                  <Label htmlFor="savings_category" className="text-sm font-medium text-gray-700">Jenis Tabungan*</Label>
                  <RadioGroup
                    value={formData.savings_category}
                    onValueChange={handleRadioChange as (value: string) => void}
                    className="grid gap-4"
                  >
                    <div className={`flex items-start space-x-4 border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                      formData.savings_category === 'fisik' 
                        ? 'border-amber-400 bg-amber-50' 
                        : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50'
                    }`}>
                      <RadioGroupItem value="fisik" id="fisik" className="border-amber-500 text-amber-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-2 rounded-lg">
                            <PiggyBank className="h-4 w-4 text-amber-600" />
                          </div>
                          <Label htmlFor="fisik" className="font-semibold text-gray-800">Celengan Fisik (Cash)</Label>
                        </div>
                        <p className="text-sm text-gray-600">Uang disimpan terpisah secara fisik - celengan, dompet lain, atau tempat khusus</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start space-x-4 border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                      formData.savings_category === 'digital' 
                        ? 'border-amber-400 bg-amber-50' 
                        : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50'
                    }`}>
                      <RadioGroupItem value="digital" id="digital" className="border-amber-500 text-amber-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-gradient-to-r from-orange-100 to-yellow-100 p-2 rounded-lg">
                            <Calendar className="h-4 w-4 text-orange-600" />
                          </div>
                          <Label htmlFor="digital" className="font-semibold text-gray-800">Celengan Digital (Saldo)</Label>
                        </div>
                        <p className="text-sm text-gray-600">Uang tetap di rekening tetapi dipisahkan sebagai sub-balance khusus tabungan</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Nama Target dengan design yang menarik */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nama Target*</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Contoh: Laptop Gaming, Liburan Bali, Dana Darurat..."
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-12 border-2 border-gray-200 focus:border-amber-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200"
                    required
                  />
                  <p className="text-xs text-gray-500">Beri nama yang memotivasi untuk target tabungan Anda</p>
                </div>

                {/* Jumlah Target dengan design yang modern */}
                <div className="space-y-3">
                  <Label htmlFor="target_amount" className="text-sm font-medium text-gray-700">Jumlah Target*</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-amber-500 to-orange-500 p-2 rounded-lg">
                      <PiggyBank className="text-white h-4 w-4" />
                    </div>
                    <CurrencyInput
                      id="target_amount"
                      showPrefix={false}
                      placeholder="Masukkan jumlah target..."
                      value={Number(formData.target_amount)}
                      onChange={(value) => setFormData({...formData, target_amount: value.toString()})}
                      disabled={loading}
                      className="pl-16 h-14 text-lg font-medium border-2 border-gray-200 focus:border-amber-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Tentukan berapa total yang ingin Anda tabung</p>
                </div>

                {/* Tanggal Target dengan design yang konsisten */}
                <div className="space-y-3">
                  <Label htmlFor="target_date" className="text-sm font-medium text-gray-700">Tanggal Target (Opsional)</Label>
                  <div className="relative">
                    <Input
                      id="target_date"
                      name="target_date"
                      type="date"
                      value={formData.target_date}
                      onChange={handleChange}
                      disabled={loading}
                      className="h-12 border-2 border-gray-200 focus:border-amber-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-amber-500">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Kapan Anda ingin mencapai target ini? (opsional)</p>
                </div>

                {/* Deskripsi dengan design yang menarik */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Ceritakan motivasi Anda... Untuk apa tabungan ini? Mengapa penting bagi Anda?"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={loading}
                    rows={4}
                    className="border-2 border-gray-200 focus:border-amber-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200 resize-none"
                  />
                  <p className="text-xs text-gray-500">Tulis motivasi atau tujuan tabungan untuk tetap semangat</p>
                </div>

                {/* Preview Card - Tampilan target yang akan dibuat */}
                {(formData.name || formData.target_amount) && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-2 rounded-lg">
                        <PiggyBank className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-sm font-medium text-amber-700">Preview Target Tabungan</div>
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

                {/* Action buttons dengan design yang modern */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-12 font-medium border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                    onClick={() => navigate("/savings")}
                    disabled={loading}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    className="h-12 font-medium bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <PiggyBank className="mr-2 h-4 w-4" />
                        Tambah Target
                      </>
                    )}
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
