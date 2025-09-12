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

    // Also check for query parameters (Supabase can send reset code/token via query params)
    const queryParams = new URLSearchParams(location.search);
    const resetCode = queryParams.get('code');
    const resetToken = queryParams.get('token');
    const queryType = queryParams.get('type');

    console.log('Reset password page loaded with params:', {
      accessToken: !!accessToken,
      type,
      resetCode: !!resetCode,
      resetToken: !!resetToken,
      queryType
    });

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
      } else if (resetCode) {
        // Handle reset code from query parameters
        try {
          setLoading(true);
          setIsFromResetLink(true);
          
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(resetCode);
          
          if (error) {
            console.error('Error exchanging code for session:', error);
            setError('Link reset tidak valid atau sudah kadaluarsa');
          } else if (data.session) {
            console.log('Session exchanged successfully');
            toast({
              title: 'Link reset password berhasil',
              description: 'Silakan masukkan password baru Anda',
            });
          }
        } catch (error) {
          console.error('Error exchanging code:', error);
          setError('Terjadi kesalahan saat memproses link reset password');
        } finally {
          setLoading(false);
        }
      } else if (resetToken && queryType === 'recovery') {
        // Handle reset token from query parameters (new Supabase format)
        try {
          setLoading(true);
          setIsFromResetLink(true);
          
          console.log('Processing reset token from query params');
          
          // Verify the token and get session
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: resetToken,
            type: 'recovery'
          });
          
          if (error) {
            console.error('Error verifying reset token:', error);
            setError('Link reset tidak valid atau sudah kadaluarsa');
          } else {
            console.log('Token verified successfully');
            toast({
              title: 'Link reset password berhasil',
              description: 'Silakan masukkan password baru Anda',
            });
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          setError('Terjadi kesalahan saat memproses link reset password');
        } finally {
          setLoading(false);
        }
      }
    };

    handleRecoveryToken();
  }, [location, toast]);
  
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-br from-indigo-200 to-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse" style={{animationDelay: '4s'}}></div>
        
        <div className="w-full max-w-md relative z-10">
          <Link 
            to="/" 
            className="inline-flex items-center mb-6 text-sm text-gray-600 hover:text-gray-900 transition-all duration-200 hover:scale-105"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke halaman masuk
          </Link>
          
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <LockKeyhole className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Reset Password</h1>
              <p className="text-gray-600 mt-2">Buat password baru untuk akun Anda</p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm rounded-xl flex items-start border border-red-100">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Gagal reset password</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}
            
            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Berhasil Diubah</h2>
                <p className="text-gray-600 mb-4">Password Anda telah berhasil diperbarui.</p>
                <p className="text-sm text-gray-500">Anda akan diarahkan ke halaman login dalam beberapa detik...</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-6">
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
                        className="pr-10 h-12 border-gray-200 focus:border-blue-500 transition-colors"
                        required
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                      className="h-12 border-gray-200 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="mr-2 h-5 w-5" />
                      <span>Simpan Password Baru</span>
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
          
          <p className="text-center mt-6 text-sm text-gray-600">
            Kembali ke <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">halaman login</Link>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        <div className="container mx-auto py-2 px-3 sm:px-4 md:px-6 max-w-2xl relative z-10 pt-4 sm:pt-6 md:pt-4 pb-20 sm:pb-32">
          {/* Header dengan glassmorphism effect */}
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm border border-white/20 sticky top-2 sm:top-4 z-10">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile')}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md border border-white/30 p-0 flex-shrink-0"
                aria-label="Kembali"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-bold text-gray-800 truncate">
                  {isGoogleAccount ? 'Atur Password' : 'Ubah Password'}
                </h1>
                <p className="text-xs text-gray-500 truncate">
                  {isGoogleAccount ? 'Buat password untuk login alternatif' : 'Perbarui kata sandi akun Anda'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <LockKeyhole className="h-8 w-8 text-white" />
              </div>
            </div>
            
            {isGoogleAccount && (
              <div className="mb-6 p-4 bg-blue-50/80 backdrop-blur-sm rounded-xl text-sm text-blue-700 border border-blue-100">
                <p className="mb-2 font-medium">🔗 Akun Google</p>
                <p>
                  Anda login menggunakan akun Google. Dengan mengatur password, 
                  Anda juga bisa login menggunakan email dan password.
                </p>
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm rounded-xl flex items-start border border-red-100">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Gagal mengubah password</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                    {isGoogleAccount ? 'Password Baru' : 'Password Baru'}
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimal 6 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10 h-12 border-gray-200 focus:border-blue-500 transition-colors"
                      required
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                    className="h-12 border-gray-200 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <LockKeyhole className="mr-2 h-5 w-5" />
                    <span>
                      {isGoogleAccount ? 'Atur Password' : 'Ubah Password'}
                    </span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage; 