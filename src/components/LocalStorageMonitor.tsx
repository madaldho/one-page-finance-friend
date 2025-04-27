import { useEffect } from 'react';
import { cleanExpiredCache, getLocalStorageUsage } from '@/lib/utils';

/**
 * Komponen yang memantau penggunaan local storage dan membersihkan cache yang sudah tidak diperlukan
 * untuk mencegah masalah performa di perangkat mobile.
 */
const LocalStorageMonitor = () => {
  useEffect(() => {
    // Bersihkan cache yang kadaluarsa saat komponen dimount
    cleanExpiredCache();

    // Set interval untuk memeriksa penggunaan storage
    const checkInterval = setInterval(() => {
      try {
        const usageInKB = getLocalStorageUsage();
        
        // Jika penggunaan lebih dari 4MB (4096KB), bersihkan cache yang kadaluarsa
        if (usageInKB > 4096) {
          console.log(`LocalStorage usage is high (${usageInKB.toFixed(2)} KB). Cleaning expired cache...`);
          cleanExpiredCache();
          
          // Jika masih terlalu besar setelah membersihkan cache kadaluarsa,
          // pertimbangkan untuk membersihkan cache yang jarang digunakan
          const newUsage = getLocalStorageUsage();
          if (newUsage > 4096) {
            console.log(`Storage usage still high (${newUsage.toFixed(2)} KB) after cleaning expired items.`);
            cleanInfrequentlyUsedCache();
          }
        }
      } catch (error) {
        console.error('Error in localStorage monitor:', error);
      }
    }, 60000); // Periksa setiap 1 menit
    
    return () => {
      clearInterval(checkInterval);
    };
  }, []);
  
  /**
   * Membersihkan cache yang jarang digunakan
   * Strategi: Cache yang belum diakses dalam 2 hari terakhir akan dihapus
   */
  const cleanInfrequentlyUsedCache = () => {
    try {
      const now = Date.now();
      const TWO_DAYS = 2 * 24 * 60 * 60 * 1000; // 2 hari dalam milidetik
      let bytesFreed = 0;
      
      // Cari key yang memiliki pola 'lastAccess_*'
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        // Periksa timestamp akses terakhir
        const accessKey = `lastAccess_${key}`;
        const lastAccess = localStorage.getItem(accessKey);
        
        if (lastAccess) {
          const lastAccessTime = parseInt(lastAccess);
          if (now - lastAccessTime > TWO_DAYS) {
            // Hapus item dan catatan akses terakhirnya
            const item = localStorage.getItem(key);
            if (item) {
              bytesFreed += item.length * 2; // Perkiraan dalam bytes
              localStorage.removeItem(key);
              localStorage.removeItem(accessKey);
            }
          }
        }
      }
      
      if (bytesFreed > 0) {
        console.log(`Cleaned infrequently used cache, freed approximately ${bytesFreed / 1024} KB`);
      }
    } catch (error) {
      console.error('Error cleaning infrequently used cache:', error);
    }
  };
  
  return null; // Komponen ini tidak merender apapun
};

export default LocalStorageMonitor; 