import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <p className="text-white/80 font-medium">Memeriksa sesi admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-blue-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-black/10" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }}></div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-white/25 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
        <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}></div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Logo/Header Section */}
          <div className="text-center mb-8 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg border border-white/20 mb-6 shadow-2xl hover:scale-105 transition-transform duration-300">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 sm:text-4xl">Admin Portal</h1>
            <p className="text-white/70 font-medium text-sm sm:text-base">Keuangan Pribadi Dashboard</p>
          </div>

          {/* Login Card */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl opacity-0 animate-[slideUp_0.8s_ease-out_0.3s_forwards] hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Admin
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="masukkan email admin"
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 h-12 pl-4 pr-4 rounded-xl backdrop-blur-sm focus:bg-white/20 focus:border-white/40 transition-all duration-300 hover:bg-white/15"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="masukkan password"
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 h-12 pl-4 pr-12 rounded-xl backdrop-blur-sm focus:bg-white/20 focus:border-white/40 transition-all duration-300 hover:bg-white/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-white/10"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      <span>Memproses login...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Shield className="mr-3 h-5 w-5" />
                      <span>Masuk ke Dashboard</span>
                    </div>
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-white/50 text-sm">
                  Khusus untuk administrator sistem
                </p>
                <div className="flex items-center justify-center mt-4 space-x-2">
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 