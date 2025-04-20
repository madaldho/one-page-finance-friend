import React, { useState, useEffect } from 'react';
import { isSameDay } from 'date-fns';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { DateRange } from 'react-day-picker';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// Event emitter for global date range changes
export const dateRangeEmitter = {
  listeners: [] as ((range: DateRange | undefined) => void)[],
  emit(range: DateRange | undefined) {
    this.listeners.forEach(listener => listener(range));
  },
  subscribe(listener: (range: DateRange | undefined) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
};

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  align?: 'start' | 'center' | 'end';
  locale?: string;
  showReset?: boolean;
  className?: string;
  calendarClassName?: string;
  emitGlobal?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  align = 'start',
  locale = id,
  showReset = true,
  className,
  calendarClassName,
  emitGlobal = false
}: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>(value);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Helper to format dates in Indonesian format
  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'dd-MM-yyyy');
  };
  
  // Function to format date for HTML input (yyyy-MM-dd)
  const formatForInput = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  // Handle direct input change
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined;
    
    if (newDate) {
      setDate(prev => {
        const newRange = { from: newDate, to: prev?.to };
        handleChange(newRange);
        return newRange;
      });
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined;
    
    if (newDate) {
      setDate(prev => {
        const newRange = { from: prev?.from, to: newDate };
        handleChange(newRange);
        return newRange;
      });
    }
  };

  const handleChange = (range: DateRange | undefined) => {
    setDate(range);
    onChange?.(range);
    
    if (emitGlobal) {
      dateRangeEmitter.emit(range);
    }
  };

  const handleReset = () => {
    setDate(undefined);
    onChange?.(undefined);
    
    if (emitGlobal) {
      dateRangeEmitter.emit(undefined);
    }
  };

  useEffect(() => {
    setDate(value);
  }, [value]);

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            size="sm"
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {formatDate(date.from)} - {formatDate(date.to)}
                </>
              ) : (
                formatDate(date.from)
              )
            ) : (
              <span>Pilih tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align={align}
        >
          <div className="px-3 pt-3 flex items-center justify-between">
            <div className="flex gap-2">
              <Input
                type="date"
                value={formatForInput(date?.from)}
                onChange={handleFromChange}
                className="w-[130px]"
              />
              <span className="flex items-center">-</span>
              <Input
                type="date"
                value={formatForInput(date?.to)}
                onChange={handleToChange}
                className="w-[130px]"
              />
            </div>
            {showReset && date?.from && (
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                onClick={handleReset}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleChange}
            numberOfMonths={1}
            locale={locale}
            showOutsideDays={false}
            className={cn('p-3', calendarClassName)}
            classNames={{
              nav_button_previous: 'h-7 w-7',
              nav_button_next: 'h-7 w-7',
              caption: 'flex items-center justify-center gap-1',
              caption_label: 'text-sm font-medium',
              cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
              day: cn(
                'h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-md'
              ),
              day_range_end: 'day-range-end',
              day_selected:
                'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
              day_today: 'bg-accent text-accent-foreground',
              day_outside:
                'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
              day_disabled: 'text-muted-foreground opacity-50',
              day_range_middle:
                'aria-selected:bg-accent aria-selected:text-accent-foreground',
              day_hidden: 'invisible',
              nav: 'flex items-center',
              nav_button: 'h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
              row: 'flex w-full mt-2',
              caption_dropdowns: 'flex gap-1',
              dropdown: 'focus:outline-none focus:ring-2 focus:ring-primary',
              dropdown_month: 'flex-1',
              dropdown_year: 'flex-1',
            }}
            components={{
              IconLeft: () => <ChevronLeft className="h-4 w-4" />,
              IconRight: () => <ChevronRight className="h-4 w-4" />,
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 