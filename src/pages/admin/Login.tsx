import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Periksa jika sudah ada sesi admin saat komponen dimuat
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        // Cek jika sudah login sebagai admin
        const savedAdminStatus = localStorage.getItem('isAdmin') === 'true';
        if (savedAdminStatus) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            // Cek apakah user benar-benar admin
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('id', data.session.user.id)
              .single();

            if (!profileError && profileData?.is_admin) {
              // Jika masih admin, arahkan ke dashboard
              navigate('/admin/dashboard');
              return;
            }
          }
          // Jika tidak valid, hapus flag admin
          localStorage.removeItem('isAdmin');
        }
      } catch (error) {
        console.error('Error checking admin session:', error);
        localStorage.removeItem('isAdmin');
      } finally {
        setCheckingSession(false);
      }
    };

    checkAdminSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Authenticate dengan Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Cek apakah user adalah admin di profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        // Jika pengguna bukan admin, keluar dan tampilkan pesan error
        if (!profileData.is_admin) {
          await supabase.auth.signOut();
          throw new Error('Anda tidak memiliki akses ke dashboard admin');
        }

        // Simpan status admin di localStorage
        localStorage.setItem('isAdmin', 'true');

        toast({
          title: "Login Berhasil",
          description: "Selamat datang di dashboard admin",
        });

        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      localStorage.removeItem('isAdmin');
      
      toast({
        title: "Login Gagal",
        description: error.message || "Terjadi kesalahan saat login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email admin"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Memproses...</span>
                </div>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin; 