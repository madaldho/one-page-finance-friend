
import React from "react";
import { Card } from "@/components/ui/card";
import { Loan } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { formatDistance } from "date-fns";
import { ChevronRight } from "lucide-react";

interface LoansCardProps {
  loans: Loan[];
  loading: boolean;
  onViewAll: () => void;
}

const LoansCard: React.FC<LoansCardProps> = ({ loans, loading, onViewAll }) => {
  if (loading) {
    return (
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Hutang & Piutang</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-2"></div>
          <div className="h-12 bg-gray-200 rounded mb-2"></div>
        </div>
      </Card>
    );
  }

  if (!loans || loans.length === 0) {
    return (
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Hutang & Piutang</h2>
        </div>
        <div className="text-gray-500 text-center py-4">
          Belum ada data hutang atau piutang
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-lg">Hutang & Piutang</h2>
        <button className="text-[#6E59A5] text-sm font-medium" onClick={onViewAll}>
          Lihat Semua
        </button>
      </div>

      <div className="space-y-3">
        {loans.slice(0, 3).map((loan) => (
          <div
            key={loan.id}
            className="border border-gray-100 rounded-lg p-3 flex justify-between items-center"
          >
            <div>
              <p className="font-medium text-sm">{loan.title}</p>
              <p className="text-gray-500 text-xs">
                {loan.lender}
              </p>
            </div>
            <div className="flex items-center">
              <div className="text-right mr-2">
                <p className={`font-medium ${loan.type === "payable" ? "text-red-500" : "text-green-500"}`}>
                  {formatCurrency(loan.remaining_amount)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistance(new Date(loan.due_date), new Date(), { addSuffix: true })}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default LoansCard;
