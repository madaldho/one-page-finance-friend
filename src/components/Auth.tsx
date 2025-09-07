import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AuthError } from '@supabase/supabase-js';
import { Checkbox } from "@/components/ui/checkbox";
import { registerDevice } from '@/utils/deviceManager';

import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [checkingDevice, setCheckingDevice] = useState(true);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
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
      if (forgotPassword) {
        // Handle password reset request
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;
        
        setResetEmailSent(true);
        toast({
          title: "✉️ Email Reset Password Terkirim",
          description: "Silakan periksa email Anda untuk instruksi reset password.",
        });
      } else if (isSignUp) {
        // Check if user exists before sign up - improved logic
        try {
          const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
            email,
            password: "dummy-password-check", // This will fail but tells us if email exists
          });
          
          // If we get here with a user, email exists
          if (existingUser?.user) {
            toast({
              title: "❌ Email Sudah Terdaftar",
              description: "Akun dengan email ini sudah ada. Silakan login atau reset password.",
              variant: "destructive",
            });
            setIsSignUp(false);
            setLoading(false);
            return;
          }
        } catch (checkError: any) {
          // Check if it's specifically an "Invalid login credentials" error
          // This means user exists but password is wrong
          if (checkError?.message?.includes('Invalid login credentials')) {
            toast({
              title: "❌ Email Sudah Terdaftar", 
              description: "Akun dengan email ini sudah ada. Silakan login atau reset password.",
              variant: "destructive",
            });
            setIsSignUp(false);
            setLoading(false);
            return;
          }
          // If it's a different error (like "Email not confirmed"), proceed with signup
        }
        
        // Proceed with signup if user doesn't exist
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
        // Login with email and password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Provide more specific error messages
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Email atau password salah. Pastikan password sudah diatur jika Anda menggunakan akun Google.');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('Silakan konfirmasi email Anda terlebih dahulu.');
          } else if (error.message.includes('Too many requests')) {
            throw new Error('Terlalu banyak percobaan login. Silakan tunggu beberapa menit.');
          }
          throw error;
        }
        
        toast({
          title: "🎉 Login Berhasil",
          description: "Selamat datang kembali!",
        });

        // Jika pengguna memilih untuk mengingat perangkat
        if (rememberDevice && data.user) {
          await registerDevice(data.user.id);
          console.log('Perangkat berhasil didaftarkan');
        }

        // Check if user profile exists and create if not
        await ensureUserProfile(data.user.id);

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

  const ensureUserProfile = async (userId: string) => {
    try {
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking profile:', profileError);
        return;
      }
      
      // If profile doesn't exist, create one
      if (!profile) {
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData && userData.user) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              name: userData.user.email?.split('@')[0] || 'User',
              email: userData.user.email,
              subscription_type: 'free',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error('Error creating profile:', insertError);
          }
          
          // Create default user settings
          await supabase
            .from('user_settings')
            .insert({
              user_id: userId,
              show_budgeting: true,
              show_loans: true,
              show_savings: true
            });
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      // Set redirect URL to AuthCallback page
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth-callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      
      // Navigasi otomatis akan dilakukan oleh Supabase
      toast({
        title: "Redirecting to Google...",
        description: "Harap tunggu sementara kami mengarahkan Anda ke Google.",
      });
      
      // Jika rememberDevice dicentang, data akan dicatat di callback
      
    } catch (error) {
      console.error("Google sign in error:", error);
      toast({
        title: "Login dengan Google Gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat login dengan Google",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Reset states when toggling between modes
  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setForgotPassword(false);
    setResetEmailSent(false);
  };

  const toggleForgotPassword = () => {
    setForgotPassword(!forgotPassword);
    setResetEmailSent(false);
  };

  // Tampilkan loading spinner saat mengecek perangkat
  if (checkingDevice) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
      {/* Animasi background dengan gradien */}
      <div className={`absolute inset-0 ${
        isSignUp 
          ? "bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20" 
          : forgotPassword
            ? "bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20"
          : "bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20"
      }`}>
        {/* Efek orbs gradien yang bergerak */}
        <div 
          className="absolute w-96 h-96 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob"
          style={{ 
            top: '15%', 
            left: '25%', 
            backgroundColor: isSignUp ? '#10b981' : forgotPassword ? '#f59e0b' : '#3b82f6',
            animation: 'blob 20s infinite ease-in-out',
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)` 
          }}
        />
        <div 
          className="absolute w-96 h-96 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000"
          style={{ 
            top: '60%', 
            right: '25%', 
            backgroundColor: isSignUp ? '#14b8a6' : forgotPassword ? '#f97316' : '#8b5cf6',
            animation: 'blob 18s infinite ease-in-out',
            animationDelay: '2s',
            transform: `translate(${-mousePosition.x * 0.01}px, ${-mousePosition.y * 0.01}px)` 
          }}
        />
        <div 
          className="absolute w-96 h-96 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-4000"
          style={{ 
            bottom: '10%', 
            left: '35%',
            backgroundColor: isSignUp ? '#06b6d4' : forgotPassword ? '#fbbf24' : '#d946ef',
            animation: 'blob 25s infinite ease-in-out',
            animationDelay: '4s',
            transform: `translate(${mousePosition.y * 0.01}px, ${mousePosition.x * 0.01}px)` 
          }}
        />
        
        {/* Ambient particle effects */}
        <div className="stars absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i}
              className="star absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `twinkle ${3 + Math.random() * 7}s infinite ${Math.random() * 5}s ease-in-out`,
                opacity: Math.random() * 0.7 + 0.3
              }}
            />
          ))}
        </div>
        
        {/* Frosted glass overlay */}
        <div className="absolute inset-0 backdrop-blur-[2px]"></div>
      </div>
      
      {/* Main content card */}
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl transition-all duration-500 z-10 backdrop-blur-md ${
        isSignUp 
          ? "bg-gradient-to-br from-white to-emerald-50 border border-emerald-100" 
          : forgotPassword
            ? "bg-gradient-to-br from-white to-amber-50 border border-amber-100"
          : "bg-gradient-to-br from-white to-blue-50 border border-blue-100"
      }`}>
        {/* Back button for forgot password */}
        {forgotPassword && (
          <button
            onClick={toggleForgotPassword}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="text-sm">Kembali ke login</span>
          </button>
        )}

        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="flex flex-row items-center mb-4 w-full justify-center">
            <div className="mr-3">
              <img 
                src="/logokeuanganpay.webp" 
                alt="Keuangan Pribadi Logo" 
                className="w-16 h-16"
              />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-800 leading-8">Keuangan</h1>
              <h1 className="text-3xl font-bold text-gray-800 leading-8">Pribadi</h1>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold mb-2 ${
            isSignUp ? "text-emerald-700" : 
            forgotPassword ? "text-amber-700" : 
            "text-blue-700"
          }`}>
            {forgotPassword 
              ? resetEmailSent ? "Email Terkirim" : "Reset Password" 
              : isSignUp ? "Buat Akun Baru" : "Selamat Datang Kembali"}
          </h2>
          <p className="text-gray-600">
            {forgotPassword 
              ? resetEmailSent 
                ? "Silakan cek email Anda untuk instruksi reset password"
                : "Masukkan email Anda untuk menerima link reset password"
              : isSignUp 
              ? "Daftar untuk mulai mengelola keuangan Anda"
              : "Masuk ke akun Anda untuk melanjutkan"
            }
          </p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@example.com"
                className="pl-10 border-gray-300 bg-white/80 text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-offset-0 focus:ring-opacity-50"
                style={{
                  borderColor: isSignUp 
                    ? "rgb(167, 243, 208)" 
                    : forgotPassword 
                      ? "rgb(253, 230, 138)" 
                      : "rgb(191, 219, 254)"
                }}
              />
            </div>
          </div>
          
          {/* Only show password field if not in forgot password mode or not in email sent confirmation */}
          {!forgotPassword && !resetEmailSent && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="pl-10 border-gray-300 bg-white/80 text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-offset-0 focus:ring-opacity-50"
                style={{
                    borderColor: isSignUp 
                      ? "rgb(167, 243, 208)" 
                      : "rgb(191, 219, 254)"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          )}

          {/* Remember device checkbox only on login */}
          {!isSignUp && !forgotPassword && !resetEmailSent && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox
                  id="remember-device"
                  checked={rememberDevice}
                  onCheckedChange={(checked) => setRememberDevice(checked === true)}
                  className={isSignUp ? "text-emerald-500" : "text-blue-500"}
                />
                <label htmlFor="remember-device" className="ml-2 block text-sm text-gray-900">
                  Ingat perangkat ini
                </label>
              </div>
              
              <button
                type="button"
                onClick={toggleForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Lupa Password?
              </button>
            </div>
          )}
          
          <Button
            className={`w-full h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group ${
              isSignUp
                ? "bg-emerald-500 hover:bg-emerald-600"
                : forgotPassword
                  ? "bg-amber-500 hover:bg-amber-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            type="submit"
            disabled={loading}
          >
            <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full"></span>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : forgotPassword ? (
              resetEmailSent ? "Kirim Ulang" : "Kirim Link Reset"
            ) : isSignUp ? (
              "Daftar Sekarang"
            ) : (
              "Masuk"
            )}
          </Button>
        
          {/* Only show OAuth options if not in forgot password mode */}
          {!forgotPassword && (
            <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-3 bg-opacity-80 ${
                isSignUp ? "bg-emerald-50" : "bg-blue-50"
              } text-gray-600`}>
                Atau lanjutkan dengan
              </span>
            </div>
          </div>
          
          <Button
            className={`w-full bg-white hover:bg-gray-50 text-gray-700 border ${
              isSignUp ? "border-emerald-300" : "border-blue-300"
            } hover:shadow-lg transition-all duration-300`}
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            type="button"
            variant="outline"
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
            </>
          )}
        </form>
        
        {/* Toggle between signup and login */}
        {!forgotPassword && (
        <p className="mt-6 text-center text-sm text-gray-600">
          {isSignUp ? "Sudah punya akun? " : "Belum punya akun? "}
          <button
            type="button"
              onClick={toggleSignUp}
            className={`font-medium hover:underline ${
              isSignUp ? "text-emerald-600 hover:text-emerald-700" : "text-blue-600 hover:text-blue-700"
            }`}
          >
            {isSignUp ? "Masuk di sini" : "Daftar sekarang"}
          </button>
        </p>
        )}

        {/* Return to login from reset email sent confirmation */}
        {forgotPassword && resetEmailSent && (
          <p className="mt-6 text-center text-sm text-gray-600">
            <button
              type="button"
              onClick={toggleForgotPassword}
              className="font-medium hover:underline text-amber-600 hover:text-amber-700"
            >
              Kembali ke halaman login
            </button>
          </p>
        )}
      </div>
      
      {/* CSS animations */}
      <style>
        {`
          @keyframes blob {
            0% {
              transform: scale(1) translate(0px, 0px);
            }
            33% {
              transform: scale(1.1) translate(30px, -50px);
            }
            66% {
              transform: scale(0.9) translate(-20px, 20px);
            }
            100% {
              transform: scale(1) translate(0px, 0px);
            }
          }
          @keyframes twinkle {
            0% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.2); }
            100% { opacity: 0.3; transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};

export default Auth;
