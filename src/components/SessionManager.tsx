import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Komponen ini menangani refresh sesi otomatis saat aplikasi dibuka
 * Ini akan menjaga sesi tetap aktif meskipun pengguna tidak aktif untuk jangka waktu lama
 */
const SessionManager = () => {
  const { refreshSession } = useAuth();

  useEffect(() => {
    const checkAndRefreshSession = () => {
      try {
        // Cek apakah ada sesi yang perlu di-refresh
        const lastRefresh = localStorage.getItem('last_session_refresh');
        
        if (lastRefresh) {
          const lastRefreshTime = new Date(lastRefresh).getTime();
          const currentTime = new Date().getTime();
          const hoursSinceLastRefresh = (currentTime - lastRefreshTime) / (1000 * 60 * 60);
          
          // Jika sudah lebih dari 6 jam sejak refresh terakhir, refresh session
          if (hoursSinceLastRefresh > 6) {
            console.log('Refreshing session after', Math.floor(hoursSinceLastRefresh), 'hours of inactivity');
            refreshSession();
          }
        }
        
        // Tambahkan event listener untuk browser visibility
        document.addEventListener('visibilitychange', handleVisibilityChange);
      } catch (error) {
        console.error('Error in session check:', error);
      }
    };
    
    // Handler saat halaman menjadi visible kembali (user beralih tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastRefresh = localStorage.getItem('last_session_refresh');
        
        if (lastRefresh) {
          const lastRefreshTime = new Date(lastRefresh).getTime();
          const currentTime = new Date().getTime();
          const hoursSinceLastRefresh = (currentTime - lastRefreshTime) / (1000 * 60 * 60);
          
          // Jika sudah lebih dari 1 jam sejak refresh terakhir saat kembali ke tab
          if (hoursSinceLastRefresh > 1) {
            console.log('Refreshing session on tab focus after', Math.floor(hoursSinceLastRefresh), 'hours');
            refreshSession();
          }
        }
      }
    };
    
    // Check saat pertama kali komponen dimuat
    checkAndRefreshSession();
    
    // Check juga saat window mendapat fokus kembali (misal: user membuka laptop setelah ditutup)
    window.addEventListener('focus', refreshSession);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refreshSession);
    };
  }, [refreshSession]);

  // Komponen ini tidak merender apapun
  return null;
};

export default SessionManager; 