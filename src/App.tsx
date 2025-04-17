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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('supabase.auth.token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={!isAuthenticated ? <Auth /> : <Index />} />
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
