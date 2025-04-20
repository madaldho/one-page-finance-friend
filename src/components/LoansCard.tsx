import React, { useState } from "react";
import { Loan } from "@/types";
import { Link } from "react-router-dom";
import { ChevronRight, CalendarDays, ArrowRight, X, Clock, Wallet, User, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { format, isAfter, parseISO, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface LoansCardProps {
  loans: Loan[];
  loading?: boolean;
  onViewAll?: () => void;
}

const LoansCard = ({ loans = [], loading = false, onViewAll }: LoansCardProps) => {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [activeListType, setActiveListType] = useState<'payable' | 'receivable' | null>(null);

  // Group loans by type and filter out paid ones
  const activeDebts = loans.filter(loan => loan.type === "payable" && loan.status !== "paid");
  const activeReceivables = loans.filter(loan => loan.type === "receivable" && loan.status !== "paid");

  // Calculate totals
  const totalDebts = activeDebts.reduce((sum, loan) => sum + (loan.amount - (loan.paid_amount || 0)), 0);
  const totalReceivables = activeReceivables.reduce((sum, loan) => sum + (loan.amount - (loan.paid_amount || 0)), 0);

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return !isAfter(parseISO(dueDate), new Date());
  };

  const handleLoanClick = (loan: Loan, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedLoan(loan);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setTimeout(() => setSelectedLoan(null), 300);
  };

  const handleShowList = (type: 'payable' | 'receivable') => {
    setActiveListType(type);
    setShowListModal(true);
  };

  const handleCloseListModal = () => {
    setShowListModal(false);
    setActiveListType(null);
  };

  const getPaymentProgress = (loan: Loan) => {
    const paid = loan.paid_amount || 0;
    return (paid / loan.amount) * 100;
  };

  const getRemainingDays = (dueDate: string) => {
    if (!dueDate) return 0;
    const days = differenceInDays(parseISO(dueDate), new Date());
    return days > 0 ? days : 0;
  };

  return (
    <>
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
          <div>
            {/* Split card layout */}
            <div className="flex gap-2">
              {/* Hutang Section */}
              <div 
                className="flex-1 bg-red-50 p-3 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                onClick={() => handleShowList('payable')}
              >
                <div className="mb-2">
                  <p className="text-xs text-gray-500">Total Hutang</p>
                  <p className="font-bold text-red-600">{formatCurrency(totalDebts)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-600">Hutang ({activeDebts.length})</p>
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                </div>
              </div>

              {/* Piutang Section */}
              <div 
                className="flex-1 bg-green-50 p-3 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
                onClick={() => handleShowList('receivable')}
              >
                <div className="mb-2 text-right">
                  <p className="text-xs text-gray-500">Total Piutang</p>
                  <p className="font-bold text-green-600">{formatCurrency(totalReceivables)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-600">Piutang ({activeReceivables.length})</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
      
      {/* List Preview Modal */}
      {showListModal && activeListType && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300" onClick={handleCloseListModal}>
          <div 
            className="bg-white rounded-t-xl sm:rounded-xl p-5 w-full max-w-md max-h-[90vh] overflow-auto animate-in slide-in-from-bottom sm:slide-in-from-center duration-300" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">
                {activeListType === 'payable' ? 'Daftar Hutang' : 'Daftar Piutang'}
              </h3>
              <button 
                onClick={handleCloseListModal} 
                className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors"
                title="Tutup"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-1">Total {activeListType === 'payable' ? 'Hutang' : 'Piutang'}</p>
                <p className="text-xl font-bold">
                  {formatCurrency(activeListType === 'payable' ? totalDebts : totalReceivables)}
                </p>
              </div>
              
              {activeListType === 'payable' ? (
                activeDebts.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Tidak ada hutang aktif</p>
                  </div>
                ) : (
                  activeDebts.map((debt) => (
                    <div 
                      key={debt.id}
                      className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                      onClick={(e) => {
                        handleCloseListModal();
                        handleLoanClick(debt, e);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{debt.description}</span>
                            {isOverdue(debt.due_date) && (
                              <Badge variant="destructive" className="text-[9px] py-0 px-1.5">Terlambat</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Jatuh tempo: {debt.due_date ? format(parseISO(debt.due_date), "dd MMM yyyy", { locale: id }) : "-"}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className="text-red-600 font-medium">{formatCurrency(debt.amount - (debt.paid_amount || 0))}</span>
                          <ChevronRight className="h-4 w-4 ml-1 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                activeReceivables.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Tidak ada piutang aktif</p>
                  </div>
                ) : (
                  activeReceivables.map((receivable) => (
                    <div 
                      key={receivable.id}
                      className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                      onClick={(e) => {
                        handleCloseListModal();
                        handleLoanClick(receivable, e);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{receivable.description}</span>
                            {isOverdue(receivable.due_date) && (
                              <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Terlambat</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Jatuh tempo: {receivable.due_date ? format(parseISO(receivable.due_date), "dd MMM yyyy", { locale: id }) : "-"}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className="text-green-600 font-medium">{formatCurrency(receivable.amount - (receivable.paid_amount || 0))}</span>
                          <ChevronRight className="h-4 w-4 ml-1 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
              
              <div className="pt-4 flex justify-center">
                <Link 
                  to="/loans" 
                  className="text-blue-600 hover:bg-blue-50 transition-colors rounded-md py-2 px-4 text-sm font-medium inline-block"
                >
                  Kelola {activeListType === 'payable' ? 'Hutang' : 'Piutang'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Loan Detail Modal */}
      {showDetail && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300" onClick={handleCloseDetail}>
          <div 
            className="bg-white rounded-t-xl sm:rounded-xl p-5 w-full max-w-md max-h-[90vh] overflow-auto animate-in slide-in-from-bottom sm:slide-in-from-center duration-300" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Detail {selectedLoan.type === "payable" ? "Hutang" : "Piutang"}</h3>
              <button 
                onClick={handleCloseDetail} 
                className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors"
                title="Tutup detail"
                aria-label="Tutup detail"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <h3 className="text-lg font-medium">{selectedLoan.description}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  <div>
                    <p className="text-gray-500">Tanggal Jatuh Tempo:</p>
                    <p className="font-medium">
                      {selectedLoan.due_date ? format(parseISO(selectedLoan.due_date), "d MMMM yyyy", { locale: id }) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status:</p>
                    <p className="font-medium flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                        selectedLoan.status === "paid" ? "bg-green-500" : 
                        isOverdue(selectedLoan.due_date) ? "bg-red-500" : "bg-yellow-500"
                      }`}></span>
                      {selectedLoan.status === "paid" ? "Lunas" : 
                       isOverdue(selectedLoan.due_date) ? "Terlambat" : "Belum Lunas"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-100 rounded-lg p-4">
                <div className="text-center mb-3">
                  <p className="text-gray-500 text-sm mb-1">Total {selectedLoan.type === "payable" ? "Hutang" : "Piutang"}</p>
                  <div className="text-2xl font-bold mb-1">
                    {formatCurrency(selectedLoan.amount)}
                  </div>
                  
                  {selectedLoan.paid_amount > 0 && (
                    <div className="text-sm text-gray-600">
                      Terbayar: {formatCurrency(selectedLoan.paid_amount)} 
                      ({Math.round((selectedLoan.paid_amount / selectedLoan.amount) * 100)}%)
                    </div>
                  )}
                </div>
                
                <Progress
                  value={getPaymentProgress(selectedLoan)}
                  className="h-4 w-full"
                  indicatorClassName={selectedLoan.type === "payable" ? "bg-red-500" : "bg-green-500"}
                />
                
                {isOverdue(selectedLoan.due_date) && selectedLoan.status !== "paid" && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 text-red-600 rounded-md text-sm mt-3">
                    <AlertCircle className="h-4 w-4" /> 
                    <span>Jatuh tempo telah terlewati!</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-500 text-xs">
                      {selectedLoan.type === "payable" ? "Pemberi Pinjaman" : "Peminjam"}
                    </p>
                  </div>
                  <p className="font-medium text-sm pl-6">
                    {selectedLoan.type === "payable" ? selectedLoan.lender : selectedLoan.borrower || "-"}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-500 text-xs">Sisa Waktu</p>
                    </div>
                  <p className="font-medium text-sm pl-6">
                    {isOverdue(selectedLoan.due_date) ? 
                      "Telah lewat jatuh tempo " : 
                      selectedLoan.due_date ? 
                        `${getRemainingDays(selectedLoan.due_date)} hari lagi` : 
                        "Tidak ada tenggat"
                    }
                  </p>
                </div>
              </div>
              
              <div className="pt-3 text-center">
                <Button 
                  variant="ghost" 
                  onClick={handleCloseDetail}
                  className="text-blue-600 hover:bg-blue-50 transition-colors rounded-md py-2 px-4 text-sm font-medium inline-block"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
          </div>
        )}
    </>
  );
};

export default LoansCard;
