import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getSubscriptionLabel, UserSubscriptionProfile } from '@/utils/subscription';
import { differenceInDays, parseISO } from 'date-fns';
import { Crown, Sparkles } from 'lucide-react';

interface UserWithProfile {
  email?: string;
  profile?: {
    name?: string;
    avatar_url?: string;
    subscription_type?: string;
    trial_start?: string;
    trial_end?: string;
    is_admin?: boolean;
    [key: string]: unknown;
  };
}

interface ProfileSectionProps {
  user: UserWithProfile;
}

const ProfileSection = ({ user }: ProfileSectionProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  
  const handleEditProfile = () => {
    navigate('/profile');
  };
  
  // Menggunakan getSubscriptionLabel untuk mendapatkan label status langganan
  const profile = user?.profile as UserSubscriptionProfile || null;
  const subscriptionLabel = getSubscriptionLabel(profile);
  
  // Check if user has Pro status
  const isPro = subscriptionLabel.text.includes('Pro');

  // Fungsi untuk handle error saat loading image
  const handleImageError = () => {
    console.log("Avatar image failed to load");
    setImageError(true);
  };
  
  // Mendapatkan initial dari email jika nama tidak tersedia
  const getInitial = () => {
    if (user?.profile?.name && user.profile.name.length > 0) {
      return user.profile.name.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };
  
  return (
    <section className="mb-8">
      <div className="backdrop-blur-sm bg-white/80 rounded-xl shadow-sm border border-white/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100/50">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Crown className="w-3 h-3 text-white" />
            </div>
            Profil
          </h2>
          <p className="text-sm text-gray-500 mt-1">Informasi akun dan status langganan</p>
        </div>
        
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar dengan border untuk Pro */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${
                isPro ? 'border-2 border-amber-400' : 'border border-gray-200'
              }`}>
                {user?.profile?.avatar_url && !imageError ? (
                  <img 
                    src={user.profile.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    loading="eager"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${
                    isPro ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-gray-500'
                  }`}>
                    <span className="text-white text-sm font-medium">
                      {getInitial()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <p className={`font-medium text-sm ${isPro ? 'text-purple-900' : 'text-gray-900'}`}>
                  {user?.profile?.name || user?.email || 'User'}
                </p>
                
                <div className="flex items-center gap-2 mt-1">
                  {isPro ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white font-medium inline-flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        <span>Akun {subscriptionLabel.text}</span>
                      </span>
                      
                      {profile?.trial_end && subscriptionLabel.text === 'Trial Pro' && (
                        <span className="text-xs text-indigo-700 font-medium">
                          {Math.max(0, differenceInDays(parseISO(profile.trial_end), new Date()))} hari tersisa
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      Akun {subscriptionLabel.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleEditProfile}
              variant="ghost"
              size="sm"
              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg px-3 py-2"
            >
              Edit Profil
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileSection;
