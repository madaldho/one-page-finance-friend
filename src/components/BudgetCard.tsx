
import React from "react";
import { Budget } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface BudgetCardProps {
  budgets?: Budget[];
  budget?: Budget;
}

const BudgetCard = ({ budgets, budget }: BudgetCardProps) => {
  // Convert a single budget to an array if that's what was provided
  const budgetArray = budget ? [budget] : budgets || [];

  const calculateProgress = (budget: Budget) => {
    if (!budget.spent) return 0;
    return (budget.spent / budget.amount) * 100;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-red-500";
    if (progress >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Anggaran</h2>
        <Link to="/budgets" className="flex items-center text-sm text-blue-600 hover:text-blue-700">
          Kelola <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      <div className="space-y-4">
        {budgetArray.slice(0, 3).map((budget) => {
          const progress = calculateProgress(budget);
          return (
            <div key={budget.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{budget.category}</span>
                <span className="text-sm text-gray-500">
                  Rp {budget.spent?.toLocaleString() || 0} / Rp{" "}
                  {budget.amount.toLocaleString()}
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
          <div className="text-center py-4 text-gray-500">
            <p>Belum ada anggaran</p>
            <p className="text-sm">
              <Link to="/budgets" className="text-blue-600">
                Tambahkan anggaran
              </Link>{" "}
              untuk memantau pengeluaran kamu
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetCard;
