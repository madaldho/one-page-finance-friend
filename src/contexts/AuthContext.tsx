import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { verifyDevice, removeAllDevices } from '@/utils/deviceManager';
import { useToast } from '@/hooks/use-toast';
// import { UserProfile } from '@/types';

// Definisi interface UserProfile langsung di file ini
interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  email?: string;
  is_admin?: boolean;
  subscription_type?: 'free' | 'pro_6m' | 'pro_12m';
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  autoLogin: () => Promise<boolean>;
  fetchProfile: () => Promise<UserProfile | null>;
  updateProfile: (data: Partial<UserProfile>) => Promise<UserProfile | null>;
  refreshProfileCache: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
  autoLogin: async () => false,
  fetchProfile: async () => null,
  updateProfile: async () => null,
  refreshProfileCache: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTokenInterval, setRefreshTokenInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Fungsi untuk refresh cache profil lewat service worker
  const refreshProfileCache = async () => {
    if (!user) return;
    
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        console.log('Requesting profile cache refresh');
        
        // Buat channel untuk komunikasi dengan service worker
        const messageChannel = new MessageChannel();
        
        // Buat promise untuk menunggu respons service worker
        const refreshPromise = new Promise<boolean>((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.refreshed) {
              resolve(true);
            } else {
              resolve(false);
            }
          };
        });
        
        // URL avatar dan profil yang perlu di-refresh
        const urlsToRefresh = [];
        
        if (profile?.avatar_url) {
          // Tambahkan timestamp untuk memaksa browser mengambil ulang gambar
          const timestamp = new Date().getTime();
          const avatarUrl = profile.avatar_url.includes('?') 
            ? `${profile.avatar_url}&t=${timestamp}`
            : `${profile.avatar_url}?t=${timestamp}`;
          
          urlsToRefresh.push(avatarUrl);
        }
        
        // Tambahkan URL ke API profil
        if (user.id) {
          const apiUrl = import.meta.env.VITE_SUPABASE_URL || "https://pjwmfyvknbtoofxfuwjm.supabase.co";
          urlsToRefresh.push(`${apiUrl}/rest/v1/profiles?id=eq.${user.id}`);
          urlsToRefresh.push(`${apiUrl}/rest/v1/user_settings?user_id=eq.${user.id}`);
          urlsToRefresh.push(`${apiUrl}/rest/v1/trusted_devices?user_id=eq.${user.id}`);
        }
        
        // Kirim pesan ke service worker
        navigator.serviceWorker.controller.postMessage(
          { 
            type: 'REFRESH_CACHE',
            urls: urlsToRefresh 
          },
          [messageChannel.port2]
        );
        
        // Tunggu konfirmasi dari service worker (dengan timeout)
        const result = await Promise.race([
          refreshPromise,
          new Promise<boolean>(resolve => setTimeout(() => resolve(false), 5000))
        ]);
        
        if (result) {
          console.log('Profile cache refreshed successfully');
          
          // Notifikasi pengguna tentang data terbaru
          if (window.navigator.onLine) {
            toast({
              title: "Data profil telah diperbarui",
              description: "Informasi terbaru telah dimuat",
              duration: 3000,
            });
          }
        } else {
          console.warn('Profile cache refresh might have failed or timed out');
        }
      }
    } catch (error) {
      console.error('Error refreshing profile cache:', error);
    }
  };

  const setupSessionTracking = useCallback(() => {
    // Periksa apakah aplikasi di-install sebagai PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                 (window.navigator as { standalone?: boolean }).standalone === true;
    
    // Setup interval untuk refresh session - lebih sering jika dalam mode PWA
    const intervalTime = isPWA ? 3 * 60 * 60 * 1000 : 6 * 60 * 60 * 1000; // 3 jam untuk PWA, 6 jam untuk browser
    
    if (refreshTokenInterval) {
      clearInterval(refreshTokenInterval);
    }
    
    const interval = setInterval(async () => {
      console.log('Refreshing auth session...');
      await refreshSession();
    }, intervalTime);
    
    setRefreshTokenInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [refreshTokenInterval]);

  // Fungsi untuk menangani perubahan status network
  const handleNetworkChange = useCallback(() => {
    if (window.navigator.onLine) {
      console.log('Online detected, refreshing session and profile');
      refreshSession();
      fetchProfile();
      // Perbarui cache profil setelah online
      setTimeout(() => {
        refreshProfileCache();
      }, 2000);
    } else {
      console.log('Offline detected');
    }
  }, []);

  // Fungsi untuk membersihkan cache autentikasi saat logout
  const clearAuthCache = async () => {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        console.log('Requesting auth cache clear');
        
        // Buat channel untuk komunikasi dengan service worker
        const messageChannel = new MessageChannel();
        
        // Buat promise untuk menunggu respons service worker
        const clearPromise = new Promise<boolean>((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.cleared) {
              resolve(true);
            } else {
              resolve(false);
            }
          };
        });
        
        // Kirim pesan ke service worker
        navigator.serviceWorker.controller.postMessage(
          { 
            type: 'CLEAR_AUTH_CACHE' 
          },
          [messageChannel.port2]
        );
        
        // Tunggu konfirmasi dari service worker (dengan timeout)
        const result = await Promise.race([
          clearPromise,
          new Promise<boolean>(resolve => setTimeout(() => resolve(false), 3000))
        ]);
        
        if (result) {
          console.log('Auth cache cleared successfully');
        } else {
          console.warn('Auth cache clear might have failed or timed out');
        }
      }
    } catch (error) {
      console.error('Error clearing auth cache:', error);
    }
  };

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
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
    }
  };

  const fetchProfile = async (): Promise<UserProfile | null> => {
    try {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      // Tambahkan timestamp ke avatar_url untuk memaksa browser mengambil gambar terbaru
      if (data && data.avatar_url) {
        const timestamp = new Date().getTime();
        data.avatar_url = data.avatar_url.includes('?') 
          ? `${data.avatar_url}&t=${timestamp}`
          : `${data.avatar_url}?t=${timestamp}`;
      }
      
      setProfile(data as UserProfile);
      return data as UserProfile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
    try {
      if (!user) return null;
      
      // Tambahkan timestamp updated_at
      const updateData = {
        ...profileData,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }
      
      // Perbarui state profil
      const updatedProfile = data as UserProfile;
      
      // Tambahkan timestamp ke avatar_url
      if (updatedProfile.avatar_url) {
        const timestamp = new Date().getTime();
        updatedProfile.avatar_url = updatedProfile.avatar_url.includes('?') 
          ? `${updatedProfile.avatar_url}&t=${timestamp}`
          : `${updatedProfile.avatar_url}?t=${timestamp}`;
      }
      
      setProfile(updatedProfile);
      
      // Refresh cache untuk avatar dan profil
      await refreshProfileCache();
      
      return updatedProfile;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return null;
    }
  };

  const ensureUserProfile = async (): Promise<void> => {
    try {
      if (!user) return;
      
      // First, try to get the existing profile
      const existingProfile = await fetchProfile();
      
      if (existingProfile) {
        console.log("User profile exists, no need to create");
        return;
      }
      
      // Create new profile if not found
      console.log("Creating new user profile in AuthContext");
      const newProfile = {
        id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        subscription_type: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Try insert first
      const { data: insertedProfile, error: insertError } = await supabase
            .from('profiles')
        .insert(newProfile)
            .select()
            .single();
            
          if (insertError) {
            console.error('Error creating profile:', insertError);
        
        // Try upsert if insert fails
        const { data: upsertedProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single();
          
        if (upsertError) {
          console.error('Error upserting profile:', upsertError);
        } else if (upsertedProfile) {
          console.log("Profile upserted successfully");
          setProfile(upsertedProfile as UserProfile);
        }
      } else if (insertedProfile) {
        console.log("Profile inserted successfully");
        setProfile(insertedProfile as UserProfile);
      }
      
      // Check if settings exist
      const { data: existingSettings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error checking user settings:', settingsError);
      }
        
      // Create settings if they don't exist
      if (!existingSettings) {
        console.log("Creating default user settings");
        const { error: insertSettingsError } = await supabase
            .from('user_settings')
            .insert({
            user_id: user.id,
              show_budgeting: true,
              show_loans: true,
              show_savings: true
            });
          
        if (insertSettingsError) {
          console.error('Error creating user settings:', insertSettingsError);
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  const autoLogin = async (): Promise<boolean> => {
    try {
      console.log("Mencoba auto login...");
      
      // 1. Pertama, periksa apakah ada sesi aktif
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session for auto login:", sessionError);
        return false;
      }
      
      // Jika sudah ada sesi aktif, gunakan saja
      if (sessionData?.session) {
        console.log("Sesi aktif ditemukan, melanjutkan dengan sesi yang ada");
        setSession(sessionData.session);
        setUser(sessionData.session.user);
        await fetchProfile();
        return true;
      }
      
      console.log("Tidak ada sesi aktif, mencoba login dengan trusted device...");
      
      // 2. Jika tidak ada sesi, coba login dengan trusted device
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        console.log("User data ditemukan:", data.user.id);
        
        // Verifikasi perangkat
        const isVerified = await verifyDevice(data.user.id);
        console.log("Hasil verifikasi perangkat:", isVerified);
        
        if (isVerified) {
          console.log("Perangkat terverifikasi, refreshing session...");
          
          // Refresh sesi untuk mendapatkan sesi baru
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error("Error refreshing session during auto login:", refreshError);
            return false;
          }
          
          if (refreshData && refreshData.session) {
            console.log("Berhasil refresh sesi, user login otomatis");
            setSession(refreshData.session);
            setUser(refreshData.session.user);
            await fetchProfile();
            
            // Perbarui waktu terakhir refresh sesi
            localStorage.setItem('last_session_refresh', new Date().toISOString());
            
            // Tampilkan toast untuk memberi tahu pengguna
            toast({
              title: "Login Otomatis Berhasil",
              description: "Selamat datang kembali!",
              duration: 4000,
            });
          
          return true;
          }
        } else {
          console.log("Perangkat tidak terverifikasi atau sudah kedaluwarsa");
        }
      } else {
        console.log("Tidak ada data user yang ditemukan");
      }
      
      console.log("Auto login gagal, perlu login manual");
      return false;
    } catch (error) {
      console.error("Auto login failed:", error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      // Clear user data from service worker cache
      await clearAuthCache();
      
      if (user?.id) {
        // Remove all trusted devices if user requested
        await removeAllDevices(user.id);
      }
      
      // Sign out from supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      // Reset all state
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Show confirmation message
      toast({
        title: "Berhasil Keluar",
        description: "Anda telah keluar dari akun",
        duration: 5000,
      });
      
      // Return to home page or login page
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Terjadi kesalahan",
        description: "Gagal keluar dari akun, silakan coba lagi",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  useEffect(() => {
    const setupAuth = async () => {
      setIsLoading(true);
      try {
        // Coba auto login saat aplikasi dimuat
        const autoLoginSuccess = await autoLogin();
        
        if (!autoLoginSuccess) {
          // Jika auto login gagal, coba dapatkan sesi secara normal
          console.log("Auto login gagal, memeriksa sesi secara normal...");
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            setSession(session);
            setUser(session.user ?? null);
            
            // Fetch user profile only if we have a session
            const userProfile = await fetchProfile();
            if (!userProfile) {
              // If no profile exists but we have a session, create one
              await ensureUserProfile();
            }
          }
        }
      } catch (error) {
        console.error('Error setting up auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setupAuth();
    
    // Setup network change listeners
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    
    // Setup session tracking with appropriate intervals
    const clearSessionTracker = setupSessionTracking();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);

        // Only on SIGNED_IN handle additional steps
        if (event === 'SIGNED_IN') {
          await ensureUserProfile();
          await fetchProfile();
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (event === 'USER_UPDATED') {
          // Refresh profile when user metadata changes
          await fetchProfile();
          refreshProfileCache();
        }
      }
    );

    return () => {
      // Cleanup listeners
      subscription.unsubscribe();
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      
      // Clear interval
      if (clearSessionTracker) clearSessionTracker();
      if (refreshTokenInterval) clearInterval(refreshTokenInterval);
    };
  }, []);

  // Set up realtime subscription untuk profil
  useEffect(() => {
    if (!user) return;
    
    // Subscribe ke perubahan profil
    const channel = supabase.channel('public:profiles:changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, async (payload) => {
        console.log('Profile updated via realtime:', payload);
        
        // Update state dengan data baru
        const updatedProfile = payload.new as UserProfile;
        
        // Tambahkan timestamp ke avatar_url
        if (updatedProfile.avatar_url) {
          const timestamp = new Date().getTime();
          updatedProfile.avatar_url = updatedProfile.avatar_url.includes('?') 
            ? `${updatedProfile.avatar_url}&t=${timestamp}`
            : `${updatedProfile.avatar_url}?t=${timestamp}`;
        }
        
        setProfile(updatedProfile);
        
        // Refresh cache untuk gambar avatar
        await refreshProfileCache();
      })
      .subscribe();
    
    // Unsubscribe saat component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const value = {
    user,
      session, 
      profile,
      isLoading, 
      signOut, 
      refreshSession,
    autoLogin,
    fetchProfile,
    updateProfile,
    refreshProfileCache,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
