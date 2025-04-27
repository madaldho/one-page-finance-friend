import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AuthError } from '@supabase/supabase-js';

import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
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

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log("Sesi login ditemukan, pengguna akan langsung diarahkan");
          navigate('/home', { replace: true });
          return;
        }
      } catch (error) {
        console.error("Error saat memeriksa sesi:", error);
      } finally {
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, [navigate]);

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
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast({
          title: "🎉 Login Berhasil",
          description: "Selamat datang kembali!",
        });

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

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Memeriksa sesi login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
      {/* Animated background with multiple gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-5urple-900 to-blue-600 z-0">
        {/* Moving gradient orbs */}
        <div 
          className="absolute w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob"
          style={{ 
            top: '15%', 
            left: '25%', 
            animation: 'blob 15s infinite ease-in-out',
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)` 
          }}
        />
        <div 
          className="absolute w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-2000"
          style={{ 
            top: '60%', 
            right: '25%', 
            animation: 'blob 18s infinite ease-in-out',
            animationDelay: '2s',
            transform: `translate(${-mousePosition.x * 0.01}px, ${-mousePosition.y * 0.01}px)` 
          }}
        />
        <div 
          className="absolute w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-4000"
          style={{ 
            bottom: '10%', 
            left: '35%',
            animation: 'blob 20s infinite ease-in-out',
            animationDelay: '4s',
            transform: `translate(${mousePosition.y * 0.01}px, ${mousePosition.x * 0.01}px)` 
          }}
        />
        
        {/* Ambient particle effects */}
        <div className="stars absolute inset-0">
          {[...Array(20)].map((_, i) => (
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
        <div className="absolute inset-0 backdrop-blur-[2px] bg-white/5"></div>
      </div>
      
      {/* Main content card */}
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl transition-all duration-500 z-10 backdrop-blur-md ${
        isSignUp 
          ? "bg-gradient-to-br from-white to-green-100 border border-green-200" 
          : "bg-gradient-to-br from-white to-blue-100 border border-blue-200"
      }`}>
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
          <div className="h-[3px] w-48 bg-gradient-to-r from-teal-600 to-teal-300 rounded-full mb-2"></div>
        </div>

        <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold mb-2 ${
            isSignUp ? "text-emerald-700" : "text-blue-700"
          }`}>
            {isSignUp ? "Buat Akun Baru" : "Selamat Datang Kembali"}
          </h2>
          <p className="text-gray-600">
            {isSignUp 
              ? "Daftar untuk mulai mengelola keuangan Anda"
              : "Masuk ke akun Anda untuk melanjutkan"
            }
          </p>
        </div>
        
        <Button
          className={`w-full mb-6 bg-white hover:bg-gray-50 text-gray-700 border ${
            isSignUp ? "border-green-300" : "border-blue-300"
          } hover:shadow-lg transition-all duration-300`}
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4 mr-2" alt="Google logo" />
              Lanjutkan dengan Google
            </>
          )}
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-gray-600">
              Atau lanjutkan dengan email
            </span>
          </div>
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
                className="pl-10 border-gray-300 bg-white text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-300"
              />
            </div>
          </div>
          
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
                className="pl-10 border-gray-300 bg-white text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-300"
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

          {!isSignUp && (
            <div className="text-right">
            
            </div>
          )}
          
          <Button
            className={`w-full h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group text-white ${
              isSignUp
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            type="submit"
            disabled={loading}
          >
            <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full"></span>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : isSignUp ? (
              "Daftar Sekarang"
            ) : (
              "Masuk"
            )}
          </Button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-600">
          {isSignUp ? "Sudah punya akun? " : "Belum punya akun? "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className={`font-medium hover:underline ${
              isSignUp ? "text-emerald-600 hover:text-emerald-700" : "text-blue-600 hover:text-blue-700"
            }`}
          >
            {isSignUp ? "Masuk di sini" : "Daftar sekarang"}
          </button>
        </p>
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
