import React, { useEffect, useState } from 'react';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Home } from 'lucide-react';

const AdminLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        if (!user) {
          navigate('/admin123');
          return;
        }

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

        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/admin123');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate, toast]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/admin123');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white fixed inset-y-0 left-0 z-50 overflow-y-auto">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-xs text-gray-400">Keuangan Pribadi App</p>
        </div>
        <nav className="p-4 space-y-2">
          <Link 
            to="/admin/dashboard" 
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-700"
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/admin/users" 
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-700"
          >
            <Users className="h-5 w-5" />
            <span>Kelola Pengguna</span>
          </Link>
        </nav>
        <div className="p-4 absolute bottom-0 left-0 right-0 border-t border-gray-700">
          <Button 
            variant="ghost" 
            className="w-full text-white hover:bg-gray-700 justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout; 