import React, { useState, useEffect, forwardRef, memo } from "react";
import { Input } from "./input";
import { formatNumberWithSeparator, parseFormattedNumber } from "@/lib/utils";

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: number;
  onChange?: (value: number) => void;
  showPrefix?: boolean;
  prefix?: string;
  error?: string;
  className?: string;
}

const CurrencyInput = memo(forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ 
    value, 
    onChange, 
    className, 
    showPrefix = false, 
    prefix = "Rp", 
    error, 
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>("");

    // Update display value when value changes from parent
    useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatNumberWithSeparator(value));
      }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Mengambil nilai dari input
      const inputStr = e.target.value;
      
      // Hapus semua karakter non-digit
      const rawValue = inputStr.replace(/[^\d]/g, '');
      
      // Konversi ke angka
      const numericValue = rawValue ? parseInt(rawValue, 10) : 0;
      
      // Format untuk tampilan dengan pemisah ribuan
      const formattedValue = formatNumberWithSeparator(numericValue);
      setDisplayValue(formattedValue);
      
      // Update parent component
      if (onChange) {
        onChange(numericValue);
      }
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
          inputMode="numeric"
          value={displayValue}
          onChange={handleInputChange}
          className={`${showPrefix ? 'pl-10' : ''} ${className || ''}`}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  }
));

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
