
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
    } catch (error: any) {
      toast({
        title: "❌ Gagal",
        description: error.message,
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
    } catch (error: any) {
      toast({
        title: "Gagal masuk dengan Google",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-lg transition-all duration-300 ${
        isSignUp 
          ? "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100" 
          : "bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100"
      }`}>
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${
            isSignUp ? "text-emerald-800" : "text-blue-800"
          }`}>
            {isSignUp ? "Buat Akun Baru" : "Selamat Datang Kembali"}
          </h1>
          <p className="text-gray-600">
            {isSignUp 
              ? "Daftar untuk mulai mengelola keuangan Anda"
              : "Masuk ke akun Anda untuk melanjutkan"
            }
          </p>
        </div>
        
        <Button
          className={`w-full mb-6 bg-white hover:bg-gray-50 text-gray-700 border ${
            isSignUp ? "border-green-200" : "border-blue-200"
          } hover:shadow-md transition-all duration-300`}
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
            <span className="px-2 bg-gradient-to-b from-white to-transparent text-gray-500">
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
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@example.com"
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="pl-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
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
            className={`w-full h-11 text-base font-medium shadow-sm hover:shadow-md transition-all duration-300 ${
              isSignUp
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            type="submit"
            disabled={loading}
          >
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
    </div>
  );
};

export default Auth;
