import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, TrendingUp, Zap, Calendar, BarChart3, Activity, Crown, Sparkles, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, subDays, isAfter } from 'date-fns';
import { id } from 'date-fns/locale';

interface Stats {
  totalUsers: number;
  activeProUsers: number;
  freeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  revenue: number;
  trialUsers: number;
  expiringUsers: number;
}

interface RecentActivity {
  id: string;
  type: 'signup' | 'upgrade' | 'trial_end';
  user_name: string;
  user_email: string;
  created_at: string;
  subscription_type?: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeProUsers: 0,
    freeUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    revenue: 0,
    trialUsers: 0,
    expiringUsers: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
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

      // Fetch pro users (including 1m and lifetime)
      const { count: proUsers, error: proError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .or('subscription_type.eq.pro_1m,subscription_type.eq.pro_6m,subscription_type.eq.pro_12m,subscription_type.eq.pro_lifetime');

      if (proError) throw proError;

      // Fetch trial users
      const { count: trialUsers, error: trialError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('subscription_type', 'in', '(pro_1m,pro_6m,pro_12m,pro_lifetime)')
        .not('trial_end', 'is', null)
        .gt('trial_end', new Date().toISOString());

      if (trialError) throw trialError;

      // Calculate free users
      const freeUsers = (totalUsers || 0) - (proUsers || 0) - (trialUsers || 0);

      // Fetch new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: newUsersToday, error: todayError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (todayError) throw todayError;

      // Fetch new users this week
      const weekAgo = subDays(new Date(), 7);
      const { count: newUsersThisWeek, error: weekError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      if (weekError) throw weekError;

      // Fetch users expiring soon (within 7 days)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const { count: expiringUsers, error: expiringError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('trial_end', 'is', null)
        .lt('trial_end', sevenDaysFromNow.toISOString())
        .gt('trial_end', new Date().toISOString());

      if (expiringError) throw expiringError;

      // Calculate estimated revenue (more accurate calculation)
      const { data: revenueData, error: revenueError } = await supabase
        .from('profiles')
        .select('subscription_type')
        .not('subscription_type', 'is', null)
        .or('subscription_type.eq.pro_1m,subscription_type.eq.pro_6m,subscription_type.eq.pro_12m,subscription_type.eq.pro_lifetime');

      let revenue = 0;
      if (!revenueError && revenueData) {
        revenueData.forEach(user => {
          switch (user.subscription_type) {
            case 'pro_1m':
              revenue += 49000;
              break;
            case 'pro_6m':
              revenue += 99000;
              break;
            case 'pro_12m':
              revenue += 150000;
              break;
            case 'pro_lifetime':
              revenue += 999000;
              break;
          }
        });
      }

      // Fetch recent activity
      const { data: recentUsers, error: recentError } = await supabase
        .from('profiles')
        .select('id, name, email, created_at, subscription_type, trial_end')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      const activity: RecentActivity[] = recentUsers?.map(user => ({
        id: user.id,
        type: user.subscription_type?.includes('pro') ? 'upgrade' : 'signup',
        user_name: user.name || 'User',
        user_email: user.email || '',
        created_at: user.created_at,
        subscription_type: user.subscription_type
      })) || [];

      setRecentActivity(activity);

      setStats({
        totalUsers: totalUsers || 0,
        activeProUsers: proUsers || 0,
        freeUsers: freeUsers,
        newUsersToday: newUsersToday || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        revenue: revenue,
        trialUsers: trialUsers || 0,
        expiringUsers: expiringUsers || 0,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upgrade':
        return <Crown className="h-4 w-4 text-amber-500" />;
      case 'signup':
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'upgrade':
        return `upgrade ke ${activity.subscription_type === 'pro_lifetime' ? 'Lifetime Pro' : 
          activity.subscription_type === 'pro_1m' ? 'Pro 1 Bulan' :
          activity.subscription_type === 'pro_6m' ? 'Pro 6 Bulan' : 'Pro 12 Bulan'}`;
      case 'signup':
        return 'bergabung sebagai pengguna baru';
      default:
        return 'melakukan aktivitas';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Admin
          </h1>
          <p className="text-gray-600 mt-1">
            Overview dan statistik aplikasi Finance Friend
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Activity className="h-4 w-4 mr-2" />
            {format(new Date(), 'dd MMMM yyyy', { locale: id })}
          </Badge>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="text-xs">
                Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-blue-900">
                {loading ? 
                  <div className="h-8 w-16 bg-blue-200 rounded animate-pulse"></div> : 
                  stats.totalUsers.toLocaleString()
                }
              </p>
              <p className="text-sm text-blue-700 font-medium">Total Pengguna</p>
              <div className="flex items-center text-xs text-blue-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                {loading ? '-' : `+${stats.newUsersToday} hari ini`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pro Users */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="text-xs bg-amber-200 text-amber-800">
                Pro
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-amber-900">
                {loading ? 
                  <div className="h-8 w-16 bg-amber-200 rounded animate-pulse"></div> : 
                  stats.activeProUsers.toLocaleString()
                }
              </p>
              <p className="text-sm text-amber-700 font-medium">Pengguna Pro</p>
              <div className="flex items-center text-xs text-amber-600">
                <BarChart3 className="h-3 w-3 mr-1" />
                {loading ? '-' : `${((stats.activeProUsers / (stats.totalUsers || 1)) * 100).toFixed(1)}% konversi`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trial Users */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="text-xs bg-indigo-200 text-indigo-800">
                Trial
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-indigo-900">
                {loading ? 
                  <div className="h-8 w-16 bg-indigo-200 rounded animate-pulse"></div> : 
                  stats.trialUsers.toLocaleString()
                }
              </p>
              <p className="text-sm text-indigo-700 font-medium">Pengguna Trial</p>
              <div className="flex items-center text-xs text-indigo-600">
                <Calendar className="h-3 w-3 mr-1" />
                {loading ? '-' : `${stats.expiringUsers} akan habis`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="text-xs bg-green-200 text-green-800">
                Revenue
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-lg font-bold text-green-900">
                {loading ? 
                  <div className="h-6 w-20 bg-green-200 rounded animate-pulse"></div> : 
                  formatCurrency(stats.revenue)
                }
              </p>
              <p className="text-sm text-green-700 font-medium">Estimasi Revenue</p>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                Dari pengguna Pro aktif
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              Pengguna Free
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-600">
                  {loading ? 
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div> : 
                    stats.freeUsers.toLocaleString()
                  }
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {loading ? '-' : `${((stats.freeUsers / (stats.totalUsers || 1)) * 100).toFixed(1)}% dari total`}
                </p>
              </div>
              <UserX className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              Minggu Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  {loading ? 
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div> : 
                    stats.newUsersThisWeek.toLocaleString()
                  }
                </p>
                <p className="text-sm text-gray-600 mt-1">Pengguna baru</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              Hampir Habis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-red-600">
                  {loading ? 
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div> : 
                    stats.expiringUsers.toLocaleString()
                  }
                </p>
                <p className="text-sm text-gray-600 mt-1">Trial berakhir 7 hari</p>
              </div>
              <Calendar className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Activity className="h-4 w-4 text-white" />
            </div>
            Aktivitas Terbaru
          </CardTitle>
          <CardDescription>10 aktivitas pengguna terbaru</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))
            ) : recentActivity.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Belum ada aktivitas</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.user_name} {getActivityText(activity)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {activity.user_email}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {format(new Date(activity.created_at), 'dd/MM HH:mm')}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard; 