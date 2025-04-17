
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProfileSectionProps {
  user: any;
}

const ProfileSection = ({ user }: ProfileSectionProps) => {
  const navigate = useNavigate();
  
  const handleEditProfile = () => {
    navigate('/profile');
  };
  
  return (
    <section className="mb-8 bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-[#6E59A5] flex items-center justify-center mr-3 overflow-hidden">
          {user?.profile?.avatar_url ? (
            <img 
              src={user.profile.avatar_url} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-lg font-semibold">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div>
          <p className="font-medium">
            {user?.profile?.name || user?.email || 'User'}
          </p>
          <p className="text-sm text-gray-500">Akun Personal</p>
        </div>
      </div>
      <Button 
        variant="link" 
        className="text-[#6E59A5] p-0 h-auto font-medium"
        onClick={handleEditProfile}
      >
        Edit Profile
      </Button>
    </section>
  );
};

export default ProfileSection;
