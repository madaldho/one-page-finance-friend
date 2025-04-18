
import React from "react";
import { Saving } from "@/types";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface SavingsCardProps {
  savings: Saving[];
}

const SavingsCard = ({ savings }: SavingsCardProps) => {
  const calculateProgress = (saving: Saving) => {
    return (saving.current_amount / saving.target_amount) * 100;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Tidak ada target";
    return format(new Date(date), "dd MMM yyyy", { locale: id });
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Tabungan</h2>
        <Link to="/savings" className="flex items-center text-sm text-blue-600 hover:text-blue-700">
          Kelola <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      <div className="space-y-4">
        {savings.slice(0, 3).map((saving) => {
          const progress = calculateProgress(saving);
          return (
            <div key={saving.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{saving.name}</span>
                <span className="text-sm text-gray-500">
                  Rp {saving.current_amount.toLocaleString()} / Rp{" "}
                  {saving.target_amount.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={progress} 
                className="h-2" 
                indicatorClassName={
                  progress >= 100 ? "bg-green-500" : 
                  progress >= 80 ? "bg-yellow-500" : "bg-blue-500"
                }
              />
              <div className="text-sm text-gray-500">
                Target: {formatDate(saving.target_date)}
              </div>
            </div>
          );
        })}

        {savings.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p>Belum ada tabungan</p>
            <p className="text-sm">
              <Link to="/savings" className="text-blue-600">
                Tambahkan tabungan
              </Link>{" "}
              untuk memantau progres
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsCard;
