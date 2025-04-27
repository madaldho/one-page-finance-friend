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
        // Ambil sesi dari Supabase yang sudah dikonfigurasi dengan persistSession
        const { data } = await supabase.auth.getSession();
        
        // Jika ada sesi yang valid
        if (data.session) {
          console.log("Sesi ditemukan, memeriksa apakah pengguna adalah admin");
          
          // Cek apakah user adalah admin
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', data.session.user.id)
            .single();

          if (!profileError && profileData?.is_admin) {
            console.log("Pengguna adalah admin, mengalihkan ke dashboard");
            // Simpan status admin di localStorage untuk pemeriksaan cepat
            localStorage.setItem('isAdmin', 'true');
            // Jika admin valid, arahkan ke dashboard
            navigate('/admin/dashboard');
            return;
          } else {
            console.log("Sesi ada tapi bukan admin atau terjadi error");
            // Jika bukan admin, hapus flag dan biarkan di halaman login
            localStorage.removeItem('isAdmin');
          }
        } else {
          console.log("Tidak ada sesi admin yang aktif");
          localStorage.removeItem('isAdmin');
        }
      } catch (error) {
        console.error("Error checking admin session:", error);
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
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Memeriksa sesi admin...</p>
        </div>
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