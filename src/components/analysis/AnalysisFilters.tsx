
import React from 'react';
import { Search, Info } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/DateRangePicker";

interface AnalysisFiltersProps {
  period: string;
  setPeriod: (value: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  transactionCount: number;
}

export function AnalysisFilters({
  period,
  setPeriod,
  dateRange,
  setDateRange,
  searchTerm,
  setSearchTerm,
  transactionCount
}: AnalysisFiltersProps) {
  return (
    <div className="bg-muted p-4 rounded-lg mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Time Period</label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="year">Last 12 months</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className={cn(
              "w-full",
              period !== "custom" && "opacity-50 pointer-events-none"
            )}
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Search Transactions</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, category, wallet..."
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center mt-3 text-xs text-muted-foreground">
        <Info className="h-3 w-3 mr-1" />
        <span>
          {transactionCount} transactions found for {
            dateRange.from ? format(dateRange.from, 'dd MMM yyyy', { locale: id }) : ''
          } 
          {dateRange.to ? ` - ${format(dateRange.to, 'dd MMM yyyy', { locale: id })}` : ''}
        </span>
      </div>
    </div>
  );
}
