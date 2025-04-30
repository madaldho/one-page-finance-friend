import React, { useEffect } from 'react';
import { Calendar, Info } from 'lucide-react';
import { format, subDays, subMonths, startOfDay, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface AnalysisFiltersProps {
  period: string;
  setPeriod: (value: string) => void;
  dateRange: { from?: Date; to?: Date };
  setDateRange: (range: { from?: Date; to?: Date }) => void;
  transactionCount: number;
}

export function AnalysisFilters({
  period,
  setPeriod,
  dateRange,
  setDateRange,
  transactionCount
}: AnalysisFiltersProps) {
  // Update date range when period changes
  useEffect(() => {
    const today = startOfDay(new Date());
    
    if (period === 'week') {
      setDateRange({
        from: subDays(today, 6), // Last 7 days
        to: today
      });
    } else if (period === 'month') {
      setDateRange({
        from: subDays(today, 29), // Last 30 days
        to: today
      });
    } else if (period === 'year') {
      setDateRange({
        from: subMonths(today, 11), // Last 12 months
        to: today
      });
    }
    // Don't update if 'custom' is selected - let user pick
  }, [period, setDateRange]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  // Format date to YYYY-MM-DD for input
  const formatDateForInput = (date?: Date) => {
    if (!date) return "";
    return format(date, 'yyyy-MM-dd');
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newDate = parseISO(e.target.value);
      setDateRange({
        ...dateRange,
        from: newDate
      });
      
      // If date is manually changed, switch to custom period
      if (period !== 'custom') {
        setPeriod('custom');
      }
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newDate = parseISO(e.target.value);
      setDateRange({
        ...dateRange,
        to: newDate
      });
      
      // If date is manually changed, switch to custom period
      if (period !== 'custom') {
        setPeriod('custom');
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border mb-6 overflow-hidden">
      <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-end">
        <div className="space-y-1.5 flex-1">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <Calendar className="w-4 h-4 mr-1.5 text-gray-500" />
            Periode Waktu
          </label>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="bg-white border-gray-200 rounded-lg">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">7 hari terakhir</SelectItem>
              <SelectItem value="month">30 hari terakhir</SelectItem>
              <SelectItem value="year">12 bulan terakhir</SelectItem>
              <SelectItem value="custom">Rentang kustom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className={cn(
          "space-y-1.5 flex-1",
          period !== "custom" && "opacity-80"
        )}>
          <label className="text-sm font-medium text-gray-700">Rentang Tanggal</label>
          <div className="flex items-center gap-2">
            <Input 
              type="date" 
              value={formatDateForInput(dateRange.from)} 
              onChange={handleStartDateChange}
              className="flex-1"
            />
            <span className="text-gray-400">-</span>
            <Input 
              type="date" 
              value={formatDateForInput(dateRange.to)} 
              onChange={handleEndDateChange}
              className="flex-1"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 flex items-center border-t">
        <Info className="h-3 w-3 mr-1.5 flex-shrink-0" />
        <div className="flex items-center flex-wrap gap-1">
          <span>Menampilkan</span> 
          <Badge variant="secondary" className="font-medium text-xs">
            {transactionCount} transaksi
          </Badge>
          {dateRange.from && (
            <span>
              dari {format(dateRange.from, 'dd MMMM yyyy', { locale: id })}
              {dateRange.to ? ` - ${format(dateRange.to, 'dd MMMM yyyy', { locale: id })}` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
