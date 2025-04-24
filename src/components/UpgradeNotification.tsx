import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO } from 'date-fns';
import { X, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UserProfile {
  subscription_type?: string;
  trial_end?: string;
  [key: string]: any;
}

const UpgradeNotification = () => {
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hasShownTodayKey] = useState<string>(`upgrade_notification_shown_${new Date().toISOString().split('T')[0]}`);

  useEffect(() => {
    if (!user) return;

    const checkTrialStatus = async () => {
      try {
        // Cek apakah notifikasi sudah ditampilkan hari ini
        const hasShownToday = localStorage.getItem(hasShownTodayKey) === 'true';
        
        if (hasShownToday) return;

        // Ambil profile user
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        setUserProfile(data);

        // Jika user bukan pro dan trial sudah habis, tampilkan notifikasi
        if (
          data && 
          data.subscription_type === 'free' && 
          data.trial_end
        ) {
          const trialEndDate = parseISO(data.trial_end);
          const daysLeft = differenceInDays(trialEndDate, new Date());
          
          if (daysLeft <= 0) {
            // Tampilkan dialog
            setShowDialog(true);
            // Tandai bahwa notifikasi sudah ditampilkan hari ini
            localStorage.setItem(hasShownTodayKey, 'true');
          }
        }
      } catch (error) {
        console.error('Error checking trial status:', error);
      }
    };

    checkTrialStatus();
  }, [user, hasShownTodayKey]);

  const handleUpgrade = (plan: string) => {
    // Redirect ke WhatsApp
    const message = `Halo, saya ingin upgrade ke paket ${plan === 'pro_6m' ? 'Pro 6 Bulan' : 'Pro 12 Bulan'} untuk aplikasi Keuangan Pribadi.`;
    const whatsappUrl = `https://wa.me/6281387013123?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setShowDialog(false);
  };

  if (!showDialog) return null;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Award className="h-5 w-5 text-orange-500" />
            <span>Upgrade ke Pro Sekarang!</span>
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Masa trial Pro Anda sudah berakhir. Upgrade sekarang untuk menikmati semua fitur tanpa batasan!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20">
              <div className="absolute transform rotate-45 bg-orange-500 text-white text-xs font-bold py-1 right-[-35px] top-[12px] w-[120px] text-center">
                HEMAT
              </div>
            </div>
            
            <h3 className="font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-orange-500" />
              <span>Pro 12 Bulan</span>
            </h3>
            <div className="mt-1 mb-3">
              <span className="text-2xl font-bold">Rp150.000</span>
              <span className="text-sm text-gray-500 ml-1">/ tahun</span>
              <p className="text-xs text-orange-600 font-medium">Hanya Rp12.500 per bulan</p>
            </div>
            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => handleUpgrade('pro_12m')}
            >
              <span>Pilih Paket Ini</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold">Pro 6 Bulan</h3>
            <div className="mt-1 mb-3">
              <span className="text-2xl font-bold">Rp99.000</span>
              <span className="text-sm text-gray-500 ml-1">/ 6 bulan</span>
              <p className="text-xs text-gray-500">Rp16.500 per bulan</p>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleUpgrade('pro_6m')}
            >
              Pilih Paket Ini
            </Button>
          </div>
        </div>
        
        <DialogFooter className="flex-col gap-2">
          <Button 
            variant="ghost" 
            className="w-full text-gray-500 text-sm hover:text-gray-700 hover:bg-gray-100"
            onClick={() => setShowDialog(false)}
          >
            Tetap menggunakan versi gratis
          </Button>
          <p className="text-xs text-center text-gray-500 mt-2">
            Versi gratis memiliki batasan: maksimum 10 kategori dan fitur tabungan, anggaran, hutang-piutang, serta aset tidak tersedia.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeNotification; 