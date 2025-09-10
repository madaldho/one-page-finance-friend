import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, Settings as SettingsIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getSubscriptionLabel, UserSubscriptionProfile } from '@/utils/subscription';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserSubscriptionProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk fetch profile yang bisa digunakan kembali
  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data as UserSubscriptionProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();

    // Listen untuk perubahan data profile secara real-time
    const profileSubscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Profile updated:', payload);
          // Update state dengan data terbaru
          setUserProfile(payload.new as UserSubscriptionProfile);
        }
      )
      .subscribe();

    // Listen untuk focus window event untuk refresh data ketika user kembali ke tab
    const handleFocus = () => {
      fetchUserProfile();
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup subscription dan event listener saat component unmount
    return () => {
      profileSubscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
      toast({
        title: "Berhasil logout",
        description: "Anda telah keluar dari akun",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Gagal logout",
        description: "Terjadi kesalahan saat keluar dari akun",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  // Ambil nama dari profile yang ter-update, dengan fallback yang lebih baik
  // Prioritas: name dari profile DB > user metadata > email
  const fullName = (userProfile?.name && typeof userProfile.name === 'string' 
                     ? userProfile.name.trim() 
                     : null) || 
                   (user.user_metadata?.full_name && typeof user.user_metadata.full_name === 'string'
                     ? user.user_metadata.full_name.trim()
                     : null) ||
                   user.email?.split('@')[0] || 
                   "User";
                   
  const subscriptionInfo = userProfile ? getSubscriptionLabel(userProfile) : { text: 'Free', className: '', icon: '' };

  return (
    <div className="relative mb-6">
      {/* Clean & Simple Header */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-sm opacity-60"></div>
            <Avatar className="h-12 w-12 relative border-2 border-white shadow-lg">
              <AvatarImage 
                src={(userProfile?.avatar_url as string) || ""} 
                className="object-cover w-full h-full aspect-square"
              />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg">
                {String(fullName).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Halo, {String(fullName).split(' ')[0]}! 👋
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              {subscriptionInfo.text === 'Premium' ? (
                <span className="text-amber-600">✨ Premium Member</span>
              ) : (
                <span>Kelola keuangan Anda</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-2xl bg-white/70 hover:bg-white hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-100"
              >
                <User className="h-5 w-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mr-4 rounded-2xl shadow-xl border-gray-100" align="end">
              <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
                <p className="text-sm font-semibold text-gray-900">{String(fullName)}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
                <div className="mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    subscriptionInfo.text === 'Premium' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {subscriptionInfo.text}
                  </span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate("/settings")}
                className="mx-2 my-1 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                <SettingsIcon className="mr-3 h-4 w-4 text-gray-500" />
                <span className="font-medium">Pengaturan</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut} 
                className="mx-2 my-1 rounded-xl text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span className="font-medium">Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Header;
