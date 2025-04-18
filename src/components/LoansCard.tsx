
import React from "react";
import { Loan } from "@/types";
import { Link } from "react-router-dom";
import { ChevronRight, CalendarDays, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface LoansCardProps {
  loans: Loan[];
  loading?: boolean;
  onViewAll?: () => void;
}

const LoansCard = ({ loans = [], loading = false, onViewAll }: LoansCardProps) => {
  // Group loans by type and filter out paid ones
  const activeDebts = loans.filter(loan => loan.type === "payable" && loan.status !== "paid");
  const activeReceivables = loans.filter(loan => loan.type === "receivable" && loan.status !== "paid");

  // Calculate totals
  const totalDebts = activeDebts.reduce((sum, loan) => sum + (loan.remaining_amount || loan.amount), 0);
  const totalReceivables = activeReceivables.reduce((sum, loan) => sum + (loan.remaining_amount || loan.amount), 0);

  return (
    <Card className="overflow-hidden mb-4">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-4 flex flex-row items-center justify-between">
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2">
            <span className="text-xs text-blue-700 font-bold">H</span>
          </div>
          <CardTitle className="text-base font-medium text-blue-800">Hutang & Piutang</CardTitle>
        </div>
        <Link to="/loans" className="flex items-center text-xs text-blue-600 hover:text-blue-700">
          Kelola <ChevronRight className="h-3 w-3 ml-1" />
        </Link>
      </CardHeader>
      
      <CardContent className="p-3">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : activeDebts.length === 0 && activeReceivables.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p>Tidak ada hutang atau piutang aktif</p>
            <p className="text-xs mt-1">
              <Link to="/loans" className="text-blue-600">
                Kelola hutang dan piutang
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeDebts.length > 0 && (
              <div>
                <div key={activeDebts[0].id} className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors">
                  <Link to={`/loans/${activeDebts[0].id}`} className="block">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{activeDebts[0].title || activeDebts[0].description}</span>
                      <span className="text-xs text-red-600 font-medium">Rp {(activeDebts[0].remaining_amount || activeDebts[0].amount).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <CalendarDays className="h-3 w-3 mr-1 inline" />
                      Jatuh tempo: {activeDebts[0].due_date ? format(new Date(activeDebts[0].due_date), "dd/MM/yyyy") : "Tidak ada"}
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {activeReceivables.length > 0 && (
              <div>
                <div key={activeReceivables[0].id} className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors">
                  <Link to={`/loans/${activeReceivables[0].id}`} className="block">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{activeReceivables[0].title || activeReceivables[0].description}</span>
                      <span className="text-xs text-green-600 font-medium">Rp {(activeReceivables[0].remaining_amount || activeReceivables[0].amount).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <CalendarDays className="h-3 w-3 mr-1 inline" />
                      Jatuh tempo: {activeReceivables[0].due_date ? format(new Date(activeReceivables[0].due_date), "dd/MM/yyyy") : "Tidak ada"}
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoansCard;
