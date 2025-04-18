
import * as React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  date?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  date,
  onChange,
  className,
}: DateRangePickerProps) {
  const [selectedDateRange, setSelectedDateRange] = React.useState<DateRange | undefined>(date);

  React.useEffect(() => {
    if (date) {
      setSelectedDateRange(date);
    }
  }, [date]);

  const handleDateSelect = (range: DateRange | undefined) => {
    setSelectedDateRange(range);
    if (onChange) {
      onChange(range);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal bg-white/90",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDateRange?.from ? (
              selectedDateRange.to ? (
                <>
                  {format(selectedDateRange.from, "dd MMM yyyy", { locale: id })} -{" "}
                  {format(selectedDateRange.to, "dd MMM yyyy", { locale: id })}
                </>
              ) : (
                format(selectedDateRange.from, "dd MMM yyyy", { locale: id })
              )
            ) : (
              <span>Pilih tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selectedDateRange?.from}
            selected={selectedDateRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            locale={id}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
