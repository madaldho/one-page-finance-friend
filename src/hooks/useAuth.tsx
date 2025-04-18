import { useAuth as useAuthContext } from '@/contexts/AuthContext';

/**
 * Hook untuk mengakses konteks autentikasi
 * File ini dibuat untuk menghindari kesalahan impor dan memastikan kompatibilitas
 * dengan komponen yang mengimport dari @/hooks/useAuth
 */
export const useAuth = useAuthContext;

export default useAuth; 