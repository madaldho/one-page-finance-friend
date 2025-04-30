import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Smartphone, Laptop, Trash2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDeviceFingerprint } from '@/utils/deviceFingerprint';

interface TrustedDevice {
  id: string;
  device_name: string;
  last_used: string;
  created_at: string;
  fingerprint: string;
}

const DeviceManager = () => {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFingerprint, setCurrentFingerprint] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        if (!user) return;
        
        // Ambil fingerprint perangkat saat ini
        const fingerprint = await getDeviceFingerprint();
        setCurrentFingerprint(fingerprint);
        
        // Ambil daftar perangkat terpercaya dari database
        const { data, error } = await supabase
          .from('trusted_devices')
          .select('*')
          .eq('user_id', user.id)
          .order('last_used', { ascending: false });
        
        if (error) throw error;
        
        // Cast data ke TrustedDevice[]
        setDevices(data as unknown as TrustedDevice[]);
      } catch (error) {
        console.error('Error fetching trusted devices:', error);
        toast({
          title: 'Gagal memuat perangkat',
          description: 'Terjadi kesalahan saat memuat daftar perangkat terpercaya.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDevices();
  }, [user, toast]);

  const removeDevice = async (deviceId: string, fingerprint: string) => {
    try {
      const { error } = await supabase
        .from('trusted_devices')
        .delete()
        .eq('id', deviceId);
      
      if (error) throw error;
      
      // Perbarui daftar perangkat
      setDevices(devices.filter(device => device.id !== deviceId));
      
      toast({
        title: 'Perangkat dihapus',
        description: 'Perangkat telah dihapus dari daftar perangkat terpercaya.',
      });
      
      // Jika menghapus perangkat saat ini, refresh halaman agar user perlu login ulang
      if (fingerprint === currentFingerprint) {
        toast({
          title: 'Perangkat saat ini dihapus',
          description: 'Anda perlu login ulang karena perangkat saat ini telah dihapus.',
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Error removing device:', error);
      toast({
        title: 'Gagal menghapus perangkat',
        description: 'Terjadi kesalahan saat menghapus perangkat.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.toLowerCase().includes('android') || 
        deviceName.toLowerCase().includes('iphone') || 
        deviceName.toLowerCase().includes('ios')) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Laptop className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
            Perangkat Terpercaya
          </CardTitle>
          <CardDescription>Mengelola perangkat yang tersimpan untuk login otomatis</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
          Perangkat Terpercaya
        </CardTitle>
        <CardDescription>
          Perangkat yang Anda gunakan untuk login
        </CardDescription>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <p className="mb-1">Belum ada perangkat terpercaya yang tersimpan.</p>
            <p className="text-sm mt-2">Saat login, aktifkan opsi "Ingat perangkat ini" untuk otomatis login di masa mendatang.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  device.fingerprint === currentFingerprint
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-card border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 p-2 rounded-full ${
                    device.fingerprint === currentFingerprint
                      ? 'bg-primary/10'
                      : 'bg-gray-100'
                  }`}>
                    {getDeviceIcon(device.device_name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{device.device_name}</p>
                      {device.fingerprint === currentFingerprint && (
                        <span className="text-xs bg-primary/80 text-white px-2 py-0.5 rounded-full">
                          Perangkat Ini
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-2 text-xs text-muted-foreground">
                      <p>
                        <span className="inline-block sm:hidden font-medium">Aktif: </span>
                        {formatDate(device.last_used)}
                      </p>
                      <span className="hidden sm:inline">•</span>
                      <p>
                        <span className="inline-block sm:hidden font-medium">Terdaftar: </span>
                        {formatDate(device.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-full h-8 w-8"
                  onClick={() => removeDevice(device.id, device.fingerprint)}
                  title="Hapus perangkat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeviceManager; 