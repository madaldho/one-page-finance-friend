
import React, { useState, useEffect, FormEvent } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Saving, Wallet } from "@/types";
import { CurrencyInput } from "@/components/ui/currency-input";

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
  
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString()}`;
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
  
  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-xl">
        <div className="flex items-center mb-6">
          <Link to="/savings" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Setor ke Tabungan</h1>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p>Memuat data...</p>
          </div>
        ) : !saving ? (
          <div className="text-center py-8">
            <p>Tabungan tidak ditemukan</p>
            <Button asChild className="mt-4">
              <Link to="/savings">Kembali</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg p-4 mb-6">
              <h2 className="font-medium text-lg mb-2">{saving.name}</h2>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">Saldo saat ini:</span>
                <span className="font-medium">{formatCurrency(saving.current_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Target:</span>
                <span className="font-medium">{formatCurrency(saving.target_amount)}</span>
              </div>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${saving.current_amount / saving.target_amount >= 1 ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(saving.current_amount / saving.target_amount * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal Setoran*</Label>
                  <div className="flex items-center border rounded-md">
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      disabled={submitting}
                      required
                      className="border-0"
                    />
                    <div className="px-3 text-gray-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wallet_id">Dompet Sumber*</Label>
                  <Select 
                    value={formData.wallet_id} 
                    onValueChange={(value) => handleSelectChange("wallet_id", value)}
                    disabled={submitting}
                  >
                    <SelectTrigger id="wallet_id">
                      <SelectValue placeholder="Pilih dompet sumber" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map(wallet => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.name} - {formatCurrency(wallet.balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {saving.savings_category === "fisik" 
                      ? "Untuk tabungan fisik, sumber dana akan berkurang dari dompet Anda"
                      : "Pilih dompet sumber dana untuk setoran"
                    }
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah Setoran*</Label>
                  <CurrencyInput
                    id="amount"
                    placeholder="100000"
                    value={Number(formData.amount)}
                    onChange={(value) => setFormData({...formData, amount: value.toString()})}
                    disabled={submitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Tambahkan catatan tentang setoran ini"
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={submitting}
                    rows={3}
                  />
                </div>
                
                <div className="pt-4 space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-500 hover:bg-amber-600" 
                    disabled={submitting}
                  >
                    {submitting ? "Memproses..." : "Setor"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate("/savings")}
                    disabled={submitting}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default SavingsDeposit;
