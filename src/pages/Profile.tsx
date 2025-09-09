import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2, User, LockKeyhole, ArrowRight, Smartphone, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link, useNavigate } from "react-router-dom";

const formSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong"),
});

type ProfileFormValues = z.infer<typeof formSchema>;

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatar, setAvatar] = useState("");
  
  // Cek apakah user login via Google
  const isGoogleAccount = user?.app_metadata?.provider === 'google';

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Check if profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        form.setValue("name", data.name || "");
        setAvatar(data.avatar_url || "");
      }
    } catch (error: unknown) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Gagal Memuat Profil",
        description: "Terjadi kesalahan saat mengambil data profil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filename = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${filename}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update avatar in profile
      setAvatar(data.publicUrl);
      
      toast({
        title: "Avatar Diperbarui",
        description: "Foto profil kamu telah berhasil diperbarui",
      });
    } catch (error: unknown) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunggah foto';
      toast({
        title: "Gagal Mengunggah Foto",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setLoading(true);

      if (!user?.id) {
        toast({
          title: "Tidak Terautentikasi",
          description: "Silakan login terlebih dahulu",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          name: values.name,
          avatar_url: avatar,
          updated_at: new Date().toISOString() 
        });

      if (error) throw error;

      toast({
        title: "Profil Diperbarui",
        description: "Profil kamu telah berhasil diperbarui",
      });
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui profil';
      toast({
        title: "Gagal Memperbarui Profil",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-full mix-blend-multiply filter blur-xl"></div>
        </div>
        
        <div className="container mx-auto py-2 px-2 md:px-6 max-w-2xl relative z-10 pt-6 md:pt-4">
          {/* Header dengan glassmorphism effect */}
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md border border-white/30 p-0"
                aria-label="Kembali"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Profil Saya</h1>
                <p className="text-xs text-gray-500">Kelola informasi akun dan pengaturan pribadi</p>
              </div>
            </div>
          </div>
        
          {/* Main Profile Card */}
          <div className="backdrop-blur-sm bg-white/80 rounded-xl shadow-sm border border-white/20 mb-6 overflow-hidden">
            {/* Header Section */}
            <div className="px-5 py-5 border-b border-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt="Avatar" 
                      className="w-14 h-14 rounded-xl object-cover border border-gray-200"
                      onError={(e) => {
                        console.log("Gambar avatar gagal dimuat");
                        setAvatar("");
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center border border-gray-200">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <label className="absolute -bottom-1 -right-1 bg-indigo-500 text-white p-1.5 rounded-lg cursor-pointer hover:bg-indigo-600 transition-colors">
                    {uploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={uploadAvatar}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-medium text-gray-900">
                    {form.watch("name") || "Pengguna Baru"}
                  </h2>
                  <p className="text-gray-500 text-sm">{user?.email}</p>
                  {uploading && (
                    <p className="text-sm text-indigo-600 mt-1 flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Sedang mengunggah...
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Form Section */}
            <div className="p-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 text-sm font-medium">Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan nama lengkap Anda"
                            className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg h-10 bg-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <FormLabel className="text-gray-700 text-sm font-medium">Email</FormLabel>
                    <Input
                      value={user?.email || ""}
                      disabled
                      className="bg-gray-50 border-gray-200 rounded-lg h-10 mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email tidak dapat diubah
                    </p>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-0 rounded-lg h-10 font-medium transition-colors"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Perubahan"
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
          
          {/* Security Section */}
          <div className="backdrop-blur-sm bg-white/80 rounded-xl shadow-sm border border-white/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100/50">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <LockKeyhole className="w-5 h-5 text-orange-600" />
                Keamanan Akun
              </h3>
              <p className="text-sm text-gray-500 mt-1">Kelola password dan keamanan akun</p>
            </div>
            
            <div className="p-5">
              <Link 
                to="/reset-password" 
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <LockKeyhole className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">
                      {isGoogleAccount ? 'Atur Password Akun' : 'Ubah Password'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {isGoogleAccount 
                        ? 'Tambahkan password untuk akun Google Anda' 
                        : 'Perbarui password login Anda'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
