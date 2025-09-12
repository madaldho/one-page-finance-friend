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
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

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
    navigate('/upgrade');
    setShowDialog(false);
  };

  if (!showDialog) return null;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="max-w-sm border-0 p-0 bg-transparent overflow-hidden">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 relative overflow-hidden border border-gray-200/50">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl translate-x-8 -translate-y-8"></div>
          
          {/* Close button */}
          <button 
            onClick={() => setShowDialog(false)}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-gray-100/80 hover:bg-gray-200 transition-colors"
          >
            <X className="h-3 w-3 text-gray-500" />
          </button>
          
          <div className="relative z-10 text-center">
            {/* Icon */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Award className="h-6 w-6 text-white" />
            </div>
            
            {/* Main message */}
            <h3 className="text-lg font-bold mb-2 text-gray-800">
               Trial Habis!
            </h3>
            
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Waktunya upgrade ke <span className="font-bold text-blue-600">Pro</span> untuk 
              kelola keuangan lebih <span className="font-bold text-indigo-600">rapi, hemat, & tenang!</span>
            </p>
            
            {/* Quick benefits */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-100">
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span>📊 Analisis tanpa batas</span>
                  <span>🏷️ Kategori tak terbatas</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>🏦 Tabungan/Celengan</span>
                  <span>💰 Hutang-Piutang</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <span>📈 Anggaran/Budget</span>
                  <span>📊 Manajemen Aset</span>
                </div>
              </div>
            </div>
            
            {/* Promo highlight */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-3 mb-4 border border-red-100">
              <p className="text-xs font-bold text-red-600 mb-1">
                🔥 Promo Early Adopter
              </p>
              <p className="text-xs text-gray-600">
                Lifetime hanya <span className="font-bold text-red-600">Rp150.000</span> (100 user pertama)
              </p>
            </div>
            
            {/* Main CTA */}
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 mb-3"
              onClick={() => handleUpgrade('upgrade')}
            >
              🚀 Lihat Semua Paket Pro
            </Button>
            
            {/* Pricing options */}
            <div className="text-xs text-gray-500 mb-4 space-y-1">
              <div className="flex justify-between items-center">
                <span>💳 Bulanan:</span>
                <span className="font-bold text-blue-600">Rp20.000</span>
              </div>
              <div className="flex justify-between items-center">
                <span>📅 Tahunan:</span>
                <span className="font-bold text-green-600">Rp85.000 <span className="text-xs text-green-500">(hemat 155k)</span></span>
              </div>
              <div className="flex justify-between items-center">
                <span>⭐ Lifetime:</span>
                <span className="font-bold text-red-600">Rp150.000 </span>
              </div>
            </div>
            
            {/* Skip option */}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-400 text-xs hover:text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={() => setShowDialog(false)}
            >
              Nanti aja deh 😅
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeNotification; 