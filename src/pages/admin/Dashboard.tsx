import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';

interface Stats {
  totalUsers: number;
  activeProUsers: number;
  freeUsers: number;
  newUsersToday: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeProUsers: 0,
    freeUsers: 0,
    newUsersToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch total users
      const { count: totalUsers, error: totalError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Fetch pro users
      const { count: proUsers, error: proError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .or('subscription_type.eq.pro_6m,subscription_type.eq.pro_12m');

      if (proError) throw proError;

      // Calculate free users
      const freeUsers = (totalUsers || 0) - (proUsers || 0);

      // Fetch new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: newUsers, error: newError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (newError) throw newError;

      setStats({
        totalUsers: totalUsers || 0,
        activeProUsers: proUsers || 0,
        freeUsers: freeUsers,
        newUsersToday: newUsers || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Gagal memuat statistik",
        description: "Terjadi kesalahan saat mengambil data statistik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pengguna</CardDescription>
            <CardTitle className="text-3xl">
              {loading ? 
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div> : 
                stats.totalUsers
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-primary mt-2">
              <Users className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        {/* Pro Users */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pengguna Pro</CardDescription>
            <CardTitle className="text-3xl">
              {loading ? 
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div> : 
                stats.activeProUsers
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-green-500 mt-2">
              <UserCheck className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        {/* Free Users */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pengguna Free</CardDescription>
            <CardTitle className="text-3xl">
              {loading ? 
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div> : 
                stats.freeUsers
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-orange-500 mt-2">
              <UserX className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        {/* New Users Today */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pengguna Baru Hari Ini</CardDescription>
            <CardTitle className="text-3xl">
              {loading ? 
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div> : 
                stats.newUsersToday
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-blue-500 mt-2">
              <TrendingUp className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
          <CardDescription>Statistik dan performa aplikasi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm">
                <p className="text-muted-foreground">Rasio Konversi Pro:</p>
                <p className="font-medium">
                  {loading ? 
                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div> : 
                    `${((stats.activeProUsers / (stats.totalUsers || 1)) * 100).toFixed(1)}%`
                  }
                </p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Pengguna Free:</p>
                <p className="font-medium">
                  {loading ? 
                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div> : 
                    `${((stats.freeUsers / (stats.totalUsers || 1)) * 100).toFixed(1)}%`
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard; 