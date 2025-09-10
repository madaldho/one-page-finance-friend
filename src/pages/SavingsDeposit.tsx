import React, { useState, useEffect, FormEvent } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Calendar, PiggyBank, Wallet as WalletIcon, DollarSign, TrendingUp, Info } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Saving, Wallet } from "@/types";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";

const SavingsDeposit = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [saving, setSaving] = useState<Saving | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    wallet_id: "",
    amount: "",
    notes: ""
  });
  
  useEffect(() => {
    if (user && id) {
      fetchData();
    }
  }, [user, id]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch saving
      const { data: savingData, error: savingError } = await supabase
        .from("savings")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();
      
      if (savingError) throw savingError;
      setSaving(savingData as Saving);
      
      // Fetch wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user?.id);
      
      if (walletsError) throw walletsError;
      setWallets(walletsData as Wallet[]);
      
    } catch (error: any) {
      console.error("Error fetching data:", error.message);
      toast({
        title: "Gagal memuat data",
        description: "Terjadi kesalahan saat mengambil data",
        variant: "destructive",
      });
      navigate("/savings");
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!saving) return;
    
    // Validasi input
    if (!formData.wallet_id) {
      toast({
        title: "Pilih Dompet",
        description: "Pilih dompet sumber untuk setoran",
        variant: "destructive",
      });
      return;
    }
    
    const amount = Number(formData.amount);
    if (!amount || amount <= 0) {
      toast({
        title: "Jumlah Tidak Valid",
        description: "Masukkan jumlah setoran yang valid",
        variant: "destructive",
      });
      return;
    }
    
    // Cek apakah dompet memiliki saldo cukup
    const sourceWallet = wallets.find(w => w.id === formData.wallet_id);
    if (!sourceWallet) {
      toast({
        title: "Dompet Tidak Ditemukan",
        description: "Dompet sumber tidak valid",
        variant: "destructive",
      });
      return;
    }
    
    if (sourceWallet.balance < amount) {
      toast({
        title: "Saldo Tidak Cukup",
        description: "Saldo dompet tidak mencukupi untuk melakukan setoran",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Start a Supabase transaction
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const amount = Number(formData.amount);
      const sourceWallet = wallets.find(w => w.id === formData.wallet_id);
      if (!sourceWallet) throw new Error("Wallet not found");

      // 1. Insert transaction record for expense (money going from wallet to savings)
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          title: `Setor ke Tabungan: ${saving.name}`,
          amount: amount,
          type: "expense",
          date: formData.date,
          description: formData.notes || `Setoran tabungan untuk ${saving.name}`,
          wallet_id: formData.wallet_id,
          category: "Tabungan",
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // 2. Update source wallet balance
      const { error: walletError } = await supabase
        .from("wallets")
        .update({ balance: sourceWallet.balance - amount })
        .eq("id", formData.wallet_id);
        
      if (walletError) throw walletError;
      
      // 3. Update savings balance and record savings transaction
      const newAmount = saving.current_amount + amount;
      const { error: savingError } = await supabase
        .from("savings")
        .update({ current_amount: newAmount })
        .eq("id", saving.id);
        
      if (savingError) throw savingError;
      
      // 4. Record in savings_transactions
      const { error: savingsTransactionError } = await supabase
        .from("savings_transactions")
        .insert({
          savings_id: saving.id,
          wallet_id: formData.wallet_id,
          amount: amount,
          type: "deposit",
          date: formData.date,
          notes: formData.notes || null,
          user_id: user.id
        });
        
      if (savingsTransactionError) throw savingsTransactionError;
      
      toast({
        title: "Setoran Berhasil",
        description: `Berhasil menyetor ${formatCurrency(amount)} ke tabungan ${saving.name}`,
      });
      
      navigate("/savings");
      
    } catch (error: any) {
      console.error("Error depositing to savings:", error.message);
      toast({
        title: "Gagal Melakukan Setoran",
        description: error.message || "Terjadi kesalahan saat memproses setoran",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const calculateProgress = (current: number, target: number) => {
    return (current / target) * 100;
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

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-slate-200 to-gray-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mix-blend-multiply filter blur-3xl"></div>
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
                <h1 className="text-lg font-bold text-gray-800">Setor Dana</h1>
                <p className="text-xs text-gray-500">Tambahkan dana ke tabungan Anda</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 p-8">
              <div className="text-center">
                <div className="animate-spin w-10 h-10 border-3 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-base font-medium text-gray-700">Memuat data tabungan...</p>
              </div>
            </div>
          ) : !saving ? (
            <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PiggyBank className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="font-semibold text-xl mb-3 text-gray-800">Tabungan Tidak Ditemukan</h3>
                <p className="text-sm text-gray-500 mb-6">Tabungan yang Anda cari tidak dapat ditemukan</p>
                <Button asChild className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700">
                  <Link to="/savings">Kembali ke Tabungan</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Saving Info Card */}
              <div className="backdrop-blur-sm bg-white/95 rounded-2xl shadow-md border border-gray-200/50 overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-slate-600 to-gray-700 p-5 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                      <PiggyBank className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">{saving.name}</h2>
                      <p className="text-white/70 text-sm capitalize">
                        {saving.savings_category === "fisik" ? "Tabungan Fisik" : "Tabungan Digital"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/70">Terkumpul: {formatCurrency(saving.current_amount)}</span>
                      <span className="font-medium">Target: {formatCurrency(saving.target_amount)}</span>
                    </div>
                    
                    <Progress
                      value={calculateProgress(saving.current_amount, saving.target_amount)}
                      className="h-2 bg-white/15"
                      indicatorClassName="bg-white/90"
                    />
                    
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Target: {formatDate(saving.target_date)}</span>
                      </div>
                      <span className="font-medium">
                        {Math.round(calculateProgress(saving.current_amount, saving.target_amount))}% tercapai
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Info Section */}
                <div className="p-5 bg-gradient-to-br from-slate-50 to-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-lg mt-0.5">
                      <Info className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Dana akan ditambahkan ke tabungan <strong>{saving.name}</strong> dan dikurangi dari dompet yang Anda pilih.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Card */}
              <div className="backdrop-blur-sm bg-white/95 rounded-2xl shadow-md border border-gray-200/50 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-5 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Form Setoran</h3>
                      <p className="text-white/70 text-sm">Masukkan detail setoran Anda</p>
                    </div>
                  </div>
                </div>

                <form className="p-6 space-y-6" onSubmit={handleSubmit}>
                  {/* Date Input */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      Tanggal Setoran*
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>

                  {/* Wallet Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="wallet" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <WalletIcon className="h-4 w-4 text-gray-500" />
                      Dompet Sumber*
                    </Label>
                    <Select value={formData.wallet_id} onValueChange={(value) => handleSelectChange("wallet_id", value)} required>
                      <SelectTrigger className="h-12 border-gray-200 focus:border-green-500">
                        <SelectValue placeholder="Pilih dompet sumber dana" />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets
                          .filter(wallet => saving?.savings_category === "fisik" ? wallet.type === "cash" : true)
                          .map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id} className="p-3">
                              <div className="flex items-center gap-3 w-full">
                                <div 
                                  className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                                  style={{ backgroundColor: wallet.color || '#6B7280' }}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">{wallet.name}</span>
                                    <span className="text-sm font-semibold text-green-600">
                                      {formatCurrency(wallet.balance)}
                                    </span>
                                  </div>
                                  {wallet.type && (
                                    <span className="text-xs text-gray-500 capitalize">{wallet.type}</span>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {saving?.savings_category === "fisik" && (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        💡 Untuk tabungan fisik, hanya dapat menggunakan dompet cash
                      </p>
                    )}
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      Jumlah Setoran*
                    </Label>
                    <CurrencyInput
                      id="amount"
                      showPrefix={true}
                      placeholder="Masukkan jumlah setoran"
                      value={Number(formData.amount)}
                      onChange={(value) => handleSelectChange("amount", value.toString())}
                      disabled={submitting}
                      className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>

                  {/* Notes Input */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                      Catatan (Opsional)
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Tambahkan catatan untuk setoran ini..."
                      rows={3}
                      className="border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={submitting} 
                      className="h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {submitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Memproses Setoran...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <PiggyBank className="h-4 w-4" />
                          Setor Dana
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
                      Kembali ke Tabungan
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SavingsDeposit;
