import React, { useState, useEffect, forwardRef } from "react";
import { Input } from "./input";
import { formatNumberWithSeparator, parseFormattedNumber } from "@/lib/utils";
import { NumericKeyboard } from "./NumericKeyboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDebounce } from "@/hooks/use-debounce";

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: number;
  onChange?: (value: number) => void;
  showPrefix?: boolean;
  prefix?: string;
  error?: string;
  className?: string;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ 
    value, 
    onChange, 
    className, 
    showPrefix = false, 
    prefix = "Rp", 
    error, 
    ...props 
  }, ref) => {
    const [showKeyboard, setShowKeyboard] = useState(false);
    const [displayValue, setDisplayValue] = useState<string>("");
    const [inputValue, setInputValue] = useState<number>(value || 0);
    const isMobile = useIsMobile();
    
    // Menggunakan debounce untuk mengurangi lag saat input
    const debouncedValue = useDebounce(inputValue, 150);

    // Update ke parent hanya setelah debounce selesai
    useEffect(() => {
      if (onChange) {
        onChange(debouncedValue);
      }
    }, [debouncedValue, onChange]);

    // Update display value when value changes from parent
    useEffect(() => {
      if (value !== undefined) {
        setInputValue(value);
        setDisplayValue(formatNumberWithSeparator(value));
      }
    }, [value]);

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement, MouseEvent>) => {
      if (isMobile) {
        e.preventDefault();
        setShowKeyboard(true);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isMobile) return; // Tidak perlu handle di mobile karena menggunakan NumericKeyboard
      
      // Mengambil nilai dari input
      const inputStr = e.target.value;
      
      // Hapus semua karakter non-digit dan formatting sebelumnya (titik)
      const rawValue = inputStr.replace(/[^\d]/g, '');
      
      // Konversi ke angka
      const numericValue = rawValue ? parseInt(rawValue, 10) : 0;
      
      // Format untuk tampilan dengan pemisah ribuan
      setDisplayValue(formatNumberWithSeparator(numericValue));
      
      // Update state lokal (akan di-debounce sebelum mengirim ke parent)
      setInputValue(numericValue);
    };

    const handleSetAmount = (val: number) => {
      setInputValue(val);
    };

    return (
      <div className="relative">
        {showPrefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          ref={ref}
          type="text"
          value={displayValue}
          readOnly={isMobile} // hanya readonly untuk mobile
          onFocus={handleInputFocus}
          onClick={handleInputFocus}
          onChange={handleInputChange} // tambahkan onChange handler untuk desktop
          className={`${showPrefix ? 'pl-10' : ''} ${className || ''} ${isMobile ? "cursor-pointer" : ""}`}
          aria-invalid={!!error}
          inputMode="numeric"
          {...props}
        />
        {/* Show keyboard only on mobile/tablet */}
        {isMobile && (
          <NumericKeyboard
            open={showKeyboard}
            initialValue={value}
            onClose={() => setShowKeyboard(false)}
            onSubmit={handleSetAmount}
            presentationMode="bottom-sheet"
          />
        )}
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
