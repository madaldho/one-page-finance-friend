import React, { useEffect, useState } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Home, Menu, X, Shield, Settings } from 'lucide-react';

const AdminLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        if (!user) {
          // Cek jika ada sesi yang tersimpan sebelumnya
          const { data: sessionData } = await supabase.auth.getSession();
          
          if (!sessionData.session) {
            navigate('/admin123');
            return;
          }
          
          // Ada sesi, tapi perlu memverifikasi apakah admin
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', sessionData.session.user.id)
            .single();
            
          if (profileError || !profileData?.is_admin) {
            navigate('/admin123');
            return;
          }
          
          // Pengguna adalah admin, set state sesuai
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // Jika user sudah ada, cek apakah admin
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (!data?.is_admin) {
          toast({
            title: "Akses Ditolak",
            description: "Anda tidak memiliki akses ke dashboard admin",
            variant: "destructive",
          });
          navigate('/admin123');
          return;
        }

        // Simpan status admin di localStorage untuk persistensi
        localStorage.setItem('isAdmin', 'true');
        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        localStorage.removeItem('isAdmin');
        navigate('/admin123');
      } finally {
        setLoading(false);
      }
    };

    // Cek dulu di localStorage jika pengguna sudah login sebagai admin sebelumnya
    const savedAdminStatus = localStorage.getItem('isAdmin') === 'true';
    if (savedAdminStatus && user) {
      setIsAdmin(true);
      setLoading(false);
    } else {
      checkAdminStatus();
    }
  }, [user, navigate, toast]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('isAdmin');
      await supabase.auth.signOut();
      navigate('/admin123');
      toast({
        title: "Logout Berhasil",
        description: "Anda telah keluar dari dashboard admin",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Navigation items
  const navItems = [
    {
      path: '/admin/dashboard',
      name: 'Dashboard',
      icon: Home,
    },
    {
      path: '/admin/users',
      name: 'Kelola Pengguna',
      icon: Users,
    },
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <p className="text-gray-600 font-medium">Memuat dashboard admin...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                  <p className="text-xs text-white/70">Keuangan Pribadi</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:bg-white/20"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group
                    ${isActive 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                    }
                  `}
                >
                  <IconComponent className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-200/50 bg-gray-50/50">
            <div className="mb-4 p-3 bg-white/70 rounded-xl border border-gray-200/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full text-gray-600 hover:text-red-600 hover:bg-red-50 justify-start transition-colors duration-200"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              <span className="font-medium">Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center lg:hidden">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {navItems.find(item => isActivePath(item.path))?.name || 'Dashboard'}
                    </h2>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      Panel administrasi keuangan pribadi
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Online</span>
                </div>
                
                <div className="lg:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 