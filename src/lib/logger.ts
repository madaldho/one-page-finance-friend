/**
 * Logger service - menangani log dengan aman untuk aplikasi
 * Penggunaan:
 * import { logger } from '@/lib/logger';
 * logger.info('Pesan info');
 * logger.error('Terjadi kesalahan', error);
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Cek apakah aplikasi dalam mode produksi
const isProduction = import.meta.env.MODE === 'production';

/**
 * Mencegah informasi sensitif muncul di log
 * @param data Data yang akan dipotong
 * @returns Data yang sudah disamarkan
 */
const sanitizeData = (data: any): any => {
  if (!data) return data;
  
  // Jika data adalah objek, coba samarkan field sensitif
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    
    // Daftar field sensitif yang perlu disamarkan
    const sensitiveFields = [
      'password', 'token', 'accessToken', 'refreshToken', 
      'apiKey', 'key', 'secret', 'credential', 'pin', 'balance'
    ];
    
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    // Jika ada field 'error' atau 'data', sanitasi juga secara rekursif
    if ('error' in sanitized && typeof sanitized.error === 'object') {
      sanitized.error = sanitizeData(sanitized.error);
    }
    
    if ('data' in sanitized && typeof sanitized.data === 'object') {
      sanitized.data = sanitizeData(sanitized.data);
    }
    
    return sanitized;
  }
  
  return data;
};

/**
 * Logger yang aman untuk penggunaan di aplikasi
 */
export const logger = {
  /**
   * Log pesan informasi
   */
  info: (message: string, data?: any) => {
    if (isProduction) return; // Tidak perlu log info di produksi
    
    if (data) {
      console.info(`[INFO] ${message}`, sanitizeData(data));
    } else {
      console.info(`[INFO] ${message}`);
    }
  },
  
  /**
   * Log peringatan
   */
  warn: (message: string, data?: any) => {
    if (data) {
      console.warn(`[WARN] ${message}`, sanitizeData(data));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },
  
  /**
   * Log kesalahan
   */
  error: (message: string, error?: any) => {
    // Di produksi, hanya log pesan kesalahan tanpa stack trace
    if (isProduction) {
      // Dalam produksi, kita bisa mengirim error ke layanan monitoring seperti Sentry
      console.error(`[ERROR] ${message}`);
      return;
    }
    
    if (error) {
      // Di development, log error lengkap tapi sanitasi data sensitif
      console.error(`[ERROR] ${message}`, sanitizeData(error));
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },
  
  /**
   * Log debug - hanya aktif di development
   */
  debug: (message: string, data?: any) => {
    if (isProduction) return; // Matikan di produksi
    
    if (data) {
      console.debug(`[DEBUG] ${message}`, sanitizeData(data));
    } else {
      console.debug(`[DEBUG] ${message}`);
    }
  }
};

/**
 * Fungsi helper untuk mencatat kesalahan umum
 */
export const logError = (component: string, action: string, error: any) => {
  logger.error(`[${component}] Error saat ${action}`, error);
}; 