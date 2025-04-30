import React from 'react';
import { Download, RefreshCw, LineChart, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface AnalysisHeaderProps {
  onRefresh: () => void;
  onExport: () => void;
  incomeTotal?: number;
  expenseTotal?: number;
  balanceTotal?: number;
}

export function AnalysisHeader({ 
  onRefresh, 
  onExport,
  incomeTotal = 0,
  expenseTotal = 0,
  balanceTotal = 0
}: AnalysisHeaderProps) {
  return (
    <div className="mb-8 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl overflow-hidden shadow-lg">
      <div className="p-5 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
            <div className="flex items-center gap-2">
              <LineChart className="w-6 h-6 text-blue-200" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analisis Keuangan</h1>
            </div>
            <p className="text-blue-100 mt-1">
              Analisa pengeluaran, pemasukan, dan pola keuangan Anda
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
              variant="ghost" 
            size="sm" 
            onClick={onRefresh}
              className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
              variant="ghost" 
            size="sm" 
            onClick={onExport}
              className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
        </div>

        
      </div>
    </div>
  );
}
