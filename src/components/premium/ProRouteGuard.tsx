import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasProAccess, UserSubscriptionProfile } from '@/utils/subscription';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProRouteGuardProps {
  children: React.ReactNode;
  featureName?: string;
}

/**
 * Komponen untuk melindungi rute yang hanya dapat diakses oleh pengguna Pro.
 * Pengguna free akan dialihkan ke halaman Upgrade.
 * 
 * @param children - Komponen anak yang akan di-render jika pengguna adalah Pro
 * @param featureName - Nama fitur (untuk pesan toast)
 */
const ProRouteGuard: React.FC<ProRouteGuardProps> = ({ children, featureName = 'Pro' }) => {
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasPro, setHasPro] = useState(false);
  const [userProfile, setUserProfile] = useState<UserSubscriptionProfile | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      
      try {
        // Dapatkan user saat ini
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setHasPro(false);
          setLoading(false);
          return;
        }
        
        // Dapatkan profil user
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('subscription_type, trial_start, trial_end, is_admin')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        setUserProfile(profile as UserSubscriptionProfile);
        const isPro = hasProAccess(profile as UserSubscriptionProfile);
        setHasPro(isPro);
      } catch (error) {
        console.error('Error checking pro access:', error);
        setHasPro(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-10 w-10 bg-gray-200 rounded-full mb-2"></div>
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!hasPro) {
    // Tampilkan toast notifikasi
    toast({
      title: 'Fitur Khusus Pro',
      description: `Halaman ${featureName} hanya tersedia untuk pengguna Pro. Silahkan upgrade untuk mengakses.`,
      variant: 'destructive',
    });
    
    // Alihkan ke halaman upgrade dengan menyimpan halaman yang ingin dituju
    return <Navigate to="/upgrade" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProRouteGuard; 