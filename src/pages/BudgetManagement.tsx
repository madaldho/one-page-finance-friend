import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Plus, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Budget } from "@/types/index";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BudgetSource {
  id: string;
  name: string;
  amount: number;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
}

interface UserSettings {
  id: string;
  user_id: string;
  show_budgeting: boolean;
  show_savings: boolean;
  show_loans: boolean;
}

const BudgetManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<BudgetSource[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expiredBudgets, setExpiredBudgets] = useState<Budget[]>([]);
  const [budgetEnabled, setBudgetEnabled] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [sourceToEdit, setSourceToEdit] = useState<BudgetSource | null>(null);
  const [showSourceMenu, setShowSourceMenu] = useState<string | null>(null);
  const [editingSource, setEditingSource] = useState(false);
  const [editSourceName, setEditSourceName] = useState("");
  const [editSourceAmount, setEditSourceAmount] = useState("");
  const [categories, setCategories] = useState<{id: string; name: string; color?: string}[]>([]);
  const [budgetExpenses, setBudgetExpenses] = useState<Record<string, number>>({});
  
  // State untuk Budget
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [showBudgetMenu, setShowBudgetMenu] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState(false);
  const [editBudgetAmount, setEditBudgetAmount] = useState("");
  const [editBudgetCategory, setEditBudgetCategory] = useState("");
  const [editBudgetPeriod, setEditBudgetPeriod] = useState<string>("");
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);
  
  // State untuk konfirmasi hapus
  const [showDeleteSourceDialog, setShowDeleteSourceDialog] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<BudgetSource | null>(null);
  const [showDeleteBudgetDialog, setShowDeleteBudgetDialog] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Fungsi untuk memeriksa dan memperbarui anggaran yang sudah berakhir
  const checkExpiredBudgets = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset waktu ke awal hari
      
      // Filter anggaran aktif yang sudah melewati tanggal akhir
      const expiredBudgetsToUpdate = budgets.filter(budget => {
        if (!budget.end_date) return false;
        const endDate = new Date(budget.end_date);
        endDate.setHours(23, 59, 59, 999); // Set waktu ke akhir hari
        return today > endDate;
      });
      
      if (expiredBudgetsToUpdate.length > 0) {
        // Perbarui status anggaran menjadi tidak aktif
        for (const budget of expiredBudgetsToUpdate) {
          const { error } = await supabase
            .from("budgets")
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq("id", budget.id);
            
          if (error) {
            console.error(`Error updating budget ${budget.id}:`, error);
          }
        }
        
        // Muat ulang data anggaran
        fetchData();
        
        toast({
          title: "Anggaran Diperbarui",
          description: `${expiredBudgetsToUpdate.length} anggaran telah dipindahkan ke riwayat karena sudah berakhir`,
        });
      }
    } catch (error) {
      console.error("Error checking expired budgets:", error);
    }
  };
  
  // Panggil fungsi pemeriksaan anggaran setelah data dimuat
  useEffect(() => {
    if (budgets.length > 0) {
      checkExpiredBudgets();
    }
  }, [budgets]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        throw settingsError;
      }

      if (settingsData) {
        setBudgetEnabled(settingsData.show_budgeting);
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
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

      // Fetch active budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user?.id)
        .eq("active", true)
        .order("category");

      if (budgetsError) throw budgetsError;
      setBudgets(budgetsData || []);
      
      // Fetch expired budgets
      const { data: expiredData, error: expiredError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user?.id)
        .eq("active", false)
        .order("end_date", { ascending: false });
        
      if (expiredError) throw expiredError;
      setExpiredBudgets(expiredData || []);

      // Fetch budget expenses
      await fetchBudgetExpenses([...budgetsData || [], ...expiredData || []]);
    } catch (error: unknown) {
      console.error("Error fetching budget data:", error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil data";
      toast({
        title: "Gagal Memuat Data",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetExpenses = async (budgetList: Budget[]) => {
    try {
      const expenses: Record<string, number> = {};
      
      for (const budget of budgetList) {
        const startDate = new Date(budget.start_date);
        const endDate = budget.end_date ? new Date(budget.end_date) : new Date();
        
        let query = supabase
          .from("transactions")
          .select("amount")
          .eq("type", "expense")
          .gte("date", startDate.toISOString().split('T')[0])
          .lte("date", endDate.toISOString().split('T')[0]);
          
        // Hanya filter berdasarkan kategori jika bukan "all"
        if (budget.category !== "all") {
          query = query.eq("category", budget.category);
        }
        
        const { data, error } = await query;
          
        if (error) throw error;
        
        const totalExpenses = data?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
        expenses[budget.id] = totalExpenses;
      }
      
      setBudgetExpenses(expenses);
    } catch (error) {
      console.error("Error fetching budget expenses:", error);
    }
  };

  const calculateProgress = (budget: Budget) => {
    const spent = budgetExpenses[budget.id] || 0;
    return (spent / budget.amount) * 100;
  };

  const handleToggleBudgetFeature = async () => {
    try {
      const newValue = !budgetEnabled;
      setBudgetEnabled(newValue);

      const { data: settingsData, error: checkError } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (settingsData) {
        const { error: updateError } = await supabase
          .from("user_settings")
          .update({
            show_budgeting: newValue,
          })
          .eq("user_id", user?.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("user_settings")
          .insert({
            user_id: user?.id,
            show_budgeting: newValue,
            show_savings: true,
            show_loans: true,
          });

        if (insertError) throw insertError;
      }

      toast({
        title: newValue ? "Fitur Budget Diaktifkan" : "Fitur Budget Dinonaktifkan",
        description: newValue
          ? "Budget akan ditampilkan di halaman utama"
          : "Budget tidak akan ditampilkan di halaman utama",
      });
    } catch (error: unknown) {
      console.error("Error updating budget setting:", error);
      setBudgetEnabled(!budgetEnabled); // Revert optimistic update
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan pengaturan";
      toast({
        title: "Gagal Mengubah Pengaturan",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-red-500";
    if (progress >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatPeriod = (period: string) => {
    if (period === "monthly") {
      return "Budget Bulanan";
    } else if (period === "weekly") {
      return "Budget Mingguan";
    } else if (period === "date_range" || period === "custom_range" || period === "custom") {
      return "Budget Rentang Waktu";
    } else {
      return "Budget Rentang Waktu";
    }
  };

  const displayPeriod = (budget: Budget) => {
    if (budget.period_display) {
      return `Budget ${budget.period_display}`;
    }
    return formatPeriod(budget.period);
  };

  const handleSourceOptions = (source: BudgetSource, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents event bubbling
    
    if (showSourceMenu === source.id) {
      setShowSourceMenu(null);
    } else {
      setShowSourceMenu(source.id);
    }
  };

  const handleSourceClick = (source: BudgetSource) => {
    // Toggle source details
    setSourceToEdit(sourceToEdit?.id === source.id ? null : source);
  };

  const handleEditSource = (source: BudgetSource) => {
    setEditingSource(true);
    setSourceToEdit(source);
    setEditSourceName(source.name);
    setEditSourceAmount(source.amount.toString());
    setShowSourceMenu(null);
  };

  const cancelEditSource = () => {
    setEditingSource(false);
    setSourceToEdit(null);
    setEditSourceName("");
    setEditSourceAmount("");
  };

  const saveEditedSource = async () => {
    if (!sourceToEdit) return;
    
    if (!editSourceName.trim()) {
      toast({
        title: "Nama Diperlukan",
        description: "Masukkan nama sumber dana",
        variant: "destructive",
      });
      return;
    }

    if (!editSourceAmount || isNaN(Number(editSourceAmount)) || Number(editSourceAmount) <= 0) {
      toast({
        title: "Jumlah Tidak Valid",
        description: "Masukkan jumlah dana yang valid",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("budget_sources")
        .update({
          name: editSourceName.trim(),
          amount: Number(editSourceAmount),
        })
        .eq("id", sourceToEdit.id);
        
      if (error) throw error;
      
      // Update state
      setSources(prevSources => 
        prevSources.map(source => 
          source.id === sourceToEdit.id 
            ? { ...source, name: editSourceName.trim(), amount: Number(editSourceAmount) } 
            : source
        )
      );
      
      toast({
        title: "Sumber Dana Diperbarui",
        description: "Sumber dana berhasil diperbarui",
      });
      
      setEditingSource(false);
      setSourceToEdit(null);
      setEditSourceName("");
      setEditSourceAmount("");
      
    } catch (error: unknown) {
      console.error("Error mengedit sumber dana:", error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat mengedit sumber dana";
      toast({
        title: "Gagal Mengedit",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShowDeleteSourceDialog = (source: BudgetSource) => {
    setSourceToDelete(source);
    setShowDeleteSourceDialog(true);
    setShowSourceMenu(null);
  };

  const handleCloseDeleteSourceDialog = () => {
    setShowDeleteSourceDialog(false);
    setSourceToDelete(null);
  };

  const handleDeleteSource = async () => {
    if (!sourceToDelete) return;
    
    try {
      setLoading(true);
      
      // Periksa apakah sumber dana digunakan dalam budget
      const { data: relatedBudgets, error: checkError } = await supabase
        .from("budgets")
        .select("id")
        .eq("source_id", sourceToDelete.id)
        .limit(1);
        
      if (checkError) throw checkError;
      
      if (relatedBudgets && relatedBudgets.length > 0) {
        toast({
          title: "Tidak Dapat Menghapus",
          description: "Sumber dana ini sedang digunakan dalam anggaran aktif",
          variant: "destructive",
        });
        return;
      }
      
      // Hapus sumber dana
      const { error } = await supabase
        .from("budget_sources")
        .delete()
        .eq("id", sourceToDelete.id);
        
      if (error) throw error;
      
      // Update state
      setSources(prevSources => prevSources.filter(s => s.id !== sourceToDelete.id));
      
      toast({
        title: "Sumber Dana Dihapus",
        description: "Sumber dana berhasil dihapus",
      });
    } catch (error: unknown) {
      console.error("Error menghapus sumber dana:", error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus sumber dana";
      toast({
        title: "Gagal Menghapus",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const getCategoryName = (categoryId: string) => {
    if (categoryId === "all") return "Semua Kategori";
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getCategoryColor = (categoryId: string) => {
    if (categoryId === "all") return "#000000";
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || "#CCCCCC";
  };

  const getSourceColor = (sourceId: string) => {
    // Warna-warna untuk sumber dana
    const colors = [
      "#4CAF50", // Green
      "#2196F3", // Blue
      "#9C27B0", // Purple
      "#FFC107", // Amber
      "#FF5722", // Deep Orange
      "#009688", // Teal
      "#673AB7", // Deep Purple
      "#3F51B5"  // Indigo
    ];
    
    // Menghasilkan indeks berdasarkan ID sumber
    let hash = 0;
    for (let i = 0; i < sourceId.length; i++) {
      hash = sourceId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Mengambil warna dari array berdasarkan hash
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const handleBudgetOptions = (budget: Budget, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents event bubbling
    
    if (showBudgetMenu === budget.id) {
      setShowBudgetMenu(null);
    } else {
      setShowBudgetMenu(budget.id);
    }
  };

  const handleBudgetClick = (budget: Budget) => {
    // Toggle budget details
    setBudgetToEdit(budgetToEdit?.id === budget.id ? null : budget);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(true);
    setBudgetToEdit(budget);
    setEditBudgetAmount(budget.amount.toString());
    setEditBudgetCategory(budget.category);
    setEditBudgetPeriod(budget.period);
    setEditStartDate(budget.start_date ? new Date(budget.start_date) : undefined);
    setEditEndDate(budget.end_date ? new Date(budget.end_date) : undefined);
    setShowBudgetMenu(null);
  };

  const cancelEditBudget = () => {
    setEditingBudget(false);
    setBudgetToEdit(null);
    setEditBudgetAmount("");
    setEditBudgetCategory("");
    setEditBudgetPeriod("");
    setEditStartDate(undefined);
    setEditEndDate(undefined);
  };

  const saveEditedBudget = async () => {
    try {
      if (!budgetToEdit) return;
      
      if (!editBudgetAmount || isNaN(Number(editBudgetAmount)) || Number(editBudgetAmount) <= 0) {
        toast({
          title: "Jumlah Tidak Valid",
          description: "Masukkan jumlah anggaran yang valid",
          variant: "destructive",
        });
        return;
      }
      
      const startDate = editStartDate ? new Date(editStartDate) : undefined;
      const endDate = editEndDate ? new Date(editEndDate) : undefined;
      
      // Periksa apakah anggaran sudah berakhir (end_date sudah lewat)
      let isActive = true;
      if (endDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset waktu ke awal hari
        endDate.setHours(23, 59, 59, 999); // Set waktu ke akhir hari
        isActive = today <= endDate;
      }
      
      const updateData = {
        amount: Number(editBudgetAmount),
        period: editBudgetPeriod,
        start_date: startDate ? startDate.toISOString().split('T')[0] : null,
        end_date: endDate ? endDate.toISOString().split('T')[0] : null,
        active: isActive, // Set status aktif berdasarkan tanggal akhir
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from("budgets")
        .update(updateData)
        .eq("id", budgetToEdit.id);
      
      if (error) throw error;
      
      // Perbarui state
      setBudgets(prev => 
        isActive 
          ? prev.map(b => b.id === budgetToEdit.id ? { ...b, ...updateData } : b)
          : prev.filter(b => b.id !== budgetToEdit.id) // Hapus dari daftar aktif jika tidak aktif
      );
      
      // Jika tidak aktif, tambahkan ke daftar expired
      if (!isActive) {
        setExpiredBudgets(prev => [{ ...budgetToEdit, ...updateData }, ...prev]);
        
        toast({
          title: "Anggaran Dipindahkan",
          description: "Anggaran telah dipindahkan ke riwayat karena sudah berakhir",
        });
      } else {
        toast({
          title: "Anggaran Diperbarui",
          description: "Anggaran berhasil diperbarui",
        });
      }
      
      // Reset state
      setBudgetToEdit(null);
      setEditingBudget(false);
      setShowBudgetMenu(null);
      
    } catch (error: unknown) {
      console.error("Error updating budget:", error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan anggaran";
      toast({
        title: "Gagal Memperbarui Anggaran",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleShowDeleteBudgetDialog = (budget: Budget) => {
    setBudgetToDelete(budget);
    setShowDeleteBudgetDialog(true);
    setShowBudgetMenu(null);
  };

  const handleCloseDeleteBudgetDialog = () => {
    setShowDeleteBudgetDialog(false);
    setBudgetToDelete(null);
  };

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", budgetToDelete.id);
        
      if (error) throw error;
      
      // Update state
      setBudgets(prevBudgets => prevBudgets.filter(b => b.id !== budgetToDelete.id));
      
      toast({
        title: "Anggaran Dihapus",
        description: "Anggaran berhasil dihapus",
      });
    } catch (error: unknown) {
      console.error("Error menghapus anggaran:", error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus anggaran";
      toast({
        title: "Gagal Menghapus",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTime = (budget: Budget): string => {
    if (!budget.end_date) return "Tidak ada batas waktu";
    
    const today = new Date();
    const endDate = new Date(budget.end_date);
    
    // Jika sudah lewat tanggal akhir
    if (today > endDate) return "Sudah berakhir";
    
    const diffTime = Math.abs(endDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Berakhir hari ini";
    if (diffDays === 1) return "Berakhir besok";
    if (diffDays < 7) return `${diffDays} hari lagi`;
    
    // Tampilkan berdasarkan periode
    if (budget.period === "weekly") {
      return `${Math.ceil(diffDays / 7)} minggu lagi`;
    } else if (budget.period === "monthly") {
      const months = Math.ceil(diffDays / 30);
      return months <= 1 ? "Bulan ini" : `${months} bulan lagi`;
    } else if (budget.period === "yearly") {
      const years = Math.ceil(diffDays / 365);
      return years <= 1 ? "Tahun ini" : `${years} tahun lagi`;
    } else {
      // Untuk periode kustom atau lainnya
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} minggu lagi`;
      if (diffDays < 365) return `${Math.ceil(diffDays / 30)} bulan lagi`;
      return `${Math.ceil(diffDays / 365)} tahun lagi`;
    }
  };

  const handleEditBudgetPeriod = (value: string) => {
    setEditBudgetPeriod(value);
    
    if (value !== 'date_range' && value !== 'custom_range' && editStartDate) {
      // Hitung tanggal akhir berdasarkan periode
      const endDate = new Date(editStartDate);
      
      if (value === 'weekly') {
        endDate.setDate(endDate.getDate() + 7); // 7 hari dari mulai
      } else if (value === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1); // Akhir bulan
      } else if (value === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
        endDate.setDate(endDate.getDate() - 1); // Akhir tahun
      }
      
      setEditEndDate(endDate);
    }
  };

  const handleEditStartDateChange = (date: Date | undefined) => {
    setEditStartDate(date);
    
    if (date && editBudgetPeriod && editBudgetPeriod !== 'date_range' && editBudgetPeriod !== 'custom_range') {
      // Update tanggal akhir sesuai periode
      const endDate = new Date(date);
      
      if (editBudgetPeriod === 'weekly') {
        endDate.setDate(endDate.getDate() + 6);
      } else if (editBudgetPeriod === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1);
      } else if (editBudgetPeriod === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
        endDate.setDate(endDate.getDate() - 1);
      }
      
      setEditEndDate(endDate);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-xl">
        {/* Header */}
        <div className="flex items-center mb-4">
          <Link to="/settings" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Manajemen Budget</h1>
        </div>

        {/* Budget Feature Toggle */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Fitur Budget</h2>
              <p className="text-sm text-gray-500">{budgetEnabled ? "Aktif" : "Nonaktif"}</p>
            </div>
            <Switch checked={budgetEnabled} onCheckedChange={handleToggleBudgetFeature} />
          </div>
        </div>

        {/* Budget Sources */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Sumber Dana Budget</h2>
            <Link
              to="/budget-sources/add"
              className="flex items-center text-sm text-green-500 border border-green-500 rounded-lg px-2 py-1"
            >
              <Plus className="h-4 w-4 mr-1" /> Tambah Sumber
            </Link>
          </div>

          <div className="space-y-2">
            {sources.map((source) => (
              <div key={source.id}>
              <div
                  className={`flex items-center justify-between bg-gray-50 rounded-lg p-3 cursor-pointer ${sourceToEdit?.id === source.id ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSourceClick(source)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: getSourceColor(source.id) }}></div>
                    <p className="font-medium">{source.name}</p>
                  </div>
                  <p className="text-sm text-gray-500">Rp {source.amount.toLocaleString()}</p>
                </div>
                  <div className="relative">
                    <button 
                      className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"
                      title="Menu sumber dana"
                      aria-label="Menu sumber dana"
                      onClick={(e) => handleSourceOptions(source, e)}
                    >
                  <MoreVertical className="h-5 w-5" />
                </button>
                    
                    {showSourceMenu === source.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white shadow-lg rounded-md py-1 z-10">
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => handleEditSource(source)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Edit
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => handleShowDeleteSourceDialog(source)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {sourceToEdit?.id === source.id && (
                  <div className="bg-blue-50 p-3 rounded-b-lg -mt-1 border-t border-blue-100">
                    {editingSource ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Nama Sumber</label>
                          <input 
                            type="text" 
                            value={editSourceName} 
                            onChange={e => setEditSourceName(e.target.value)}
                            className="w-full p-2 border rounded-md text-sm"
                            placeholder="Nama sumber dana"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Jumlah (Rp)</label>
                          <CurrencyInput
                            showPrefix={true}
                            value={Number(editSourceAmount)}
                            onChange={(value) => setEditSourceAmount(value.toString())}
                            placeholder="Jumlah sumber dana"
                            className="text-sm"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button 
                            className="px-3 py-1 bg-white border rounded-md text-sm"
                            onClick={cancelEditSource}
                          >
                            Batal
                          </button>
                          <button 
                            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
                            onClick={saveEditedSource}
                          >
                            Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-4">Detail Sumber Dana</p>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-lg">
                              <p className="text-xs text-gray-500">Total Dana</p>
                              <p className="font-medium">Rp {source.amount.toLocaleString()}</p>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg">
                              <p className="text-xs text-gray-500">Digunakan</p>
                              <p className="font-medium">
                                Rp {(budgets
                                  .filter(b => b.source_id === source.id)
                                  .reduce((sum, b) => sum + b.amount, 0)).toLocaleString()}
                                </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Visualisasi Penggunaan Persentase */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Alokasi Dana</span>
                            <span>
                              {Math.min(
                                (budgets
                                  .filter(b => b.source_id === source.id)
                                  .reduce((sum, b) => sum + b.amount, 0) / source.amount) * 100,
                                100
                              ).toFixed(0)}% digunakan
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500"
                              style={{ 
                                width: `${Math.min(
                                  (budgets
                                    .filter(b => b.source_id === source.id)
                                    .reduce((sum, b) => sum + b.amount, 0) / source.amount) * 100,
                                  100
                                )}%` 
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {Math.max(
                              100 - (budgets
                                .filter(b => b.source_id === source.id)
                                .reduce((sum, b) => sum + b.amount, 0) / source.amount) * 100,
                              0
                            ).toFixed(0)}% tersedia untuk anggaran baru
                          </p>
                        </div>
                        
                        {budgets.filter(b => b.source_id === source.id).length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Digunakan di anggaran:</p>
                            <div className="space-y-2">
                              {budgets
                                .filter(b => b.source_id === source.id)
                                .map(budget => (
                                  <div key={budget.id} className="bg-white p-2 rounded-md text-sm flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: getCategoryColor(budget.category) }}
                                      ></div>
                                      <span>{getCategoryName(budget.category)}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-gray-500">Rp {budget.amount.toLocaleString()}</span>
                                      {budget.source_percentage && (
                                        <p className="text-xs text-gray-400">{budget.source_percentage}%</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {sources.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p>Belum ada sumber dana budget</p>
                <p className="text-sm">Tambahkan sumber dana untuk menyiapkan anggaran</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Budgets */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Anggaran Budget Aktif</h2>
            <Link
              to="/budget/add"
              className="flex items-center text-sm bg-green-500 text-white rounded-lg px-3 py-1.5"
            >
              <Plus className="h-4 w-4 mr-1" /> Tambah
            </Link>
          </div>

          <div className="space-y-4">
            {budgets.map((budget) => {
              const progress = calculateProgress(budget);
              const spent = budgetExpenses[budget.id] || 0;
              return (
                <div key={budget.id}>
                  <div
                    className={`flex items-center justify-between bg-gray-50 rounded-lg p-3 cursor-pointer ${budgetToEdit?.id === budget.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleBudgetClick(budget)}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className={`w-4 h-4 rounded-full border border-gray-200 shadow-sm flex-shrink-0`}
                            style={{ backgroundColor: getCategoryColor(budget.category) }}
                          ></div>
                          <h3 className="font-medium">{getCategoryName(budget.category)}</h3>
                        </div>
                        <span className="text-sm">
                          Rp {spent.toLocaleString()} / Rp {budget.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{displayPeriod(budget)}</span>
                          <span className="text-xs text-orange-500">• {getRemainingTime(budget)}</span>
                        </div>
                        <span className="text-xs font-medium">
                          {Math.min(Math.round(progress), 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={progress} 
                        className="h-2 mt-1" 
                        indicatorClassName={getProgressColor(progress)}
                      />
                    </div>
                    <div className="relative">
                      <button 
                        className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"
                        title="Menu anggaran"
                        aria-label="Menu anggaran"
                        onClick={(e) => handleBudgetOptions(budget, e)}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      
                      {showBudgetMenu === budget.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-white shadow-lg rounded-md py-1 z-10">
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            onClick={() => handleEditBudget(budget)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                            onClick={() => handleShowDeleteBudgetDialog(budget)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {budgetToEdit?.id === budget.id && (
                    <div className="bg-blue-50 p-3 rounded-b-lg -mt-1 border-t border-blue-100">
                      {editingBudget ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Kategori</label>
                            <div className="relative">
                              <Select value={editBudgetCategory} onValueChange={setEditBudgetCategory}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Pilih kategori anggaran" />
                                </SelectTrigger>
                                <SelectContent>
                              {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full border border-gray-200"
                                          style={{ backgroundColor: cat.color || "#CCCCCC" }}
                                        ></div>
                                        <span>{cat.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Jumlah (Rp)</label>
                            <CurrencyInput
                              showPrefix={true}
                              value={Number(editBudgetAmount)}
                              onChange={(value) => setEditBudgetAmount(value.toString())}
                              placeholder="Jumlah anggaran"
                              className="text-sm"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Periode</label>
                            <select 
                              value={editBudgetPeriod} 
                              onChange={e => handleEditBudgetPeriod(e.target.value)}
                              className="w-full p-2 border rounded-md text-sm"
                              title="Pilih periode anggaran"
                              aria-label="Pilih periode anggaran"
                            >
                              <option value="weekly">Mingguan</option>
                              <option value="monthly">Bulanan</option>
                              <option value="date_range">Rentang Waktu Kustom</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Tanggal Mulai</label>
                              <div className="relative">
                                <input 
                                  type="date" 
                                  value={editStartDate ? editStartDate.toISOString().split('T')[0] : ''} 
                                  onChange={e => handleEditStartDateChange(e.target.value ? new Date(e.target.value) : undefined)}
                                  className="w-full p-2 border rounded-md text-sm"
                                  title="Tanggal mulai anggaran"
                                  aria-label="Tanggal mulai anggaran"
                                  placeholder="Pilih tanggal mulai"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Tanggal Akhir</label>
                              <div className="relative">
                                <input 
                                  type="date" 
                                  value={editEndDate ? editEndDate.toISOString().split('T')[0] : ''} 
                                  onChange={e => setEditEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                                  className={`w-full p-2 border rounded-md text-sm ${editBudgetPeriod !== 'date_range' && editBudgetPeriod !== 'custom_range' ? 'bg-gray-100' : ''}`}
                                  disabled={editBudgetPeriod !== 'date_range' && editBudgetPeriod !== 'custom_range'}
                                  min={editStartDate ? editStartDate.toISOString().split('T')[0] : ''}
                                  title="Tanggal akhir anggaran"
                                  aria-label="Tanggal akhir anggaran"
                                  placeholder="Pilih tanggal akhir"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end">
                            <button 
                              className="px-3 py-1 bg-white border rounded-md text-sm"
                              onClick={cancelEditBudget}
                            >
                              Batal
                            </button>
                            <button 
                              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
                              onClick={saveEditedBudget}
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-4">Detail Anggaran</p>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs text-gray-500">Kategori</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div 
                                    className="w-3 h-3 rounded-full border border-gray-200"
                                    style={{ backgroundColor: getCategoryColor(budget.category) }}
                                  ></div>
                                  <p className="font-medium">{getCategoryName(budget.category)}</p>
                                </div>
                              </div>
                              
                              <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs text-gray-500">Total Anggaran</p>
                                <p className="font-medium">Rp {budget.amount.toLocaleString()}</p>
                              </div>

                              <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs text-gray-500">Sisa Anggaran</p>
                                <p className={`font-medium ${budget.amount - spent < 0 ? 'text-red-500' : ''}`}>
                                  Rp {Math.max(0, budget.amount - spent).toLocaleString()}
                                </p>
                              </div>

                              <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs text-gray-500">Sisa Waktu</p>
                                <p className="font-medium">
                                  {getRemainingTime(budget)}
                                </p>
                              </div>
                              
                              <div className="bg-white p-3 rounded-lg col-span-2">
                                <p className="text-xs text-gray-500">Periode</p>
                                <p className="font-medium">
                                  {displayPeriod(budget)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {budget.source_id && (
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Sumber Dana:</p>
                              {sources.filter(s => s.id === budget.source_id).map(source => (
                                <div key={source.id} className="bg-white p-2 rounded-md text-sm flex items-center justify-between">
                                  <span>{source.name}</span>
                                  <span className="text-gray-500">
                                    {budget.source_percentage}% (Rp {((source.amount * (budget.source_percentage || 0)) / 100).toLocaleString()})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {budgets.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p>Belum ada anggaran budget aktif</p>
                <p className="text-sm">Tambahkan anggaran untuk memantau pengeluaran</p>
              </div>
            )}
          </div>
        </div>

        {/* Budget History */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Riwayat Anggaran</h2>
            <button 
              className="text-sm text-gray-500"
              onClick={toggleHistory}
            >
              {showHistory ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
          
          {!showHistory ? (
            <p className="text-sm text-gray-500 text-center py-2">
              {expiredBudgets.length} anggaran yang telah berakhir
            </p>
          ) : (
            <div className="space-y-3 mt-4">
              {expiredBudgets.map((budget) => {
                const progress = calculateProgress(budget);
                const spent = budgetExpenses[budget.id] || 0;
                return (
                  <div key={budget.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{getCategoryName(budget.category)}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          Rp {spent.toLocaleString()} / Rp {budget.amount.toLocaleString()}
                        </span>
                        <div className="relative">
                          <button 
                            className="text-gray-500 hover:bg-gray-100 p-1 rounded-full"
                            title="Menu anggaran"
                            aria-label="Menu anggaran"
                            onClick={(e) => handleBudgetOptions(budget, e)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          
                          {showBudgetMenu === budget.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white shadow-lg rounded-md py-1 z-10">
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                                onClick={() => handleShowDeleteBudgetDialog(budget)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18"></path>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                                Hapus
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border border-gray-200 shadow-sm flex-shrink-0`}
                          style={{ backgroundColor: getCategoryColor(budget.category) }}
                        ></div>
                        <span className="text-xs text-gray-500">{displayPeriod(budget)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {budget.end_date ? new Date(budget.end_date).toLocaleDateString('id-ID') : ''}
                        </span>
                        <span className="text-xs font-medium">
                          {Math.min(Math.round(progress), 100)}%
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={progress} 
                      className="h-2" 
                      indicatorClassName={getProgressColor(progress)}
                    />
                  </div>
                );
              })}
              
              {expiredBudgets.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p>Belum ada riwayat anggaran</p>
                  <p className="text-sm">Anggaran yang telah berakhir akan muncul di sini</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Budget Tips */}
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-medium mb-3">Tips Penggunaan Budget</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Tetapkan anggaran yang realistis untuk setiap kategori</li>
            <li>• Pantau pengeluaran secara rutin</li>
            <li>• Sesuaikan anggaran jika diperlukan</li>
            <li>• Budget akan muncul di halaman utama untuk pemantauan mudah</li>
          </ul>
        </div>
      </div>

      {/* Delete Confirmation Dialogs */}
      <DeleteConfirmationDialog
        isOpen={showDeleteSourceDialog}
        onClose={handleCloseDeleteSourceDialog}
        onConfirm={handleDeleteSource}
        title="Hapus Sumber Dana"
        description="Apakah Anda yakin ingin menghapus sumber dana"
        itemName={sourceToDelete?.name}
      />
      
      <DeleteConfirmationDialog
        isOpen={showDeleteBudgetDialog}
        onClose={handleCloseDeleteBudgetDialog}
        onConfirm={handleDeleteBudget}
        title="Hapus Anggaran"
        description="Apakah Anda yakin ingin menghapus anggaran"
        itemName={budgetToDelete ? getCategoryName(budgetToDelete.category) : ""}
      />
    </Layout>
  );
};

export default BudgetManagement;
