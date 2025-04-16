import React from "react";
import { Budget } from "@/types";
import { Progress } from "@/components/ui/progress";

interface BudgetCardProps {
  budgets: Budget[];
}

const BudgetCard = ({ budgets }: BudgetCardProps) => {
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
        <button className="text-sm text-blue-600 hover:text-blue-700">
          Lihat Semua
        </button>
      </div>

      <div className="space-y-4">
        {budgets.map((budget) => {
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
                className={`h-2 ${getProgressColor(progress)}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetCard;
