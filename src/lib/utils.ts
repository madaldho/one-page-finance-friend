import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Indonesian Rupiah currency
 * @param amount The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Formats a number with thousand separators (dots) for display in input fields
 * @param value The number to format
 * @returns String with thousand separators (e.g., 1000000 -> "1.000.000")
 */
export const formatNumberWithSeparator = (value: number | string): string => {
  if (!value && value !== 0) return '';
  
  // Convert to string and remove any non-digit characters
  const numStr = value.toString().replace(/\D/g, '');
  
  // Format with thousand separators
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Converts a string with thousand separators back to a number
 * @param formattedValue String with thousand separators (e.g., "1.000.000")
 * @returns Number value (e.g., 1000000)
 */
export const parseFormattedNumber = (formattedValue: string): number => {
  if (!formattedValue) return 0;
  
  // Remove all dots and convert to number
  const value = formattedValue.replace(/\./g, '');
  return parseInt(value, 10) || 0;
};

/**
 * Calculates the percentage of a value compared to a total
 * @param value The current value
 * @param total The total value
 * @returns Percentage as a number between 0 and 100
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
}

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};
