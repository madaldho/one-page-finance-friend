import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasProAccess, UserSubscriptionProfile } from '@/utils/subscription';
import { useToast } from '@/hooks/use-toast';

interface ProOnlyRedirectProps {
  userProfile: UserSubscriptionProfile | null;
  featureName: string;
}

/**
 * Komponen untuk mengarahkan pengguna ke halaman upgrade jika mereka bukan pengguna Pro
 * 
 * @param userProfile - Profil pengguna saat ini
 * @param featureName - Nama fitur yang dibatasi (untuk pesan toast)
 */
const ProOnlyRedirect: React.FC<ProOnlyRedirectProps> = ({ userProfile, featureName }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    // Periksa apakah pengguna memiliki akses Pro
    const hasAccess = hasProAccess(userProfile);
    
    if (!hasAccess) {
      // Tampilkan toast
      toast({
        title: 'Fitur Khusus Pro',
        description: `Fitur ${featureName} hanya tersedia untuk pengguna Pro. Silahkan upgrade untuk mengakses.`,
        variant: 'destructive',
      });
      
      // Arahkan ke halaman upgrade
      navigate('/upgrade');
    }
  }, [userProfile, featureName, navigate, toast]);
  
  // Komponen ini tidak merender apapun, hanya berfungsi untuk redirect
  return null;
};

export default ProOnlyRedirect; 