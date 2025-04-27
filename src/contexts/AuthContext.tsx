import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          localStorage.setItem('last_session_refresh', new Date().toISOString());
        } 
        else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          localStorage.removeItem('last_session_refresh');
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
        
        const interval = setInterval(refreshSession, 12 * 60 * 60 * 1000);
        setRefreshTokenInterval(interval);
      }
      
      setIsLoading(false);
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
    <AuthContext.Provider value={{ session, user, isLoading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
