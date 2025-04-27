import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AuthError } from '@supabase/supabase-js';
import { Checkbox } from "@/components/ui/checkbox";
import { registerDevice } from '@/utils/deviceManager';

import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [checkingDevice, setCheckingDevice] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Untuk animasi background effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Cek perangkat yang tersimpan
  useEffect(() => {
    const checkTrustedDevice = async () => {
      try {
        // Import fungsi secara dinamis untuk menghindari masalah circular dependency
        const { verifyDevice } = await import('@/utils/deviceManager');
        
        // Periksa apakah perangkat ini terdaftar
        const userId = await verifyDevice();
        
        if (userId) {
          // Jika perangkat terdaftar, login otomatis
          console.log('Perangkat terpercaya terdeteksi');
          
          // Dapatkan sesi pengguna
          const { data, error } = await supabase.auth.getUser();
          
          if (!error && data.user) {
            // Sudah ada sesi aktif
            toast({
              title: "🎉 Login Otomatis",
              description: "Selamat datang kembali!",
            });
            navigate('/home', { replace: true });
          } else {
            // Perlu mendapatkan sesi baru berdasarkan device ID
            const { error: sessionError } = await supabase.auth.refreshSession();
            
            if (!sessionError) {
              toast({
                title: "🎉 Login Otomatis",
                description: "Selamat datang kembali!",
              });
              navigate('/home', { replace: true });
            }
          }
        }
      } catch (error) {
        console.error('Error checking trusted device:', error);
      } finally {
        setCheckingDevice(false);
      }
    };
    
    checkTrustedDevice();
  }, [navigate, toast]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        toast({
          title: "✨ Pendaftaran Berhasil",
          description: "Silakan periksa email Anda untuk konfirmasi.",
        });
        setIsSignUp(false); // Switch to login view after successful registration
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast({
          title: "🎉 Login Berhasil",
          description: "Selamat datang kembali!",
        });

        // Jika pengguna memilih untuk mengingat perangkat
        if (rememberDevice && data.user) {
          await registerDevice(data.user.id);
          console.log('Perangkat berhasil didaftarkan');
        }

        navigate('/home', { replace: true });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof AuthError 
        ? error.message 
        : 'Terjadi kesalahan saat autentikasi';
      
      toast({
        title: "❌ Gagal",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      const errorMessage = error instanceof AuthError 
        ? error.message 
        : 'Terjadi kesalahan saat masuk dengan Google';
      
      toast({
        title: "Gagal masuk dengan Google",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Tampilkan loading spinner saat mengecek perangkat
  if (checkingDevice) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Memeriksa perangkat...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 relative overflow-hidden">
      {/* Background effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 opacity-30"
        style={{
          backgroundPosition: `${mousePosition.x / 50}px ${mousePosition.y / 50}px`
        }}
      />
      
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              {isSignUp ? 'Daftar Akun Baru' : 'Masuk ke Akun Anda'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isSignUp 
                ? 'Sudah memiliki akun? ' 
                : 'Belum memiliki akun? '}
              <button
                type="button"
                className="font-medium text-primary hover:text-primary/80"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Masuk' : 'Daftar sekarang'}
              </button>
            </p>
          </div>
          
          <div className="bg-white px-6 py-8 shadow-md rounded-lg">
            <form className="space-y-6" onSubmit={handleAuth}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="pl-10"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <div className="flex items-center">
                  <div className="flex items-center">
                    <Checkbox 
                      id="remember-device" 
                      checked={rememberDevice}
                      onCheckedChange={(checked) => setRememberDevice(checked === true)}
                    />
                    <label htmlFor="remember-device" className="ml-2 block text-sm text-gray-900">
                      Ingat perangkat ini
                    </label>
                  </div>
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    isSignUp ? 'Daftar' : 'Masuk'
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Atau lanjutkan dengan</span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Menghubungkan...</span>
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                        <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                      </svg>
                      <span>Google</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
