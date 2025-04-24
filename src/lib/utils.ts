import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { format as fnsFormat, parseISO } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  try {
    return fnsFormat(parseISO(dateString), "dd/MM/yyyy");
  } catch (error) {
    return dateString;
  }
}; 

export function formatNumberWithSeparator(value: string | number) {
  const numStr = String(value).replace(/[^0-9]/g, '');
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseFormattedNumber(value: string) {
  return parseFloat(value.replace(/\./g, ''));
}

// Fungsi untuk memproses string jumlah uang menjadi number
export function parseAmount(value: string | number): number {
  if (typeof value === 'number') return value;
  
  // Hapus semua karakter non-digit dan koma/titik
  const cleanedValue = String(value).replace(/[^\d.,]/g, '');
  
  // Ganti koma dengan titik jika ada
  const normalizedValue = cleanedValue.replace(/,/g, '.');
  
  // Jika formatnya seperti 1.000.000, ambil hanya digit
  if (normalizedValue.split('.').length > 2) {
    return parseFloat(normalizedValue.replace(/\./g, ''));
  }
  
  // Jika formatnya 1000.50 atau 1000
  return parseFloat(normalizedValue) || 0;
}
