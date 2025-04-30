import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PieChart, Settings, TableProperties } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UpgradeNotification from './UpgradeNotification';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // If user is not authenticated, redirect to auth page
  React.useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Ensure page is scrolled to top when layout renders
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F6F6F7] flex flex-col pb-16">
      <UpgradeNotification />
      
      {children}
      
      <nav className="fixed bottom-0 left-0 w-full bg-white px-6 py-3 border-t">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link 
            to="/home" 
            className={`flex flex-col items-center gap-1 ${
              location.pathname === '/home' ? 'text-[#6E59A5]' : 'text-gray-400'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </Link>
          
          <Link 
            to="/analysis" 
            className={`flex flex-col items-center gap-1 ${
              location.pathname === '/analysis' ? 'text-[#6E59A5]' : 'text-gray-400'
            }`}
          >
            <PieChart className="w-5 h-5" />
            <span className="text-xs">Analisis</span>
          </Link>
          
          <Link 
            to="/transactions" 
            className={`flex flex-col items-center gap-1 ${
              location.pathname.includes('/transaction') ? 'text-[#6E59A5]' : 'text-gray-400'
            }`}
          >
            <TableProperties className="w-5 h-5" />
            <span className="text-xs">Transaksi</span>
          </Link>
          
          <Link 
            to="/settings" 
            className={`flex flex-col items-center gap-1 ${
              location.pathname === '/settings' ? 'text-[#6E59A5]' : 'text-gray-400'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
