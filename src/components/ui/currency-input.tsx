
import React, { useState, useEffect, forwardRef } from "react";
import { Input } from "./input";
import { formatNumberWithSeparator } from "@/lib/utils";
import { NumericKeyboard } from "./NumericKeyboard";
import { useIsMobile } from "@/hooks/use-mobile";

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
    const isMobile = useIsMobile();

    // Update display value when value changes from parent
    useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatNumberWithSeparator(value));
      }
    }, [value]);

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement, MouseEvent>) => {
      if (isMobile) {
        e.preventDefault();
        setShowKeyboard(true);
      }
    };

    const handleSetAmount = (val: number) => {
      if (onChange) onChange(val);
      setDisplayValue(formatNumberWithSeparator(val));
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
          readOnly={isMobile} // always readonly for custom keyboard on mobile
          onFocus={handleInputFocus}
          onClick={handleInputFocus}
          className={`${showPrefix ? 'pl-10' : ''} ${className || ''} ${isMobile ? "cursor-pointer" : ""}`}
          aria-invalid={!!error}
          inputMode="numeric"
          pattern="[0-9]*"
          {...props}
        />
        {/* Show keyboard only on mobile/tablet */}
        {isMobile && (
          <NumericKeyboard
            open={showKeyboard}
            initialValue={value}
            onClose={() => setShowKeyboard(false)}
            onSubmit={handleSetAmount}
            // bottom-docked keyboard, not modal
            presentationMode="bottom-sheet"
          />
        )}
        {!isMobile && error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
