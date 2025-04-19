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

// Nilai-nilai yang diterima oleh database Supabase - sekarang kita bisa menggunakan semua nilai valid
type Period = "monthly" | "weekly" | "custom" | "date_range" | "custom_range";

const AddBudget = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<BudgetSource[]>([]);
  
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
    { value: 'daily', label: 'Harian' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'monthly', label: 'Bulanan' },
    { value: 'yearly', label: 'Tahunan' },
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

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name, color")
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

      console.log('Budget data:', {
        category: selectedCategory,
        amount,
        period: dbPeriod,
        start_date: formattedStartDate?.toISOString().split('T')[0],
        end_date: formattedEndDate ? formattedEndDate.toISOString().split('T')[0] : null,
      });

      const { data: budget, error } = await supabase
        .from('budgets')
        .insert({
          category: selectedCategory,
          amount,
          period: dbPeriod,
          start_date: formattedStartDate?.toISOString().split('T')[0],
          end_date: formattedEndDate ? formattedEndDate.toISOString().split('T')[0] : null,
          user_id: user?.id,
          active: true,
          spent: 0
        })
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
      <div className="container mx-auto p-4 pb-32 max-w-xl">
        <div className="flex items-center mb-6">
          <Link to="/budgets" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Tambah Anggaran</h1>
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
              <div className="space-y-2">
                <Label htmlFor="source">Sumber Dana</Label>
                <Select 
                  value={selectedSource} 
                  onValueChange={setSelectedSource} 
                  disabled={loading || sources.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih sumber dana" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map(source => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name} - Rp {source.amount.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {sources.length === 0 && (
                  <p className="text-xs text-red-500">
                    Tambahkan sumber dana terlebih dahulu di halaman Budget
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage">Persentase (%)</Label>
                <Input
                  id="percentage"
                  type="number"
                  placeholder="0-100"
                  min="0"
                  max="100"
                  value={percentage}
                  onChange={(e) => handlePercentageChange(e.target.value)}
                  disabled={loading || !selectedSource}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah Anggaran (Rp)</Label>
            <CurrencyInput
              id="amount"
              placeholder="500000"
              value={amount}
              onChange={(value) => setAmount(value)}
              disabled={loading || (budgetType === "percentage" && !!percentage)}
            />
          </div>

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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          if (date) {
                            setEndDate(calculateEndDate(date, period));
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Tanggal Berakhir (Otomatis)</Label>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-gray-100"
                    )}
                    disabled
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: id }) : <span>Otomatis</span>}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {periodUI === 'custom_range' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Tanggal Mulai</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Tanggal Berakhir</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={(date) => {
                          // Disable dates before start date
                          return startDate ? date < startDate : false;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Anggaran"}
          </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddBudget;
