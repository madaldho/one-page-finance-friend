import React from "react";
import { Loan } from "@/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface LoansCardProps {
  loans: Loan[];
}

const LoansCard = ({ loans }: LoansCardProps) => {
  const formatDate = (date: string | null) => {
    if (!date) return "Tidak ada jatuh tempo";
    return format(new Date(date), "dd MMM yyyy", { locale: id });
  };

  const getStatusColor = (status: Loan["status"]) => {
    switch (status) {
      case "paid":
        return "text-green-600";
      case "partial":
        return "text-yellow-600";
      case "unpaid":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getTypeLabel = (type: Loan["type"]) => {
    return type === "receivable" ? "Piutang" : "Hutang";
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Pinjaman</h2>
        <button className="text-sm text-blue-600 hover:text-blue-700">
          Lihat Semua
        </button>
      </div>

      <div className="space-y-4">
        {loans.map((loan) => (
          <div key={loan.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{loan.description}</span>
              <span className={`text-sm ${getStatusColor(loan.status)}`}>
                {loan.status === "paid"
                  ? "Lunas"
                  : loan.status === "partial"
                  ? "Sebagian"
                  : "Belum Lunas"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{getTypeLabel(loan.type)}</span>
              <span>Rp {loan.amount.toLocaleString()}</span>
            </div>
            {loan.borrower && (
              <div className="text-sm text-gray-500">
                Peminjam: {loan.borrower}
              </div>
            )}
            <div className="text-sm text-gray-500">
              Jatuh Tempo: {formatDate(loan.due_date)}
            </div>
            {loan.paid_amount && (
              <div className="text-sm text-gray-500">
                Terbayar: Rp {loan.paid_amount.toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoansCard;
