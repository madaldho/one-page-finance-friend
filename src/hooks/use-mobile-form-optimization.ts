import { useState, useEffect, useCallback, useMemo } from 'react';
import { useIsMobile } from './use-mobile';
import { useDebounce, useThrottle } from './use-debounce';

/**
 * Hook untuk optimasi performa form pada mobile device
 * Menyediakan utility functions yang dioptimasi untuk mobile
 */
export function useMobileFormOptimization() {
  const isMobile = useIsMobile();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Deteksi virtual keyboard mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const screenHeight = window.screen.height;
      
      // Jika tinggi berkurang signifikan, kemungkinan keyboard virtual terbuka
      const isKeyboardLikelyOpen = currentHeight < screenHeight * 0.75;
      setIsKeyboardOpen(isKeyboardLikelyOpen);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // Delay yang lebih optimal untuk mobile
  const optimizedDebounceDelay = useMemo(() => {
    return isMobile ? 300 : 150;
  }, [isMobile]);

  // Throttle delay yang lebih optimal untuk mobile
  const optimizedThrottleDelay = useMemo(() => {
    return isMobile ? 200 : 100;
  }, [isMobile]);

  // Factory function untuk membuat debounced input handler
  const createDebouncedInputHandler = useCallback((callback: (value: any) => void) => {
    return useDebounce(callback, optimizedDebounceDelay);
  }, [optimizedDebounceDelay]);

  // Factory function untuk membuat throttled event handler
  const createThrottledEventHandler = useCallback((callback: (...args: any[]) => void) => {
    return useThrottle(callback, optimizedThrottleDelay);
  }, [optimizedThrottleDelay]);

  // Optimized focus handler untuk mobile
  const createOptimizedFocusHandler = useCallback((callback: () => void) => {
    return useThrottle((e: Event) => {
      if (isMobile) {
        e.preventDefault();
        // Delay sedikit untuk performa yang lebih baik
        setTimeout(callback, 50);
      } else {
        callback();
      }
    }, 200);
  }, [isMobile]);

  // Helper untuk mengecek apakah perlu menggunakan optimasi mobile
  const shouldUseMobileOptimizations = useMemo(() => {
    return isMobile || window.innerWidth <= 768;
  }, [isMobile]);

  return {
    isMobile,
    isKeyboardOpen,
    optimizedDebounceDelay,
    optimizedThrottleDelay,
    createDebouncedInputHandler,
    createThrottledEventHandler,
    createOptimizedFocusHandler,
    shouldUseMobileOptimizations,
  };
}

/**
 * Hook khusus untuk optimasi input currency pada mobile
 */
export function useMobileCurrencyInput(initialValue?: number, onChange?: (value: number) => void) {
  const { isMobile, optimizedDebounceDelay } = useMobileFormOptimization();
  const [inputValue, setInputValue] = useState(initialValue || 0);
  const debouncedValue = useDebounce(inputValue, optimizedDebounceDelay);

  // Update parent hanya setelah debounce
  useEffect(() => {
    if (onChange) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange]);

  // Update internal value saat prop berubah
  useEffect(() => {
    if (initialValue !== undefined) {
      setInputValue(initialValue);
    }
  }, [initialValue]);

  const updateValue = useCallback((value: number) => {
    setInputValue(value);
  }, []);

  return {
    inputValue,
    updateValue,
    isMobile,
  };
}