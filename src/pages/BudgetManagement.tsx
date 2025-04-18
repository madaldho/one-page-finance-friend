
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
import { Budget } from "@/types";

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
  const [budgetEnabled, setBudgetEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

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

      // Fetch budget sources
      const { data: sourcesData, error: sourcesError } = await supabase
        .from("budget_sources")
        .select("*")
        .eq("user_id", user?.id)
        .order("name");

      if (sourcesError) throw sourcesError;
      setSources(sourcesData || []);

      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user?.id)
        .eq("active", true)
        .order("category");

      if (budgetsError) throw budgetsError;
      setBudgets(budgetsData || []);
    } catch (error: any) {
      console.error("Error fetching budget data:", error);
      toast({
        title: "Gagal Memuat Data",
        description: error.message || "Terjadi kesalahan saat mengambil data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
    } catch (error: any) {
      console.error("Error updating budget setting:", error);
      setBudgetEnabled(!budgetEnabled); // Revert optimistic update
      toast({
        title: "Gagal Mengubah Pengaturan",
        description: error.message || "Terjadi kesalahan saat menyimpan pengaturan",
        variant: "destructive",
      });
    }
  };

  const calculateProgress = (budget: Budget) => {
    if (!budget.spent) return 0;
    return (budget.spent / budget.amount) * 100;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-red-500";
    if (progress >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatPeriod = (period: string) => {
    return period === "monthly" ? "Budget Bulanan" : "Budget Rentang Waktu";
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32 max-w-xl">
        {/* Header */}
        <div className="flex items-center mb-4">
          <Link to="/home" className="mr-2">
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
              <div
                key={source.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="font-medium">{source.name}</p>
                  </div>
                  <p className="text-sm text-gray-500">Rp {source.amount.toLocaleString()}</p>
                </div>
                <button className="text-gray-500">
                  <MoreVertical className="h-5 w-5" />
                </button>
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
              return (
                <div key={budget.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{budget.category}</h3>
                    <span className="text-sm">
                      Rp {budget.spent?.toLocaleString() || 0} / Rp {budget.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      budget.period === "monthly" ? "bg-blue-500" : "bg-purple-500"
                    }`}></div>
                    <span className="text-xs text-gray-500">{formatPeriod(budget.period)}</span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-2" 
                    indicatorClassName={getProgressColor(progress)}
                  />
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
            <button className="text-sm text-gray-500">Tampilkan</button>
          </div>
          <p className="text-sm text-gray-500 text-center py-2">
            {budgets.length} anggaran yang telah berakhir
          </p>
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
    </Layout>
  );
};

export default BudgetManagement;
