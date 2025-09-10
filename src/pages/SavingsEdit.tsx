import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Calendar, PiggyBank, Edit, Target, Info, Wallet as WalletIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Saving } from "@/types";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Progress } from "@/components/ui/progress";

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

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Tidak ada target";
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-300 to-indigo-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-300 to-purple-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          </div>

          <div className="container mx-auto py-2 px-2 md:px-6 max-w-2xl relative z-10 pt-6 pb-32">
            {/* Header */}
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
                  <h1 className="text-lg font-bold text-gray-800">Edit Tabungan</h1>
                  <p className="text-xs text-gray-500">Ubah pengaturan target tabungan</p>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 p-8">
              <div className="text-center">
                <div className="animate-spin w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-base font-medium text-gray-700">Memuat data tabungan...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-300 to-indigo-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-300 to-purple-400 rounded-full mix-blend-multiply filter blur-2xl"></div>
        </div>

        <div className="container mx-auto py-2 px-2 md:px-6 max-w-2xl relative z-10 pt-6 pb-32">
          {/* Header */}
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
                <h1 className="text-lg font-bold text-gray-800">Edit Tabungan</h1>
                <p className="text-xs text-gray-500">Ubah pengaturan target tabungan Anda</p>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Edit className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Edit Target Tabungan</h2>
                  <p className="text-white/80 text-sm">Perbarui detail dan target tabungan Anda</p>
                </div>
              </div>
            </div>
            
            <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50">
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-lg mt-0.5">
                  <Info className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Perubahan akan mempengaruhi perhitungan progres dan target pencapaian tabungan Anda.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <PiggyBank className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Detail Tabungan</h3>
                  <p className="text-white/80 text-sm">Masukkan informasi tabungan yang baru</p>
                </div>
              </div>
            </div>

            <form className="p-6 space-y-6" onSubmit={handleSubmit}>
              {/* Savings Category */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <WalletIcon className="h-4 w-4 text-gray-500" />
                  Jenis Tabungan*
                </Label>
                <RadioGroup
                  value={formData.savings_category}
                  onValueChange={handleRadioChange as (value: string) => void}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className={`relative flex items-start space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    formData.savings_category === 'fisik' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}>
                    <RadioGroupItem value="fisik" id="fisik" className="mt-1" />
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="fisik" className="font-medium text-gray-900 cursor-pointer">
                        Celengan Fisik
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Uang disimpan secara terpisah (celengan, dompet khusus)
                      </p>
                    </div>
                  </div>
                  <div className={`relative flex items-start space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    formData.savings_category === 'digital' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}>
                    <RadioGroupItem value="digital" id="digital" className="mt-1" />
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="digital" className="font-medium text-gray-900 cursor-pointer">
                        Celengan Digital
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Uang tetap di rekening tapi dialokasikan khusus
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  Nama Target Tabungan*
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Contoh: Dana Darurat, Liburan ke Bali, Beli Motor"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              {/* Target Amount */}
              <div className="space-y-2">
                <Label htmlFor="target_amount" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  Jumlah Target*
                </Label>
                <CurrencyInput
                  id="target_amount"
                  showPrefix={true}
                  placeholder="Masukkan jumlah target tabungan"
                  value={Number(formData.target_amount)}
                  onChange={(value) => setFormData({...formData, target_amount: value.toString()})}
                  disabled={submitting}
                  className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              {/* Target Date */}
              <div className="space-y-2">
                <Label htmlFor="target_date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Tanggal Target (Opsional)
                </Label>
                <Input
                  id="target_date"
                  name="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={handleChange}
                  className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Deskripsi (Opsional)
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Tambahkan deskripsi atau catatan tentang target tabungan ini..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="h-12 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan Perubahan...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Simpan Perubahan
                    </div>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/savings")}
                  disabled={submitting}
                  className="h-12 border-gray-200 hover:bg-gray-50"
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SavingsEdit; 