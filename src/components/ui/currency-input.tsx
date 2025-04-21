import React, { useState, useEffect, forwardRef, ChangeEvent } from "react";
import { Input } from "./input";
import { formatNumberWithSeparator, parseFormattedNumber } from "@/lib/utils";
import { NumericKeyboard } from "./NumericKeyboard";

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

    // Update display value when the actual value changes
    useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatNumberWithSeparator(value));
      }
    }, [value]);

    // Remove input focus/cursor/keyboard on most phones:
    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.preventDefault();
      setShowKeyboard(true);
    };

    const [displayValue, setDisplayValue] = useState<string>("");

    // Instead of typing, always use custom keyboard
    const handleSetAmount = (val: number) => {
      if (onChange) onChange(val);
      setDisplayValue(formatNumberWithSeparator(val));
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
          readOnly // make always readOnly so only our keyboard works
          onFocus={handleInputFocus}
          onClick={handleInputFocus}
          className={`${showPrefix ? 'pl-10' : ''} ${className || ''} cursor-pointer`}
          aria-invalid={!!error}
          {...props}
        />
        <NumericKeyboard
          open={showKeyboard}
          initialValue={value}
          onClose={() => setShowKeyboard(false)}
          onSubmit={handleSetAmount}
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
