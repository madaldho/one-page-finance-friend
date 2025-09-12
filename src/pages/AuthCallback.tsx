import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { registerDevice } from "@/utils/deviceManager";

// Definisi interface UserProfile langsung di file ini untuk menghindari error import
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

const AuthCallback = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if this is a password reset callback
        const queryParams = new URLSearchParams(location.search);
        const isPasswordReset = queryParams.get('type') === 'recovery';
        const hasResetCode = queryParams.get('code') !== null;
        const hasToken = queryParams.get('token') !== null;
        
        if (isPasswordReset || hasResetCode || hasToken) {
          // If it's a password reset, redirect to reset password page with the token
          console.log('Password reset detected, redirecting to reset-password page');
          navigate('/reset-password' + location.search + location.hash, { replace: true });
          return;
        }

        // Process the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data && data.session && data.session.user) {
          // Ensure user profile exists first
          await ensureUserProfile(data.session.user.id, data.session.user.email || '');
          
          // Register device for trusted login after profile is created
          try {
            const deviceRegistered = await registerDevice(data.session.user.id);
            
            if (!deviceRegistered) {
              console.error("Failed to register device, but continuing with login");
            } else {
              console.log("Device successfully registered for Google login");
            }
          } catch (deviceError) {
            console.error("Device registration error:", deviceError);
            // Continue login process even if device registration fails
          }
          
          toast({
            title: "🎉 Login Berhasil",
            description: "Selamat datang!",
          });
          
          // Redirect to home page
          navigate('/home', { replace: true });
        } else {
          throw new Error("Tidak mendapatkan sesi pengguna");
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan autentikasi");
        
        toast({
          title: "Autentikasi Gagal",
          description: err instanceof Error ? err.message : "Terjadi kesalahan saat autentikasi",
          variant: "destructive"
        });
        
        // Redirect back to auth page after error
        setTimeout(() => navigate('/', { replace: true }), 2000);
      } finally {
        setIsLoading(false);
      }
    };
    
    handleAuthCallback();
  }, [navigate, toast, location.search]);

  const ensureUserProfile = async (userId: string, email: string) => {
    try {
      console.log("Ensuring user profile exists for Google login:", userId);
      
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking profile:', profileError);
      }
      
      // If profile doesn't exist, create one
      if (!profile) {
        console.log("Creating new user profile for Google login");
        
        // Get user data
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData || !userData.user) {
          throw new Error("Tidak dapat mengambil data pengguna");
        }
        
        const displayName = userData.user.user_metadata?.full_name || 
                            userData.user.user_metadata?.name || 
                            email.split('@')[0] || 
                            'User';
        
        const avatarUrl = userData.user.user_metadata?.avatar_url || 
                          userData.user.user_metadata?.picture || 
                          null;
        
        const newProfile: Partial<UserProfile> = {
          id: userId,
          name: displayName,
          email: email,
          avatar_url: avatarUrl,
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
          } else {
            console.log("Profile upserted successfully");
          }
        } else {
          console.log("Profile inserted successfully");
        }
        
        // Check if settings exist
        const { data: existingSettings, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
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
              user_id: userId,
              show_budgeting: true,
              show_loans: true,
              show_savings: true
            });
            
          if (insertSettingsError) {
            console.error('Error creating user settings:', insertSettingsError);
          }
        }
      } else {
        console.log("User profile already exists, skipping creation");
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      {isLoading ? (
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Memproses Autentikasi...</h2>
          <p className="mt-2 text-muted-foreground">Sedang menyiapkan akun Anda...</p>
        </div>
      ) : error ? (
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Terjadi Kesalahan</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
        </div>
      ) : null}
    </div>
  );
};

export default AuthCallback; 