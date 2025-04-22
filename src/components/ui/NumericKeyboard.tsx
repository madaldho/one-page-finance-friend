import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

/**
 * presentationMode: "modal" | "bottom-sheet"
 */
interface NumericKeyboardProps {
  open: boolean;
  initialValue?: number;
  onClose: () => void;
  onSubmit: (value: number) => void;
  title?: string;
  currency?: boolean;
  presentationMode?: "modal" | "bottom-sheet";
  forceShow?: boolean;
}

const KEYS = [
  ["1", "2", "3", "÷"],
  ["4", "5", "6", "×"],
  ["7", "8", "9", "-"],
  [",", "0", "back", "+"],
];

// Fungsi untuk deteksi apakah perangkat adalah mobile/tablet
const isMobileOrTablet = () => {
  // Jika di sisi server, anggap false
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  
  // Deteksi berdasarkan user agent
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
  
  // Tambahan deteksi ukuran layar (opsional)
  const isSmallScreen = window.innerWidth <= 1024;
  
  return isMobile || isSmallScreen;
};

export const NumericKeyboard: React.FC<NumericKeyboardProps> = ({
  open,
  initialValue = 0,
  onClose,
  onSubmit,
  title = "Masukan Jumlah",
  currency = true,
  presentationMode = "modal",
  forceShow = false,
}) => {
  const [expression, setExpression] = useState<string>(initialValue ? initialValue.toString() : "");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Deteksi perangkat saat komponen di-mount
  useEffect(() => {
    setIsMobile(isMobileOrTablet());
    
    // Update saat resize window (opsional)
    const handleResize = () => {
      setIsMobile(isMobileOrTablet());
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Hide on blur or esc (only on mobile, panel mode)
  useEffect(() => {
    if (!open || presentationMode !== "bottom-sheet") return;

    const handleClick = (e: MouseEvent) => {
      // Only close if clicked outside the panel
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [open, onClose, presentationMode]);

  useEffect(() => {
    if (open) setExpression(initialValue ? initialValue.toString() : "");
  }, [open, initialValue]);

  // Only allow numbers and math ops
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

  // Jika tidak di perangkat mobile dan tidak dipaksa tampil, jangan tampilkan keyboard
  if ((!isMobile && !forceShow) || !open) return null;

  // Bottom-sheet (mobile/tablet) mode
  if (presentationMode === "bottom-sheet") {
    return (
      <div className="fixed inset-0 flex-col flex z-50">
        {/* Overlay */}
        <div className="flex-1 bg-black/10" />
        {/* Keyboard at bottom */}
        <div
          ref={panelRef}
          className="w-full max-w-md mx-auto bg-white rounded-t-2xl shadow-2xl pb-5 px-5 pt-3"
          style={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 60,
            minHeight: "330px",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-medium">{title}</span>
            <button onClick={onClose} className="text-gray-700 p-1 rounded-full hover:bg-gray-100"><X /></button>
          </div>
          <div className="flex justify-end items-center mb-4">
            <span className="text-3xl font-bold">
              {currency ? formatCurrency(getEvaluatedValue()) : getEvaluatedValue()}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3 bg-gray-100 rounded-xl py-4 px-2 mb-1">
            {KEYS.flat().map((key, i) => (
              <button
                key={i}
                onClick={() => handleKey(key)}
                className={`text-2xl py-2 rounded-lg transition active:bg-gray-300 w-full ${
                  key === "back" ? "text-red-500" : ""
                }`}
                style={{
                  gridColumn: key === "back" ? undefined : undefined,
                }}
                type="button"
              >
                {key === "back" ? (
                  <svg width="26" height="26" viewBox="0 0 20 20" fill="none"><path d="M12.5 8.5L9.5 11.5M9.5 8.5L12.5 11.5M17 10C17 14.4183 13.4183 18 9 18C4.58172 18 1 14.4183 1 10C1 5.58172 4.58172 2 9 2C13.4183 2 17 5.58172 17 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  key
                )}
              </button>
            ))}
          </div>
          <Button
            className="w-full mt-1"
            onClick={() => {
              onSubmit(getEvaluatedValue());
              onClose();
            }}
            type="button"
          >
            Menetapkan jumlah
          </Button>
        </div>
      </div>
    );
  }

  // Modal (for classic usage, if ever needed)
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/25">
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
  );
};
