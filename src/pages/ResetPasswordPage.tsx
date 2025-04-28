import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, ArrowLeft, LockKeyhole, Loader2 } from 'lucide-react';
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
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Cek apakah user login via Google
  const isGoogleAccount = user?.app_metadata?.provider === 'google';
  
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
    
    try {
      if (isGoogleAccount) {
        // Untuk pengguna Google, tambahkan password ke akun
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        
        if (error) throw error;
        
        toast({
          title: 'Password berhasil diatur',
          description: 'Sekarang Anda dapat login menggunakan email dan password'
        });
      } else {
        // Untuk pengguna email biasa, update password
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        
        if (error) throw error;
        
        toast({
          title: 'Password berhasil diubah',
          description: 'Password Anda telah diperbarui'
        });
      }
      
      // Redirect ke halaman profile setelah berhasil
      navigate('/profile');
    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengatur password';
      toast({
        title: 'Gagal mengatur password',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
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
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
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