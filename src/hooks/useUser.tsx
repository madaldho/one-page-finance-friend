
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useUser = () => {
  const { user, session, isLoading } = useAuth();

  return {
    user,
    session,
    isLoading
  };
};

export default useUser;
