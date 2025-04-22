import React from 'react';
import { Loan } from '@/types';
import { formatCurrency } from '@/lib/format';

interface LoanSummaryProps {
  loans: Loan[];
}

export const LoanSummary: React.FC<LoanSummaryProps> = ({ loans }) => {
  const totalHutang = loans
    .filter(loan => loan.type === 'payable' && loan.status !== 'paid')
    .reduce((sum, loan) => sum + (loan.amount - (loan.paid_amount || 0)), 0);

  const totalPiutang = loans
    .filter(loan => loan.type === 'receivable' && loan.status !== 'paid')
    .reduce((sum, loan) => sum + (loan.amount - (loan.paid_amount || 0)), 0);

  const countHutangItems = loans.filter(loan => loan.type === "payable" && loan.status !== "paid").length;
  const countPiutangItems = loans.filter(loan => loan.type === "receivable" && loan.status !== "paid").length;

  const countHutangOverdue = loans.filter(loan => {
    const dueDate = new Date(loan.due_date);
    const today = new Date();
    return loan.type === "payable" && loan.status !== "paid" && dueDate < today;
  }).length;

  const countPiutangOverdue = loans.filter(loan => {
    const dueDate = new Date(loan.due_date);
    const today = new Date();
    return loan.type === "receivable" && loan.status !== "paid" && dueDate < today;
  }).length;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-red-50 p-4 rounded-lg border border-red-100">
        <p className="text-xs text-red-700 mb-1">Total Hutang</p>
        <p className="text-lg font-semibold text-red-800">{formatCurrency(totalHutang)}</p>
        <div className="flex justify-between text-xs mt-2">
          <span>{countHutangItems} lunas</span>
          <span>{countHutangOverdue} terlambat</span>
        </div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
        <p className="text-xs text-green-700 mb-1">Total Piutang</p>
        <p className="text-lg font-semibold text-green-800">{formatCurrency(totalPiutang)}</p>
        <div className="flex justify-between text-xs mt-2">
          <span>{countPiutangItems} lunas</span>
          <span>{countPiutangOverdue} terlambat</span>
        </div>
      </div>
    </div>
  );
}; 