import { v4 as uuidv4 } from 'uuid';

/**
 * Fungsi untuk mendapatkan atau membuat fingerprint perangkat
 * Fingerprint akan disimpan di localStorage
 */
export const getDeviceFingerprint = async (): Promise<string> => {
  const storedFingerprint = localStorage.getItem('device_fingerprint');
  
  if (storedFingerprint) {
    return storedFingerprint;
  }
  
  // Jika belum ada fingerprint, buat yang baru
  const newFingerprint = generateFingerprint();
  localStorage.setItem('device_fingerprint', newFingerprint);
  return newFingerprint;
};

/**
 * Fungsi untuk menghasilkan fingerprint unik berdasarkan informasi perangkat
 */
const generateFingerprint = (): string => {
  // Informasi browser dan sistem operasi
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  
  // Tambahkan UUID acak untuk memastikan keunikan
  const randomId = uuidv4();
  
  // Gabungkan semua informasi dan hasilkan fingerprint
  const rawFingerprint = `${userAgent}-${platform}-${screenInfo}-${timeZone}-${language}-${randomId}`;
  
  // Buat hash sederhana
  let hash = 0;
  for (let i = 0; i < rawFingerprint.length; i++) {
    const char = rawFingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `df-${Math.abs(hash).toString(16)}-${Date.now().toString(36)}`;
};

/**
 * Fungsi untuk menghapus fingerprint perangkat (digunakan saat logout)
 */
export const clearDeviceFingerprint = (): void => {
  localStorage.removeItem('device_fingerprint');
}; 