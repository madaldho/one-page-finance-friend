import React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, min, max, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Allow empty string for clearing
      if (inputValue === '') {
        onChange(0);
        return;
      }
      
      const numValue = parseFloat(inputValue);
      
      // Validate number
      if (isNaN(numValue)) return;
      
      // Apply min/max constraints
      let finalValue = numValue;
      if (min !== undefined && numValue < min) finalValue = min;
      if (max !== undefined && numValue > max) finalValue = max;
      
      onChange(finalValue);
    };

    return (
      <Input
        type="number"
        ref={ref}
        className={cn("", className)}
        value={value || ""}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        {...props}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";