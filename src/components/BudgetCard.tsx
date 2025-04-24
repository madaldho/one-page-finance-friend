import React, { useState, useEffect } from "react";
import { Budget } from "@/types/index";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ChevronRight, X, AlertCircle, Wallet, BarChart3, ArrowUpDown, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface BudgetCardProps {
  budgets?: Budget[];
  budget?: Budget;
}

const BudgetCard = ({ budgets, budget }: BudgetCardProps) => {
  // Convert a single budget to an array if that's what was provided
  const budgetArray = budget ? [budget] : budgets || [];
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedView, setExpandedView] = useState(false);
  const [budgetExpenses, setBudgetExpenses] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCategories();
    fetchBudgetExpenses();
  }, [budgetArray]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, color");
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchBudgetExpenses = async () => {
    try {
      const expenses: Record<string, number> = {};
      
      for (const budget of budgetArray) {
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

  const calculateProgress = (budget: Budget) => {
    const spent = budgetExpenses[budget.id] || 0;
    return (spent / budget.amount) * 100;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-red-500";
    if (progress >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatPeriod = (budget: Budget) => {
    if (budget.period === "monthly") {
      return "Budget Bulanan";
    } else if (budget.period === "weekly") {
      return "Budget Mingguan";
    } else if (budget.period === "date_range" || budget.period === "custom_range" || budget.period === "custom") {
      return "Budget Rentang Waktu";
    } else {
      return "Budget Rentang Waktu";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleBudgetClick = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
  };

  const toggleExpandView = () => {
    setExpandedView(!expandedView);
  };

  return (
    <>
      <div className="bg-white rounded-lg p-4 relative overflow-hidden">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 p-2 rounded-full">
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
           
            {budgetArray.length > 0 && (
              <div className="bg-blue-100 text-blue-700 text-xs font-medium rounded-full px-2 py-0.5">
                {budgetArray.length} aktif
              </div>
            )}
          </div>
          <div className="flex items-center">
            {budgetArray.length > 3 && (
              <button 
                onClick={toggleExpandView} 
                className="text-xs mr-2 text-blue-600 hover:underline"
                aria-label={expandedView ? "Lihat lebih sedikit" : "Lihat semua"}
              >
                {expandedView ? "Ringkas" : "Lihat semua"}
              </button>
            )}
          
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-blue-50 opacity-50"></div>

        <div className="space-y-3">
          {(expandedView ? budgetArray : budgetArray.slice(0, 3)).map((budget) => {
            const progress = calculateProgress(budget);
            const spent = budgetExpenses[budget.id] || 0;
            return (
              <div
                key={budget.id}
                className="relative bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100"
                onClick={() => handleBudgetClick(budget)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getCategoryColor(budget.category) }}
                    ></div>
                    <span className="font-medium">{getCategoryName(budget.category)}</span>

                    {/* Status badge */}
                    {progress >= 100 ? (
                      <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">Melebihi</span>
                    ) : progress >= 80 ? (
                      <span className="text-xs bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5">Hampir habis</span>
                    ) : null}
                  </div>
                </div>

                <div className="mb-1.5 flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Rp {spent.toLocaleString()} dari Rp {budget.amount.toLocaleString()}
                  </span>
                  <span className="text-xs font-medium px-1 py-0.5 rounded bg-gray-200">
                    {Math.min(Math.round(progress), 100)}%
                  </span>
                </div>

                <Progress
                  value={progress}
                  className="h-2"
                  indicatorClassName={getProgressColor(progress)}
                />
              </div>
            );
          })}

          {budgetArray.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">Belum ada anggaran</p>
              <p className="text-sm text-gray-400 mb-3">
                Buat anggaran untuk memantau pengeluaranmu
              </p>
              <Link to="/budgets" className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1.5 bg-blue-50 rounded-md inline-flex items-center">
                <Plus className="h-4 w-4 mr-1" /> Tambah anggaran
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        {budgetArray.length > 0 && !expandedView && (
          <div className="mt-3 pt-2 border-t border-gray-100 text-center">
            <Link to="/budgets" className="text-blue-600 hover:underline text-sm">
              Lihat semua anggaran
            </Link>
          </div>
        )}
      </div>

      {/* Budget Detail Modal */}
      {showDetail && selectedBudget && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300" onClick={handleCloseDetail}>
          <div 
            className="bg-white rounded-t-xl sm:rounded-xl p-5 w-full max-w-md max-h-[90vh] overflow-auto animate-in slide-in-from-bottom sm:slide-in-from-center duration-300" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Detail Anggaran</h3>
              <button 
                onClick={handleCloseDetail} 
                className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors"
                title="Tutup detail anggaran"
                aria-label="Tutup detail anggaran"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: getCategoryColor(selectedBudget.category) }}
                  ></div>
                  <h3 className="text-lg font-medium">{getCategoryName(selectedBudget.category)}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Periode:</p>
                    <p className="font-medium">{formatPeriod(selectedBudget)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Masa Berlaku:</p>
                    <p className="font-medium">
                      {formatDate(selectedBudget.start_date)} - {formatDate(selectedBudget.end_date)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-100 rounded-lg p-4">
                <div className="text-center mb-2">
                  <div className="text-3xl font-bold mb-1">
                    {Math.min(Math.round(calculateProgress(selectedBudget)), 100)}%
                  </div>
                  <div className="text-gray-500 text-sm">Progress Anggaran</div>
                </div>
                
                <Progress
                  value={calculateProgress(selectedBudget)}
                  className="h-4 w-full"
                  indicatorClassName={getProgressColor(calculateProgress(selectedBudget))}
                />
                
                {calculateProgress(selectedBudget) >= 100 && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 text-red-600 rounded-md text-sm mt-3">
                    <AlertCircle className="h-4 w-4" /> 
                    <span>Anggaran telah terlampaui!</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <ArrowUpDown className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  <p className="text-gray-500 text-xs mb-1">Terpakai</p>
                  <p className="font-medium text-lg">Rp {budgetExpenses[selectedBudget.id]?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <Wallet className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  <p className="text-gray-500 text-xs mb-1">Sisa</p>
                  <p className={`font-medium text-lg ${(selectedBudget.amount - (budgetExpenses[selectedBudget.id] || 0)) < 0 ? 'text-red-500' : ''}`}>
                    Rp {Math.max(0, selectedBudget.amount - (budgetExpenses[selectedBudget.id] || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {selectedBudget.source_id && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 text-sm mb-1">Sumber Dana:</p>
                  <p className="font-medium">
                    {selectedBudget.source_percentage && `${selectedBudget.source_percentage}% dari sumber dana`}
                  </p>
                </div>
              )}
              
              <div className="pt-3 text-center">
                <Link 
                  to="/budgets" 
                  className="text-blue-600 hover:bg-blue-50 transition-colors rounded-md py-2 px-4 text-sm font-medium inline-block"
                >
                  Menuju Halaman Manajemen Budget
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BudgetCard;
