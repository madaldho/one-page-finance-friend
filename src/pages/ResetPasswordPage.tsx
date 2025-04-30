import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, ArrowLeft, LockKeyhole, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Layout from '@/components/Layout';

// Tipe untuk error dari Supabase
interface AuthError {
  message: string;
  [key: string]: unknown;
}

const ResetPasswordPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isFromResetLink, setIsFromResetLink] = useState(false);
  
  // Cek apakah user login via Google
  const isGoogleAccount = user?.app_metadata?.provider === 'google';
  
  // Check if we're coming from a password reset link
  useEffect(() => {
    // Parse the URL hash to extract the access token
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    // If there's an access token and it's from a recovery operation,
    // let's update the session
    const handleRecoveryToken = async () => {
      if (accessToken && type === 'recovery') {
        try {
          setLoading(true);
          setIsFromResetLink(true);
          // Update the session with the new token
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            console.error('Error setting session:', error);
            setError('Link reset tidak valid atau sudah kadaluarsa');
          }
        } catch (error) {
          console.error('Error handling recovery token:', error);
          setError('Terjadi kesalahan saat memproses link reset password');
        } finally {
          setLoading(false);
        }
      }
    };

    handleRecoveryToken();
  }, [location]);
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi password
    if (newPassword.length < 6) {
      toast({
        title: 'Password terlalu pendek',
        description: 'Password harus minimal 6 karakter',
        variant: 'destructive'
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Password tidak cocok',
        description: 'Konfirmasi password tidak sesuai dengan password baru',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (isGoogleAccount && !isFromResetLink) {
        // Untuk pengguna Google, tambahkan password ke akun
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        
        if (error) throw error;
        
        toast({
          title: 'Password berhasil diatur',
          description: 'Sekarang Anda dapat login menggunakan email dan password'
        });
        // Redirect ke halaman profile setelah berhasil
        navigate('/profile');
      } else {
        // Untuk pengguna email biasa, update password
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        
        if (error) throw error;
        
        setIsSuccess(true);
        toast({
          title: 'Password berhasil diubah',
          description: 'Password Anda telah diperbarui'
        });
        
        // Jika dari reset link, redirect ke login setelah beberapa detik
        if (isFromResetLink) {
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          // Jika dari halaman profil, redirect ke profile
          navigate('/profile');
        }
      }
    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengatur password';
      setError(errorMessage);
      toast({
        title: 'Gagal mengatur password',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Jika datang dari reset link tapi belum berhasil login
  if (isFromResetLink && !user && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h1 className="text-xl font-medium text-gray-800">Memproses link reset password...</h1>
            <p className="text-gray-600 mt-2">Harap tunggu sebentar</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Jika datang dari reset link dan ada error
  if (isFromResetLink && error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Link Tidak Valid</h1>
              <p className="text-gray-600 mt-2">{error}</p>
            </div>
            
            <Button asChild className="w-full">
              <Link to="/">Kembali ke Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Jika datang dari reset link dan berhasil
  if (isFromResetLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link 
            to="/" 
            className="inline-flex items-center mb-6 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke halaman masuk
          </Link>
          
          <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LockKeyhole className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
              <p className="text-gray-600 mt-2">Buat password baru untuk akun Anda</p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 rounded-md flex items-start">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Gagal reset password</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}
            
            {isSuccess ? (
              <div className="text-center py-6">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-gray-800 mb-2">Password Berhasil Diubah</h2>
                <p className="text-gray-600 mb-4">Password Anda telah berhasil diperbarui.</p>
                <p className="text-sm text-gray-500">Anda akan diarahkan ke halaman login dalam beberapa detik...</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                      Password Baru
                    </label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimal 6 karakter"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-10"
                        required
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Konfirmasi Password
                    </label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan password yang sama"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
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
                      <>
                        <LockKeyhole className="mr-2 h-4 w-4" />
                        <span>Simpan Password Baru</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
          
          <p className="text-center mt-6 text-sm text-gray-600">
            Kembali ke <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">halaman login</Link>
          </p>
        </div>
      </div>
    );
  }
  
  // Jika pengguna belum login, tampilkan pesan
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-xl font-bold mb-4">Anda belum login</h1>
            <p className="text-gray-600 mb-4">
              Silakan login terlebih dahulu untuk mengakses halaman ini.
            </p>
            <Button asChild>
              <Link to="/">Login</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Tampilan normal untuk pengguna yang sudah login
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="flex items-center mb-6">
          <Link to="/profile" className="mr-2 text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">
            {isGoogleAccount ? 'Atur Password' : 'Ubah Password'}
          </h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          {isGoogleAccount && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p className="mb-2 font-medium">Akun Google</p>
              <p>
                Anda login menggunakan akun Google. Dengan mengatur password, 
                Anda juga bisa login menggunakan email dan password.
              </p>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-md flex items-start">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Gagal mengubah password</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handlePasswordReset}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  {isGoogleAccount ? 'Password Baru' : 'Password Baru'}
                </label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Konfirmasi Password
                </label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password yang sama"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
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
                  <>
                    <LockKeyhole className="mr-2 h-4 w-4" />
                    <span>
                      {isGoogleAccount ? 'Atur Password' : 'Ubah Password'}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage; 