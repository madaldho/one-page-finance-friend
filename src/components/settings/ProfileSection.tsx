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
    <section className="mb-6">
      <div className="backdrop-blur-sm bg-white/80 rounded-xl shadow-sm border border-white/20 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100/50">
          <h2 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded flex items-center justify-center">
              <Crown className="w-2.5 h-2.5 text-white" />
            </div>
            Profil
          </h2>
        </div>
        
        <div className="p-4">
          {/* Mobile Layout */}
          <div className="md:hidden">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${
                isPro ? 'border border-amber-400' : 'border border-gray-200'
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
                  <div className={`w-full h-full flex items-center justify-center text-white font-medium text-sm ${
                    isPro ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-gradient-to-br from-gray-500 to-gray-600'
                  }`}>
                    {getInitial()}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm truncate ${isPro ? 'text-purple-900' : 'text-gray-900'}`}>
                  {user?.profile?.name || user?.email || 'User'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                    isPro 
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {subscriptionLabel.text}
                  </span>
                  
                  {profile?.trial_end && subscriptionLabel.text === 'Trial Pro' && (
                    <span className="text-xs text-indigo-700 font-medium bg-indigo-50 px-2 py-1 rounded-lg">
                      {Math.max(0, differenceInDays(parseISO(profile.trial_end), new Date()))} hari
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {(!isPro || (profile?.trial_end && subscriptionLabel.text === 'Trial Pro')) && (
                  <Button
                    onClick={() => navigate('/upgrade')}
                    size="sm"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs px-3 py-1.5 h-auto rounded-lg"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Pro
                  </Button>
                )}
                
                <Button
                  onClick={handleEditProfile}
                  variant="outline"
                  size="sm"
                  className="border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-3 py-1.5 h-auto rounded-lg"
                >
                  Edit
                </Button>
              </div>
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${
                isPro ? 'border border-amber-400' : 'border border-gray-200'
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
                  <div className={`w-full h-full flex items-center justify-center text-white font-medium ${
                    isPro ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-gradient-to-br from-gray-500 to-gray-600'
                  }`}>
                    {getInitial()}
                  </div>
                )}
              </div>
              
              <div>
                <p className={`font-medium text-sm ${isPro ? 'text-purple-900' : 'text-gray-900'}`}>
                  {user?.profile?.name || user?.email || 'User'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                    isPro 
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {subscriptionLabel.text}
                  </span>
                  
                  {profile?.trial_end && subscriptionLabel.text === 'Trial Pro' && (
                    <span className="text-xs text-indigo-700 font-medium bg-indigo-50 px-2 py-1 rounded-lg">
                      {Math.max(0, differenceInDays(parseISO(profile.trial_end), new Date()))} hari tersisa
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {(!isPro || (profile?.trial_end && subscriptionLabel.text === 'Trial Pro')) && (
                <Button
                  onClick={() => navigate('/upgrade')}
                  size="sm"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs px-4 py-2 rounded-lg"
                >
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  {isPro ? 'Upgrade Pro' : 'Upgrade Pro'}
                </Button>
              )}
              
              <Button
                onClick={handleEditProfile}
                variant="outline"
                size="sm"
                className="border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-4 py-2 rounded-lg"
              >
                Edit Profil
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileSection;
