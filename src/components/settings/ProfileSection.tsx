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
    <section className={`mb-8 rounded-lg shadow-sm overflow-hidden ${isPro ? 'shadow-md' : ''}`}>
      {/* Card Header - Gradient background for Pro users */}
      {isPro && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-6"></div>
      )}
      
      <div className={`p-4 ${isPro ? 'bg-gradient-to-br from-white to-purple-50' : 'bg-white'}`}>
        <div className="flex items-center mb-4">
          {/* Avatar dengan border untuk Pro */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 overflow-hidden ${
            isPro ? 'border-2 border-amber-400 shadow-md' : 'bg-[#6E59A5]'
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
                isPro ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-[#6E59A5]'
              }`}>
                <span className="text-white text-lg font-semibold">
                  {getInitial()}
                </span>
              </div>
            )}
          </div>
          
          <div>
            <p className={`font-medium ${isPro ? 'text-purple-900' : ''}`}>
              {user?.profile?.name || user?.email || 'User'}
            </p>
            
            <div className="flex items-center gap-1">
              {isPro ? (
                <div className="flex items-center gap-1">
                  <p className="text-sm px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white font-medium inline-flex items-center gap-1 shadow-sm">
                    <Crown className="h-3.5 w-3.5" />
                    <span>Akun {subscriptionLabel.text}</span>
                  </p>
                  
                  {profile?.trial_end && subscriptionLabel.text === 'Trial Pro' && (
                    <span className="text-xs text-indigo-700 font-medium">
                      ({Math.max(0, differenceInDays(parseISO(profile.trial_end), new Date()))} hari)
                    </span>
                  )}
                </div>
              ) : (
                <p className={`text-sm px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${subscriptionLabel.className}`}>
                  {subscriptionLabel.icon && <span>{subscriptionLabel.icon}</span>}
                  <span>Akun {subscriptionLabel.text}</span>
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Tombol Edit dengan style berbeda untuk Pro dan Free */}
        <div className="flex justify-between items-center">
          <Button 
            variant={isPro ? "ghost" : "link"} 
            className={`${isPro ? 'bg-white border shadow-sm hover:bg-gray-50' : 'text-[#6E59A5] p-0'} h-auto font-medium`}
            onClick={handleEditProfile}
          >
            Edit Profile
          </Button>
          
          {isPro && (
            <div className="flex items-center gap-1 text-xs text-indigo-600 px-2 py-1 bg-indigo-50 rounded-full">
              <Sparkles className="h-3 w-3" />
              <span>Fitur Premium Aktif</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProfileSection;
