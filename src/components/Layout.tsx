
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PieChart, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

  return (
    <div className="min-h-screen bg-[#F6F6F7] flex flex-col">
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
