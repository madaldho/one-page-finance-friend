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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col pb-20 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 animate-gradient-x"></div>
      
      <UpgradeNotification />
      
      <div className="relative z-10">
        {children}
      </div>
      
  <nav className="fixed bottom-0 left-0 w-full backdrop-blur-xl border-t border-white/30 px-4 py-2 shadow-2xl z-40">
        <div className="max-w-md mx-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-2">
            <div className="flex items-center justify-between">
              <Link 
                to="/home" 
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                  location.pathname === '/home' 
                    ? 'text-blue-600 bg-gradient-to-r from-blue-50 to-cyan-50 scale-105 shadow-lg' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                }`}
              >
                <Home className={`w-5 h-5 ${location.pathname === '/home' ? 'drop-shadow-sm' : ''}`} />
                <span className="text-xs font-medium">Home</span>
              </Link>
              
              <Link 
                to="/analysis" 
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                  location.pathname === '/analysis' 
                    ? 'text-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 scale-105 shadow-lg' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                }`}
              >
                <PieChart className={`w-5 h-5 ${location.pathname === '/analysis' ? 'drop-shadow-sm' : ''}`} />
                <span className="text-xs font-medium">Analisis</span>
              </Link>
              
              <Link 
                to="/transactions" 
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                  location.pathname.includes('/transaction') 
                    ? 'text-green-600 bg-gradient-to-r from-green-50 to-emerald-50 scale-105 shadow-lg' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                }`}
              >
                <TableProperties className={`w-5 h-5 ${location.pathname.includes('/transaction') ? 'drop-shadow-sm' : ''}`} />
                <span className="text-xs font-medium">Transaksi</span>
              </Link>
              
              <Link 
                to="/settings" 
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                  location.pathname === '/settings' 
                    ? 'text-orange-600 bg-gradient-to-r from-orange-50 to-amber-50 scale-105 shadow-lg' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                }`}
              >
                <Settings className={`w-5 h-5 ${location.pathname === '/settings' ? 'drop-shadow-sm' : ''}`} />
                <span className="text-xs font-medium">Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
