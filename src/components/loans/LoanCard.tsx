import React, { useState } from 'react';
import { Loan } from '@/types';
import { formatDate, formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface LoanCardProps {
  loan: Loan;
  onDelete: (loan: Loan) => void;
  isExpanded: boolean;
  onToggleExpand: (loan: Loan) => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  onDelete,
  isExpanded,
  onToggleExpand
}) => {
  const navigate = useNavigate();
  const isOverdue = new Date(loan.due_date) < new Date() && loan.status !== "paid";
  const isPaid = loan.status === "paid";
  const progressPercentage = loan.paid_amount ? Math.round((loan.paid_amount / loan.amount) * 100) : 0;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(loan);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div onClick={() => onToggleExpand(loan)} className="cursor-pointer">
        <div className="flex items-start p-3">
          <div className={`w-1 self-stretch ${loan.type === 'payable' ? 'bg-red-500' : 'bg-green-500'} rounded-l-lg mr-3`}></div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-800">{loan.description}</h3>
                  {isPaid && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Lunas</span>
                  )}
                  {isOverdue && !isPaid && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">Terlambat</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">Jatuh tempo: {formatDate(loan.due_date)}</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${loan.type === 'payable' ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(loan.amount)}
                </p>
                <p className="text-xs text-gray-500">{progressPercentage}% terbayar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {loan.type === 'payable' ? 'Pemberi' : 'Peminjam'}
              </p>
              <p className="font-medium">
                {loan.type === 'payable' ? loan.lender || "-" : loan.borrower || "-"}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 mb-1">Total {loan.type === 'payable' ? 'Hutang' : 'Piutang'}</p>
              <p className="font-medium">Rp {loan.amount.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Tanggal Dibuat</p>
              <p className="font-medium">{formatDate(loan.created_at)}</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 mb-1">Wallet</p>
              <p className="font-medium">{loan.wallet_name || "CASH"}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Progress Pembayaran</p>
            <div className="flex items-center justify-between">
              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                <div 
                  className={`${loan.type === 'payable' ? 'bg-blue-600' : 'bg-green-600'} h-2 rounded-full`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium">{progressPercentage}%</span>
            </div>
          </div>

          <div className="flex justify-between text-sm mb-4">
            <div>
              <p className="text-gray-500">
                {loan.type === 'payable' ? 'Terbayar' : 'Diterima'}: {formatCurrency(loan.paid_amount || 0)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Sisa: {formatCurrency(loan.amount - (loan.paid_amount || 0))}</p>
            </div>
          </div>

          <div className="flex gap-2 justify-between">
            {!isPaid && (
              <Button 
                size="sm" 
                className={`flex-1 ${loan.type === 'payable' ? '' : 'bg-green-600 hover:bg-green-700'}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/loans/${loan.id}/payment`);
                }}
              >
                {loan.type === 'payable' ? 'Bayar' : 'Terima Pembayaran'}
              </Button>
            )}
            <Button 
              size="sm" 
              variant="destructive"
              className="flex-1"
              onClick={handleDeleteClick}
            >
              Hapus
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}; 