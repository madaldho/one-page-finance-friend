import * as React from "react";
import { format, parse } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  date?: { from?: Date; to?: Date };
  onChange?: (range: { from?: Date; to?: Date } | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  date,
  onChange,
  className,
}: DateRangePickerProps) {
  const [selectedDateRange, setSelectedDateRange] = React.useState<{ from?: Date; to?: Date } | undefined>(date);

  React.useEffect(() => {
    if (date) {
      setSelectedDateRange(date);
    }
  }, [date]);

  // Format tanggal untuk input HTML
  const formatDateForInput = (date?: Date) => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  };

  // Format tanggal untuk tampilan tooltip
  const formatDateForDisplay = (date?: Date) => {
    if (!date) return "";
    return format(date, "dd MMMM yyyy", { locale: id });
  };

  // Handler untuk perubahan tanggal awal
  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fromDate = e.target.value 
      ? parse(e.target.value, "yyyy-MM-dd", new Date()) 
      : undefined;
    
    const newRange = {
      from: fromDate,
      to: selectedDateRange?.to
    };
    
    setSelectedDateRange(newRange);
    
    if (onChange) {
      onChange(newRange);
    }
  };

  // Handler untuk perubahan tanggal akhir
  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const toDate = e.target.value 
      ? parse(e.target.value, "yyyy-MM-dd", new Date()) 
      : undefined;
    
    const newRange = {
      from: selectedDateRange?.from,
      to: toDate
    };
    
    setSelectedDateRange(newRange);
    
    if (onChange) {
      onChange(newRange);
    }
  };

  return (
    <div className={cn("flex gap-2 items-center", className)}>
      <div className="flex-1 relative">
        <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
          <CalendarIcon className="h-4 w-4" />
        </div>
        <input
          type="date"
          value={formatDateForInput(selectedDateRange?.from)}
          onChange={handleFromDateChange}
          className="w-full rounded-md border border-input bg-white/90 px-8 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Tanggal mulai"
          title={selectedDateRange?.from ? formatDateForDisplay(selectedDateRange.from) : "Pilih tanggal mulai"}
        />
      </div>
      <div className="flex-none text-gray-400">-</div>
      <div className="flex-1 relative">
        <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
          <CalendarIcon className="h-4 w-4" />
        </div>
        <input
          type="date"
          value={formatDateForInput(selectedDateRange?.to)}
          onChange={handleToDateChange}
          className="w-full rounded-md border border-input bg-white/90 px-8 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Tanggal akhir"
          min={formatDateForInput(selectedDateRange?.from)}
          title={selectedDateRange?.to ? formatDateForDisplay(selectedDateRange.to) : "Pilih tanggal akhir"}
        />
      </div>
    </div>
  );
}
