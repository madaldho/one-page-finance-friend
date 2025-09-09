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
    console.log('handleAmountChange called with:', value, typeof value);
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

    if (!amount || amount <= 0 || isNaN(amount)) {
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
        amount: Number(amount), // Pastikan amount adalah number
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

      console.log('Budget data to be sent:', budgetData);
      console.log('Amount type:', typeof budgetData.amount);
      console.log('Amount value:', budgetData.amount);

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

          {/* Form dengan design yang modern */}
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            {/* Header form */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Buat Anggaran Baru</h2>
                  <p className="text-white/80 text-sm">Atur batasan pengeluaran untuk kategori tertentu</p>
                </div>
              </div>
            </div>

            {/* Form content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Kategori Pengeluaran */}
              <div className="space-y-3">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">Kategori Pengeluaran</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={loading}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200">
                    <SelectValue placeholder="Pilih kategori pengeluaran..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Jenis Anggaran */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Jenis Anggaran</Label>
                <RadioGroup value={budgetType} onValueChange={handleBudgetTypeChange} disabled={loading} className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="cursor-pointer">Nominal Tetap</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage" className="cursor-pointer">Persentase Dana</Label>
                  </div>
                </RadioGroup>
              </div>

              {budgetType === "percentage" && (
                <>
                  {/* Sumber Dana */}
                  <div className="space-y-3">
                    <Label htmlFor="source" className="text-sm font-medium text-gray-700">Sumber Dana</Label>
                    <Select 
                      value={selectedSource} 
                      onValueChange={setSelectedSource} 
                      disabled={loading || sources.length === 0}
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200">
                        <SelectValue placeholder="Pilih sumber dana..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.map(source => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {sources.length === 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-sm text-red-600">
                          Tambahkan sumber dana terlebih dahulu di halaman Budget
                        </p>
                      </div>
                    )}
                    
                    {selectedSource && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="font-semibold text-sm mb-3 text-blue-800">Informasi Sumber Dana</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-700">Total Dana:</span>
                            <span className="font-semibold text-blue-900">Rp {sources.find(s => s.id === selectedSource)?.amount.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-700">Status Penggunaan:</span>
                            <span className="font-semibold text-blue-900">{getUsedPercentage(selectedSource).toFixed(0)}% digunakan</span>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                                style={{ width: `${getUsedPercentage(selectedSource)}%` }}
                              ></div>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                                <span className="text-blue-600">Terpakai</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-100 rounded-full"></div>
                                <span className="text-blue-600">Tersedia ({getAvailablePercentage(selectedSource).toFixed(0)}%)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Alokasi Anggaran */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium text-gray-700">Alokasi Anggaran</Label>
                      {selectedSource && (
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                          Maksimal: {getAvailablePercentage(selectedSource).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="percentage" className="text-sm text-gray-600">Persentase (%)</Label>
                        <Input
                          id="percentage"
                          type="text"
                          placeholder="0-100"
                          value={percentage}
                          onChange={(e) => handlePercentageChange(e.target.value)}
                          disabled={loading || !selectedSource}
                          className="h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-sm text-gray-600">Jumlah (Rp)</Label>
                        <CurrencyInput
                          id="amount"
                          placeholder="100000"
                          value={amount}
                          onChange={handleAmountChange}
                          disabled={loading || !selectedSource}
                          className="h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200"
                        />
                      </div>
                    </div>
                    
                    {selectedSource && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <p className="text-sm text-gray-600">
                          Maksimal dana tersedia: <span className="font-semibold text-gray-800">Rp {((sources.find(s => s.id === selectedSource)?.amount || 0) * getAvailablePercentage(selectedSource) / 100).toLocaleString()}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {budgetType !== "percentage" && (
                <div className="space-y-3">
                  <Label htmlFor="amount" className="text-sm font-medium text-gray-700">Jumlah Anggaran (Rp)</Label>
                  <CurrencyInput
                    id="amount"
                    placeholder="Masukkan jumlah anggaran..."
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={loading}
                    className="h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
              )}

              {/* Periode */}
              <div className="space-y-3">
                <Label htmlFor="period" className="text-sm font-medium text-gray-700">Periode Anggaran</Label>
                <Select
                  onValueChange={handlePeriodChange}
                  defaultValue={periodUI}
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200">
                    <SelectValue placeholder="Pilih periode anggaran..." />
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

              {/* Tanggal untuk periode otomatis */}
              {periodUI !== 'custom_range' && startDate && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Rentang Waktu</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-sm text-gray-600">Tanggal Mulai</Label>
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
                        className="h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-sm text-gray-600">Tanggal Berakhir (Otomatis)</Label>
                      <Input
                        type="date"
                        id="endDate"
                        value={endDate ? endDate.toISOString().split('T')[0] : ''}
                        className="h-12 border-2 border-gray-200 rounded-xl bg-gray-100 transition-all duration-200"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tanggal untuk periode custom */}
              {periodUI === 'custom_range' && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Rentang Waktu Kustom</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDateCustom" className="text-sm text-gray-600">Tanggal Mulai</Label>
                      <Input
                        type="date"
                        id="startDateCustom"
                        value={startDate ? startDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          setStartDate(date);
                        }}
                        className="h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDateCustom" className="text-sm text-gray-600">Tanggal Berakhir</Label>
                      <Input
                        type="date"
                        id="endDateCustom"
                        value={endDate ? endDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          setEndDate(date);
                        }}
                        className="h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200"
                        min={startDate ? startDate.toISOString().split('T')[0] : ''}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-12 font-medium border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  onClick={() => navigate("/budgets")}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  className="h-12 font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Simpan Anggaran
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AddBudget;
