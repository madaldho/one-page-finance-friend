import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileName, setProfileName] = useState("User");

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user?.id)
        .single();

      if (data) {
        setProfileName(data.name || user?.email?.split('@')[0] || "User");
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 17) return "Selamat Siang";
    return "Selamat Malam";
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {getGreeting()}, {profileName}!
          </h1>
          <p className="text-gray-600">
            Kelola keuangan Anda hari ini
          </p>
        </div>
        
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white text-xl font-bold">
            {profileName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Header;
