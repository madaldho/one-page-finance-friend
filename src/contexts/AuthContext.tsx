import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { verifyDevice, removeAllDevices } from '@/utils/deviceManager';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  autoLogin: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
  autoLogin: async () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTokenInterval, setRefreshTokenInterval] = useState<NodeJS.Timeout | null>(null);

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Failed to refresh session:", error);
        return;
      }
      
      if (data && data.session) {
        setSession(data.session);
        setUser(data.session.user ?? null);
        
        localStorage.setItem('last_session_refresh', new Date().toISOString());
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
    }
  };

  // Fungsi untuk login otomatis berdasarkan perangkat terpercaya
  const autoLogin = async (): Promise<boolean> => {
    try {
      // Cek jika sudah ada sesi aktif
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        return true;
      }
      
      // Jika tidak ada sesi, coba cek perangkat terpercaya
      const userId = await verifyDevice();
      
      if (userId) {
        console.log("Perangkat terpercaya ditemukan, mencoba login otomatis");
        
        // Refresh sesi berdasarkan perangkat terpercaya
        const { data, error } = await supabase.auth.refreshSession();
        
        if (!error && data.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Perbarui timestamp refresh terakhir
          localStorage.setItem('last_session_refresh', new Date().toISOString());
          
          // Setup interval untuk refresh berkala
          setupRefreshInterval();
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error during auto login:", error);
      return false;
    }
  };

  const setupRefreshInterval = () => {
    // Bersihkan interval sebelumnya jika ada
    if (refreshTokenInterval) {
      clearInterval(refreshTokenInterval);
    }
    
    // Refresh token setiap 6 jam untuk memastikan sesi tetap aktif
    const interval = setInterval(refreshSession, 6 * 60 * 60 * 1000);
    setRefreshTokenInterval(interval);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          localStorage.setItem('last_session_refresh', new Date().toISOString());
          setupRefreshInterval();
        } 
        else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          localStorage.removeItem('last_session_refresh');
          
          if (refreshTokenInterval) {
            clearInterval(refreshTokenInterval);
            setRefreshTokenInterval(null);
          }
        }
        
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Got session:", currentSession ? "Yes" : "No");
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession) {
        refreshSession();
        setupRefreshInterval();
      } else {
        // Jika tidak ada sesi, coba auto login dengan perangkat terpercaya
        autoLogin().then(success => {
          if (!success) {
            setIsLoading(false);
          }
        });
      }
    });

    return () => {
      if (refreshTokenInterval) {
        clearInterval(refreshTokenInterval);
      }
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      if (refreshTokenInterval) {
        clearInterval(refreshTokenInterval);
        setRefreshTokenInterval(null);
      }
      
      // Simpan user ID sebelum logout untuk membersihkan perangkat
      const userId = user?.id;
      
      // Bersihkan cache melalui Service Worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          // Membuat channel untuk komunikasi dengan service worker
          const messageChannel = new MessageChannel();
          
          // Buat promise untuk menunggu respons dari service worker
          const clearCachePromise = new Promise((resolve) => {
            messageChannel.port1.onmessage = (event) => {
              if (event.data && event.data.cleared) {
                resolve(true);
              }
            };
          });
          
          // Kirim pesan ke service worker
          navigator.serviceWorker.controller.postMessage(
            { type: 'CLEAR_AUTH_CACHE' },
            [messageChannel.port2]
          );
          
          // Tunggu konfirmasi dari service worker (dengan timeout)
          await Promise.race([
            clearCachePromise,
            new Promise(resolve => setTimeout(resolve, 1000)) // timeout 1 detik
          ]);
          
          console.log('Cache dibersihkan sebelum logout');
        } catch (error) {
          console.error('Gagal membersihkan cache:', error);
        }
      }
      
      // Logout dari Supabase
      await supabase.auth.signOut({ scope: 'local' });
      localStorage.removeItem('last_session_refresh');
      
      // Hapus informasi perangkat terpercaya jika logout manual
      if (userId) {
        await removeAllDevices(userId);
      }
      
      // Hapus cache aplikasi di storage lokal
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('app:') || key.startsWith('data:') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      
      // Refresh halaman setelah logout
      window.location.href = '/';
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      isLoading, 
      signOut, 
      refreshSession,
      autoLogin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
