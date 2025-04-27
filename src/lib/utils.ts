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

// Utilitas manajemen cache
interface CacheOptions {
  key: string;
  data: any;
  expiresInMinutes?: number;
}

/**
 * Menyimpan data ke dalam cache dengan timestamp kedaluwarsa
 */
export function setCache({ key, data, expiresInMinutes = 60 }: CacheOptions): void {
  try {
    const cacheItem = {
      data,
      expires: Date.now() + (expiresInMinutes * 60 * 1000),
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('Error setting cache:', error);
    // Jika localStorage penuh, coba hapus cache yang sudah kadaluarsa
    cleanExpiredCache();
  }
}

/**
 * Mengambil data dari cache jika masih valid
 * @returns Data dari cache atau null jika sudah kadaluarsa atau tidak ditemukan
 */
export function getCache<T>(key: string): T | null {
  try {
    const cacheItem = localStorage.getItem(key);
    if (!cacheItem) return null;
    
    const { data, expires } = JSON.parse(cacheItem);
    if (Date.now() > expires) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data as T;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}

/**
 * Membersihkan cache yang sudah kadaluarsa untuk menghemat ruang penyimpanan
 */
export function cleanExpiredCache(): void {
  try {
    const keys = Object.keys(localStorage);
    let bytesFreed = 0;
    
    for (const key of keys) {
      try {
        const item = localStorage.getItem(key);
        if (!item) continue;
        
        // Coba parse sebagai item cache
        const parsedItem = JSON.parse(item);
        if (parsedItem && parsedItem.expires && Date.now() > parsedItem.expires) {
          bytesFreed += item.length * 2; // Perkiraan ukuran dalam bytes (UTF-16)
          localStorage.removeItem(key);
        }
      } catch (e) {
        // Bukan item cache, abaikan
        continue;
      }
    }
    
    console.log(`Cache cleaning freed approximately ${bytesFreed / 1024} KB`);
  } catch (error) {
    console.error('Error cleaning cache:', error);
  }
}

/**
 * Menghitung perkiraan penggunaan localStorage dalam KB
 */
export function getLocalStorageUsage(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      total += (key.length + (value?.length || 0)) * 2; // UTF-16 encoding (2 bytes per character)
    }
  }
  return total / 1024; // Convert to KB
}

/**
 * Debounce function untuk membatasi eksekusi fungsi
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function untuk membatasi eksekusi fungsi dengan interval minimum
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T, 
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
