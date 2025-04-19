import React, { useState, useEffect, forwardRef, ChangeEvent } from "react";
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
    const [displayValue, setDisplayValue] = useState<string>("");

    // Update display value when the actual value changes
    useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatNumberWithSeparator(value));
      }
    }, [value]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      // Get the current cursor position
      const cursorPosition = e.target.selectionStart || 0;
      const previousLength = displayValue.length;
      
      // Get the value without any formatting
      const rawValue = e.target.value.replace(/\./g, "");
      
      // Only allow digits
      if (/^\d*$/.test(rawValue)) {
        // Format the value
        const formattedValue = formatNumberWithSeparator(rawValue);
        setDisplayValue(formattedValue);
        
        // Calculate new cursor position based on how many dots were added or removed
        const lengthDifference = formattedValue.length - previousLength;
        
        // Call onChange with the numeric value
        if (onChange) {
          onChange(parseFormattedNumber(formattedValue));
        }
        
        // Set the cursor position after React re-renders
        setTimeout(() => {
          if (e.target.selectionStart !== null) {
            const newPosition = Math.max(0, cursorPosition + lengthDifference);
            e.target.setSelectionRange(newPosition, newPosition);
          }
        }, 0);
      }
    };

    return (
      <div className="relative">
        {showPrefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {prefix}
          </span>
        )}
        <Input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
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
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput }; 