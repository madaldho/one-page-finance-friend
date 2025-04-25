import { differenceInDays, parseISO } from 'date-fns';

/**
 * Tipe-tipe langganan yang tersedia
 */
export type SubscriptionType = "free" | "pro_6m" | "pro_12m" | "trial" | null;

/**
 * Interface untuk profil pengguna yang terkait dengan langganan
 */
export interface UserSubscriptionProfile {
  subscription_type?: SubscriptionType;
  trial_start?: string | null;
  trial_end?: string | null;
  is_admin?: boolean;
  [key: string]: unknown;
}

/**
 * Menghitung jumlah hari tersisa untuk trial atau langganan
 * Menggunakan zona waktu lokal perangkat pengguna untuk perhitungan
 * 
 * @param endDate Tanggal akhir trial atau langganan
 * @returns Jumlah hari tersisa, atau null jika tidak ada tanggal akhir
 */
export const calculateDaysRemaining = (endDate: string | null): number | null => {
  if (!endDate) return null;
  
  // Pastikan perhitungan menggunakan zona waktu lokal perangkat
  // parseISO secara otomatis memperlakukan string tanggal sesuai zona waktu lokal pengguna
  const end = parseISO(endDate);
  const today = new Date();
  
  // Reset jam ke tengah malam di zona waktu lokal
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  // Hitung selisih hari
  const diff = end.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  return Math.max(0, days);
};

/**
 * Format tanggal sesuai zona waktu lokal pengguna
 * 
 * @param date Tanggal dalam string ISO atau Date object
 * @returns Tanggal terformat YYYY-MM-DD dalam zona waktu lokal
 */
export const formatLocalDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Menambahkan jumlah hari ke tanggal dengan mempertahankan zona waktu lokal
 * 
 * @param date Tanggal awal
 * @param days Jumlah hari yang akan ditambahkan
 * @returns Tanggal baru setelah penambahan hari
 */
export const addLocalDays = (date: Date | string, days: number): Date => {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Memeriksa apakah pengguna adalah pro (langganan berbayar)
 * @param profile Profil pengguna
 * @returns Boolean yang menunjukkan apakah pengguna adalah pro
 */
export const isProUser = (profile: UserSubscriptionProfile | null): boolean => {
  if (!profile) return false;
  return profile.subscription_type === 'pro_6m' || profile.subscription_type === 'pro_12m';
};

/**
 * Memeriksa apakah pengguna memiliki akses pro (langganan berbayar atau trial aktif)
 * @param profile Profil pengguna
 * @returns Boolean yang menunjukkan apakah pengguna memiliki akses pro
 */
export const hasProAccess = (profile: UserSubscriptionProfile | null): boolean => {
  if (!profile) return false;
  
  // Jika pengguna adalah pro, mereka pasti memiliki akses pro
  if (isProUser(profile)) return true;
  
  // Jika pengguna adalah trial, mereka memiliki akses pro
  if (profile.subscription_type === 'trial') {
    const daysRemaining = calculateDaysRemaining(profile.trial_end);
    return daysRemaining !== null && daysRemaining > 0;
  }
  
  // Pengecekan lama: Jika pengguna memiliki trial yang aktif, mereka memiliki akses pro
  if (profile.trial_end) {
    const daysRemaining = calculateDaysRemaining(profile.trial_end);
    return daysRemaining !== null && daysRemaining > 0;
  }
  
  return false;
};

/**
 * Mendapatkan status langganan pengguna sebagai string untuk ditampilkan
 * @param profile Profil pengguna
 * @returns String yang mewakili status langganan pengguna
 */
export const getSubscriptionStatus = (profile: UserSubscriptionProfile | null): 
  'admin' | 'pro' | 'trial' | 'free' => {
  if (!profile) return 'free';
  
  // Cek apakah admin
  if (profile.is_admin) return 'admin';
  
  // Cek apakah pro
  if (isProUser(profile)) return 'pro';
  
  // Cek apakah trial (new)
  if (profile.subscription_type === 'trial') {
    const daysRemaining = calculateDaysRemaining(profile.trial_end);
    if (daysRemaining !== null && daysRemaining > 0) {
      return 'trial';
    }
    // Jika trial tapi sudah habis, kembalikan 'free'
    return 'free';
  }
  
  // Cek apakah dalam masa trial (pengecekan lama)
  if (profile.trial_end) {
    const daysRemaining = calculateDaysRemaining(profile.trial_end);
    if (daysRemaining !== null && daysRemaining > 0) {
      return 'trial';
    }
  }
  
  // Default: free
  return 'free';
};

/**
 * Mendapatkan label status langganan pengguna untuk UI
 * @param profile Profil pengguna
 * @returns Objek dengan label text dan class CSS
 */
export const getSubscriptionLabel = (profile: UserSubscriptionProfile | null): {
  text: string;
  className: string;
  icon?: string;
} => {
  const status = getSubscriptionStatus(profile);
  
  switch (status) {
    case 'admin':
      return {
        text: 'Admin',
        className: 'bg-red-100 text-red-800 font-medium',
        icon: '👑'
      };
    case 'pro':
      return {
        text: 'Pro',
        className: 'bg-purple-100 text-purple-800 font-medium',
        icon: '👑'
      };
    case 'trial':
      return {
        text: 'Trial Pro',
        className: 'bg-blue-100 text-blue-800 font-medium',
        icon: '✨'
      };
    case 'free':
    default:
      return {
        text: 'Free',
        className: 'text-gray-500'
      };
  }
}; 