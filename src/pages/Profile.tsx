import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2, User, LockKeyhole, ArrowRight, Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "react-router-dom";

const formSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong"),
});

type ProfileFormValues = z.infer<typeof formSchema>;

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative">
        {/* Static Beautiful Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-gradient-to-br from-pink-300 to-rose-400 rounded-full mix-blend-multiply filter blur-xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-6 pb-32 max-w-2xl relative z-10">
          {/* Clean Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Profil Saya</h1>
            <p className="text-gray-600">Kelola informasi akun dan pengaturan pribadi Anda</p>
          </div>
        
          {/* Main Profile Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden mb-6">
            {/* Header Section */}
            <div className="px-6 py-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt="Avatar" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-md"
                      onError={(e) => {
                        console.log("Gambar avatar gagal dimuat");
                        setAvatar("");
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center border-2 border-gray-200 shadow-md">
                      <User className="w-7 h-7 text-white" />
                    </div>
                  )}
                  <label className="absolute -bottom-1 -right-1 bg-indigo-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-indigo-600 transition-colors shadow-md">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
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
                  <h2 className="text-lg font-semibold text-gray-900">
                    {form.watch("name") || "Pengguna Baru"}
                  </h2>
                  <p className="text-gray-600 text-sm">{user?.email}</p>
                  {uploading && (
                    <p className="text-sm text-indigo-600 mt-1 flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Sedang Mengunggah...
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Form Section */}
            <div className="p-6 space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan nama lengkap Anda"
                            className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg h-11 bg-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                    <Input
                      value={user?.email || ""}
                      disabled
                      className="bg-gray-50 border-gray-200 rounded-lg h-11 mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email tidak dapat diubah
                    </p>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-0 rounded-lg h-11 font-medium transition-colors"
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
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <LockKeyhole className="w-5 h-5 text-orange-600" />
                Keamanan Akun
              </h3>
              <p className="text-sm text-gray-600 mt-1">Kelola password dan keamanan akun</p>
            </div>
            
            <div className="p-6">
              <Link 
                to="/reset-password" 
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <LockKeyhole className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {isGoogleAccount ? 'Atur Password Akun' : 'Ubah Password'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {isGoogleAccount 
                        ? 'Tambahkan password untuk akun Google Anda' 
                        : 'Perbarui password login Anda'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
