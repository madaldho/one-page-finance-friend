
import React, { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import Auth from './components/Auth';
import Index from './pages/Index';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Analysis from './pages/Analysis';
import WalletDetail from './pages/WalletDetail';
import NotFound from './pages/NotFound';
import TransactionPage from './pages/TransactionPage';
import { useAuth } from './contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Create a wrapper component to handle auth redirects
const AuthRedirect = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (user && location.pathname === '/') {
        navigate('/home', { replace: true });
      } else if (!user && location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    }
  }, [user, isLoading, navigate, location.pathname]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user && location.pathname !== '/') {
    return <Auth />;
  }

  return null;
};

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AuthRedirect />
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/home" element={<Index />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/wallet/:id" element={<WalletDetail />} />
          <Route path="/transaction/:type" element={<TransactionPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
