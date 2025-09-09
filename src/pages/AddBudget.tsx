import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from 'date-fns/locale';
import { CalendarIcon } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface BudgetSource {
  id: string;
  name: string;
  amount: number;
  user_id: string;
}

interface Budget {
  id: string;
  category: string;
  amount: number;
  spent?: number;
  period: string;
  source_id?: string;
  source_percentage?: number;
  user_id: string;
  start_date?: string;
  end_date?: string;
  active?: boolean;
}

// Nilai-nilai yang diterima oleh database Supabase - sekarang kita bisa menggunakan semua nilai valid
type Period = "monthly" | "weekly" | "custom" | "date_range" | "custom_range";

const AddBudget = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<BudgetSource[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]); // Menggunakan tipe Budget[]
  
  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [budgetType, setBudgetType] = useState("fixed"); // fixed or percentage
  const [selectedSource, setSelectedSource] = useState("");
  const [percentage, setPercentage] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [period, setPeriod] = useState<string>("monthly");
  const [periodUI, setPeriodUI] = useState<string>("monthly");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const periodOptions = [
    { value: 'weekly', label: 'Mingguan' },
    { value: 'monthly', label: 'Bulanan' },
    { value: 'custom_range', label: 'Rentang Kustom' },
  ];

  useEffect(() => {
    if (user) {
      fetchData();
    }
    
    // Set tanggal awal ke hari ini saat komponen dimuat
    const today = new Date().toISOString().split('T')[0];
    setStartDate(new Date(today));

    // Set tanggal akhir default berdasarkan period
    const startDateObj = new Date(today);
    const endDateValue = calculateEndDate(startDateObj, "monthly");
    setEndDate(endDateValue);
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch categories - hanya kategori pengeluaran milik user saat ini
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name, color")
        .eq("user_id", user?.id)
        .eq("type", "expense")
        .order("name");

      if (categoriesError) throw categoriesError;
      setCategories([{ id: "all", name: "Semua Kategori", color: "#000000" }, ...(categoriesData || [])]);

      // Fetch budget sources
      const { data: sourcesData, error: sourcesError } = await supabase
        .from("budget_sources")
        .select("*")
        .eq("user_id", user?.id)
        .order("name");

      if (sourcesError) throw sourcesError;
      setSources(sourcesData || []);

      if (sourcesData && sourcesData.length > 0) {
        setSelectedSource(sourcesData[0].id);
      }
      
      // Fetch active budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user?.id)
        .eq("active", true);
        
      if (budgetsError) throw budgetsError;
      setBudgets(budgetsData || []);
      
    } catch (error: unknown) {
      console.error("Error fetching data:", error);
      toast({
        title: "Gagal Memuat Data",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetTypeChange = (value: string) => {
    setBudgetType(value);
    // Reset amount or percentage based on type
    if (value === "fixed") {
      setPercentage("");
    } else {
      setAmount(0);
    }
  };

  const handlePercentageChange = (value: string) => {
    // Limit percentage to 0-100
    const percentValue = Math.min(Math.max(Number(value) || 0, 0), 100);
    setPercentage(percentValue.toString());
    
    // Calculate amount based on percentage if source is selected
    if (selectedSource) {
      const source = sources.find(s => s.id === selectedSource);
      if (source) {
        const calculatedAmount = (source.amount * percentValue) / 100;
        setAmount(calculatedAmount);
      }
    }
  };

  // Fungsi untuk menghitung persentase berdasarkan nominal
  const handleAmountChange = (value: number) => {
    setAmount(value);
    
    // Hanya hitung persentase jika sumber dana dipilih dan dalam mode persentase
    if (selectedSource && budgetType === "percentage") {
      const source = sources.find(s => s.id === selectedSource);
      if (source && source.amount > 0) {
        const calculatedPercentage = (value / source.amount) * 100;
        setPercentage(Math.min(calculatedPercentage, 100).toFixed(2));
      }
    }
  };

  // Fungsi untuk mendapatkan persentase budget yang sudah digunakan dari sumber dana
  const getUsedPercentage = (sourceId: string) => {
    if (!sourceId) return 0;
    
    const source = sources.find(s => s.id === sourceId);
    if (!source || source.amount <= 0) return 0;
    
    // Hitung total anggaran yang menggunakan sumber dana ini
    const totalBudgeted = budgets
      .filter(b => b.source_id === sourceId)
      .reduce((sum, b) => sum + b.amount, 0);
      
    return Math.min((totalBudgeted / source.amount) * 100, 100);
  };

  // Fungsi untuk mendapatkan persentase budget yang masih tersedia dari sumber dana
  const getAvailablePercentage = (sourceId: string) => {
    return Math.max(100 - getUsedPercentage(sourceId), 0);
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    setPeriodUI(value);
    
    // Reset dates when period changes
    if (value !== 'custom_range') {
      const today = new Date();
      setStartDate(today);
      
      const endDateValue = calculateEndDate(today, value);
      setEndDate(endDateValue);
    } else {
      setStartDate(undefined);
      setEndDate(undefined);
    }
  };

  const calculateEndDate = (startDate: Date, period: string) => {
    const date = new Date(startDate);
    
    switch (period) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        return undefined;
    }
    
    return date;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      toast({
        title: "Kategori Diperlukan",
        description: "Pilih kategori anggaran",
        variant: "destructive",
      });
      return;
    }

    if (amount <= 0) {
      toast({
        title: "Jumlah Tidak Valid",
        description: "Masukkan jumlah anggaran yang valid",
        variant: "destructive",
      });
      return;
    }

    if (period === 'custom_range' && (!startDate || !endDate)) {
      toast({
        title: "Tanggal Diperlukan",
        description: "Silahkan pilih tanggal mulai dan tanggal akhir",
        variant: "destructive",
      });
      return;
    }
    
    // Cek apakah ada sumber dana yang dipilih dan apakah masih cukup tersedia
    if (budgetType === "percentage" && selectedSource) {
      const availablePercentage = getAvailablePercentage(selectedSource);
      const requestedPercentage = Number(percentage);
      
      if (requestedPercentage > availablePercentage) {
        toast({
          title: "Persentase Melebihi Batas",
          description: `Maksimal tersedia ${availablePercentage.toFixed(0)}% dari sumber dana ini`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setLoading(true);
      console.log('Creating budget...');

      let formattedStartDate = startDate;
      let formattedEndDate = endDate;

      if (period !== 'custom_range' && startDate) {
        formattedEndDate = calculateEndDate(startDate, period);
      }

      if (!formattedStartDate) {
        formattedStartDate = new Date();
      }

      // Mengubah periode custom_range menjadi date_range untuk database
      const dbPeriod = period === 'custom_range' ? 'date_range' : period;

      // Data dasar untuk budget
      const budgetData: {
        category: string;
        amount: number;
        period: string;
        start_date: string | null;
        end_date: string | null;
        user_id: string | undefined;
        active: boolean;
        spent: number;
        source_id?: string;
        source_percentage?: number;
      } = {
        category: selectedCategory,
        amount,
        period: dbPeriod,
        start_date: formattedStartDate?.toISOString().split('T')[0],
        end_date: formattedEndDate ? formattedEndDate.toISOString().split('T')[0] : null,
        user_id: user?.id,
        active: true,
        spent: 0
      };
      
      // Tambahkan informasi sumber dana jika menggunakan persentase
      if (budgetType === "percentage" && selectedSource && percentage) {
        budgetData.source_id = selectedSource;
        budgetData.source_percentage = Number(percentage);
      }

      console.log('Budget data:', budgetData);

      const { data: budget, error } = await supabase
        .from('budgets')
        .insert(budgetData)
        .select();
      
      if (error) {
        console.error('Error inserting budget:', error);
        toast({
          title: "Gagal Menambahkan",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('Budget created:', budget);
      toast({
        title: "Anggaran Ditambahkan",
        description: "Anggaran baru berhasil ditambahkan",
      });

      setTimeout(() => {
      navigate("/budgets");
      }, 2000);
    } catch (error) {
      console.error('Error creating budget:', error);
      toast({
        title: "Gagal Menambahkan",
        description: "Terjadi kesalahan saat membuat budget",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-2 px-2 md:px-6 max-w-xl">
        {/* Header dengan glassmorphism effect */}
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
          <div className="flex items-center gap-3">
            <Link 
              to="/budgets"
              className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md border border-white/30"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Tambah Anggaran</h1>
              <p className="text-xs text-gray-500">Buat anggaran untuk kategori tertentu</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Kategori Pengeluaran</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }}></div>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Jenis Anggaran</Label>
            <RadioGroup value={budgetType} onValueChange={handleBudgetTypeChange} disabled={loading}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed">Tetap</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage">Persentase dari Sumber Dana</Label>
              </div>
            </RadioGroup>
          </div>

          {budgetType === "percentage" && (
            <>
              <div className="space-y-3">
                <Label htmlFor="source" className="text-base">Sumber Dana</Label>
                <Select 
                  value={selectedSource} 
                  onValueChange={setSelectedSource} 
                  disabled={loading || sources.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih sumber dana" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map(source => {
                      return (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {sources.length === 0 && (
                  <p className="text-xs text-red-500">
                    Tambahkan sumber dana terlebih dahulu di halaman Budget
                  </p>
                )}
                
                {selectedSource && (
                  <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <h4 className="font-medium text-sm mb-2">Informasi Sumber Dana</h4>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Total Dana:</span>
                      <span className="font-medium">Rp {sources.find(s => s.id === selectedSource)?.amount.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Status Penggunaan:</span>
                      <span className="font-medium">{getUsedPercentage(selectedSource).toFixed(0)}% digunakan</span>
                    </div>
                    <div className="mb-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${getUsedPercentage(selectedSource)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm flex gap-1 items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-500 text-xs">Terpakai</span>
                      <div className="w-2 h-2 bg-gray-200 rounded-full ml-2"></div>
                      <span className="text-gray-500 text-xs">Tersedia ({getAvailablePercentage(selectedSource).toFixed(0)}%)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100 mt-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="percentage" className="text-base">Alokasi Anggaran</Label>
                  {selectedSource && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Maksimal: {getAvailablePercentage(selectedSource).toFixed(0)}%
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="percentage" className="text-sm mb-1 block">Persentase (%)</Label>
                    <Input
                      id="percentage"
                      type="text"
                      placeholder="0-100"
                      value={percentage}
                      onChange={(e) => handlePercentageChange(e.target.value)}
                      disabled={loading || !selectedSource}
                      className="mt-0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="amount" className="text-sm mb-1 block">Jumlah (Rp)</Label>
                    <CurrencyInput
                      id="amount"
                      placeholder="100000"
                      value={amount}
                      onChange={handleAmountChange}
                      disabled={loading || !selectedSource}
                      className="mt-0"
                    />
                  </div>
                </div>
                
                {selectedSource && (
                  <p className="text-xs text-gray-500 mt-2">
                    Maksimal dana tersedia: Rp {((sources.find(s => s.id === selectedSource)?.amount || 0) * getAvailablePercentage(selectedSource) / 100).toLocaleString()}
                  </p>
                )}
              </div>
            </>
          )}

          {budgetType !== "percentage" && (
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah Anggaran (Rp)</Label>
              <CurrencyInput
                id="amount"
                placeholder="500000"
                value={amount}
                onChange={handleAmountChange}
                disabled={loading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="period">Periode</Label>
            <Select
              onValueChange={handlePeriodChange}
              defaultValue={periodUI}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {periodUI !== 'custom_range' && startDate && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Tanggal Mulai</Label>
                  <Input
                    type="date"
                    id="startDate"
                    value={startDate ? startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined;
                      setStartDate(date);
                      if (date) {
                        setEndDate(calculateEndDate(date, period));
                      }
                    }}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Tanggal Berakhir (Otomatis)</Label>
                  <Input
                    type="date"
                    id="endDate"
                    value={endDate ? endDate.toISOString().split('T')[0] : ''}
                    className="w-full bg-gray-100"
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

          {periodUI === 'custom_range' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="startDateCustom">Tanggal Mulai</Label>
                  <Input
                    type="date"
                    id="startDateCustom"
                    value={startDate ? startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined;
                      setStartDate(date);
                    }}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDateCustom">Tanggal Berakhir</Label>
                  <Input
                    type="date"
                    id="endDateCustom"
                    value={endDate ? endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined;
                      setEndDate(date);
                    }}
                    className="w-full"
                    min={startDate ? startDate.toISOString().split('T')[0] : ''}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button 
              type="button" 
              className="w-full" 
              variant="outline" 
              onClick={() => navigate("/budgets")}
              disabled={loading}
            >
              Batal
            </Button>
          <Button type="submit" className="w-full  bg-blue-500 hover:bg-blue-600" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Anggaran"}
          </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddBudget;
