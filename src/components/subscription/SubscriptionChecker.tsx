import { FC, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  calculateDaysRemaining, 
  formatLocalDate, 
  addLocalDays
} from '@/utils/subscription';

/**
 * Komponen yang berjalan di latar belakang untuk memeriksa dan memperbarui status langganan
 */
const SubscriptionChecker: FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Hanya jalankan jika ada user yang terautentikasi
    if (!user) return;

    const checkAndUpdateSubscription = async () => {
      try {
        // Ambil data profil user dari database
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Jika tidak ada profil, skip
        if (!data) return;
        
        // Menggunakan any untuk menghindari error TypeScript
        // Ini dibutuhkan karena skema database berbeda dengan tipe TypeScript default
        const profile = data as any;
        
        const currentDate = new Date();
        
        // Jika pengguna adalah Free dan belum memiliki trial
        if (profile.subscription_type === 'free' && !profile.trial_end) {
          // Berikan trial 8 hari menggunakan waktu lokal perangkat
          const trialStart = formatLocalDate(currentDate);
          const trialEnd = formatLocalDate(addLocalDays(currentDate, 8));
          
          // Update profil dengan tanggal trial dan set subscription_type ke 'trial'
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              subscription_type: 'trial',
              trial_start: trialStart,
              trial_end: trialEnd
            } as any)
            .eq('id', user.id);
            
          if (updateError) throw updateError;
          
          // Tampilkan toast notifikasi
          toast({
            title: 'Selamat!',
            description: 'Anda mendapatkan akses Pro gratis selama 7 hari!',
            variant: 'default'
          });
          
          return;
        }
        
        // Jika pengguna memiliki trial, cek apakah sudah berakhir
        if (profile.trial_end) {
          const daysRemaining = calculateDaysRemaining(profile.trial_end);
          
          // Jika hari tersisa 0 dan user adalah trial (trial berakhir)
          if (daysRemaining === 0 && profile.subscription_type === 'trial') {
            // Update user ke subscription_type = 'free'
            await supabase
              .from('profiles')
              .update({
                subscription_type: 'free'
              } as any)
              .eq('id', user.id);
              
            // Tampilkan toast notifikasi
            toast({
              title: 'Trial Pro Berakhir',
              description: 'Masa trial Pro Anda telah berakhir. Upgrade sekarang untuk akses penuh!',
              variant: 'destructive'
            });
          }
          
          // Jika hari tersisa 1 dan user adalah trial (trial hampir berakhir)
          if (daysRemaining === 1 && profile.subscription_type === 'trial') {
            // Tampilkan toast notifikasi
            toast({
              title: 'Trial Pro Hampir Berakhir',
              description: 'Masa trial Pro Anda akan berakhir besok. Upgrade sekarang untuk akses penuh!',
              variant: 'destructive' // Menggunakan 'destructive' karena 'warning' tidak ada di tipe
            });
          }
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    };

    // Jalankan sekali saat komponen di-mount
    checkAndUpdateSubscription();
    
    // Tambahkan interval untuk mengecek secara berkala - setiap 12 jam
    const interval = setInterval(checkAndUpdateSubscription, 12 * 60 * 60 * 1000); 
    return () => clearInterval(interval);
  }, [user, toast]);

  // Komponen ini tidak merender apapun (silent component)
  return null;
};

export default SubscriptionChecker; 