
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Plus, Info, Calendar, PiggyBank } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Wallet, Saving } from "@/types";
import { format, parseISO } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const SavingsManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [savings, setSavings] = useState<Saving[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
  const [featureEnabled, setFeatureEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch savings
      const { data: savingsData, error: savingsError } = await supabase
        .from("savings")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (savingsError) throw savingsError;
      setSavings(savingsData as Saving[]);

      // Fetch wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user?.id);

      if (walletsError) throw walletsError;
      setWallets(walletsData as Wallet[]);

    } catch (error: any) {
      console.error("Error fetching savings data:", error.message);
      toast({
        title: "Gagal memuat data",
        description: "Terjadi kesalahan saat mengambil data tabungan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (saving: Saving) => {
    return (saving.current_amount / saving.target_amount) * 100;
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Tidak ada target";
    try {
      return format(parseISO(dateString), "dd/MM/yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const handleToggleFeature = async () => {
    const newValue = !featureEnabled;
    setFeatureEnabled(newValue);
    
    try {
      const { error } = await supabase
        .from("user_settings")
        .update({ show_savings: newValue })
        .eq("user_id", user?.id);

      if (error) throw error;
      
      toast({
        title: `Fitur Tabungan ${newValue ? "Diaktifkan" : "Dinonaktifkan"}`,
        description: newValue ? 
          "Fitur tabungan sekarang aktif di halaman utama" : 
          "Fitur tabungan tidak akan ditampilkan di halaman utama",
      });
    } catch (error: any) {
      console.error("Error updating settings:", error);
      setFeatureEnabled(!newValue); // Revert state on error
      toast({
        title: "Gagal Mengubah Pengaturan",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSavingClick = (saving: Saving) => {
    setSelectedSaving(saving);
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link to="/home" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold">Tabungan/Celengan</h1>
          </div>
        </div>

        {/* Feature Toggle Section */}
        <section className="mb-6 bg-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Fitur Tabungan</h2>
              <p className="text-sm text-gray-500">Aktifkan untuk mengatur target tabungan dan menyimpan otomatis dari pemasukan</p>
            </div>
            <Switch checked={featureEnabled} onCheckedChange={handleToggleFeature} />
          </div>
          
          <div className="mt-3 pl-6 border-l-2 border-yellow-200 py-1">
            <p className="text-sm text-gray-600">
              Atur target tabungan dan alokasikan persentase dari pemasukan Anda secara otomatis untuk mencapai target.
            </p>
          </div>
        </section>

        {/* Savings Targets Section */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Target Tabungan Anda</h2>
              <p className="text-xs text-gray-500">Pantau progres Anda menuju target keuangan</p>
            </div>
            <Button 
              variant="default" 
              size="sm"
              className="bg-amber-500 hover:bg-amber-600"
              asChild
            >
              <Link to="/savings/add">
                <Plus className="h-4 w-4 mr-1" />
                Tambah Target
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p>Memuat data tabungan...</p>
            </div>
          ) : savings.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg">
              <PiggyBank className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>Belum ada target tabungan</p>
              <p className="text-sm text-gray-500">
                Mulai menabung dengan menambahkan target baru
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savings.map((saving) => {
                const progress = calculateProgress(saving);
                return (
                  <div 
                    key={saving.id} 
                    className="bg-white rounded-lg p-4"
                    onClick={() => handleSavingClick(saving)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{saving.name}</h3>
                        <p className="text-xs">
                          {saving.savings_category === "fisik" ? "Fisik" : "Digital"}
                        </p>
                      </div>
                      <button className="text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span className="text-gray-600">{formatCurrency(saving.current_amount)}</span>
                      <span className="font-medium">{formatCurrency(saving.target_amount)}</span>
                    </div>
                    
                    <Progress
                      value={progress}
                      className="h-2 mb-2"
                      indicatorClassName={
                        progress >= 100 ? "bg-green-500" :
                        progress >= 50 ? "bg-amber-500" : "bg-blue-500"
                      }
                    />
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Target: {formatDate(saving.target_date)}</span>
                      </div>
                      <span>{Math.round(progress)}% tercapai</span>
                    </div>
                    
                    <div className="mt-3 flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSaving(saving);
                          setWithdrawOpen(true);
                        }}
                      >
                        Tarik
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-amber-500 hover:bg-amber-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSaving(saving);
                          setDepositOpen(true);
                        }}
                      >
                        Setor
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* How It Works Section */}
        <section className="bg-white rounded-lg p-4 mb-6">
          <h2 className="font-semibold mb-4">Cara Kerja</h2>
          <div className="space-y-4">
            <div className="flex">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mr-3 shrink-0">
                <span className="text-amber-800 text-sm font-medium">1</span>
              </div>
              <p className="text-sm">Buat target tabungan dengan jumlah target</p>
            </div>
            <div className="flex">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mr-3 shrink-0">
                <span className="text-amber-800 text-sm font-medium">2</span>
              </div>
              <p className="text-sm">Pilih kategori pemasukan dan persentase untuk ditabung</p>
            </div>
            <div className="flex">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mr-3 shrink-0">
                <span className="text-amber-800 text-sm font-medium">3</span>
              </div>
              <p className="text-sm">Saat Anda menambahkan pemasukan dalam kategori yang dipilih, aplikasi akan secara otomatis mengalokasikan persentase yang ditentukan ke target tabungan Anda</p>
            </div>
            <div className="flex">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mr-3 shrink-0">
                <span className="text-amber-800 text-sm font-medium">4</span>
              </div>
              <p className="text-sm">Pantau progres Anda di layar utama dan di halaman pengaturan ini</p>
            </div>
          </div>
        </section>

        {/* Deposit Dialog */}
        <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Setor ke Tabungan</DialogTitle>
            </DialogHeader>
            <div className="p-4 bg-amber-50 rounded-lg mb-4">
              <h3 className="font-medium">{selectedSaving?.name}</h3>
              <p className="text-sm">Saldo saat ini: {selectedSaving ? formatCurrency(selectedSaving.current_amount) : "Rp 0"}</p>
              <p className="text-sm">Jenis: {selectedSaving?.savings_category === "fisik" ? "Fisik (Cash)" : "Digital (Saldo)"}</p>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tanggal*</label>
                <input 
                  type="date" 
                  className="w-full rounded-md border border-gray-300 p-2"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dompet Sumber (Hanya Cash)*</label>
                <select className="w-full rounded-md border border-gray-300 p-2" required>
                  <option value="">Pilih dompet cash</option>
                  {wallets.filter(w => w.type === "cash").map(wallet => (
                    <option key={wallet.id} value={wallet.id}>{wallet.name} - {formatCurrency(wallet.balance)}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Untuk tabungan fisik, Anda hanya dapat menggunakan dompet cash sebagai sumber
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jumlah Setoran*</label>
                <input 
                  type="number"
                  placeholder="100000" 
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Catatan (Opsional)</label>
                <textarea 
                  className="w-full rounded-md border border-gray-300 p-2"
                  placeholder="Tambahkan catatan tentang setoran ini"
                  rows={3}
                />
              </div>
              <div className="flex flex-col space-y-2 pt-4">
                <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600">Setor</Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => setDepositOpen(false)}>Tutup</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Withdraw Dialog */}
        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tarik dari Tabungan</DialogTitle>
            </DialogHeader>
            <div className="p-4 bg-blue-50 rounded-lg mb-4">
              <h3 className="font-medium">{selectedSaving?.name}</h3>
              <p className="text-sm">Saldo saat ini: {selectedSaving ? formatCurrency(selectedSaving.current_amount) : "Rp 0"}</p>
              <p className="text-sm">Jenis: {selectedSaving?.savings_category === "fisik" ? "Fisik (Cash)" : "Digital (Saldo)"}</p>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tanggal*</label>
                <input 
                  type="date" 
                  className="w-full rounded-md border border-gray-300 p-2"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dompet Tujuan*</label>
                <select className="w-full rounded-md border border-gray-300 p-2" required>
                  <option value="">Pilih dompet tujuan</option>
                  {wallets.map(wallet => (
                    <option key={wallet.id} value={wallet.id}>{wallet.name} - {formatCurrency(wallet.balance)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jumlah Penarikan*</label>
                <input 
                  type="number"
                  placeholder="100000" 
                  className="w-full rounded-md border border-gray-300 p-2"
                  max={selectedSaving?.current_amount}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maksimal penarikan: {selectedSaving ? formatCurrency(selectedSaving.current_amount) : "Rp 0"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Catatan (Opsional)</label>
                <textarea 
                  className="w-full rounded-md border border-gray-300 p-2"
                  placeholder="Tambahkan catatan tentang penarikan ini"
                  rows={3}
                />
              </div>
              <div className="flex flex-col space-y-2 pt-4">
                <Button type="submit" className="w-full">Tarik</Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => setWithdrawOpen(false)}>Tutup</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SavingsManagement;
