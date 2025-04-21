
import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface NumericKeyboardProps {
  open: boolean;
  initialValue?: number;
  onClose: () => void;
  onSubmit: (value: number) => void;
  title?: string;
  currency?: boolean; // use formatCurrency if true
}

const KEYS = [
  ["1", "2", "3", "÷"],
  ["4", "5", "6", "×"],
  ["7", "8", "9", "-"],
  [",", "0", "back", "+"],
];

export const NumericKeyboard: React.FC<NumericKeyboardProps> = ({
  open,
  initialValue = 0,
  onClose,
  onSubmit,
  title = "Masukan Jumlah",
  currency = true,
}) => {
  const [expression, setExpression] = useState<string>(initialValue ? initialValue.toString() : "");

  // Custom handler for buttons:
  const handleKey = (key: string) => {
    if (key === "back") {
      setExpression((prev) => prev.slice(0, -1));
    } else if (["+", "-", "×", "÷"].includes(key)) {
      if (!expression || /[+\-×÷]$/.test(expression)) return;
      setExpression((prev) => prev + key);
    } else if (key === ",") {
      // Only allow one comma for decimals
      if (!expression.includes(",")) setExpression((prev) => prev + ",");
    } else {
      // Numbers
      setExpression((prev) => prev + key);
    }
  };

  // Calculate numeric value for display
  const getEvaluatedValue = () => {
    let exp = expression.replace(/÷/g, "/").replace(/×/g, "*").replace(/,/g, ".");
    try {
      // eslint-disable-next-line no-eval
      let val = eval(exp);
      if (isNaN(val)) return 0;
      return val;
    } catch {
      return 0;
    }
  };

  // Keyboard content UI
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-25">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-medium">{title}</span>
            <button onClick={onClose}><X /></button>
          </div>
          {/* Amount display */}
          <div className="flex justify-end items-center mb-4">
            <span className="text-3xl font-bold">
              {currency ? formatCurrency(getEvaluatedValue()) : getEvaluatedValue()}
            </span>
          </div>
          {/* Keyboard grid */}
          <div className="grid grid-cols-4 gap-3 bg-gray-100 rounded-xl py-6 px-2 mb-3">
            {KEYS.flat().map((key, i) => (
              <button
                key={i}
                onClick={() => handleKey(key)}
                className={`text-2xl py-2 rounded-lg transition active:bg-gray-300 ${
                  key === "back" ? "text-red-500" : ""
                }`}
                style={{
                  gridColumn: key === "back" ? "span 1" : undefined,
                }}
              >
                {key === "back" ? (
                  <svg width="26" height="26" viewBox="0 0 20 20" fill="none"><path d="M12.5 8.5L9.5 11.5M9.5 8.5L12.5 11.5M17 10C17 14.4183 13.4183 18 9 18C4.58172 18 1 14.4183 1 10C1 5.58172 4.58172 2 9 2C13.4183 2 17 5.58172 17 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  key
                )}
              </button>
            ))}
          </div>
          {/* Set Value Button */}
          <Button
            className="w-full mt-2"
            onClick={() => {
              onSubmit(getEvaluatedValue());
              onClose();
            }}
          >
            Menetapkan jumlah
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
