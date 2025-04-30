import { createContext, useContext, useEffect, useState } from 'react';
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
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTokenInterval, setRefreshTokenInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

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
      
      setProfile(data as UserProfile);
      return data as UserProfile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
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
      const newProfile: Partial<UserProfile> = {
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
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session for auto login:", sessionError);
        return false;
      }
      
      // If we have an active session, user is already logged in
      if (sessionData?.session) {
        setSession(sessionData.session);
        setUser(sessionData.session.user);
        await fetchProfile();
        return true;
      }
      
      // Try device-based auto login
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        const isVerified = await verifyDevice(data.user.id);
        if (isVerified) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error("Error refreshing session during auto login:", refreshError);
            return false;
          }
          
          if (refreshData && refreshData.session) {
            setSession(refreshData.session);
            setUser(refreshData.session.user);
            await fetchProfile();
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error("Auto login failed:", error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error signing out:", error);
        toast({
          title: "Gagal keluar",
          description: "Terjadi kesalahan saat mencoba keluar. Silakan coba lagi.",
          variant: "destructive",
        });
        return;
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Clear refresh token interval
      if (refreshTokenInterval) {
        clearInterval(refreshTokenInterval);
        setRefreshTokenInterval(null);
      }
      
      toast({
        title: "Berhasil keluar",
        description: "Anda telah berhasil keluar dari aplikasi.",
      });
    } catch (error) {
      console.error("Error in sign out:", error);
      toast({
        title: "Gagal keluar",
        description: "Terjadi kesalahan saat mencoba keluar. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Try to get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting initial session:", error);
        }
        
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile();
        }
        
        // Set up auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log("Auth state change:", event);
            
            setSession(newSession);
            setUser(newSession?.user ?? null);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              if (newSession?.user) {
                await ensureUserProfile();
              }
            }
            
            if (event === 'SIGNED_OUT') {
              setUser(null);
              setSession(null);
              setProfile(null);
            }
          }
        );
        
        // Set up refresh interval (every 6 hours)
        const intervalId = setInterval(refreshSession, 6 * 60 * 60 * 1000);
        setRefreshTokenInterval(intervalId);
        
        return () => {
          authListener.subscription.unsubscribe();
          if (intervalId) clearInterval(intervalId);
        };
      } catch (error) {
        console.error("Error setting up auth:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    setupAuth();
  }, []);

  const value = {
    user,
    session,
    profile,
    isLoading,
    signOut,
    refreshSession,
    autoLogin,
    fetchProfile,
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
