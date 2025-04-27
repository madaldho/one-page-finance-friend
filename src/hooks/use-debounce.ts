import { useState, useEffect, useMemo } from 'react';

/**
 * Hook untuk debounce value untuk mengurangi lag saat mengetik pada input
 * @param value Value yang ingin di-debounce
 * @param delay Waktu delay dalam milidetik (default: 300ms)
 * @returns Value yang sudah di-debounce
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timer untuk update nilai setelah delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timer jika value atau delay berubah
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook untuk throttle fungsi untuk mengurangi lag saat click tombol atau event lainnya
 * @param callback Fungsi yang ingin di-throttle
 * @param delay Waktu delay dalam milidetik (default: 300ms)
 * @returns Fungsi yang sudah di-throttle
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [lastCalled, setLastCalled] = useState(0);

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCalled >= delay) {
      callback(...args);
      setLastCalled(now);
    }
  };
}

/**
 * Hook untuk memoize hasil seleksi dropdown untuk mengurangi lag saat memilih item
 * @param selector Fungsi selector yang mengambil nilai dari state
 * @param dependencies Array dependencies untuk memicu recalculation
 * @returns Hasil seleksi yang sudah di-memoize
 */
export function useMemoizedSelector<T, R>(
  selector: (state: T) => R,
  state: T,
  dependencies: unknown[] = []
): R {
  // Gunakan useMemo untuk menyimpan hasil kalkulasi
  return useMemo(() => selector(state), [state, selector, ...dependencies]);
} 