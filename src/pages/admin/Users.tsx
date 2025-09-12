import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Award,
  CalendarClock,
  Filter,
  Activity,
  Users as UsersIcon,
  Crown
} from 'lucide-react';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { id } from 'date-fns/locale';

// Perbaikan untuk definisi tipe UserProfile yang lengkap
interface UserProfile {
  id: string;
  name: string; 
  email: string;
  avatar_url?: string;
  is_admin?: boolean;
  subscription_type?: string;
  trial_start?: string;
  trial_end?: string;
  created_at?: string;
  updated_at?: string;
}

const userColumns = [
  { id: 'name', label: 'Nama', sortable: true },
  { id: 'email', label: 'Email', sortable: true },
  { id: 'trial_start', label: 'Tanggal Mulai', sortable: true },
  { id: 'trial_end', label: 'Tanggal Berakhir', sortable: true },
  { id: 'days_left', label: 'Sisa Hari', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
  { id: 'action', label: 'Aksi', sortable: false }
];

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('trial_end');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');
  const [expirationFilter, setExpirationFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format data untuk tampilan
      const formattedUsers = data.map(user => ({
        ...user,
        email: user.email || 'No Email'
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Gagal memuat data pengguna",
        description: "Terjadi kesalahan saat mengambil data pengguna",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserSubscription = async (userId: string, subscriptionType: string) => {
    try {
      setProcessingUser(userId);
      
      console.log(`Updating user ${userId} to subscription: ${subscriptionType}`);
      
      // Hitung tanggal berdasarkan tipe subscription
      const now = new Date();
      let updateData: any = {
        subscription_type: subscriptionType,
        updated_at: now.toISOString()
      };
      
      if (subscriptionType === 'pro_1m') {
        const endDate = new Date();
        endDate.setMonth(now.getMonth() + 1);
        updateData.trial_start = now.toISOString();
        updateData.trial_end = endDate.toISOString();
      } else if (subscriptionType === 'pro_6m') {
        const endDate = new Date();
        endDate.setMonth(now.getMonth() + 6);
        updateData.trial_start = now.toISOString();
        updateData.trial_end = endDate.toISOString();
      } else if (subscriptionType === 'pro_12m') {
        const endDate = new Date();
        endDate.setMonth(now.getMonth() + 12);
        updateData.trial_start = now.toISOString();
        updateData.trial_end = endDate.toISOString();
      } else if (subscriptionType === 'pro_lifetime') {
        // Untuk lifetime, set trial_start tapi tidak ada trial_end (atau set null)
        updateData.trial_start = now.toISOString();
        updateData.trial_end = null;
      } else if (subscriptionType === 'free') {
        // Untuk free user, set trial 7 hari
        const endDate = new Date();
        endDate.setDate(now.getDate() + 7);
        updateData.trial_start = now.toISOString();
        updateData.trial_end = endDate.toISOString();
      }

      console.log('Update data:', updateData);

      // Update database
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select('*');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Database update successful:', data);

      // Update local state untuk reflect perubahan di UI
      setUsers(prevUsers => prevUsers.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            subscription_type: subscriptionType,
            trial_start: updateData.trial_start,
            trial_end: updateData.trial_end,
            updated_at: updateData.updated_at
          };
        }
        return user;
      }));

      const subscriptionLabels: { [key: string]: string } = {
        'pro_1m': 'Pro 1 Bulan',
        'pro_6m': 'Pro 6 Bulan', 
        'pro_12m': 'Pro 12 Bulan',
        'pro_lifetime': 'Lifetime Pro',
        'free': 'Free'
      };

      toast({
        title: "✅ Berhasil mengupdate langganan",
        description: `Status langganan pengguna berhasil diubah ke ${subscriptionLabels[subscriptionType]}`,
      });

      // Refresh data untuk memastikan sinkronisasi
      setTimeout(() => {
        fetchUsers();
      }, 1000);

    } catch (error: any) {
      console.error('Error updating user subscription:', error);
      toast({
        title: "❌ Gagal mengupdate langganan",
        description: error.message || "Terjadi kesalahan saat mengubah status langganan",
        variant: "destructive",
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFormattedDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'd MMM yyyy', { locale: id });
    } catch (error) {
      return '-';
    }
  };

  const getDaysLeft = (endDateString?: string) => {
    if (!endDateString) return 0;
    
    try {
      const endDate = parseISO(endDateString);
      const today = new Date();
      
      return differenceInDays(endDate, today);
    } catch (error) {
      return 0;
    }
  };

  const getUserStatusBadge = (user: UserProfile) => {
    // Handle lifetime subscription first
    if (user.subscription_type === 'pro_lifetime') {
      return (
        <Badge variant="success" className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
          <Crown className="h-3 w-3" />
          <span>Lifetime Pro</span>
        </Badge>
      );
    }
    
    const daysLeft = getDaysLeft(user.trial_end);
    
    if (user.subscription_type === 'pro_1m' || user.subscription_type === 'pro_6m' || user.subscription_type === 'pro_12m' || user.subscription_type === 'pro_lifetime') {
      const labels: { [key: string]: string } = {
        'pro_1m': 'Pro 1 Bulan',
        'pro_6m': 'Pro 6 Bulan',
        'pro_12m': 'Pro 12 Bulan',
        'pro_lifetime': 'Pro Seumur Hidup'
      };
      
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <Award className="h-3 w-3" />
          <span>{labels[user.subscription_type]}</span>
        </Badge>
      );
    }
    
    if (daysLeft > 0) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-200">
          <Clock className="h-3 w-3" />
          <span>Trial ({daysLeft} hari)</span>
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        <span>Free</span>
      </Badge>
    );
  };

  // Filter users based on search term and subscription/expiration filters
  const filteredUsers = users
    .filter(user => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        (user.name && user.name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower))
      );
      
      // Subscription type filter
      let matchesSubscription = true;
      if (subscriptionFilter !== 'all') {
        matchesSubscription = user.subscription_type === subscriptionFilter;
      }
      
      // Expiration filter
      let matchesExpiration = true;
      const daysLeft = getDaysLeft(user.trial_end);
      
      if (expirationFilter === 'expired') {
        // Expired: days left <= 0 AND not lifetime
        matchesExpiration = daysLeft <= 0 && user.subscription_type !== 'pro_lifetime';
      } else if (expirationFilter === 'expiring_soon') {
        // Expiring soon: 0 < days left <= 7 AND not lifetime
        matchesExpiration = daysLeft > 0 && daysLeft <= 7 && user.subscription_type !== 'pro_lifetime';
      } else if (expirationFilter === 'active') {
        // Active: days left > 7 OR lifetime
        matchesExpiration = daysLeft > 7 || user.subscription_type === 'pro_lifetime';
      }
      
      return matchesSearch && matchesSubscription && matchesExpiration;
    })
    .sort((a, b) => {
      let fieldA: string | number | boolean | undefined = a[sortField as keyof UserProfile];
      let fieldB: string | number | boolean | undefined = b[sortField as keyof UserProfile];
      
      // Handle special case for days_left
      if (sortField === 'days_left') {
        fieldA = getDaysLeft(a.trial_end);
        fieldB = getDaysLeft(b.trial_end);
      }
      
      // Handle dates
      if (sortField === 'trial_start' || sortField === 'trial_end' || sortField === 'created_at') {
        fieldA = fieldA ? new Date(fieldA as string).getTime() : 0;
        fieldB = fieldB ? new Date(fieldB as string).getTime() : 0;
      }
      
      // Convert to comparable values
      if (fieldA === undefined || fieldA === null) fieldA = 0;
      if (fieldB === undefined || fieldB === null) fieldB = 0;
      
      // Convert booleans to numbers for comparison
      if (typeof fieldA === 'boolean') fieldA = fieldA ? 1 : 0;
      if (typeof fieldB === 'boolean') fieldB = fieldB ? 1 : 0;
      
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Kelola Pengguna
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola subscription dan status pengguna aplikasi
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <UsersIcon className="h-4 w-4 mr-2" />
            {filteredUsers.length} dari {users.length} pengguna
          </Badge>
          <Button variant="outline" onClick={fetchUsers} className="px-4 py-2">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Filter className="h-3 w-3 text-white" />
            </div>
            Filter & Pencarian
          </CardTitle>
          <CardDescription>Gunakan filter untuk mencari pengguna tertentu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div className="relative col-span-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari berdasarkan nama atau email..."
                className="pl-9 h-11 border-0 bg-gray-50 focus:bg-white transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Subscription Type Filter */}
            <div>
              <label className="text-sm font-medium block mb-2 text-gray-700">Tipe Langganan</label>
              <Select 
                value={subscriptionFilter} 
                onValueChange={setSubscriptionFilter}
              >
                <SelectTrigger className="h-11 border-0 bg-gray-50 focus:bg-white">
                  <SelectValue placeholder="Semua Langganan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Langganan</SelectItem>
                  <SelectItem value="pro_lifetime">Lifetime Pro</SelectItem>
                  <SelectItem value="pro_12m">Pro 12 Bulan</SelectItem>
                  <SelectItem value="pro_6m">Pro 6 Bulan</SelectItem>
                  <SelectItem value="pro_1m">Pro 1 Bulan</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Expiration Filter */}
            <div>
              <label className="text-sm font-medium block mb-2 text-gray-700">Status Langganan</label>
              <Select 
                value={expirationFilter} 
                onValueChange={setExpirationFilter}
              >
                <SelectTrigger className="h-11 border-0 bg-gray-50 focus:bg-white">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="expired">Habis Masa</SelectItem>
                  <SelectItem value="expiring_soon">Hampir Habis (≤7 hari)</SelectItem>
                  <SelectItem value="active">Aktif ({'>'}7 hari)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Sort Options */}
            <div>
              <label className="text-sm font-medium block mb-2 text-gray-700">Urutkan Berdasarkan</label>
              <Select 
                value={sortField} 
                onValueChange={(value) => {
                  setSortField(value);
                  setSortDirection('asc');
                }}
              >
                <SelectTrigger className="h-11 border-0 bg-gray-50 focus:bg-white">
                  <SelectValue placeholder="Urutan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial_end">Tanggal Berakhir</SelectItem>
                  <SelectItem value="days_left">Sisa Hari</SelectItem>
                  <SelectItem value="created_at">Tanggal Bergabung</SelectItem>
                  <SelectItem value="name">Nama Pengguna</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <UsersIcon className="h-3 w-3 text-white" />
            </div>
            Daftar Pengguna
          </CardTitle>
        </CardHeader>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-b-0">
                {userColumns.map((column) => (
                  <TableHead key={column.id} className="font-semibold text-gray-700 h-12">
                    <div className="flex items-center gap-2">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <button
                          className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                          onClick={() => handleSort(column.id === 'days_left' ? 'trial_end' : column.id)}
                        >
                          {sortField === column.id || (column.id === 'days_left' && sortField === 'trial_end') ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3 w-3 text-indigo-600" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-indigo-600" />
                            )
                          ) : (
                            <div className="h-3 w-3 opacity-30">
                              <ArrowUp className="h-3 w-3" />
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={userColumns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                      <div className="text-sm text-gray-500">
                        Memuat data pengguna...
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userColumns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="text-sm text-gray-500">
                        {searchTerm || subscriptionFilter !== 'all' || expirationFilter !== 'all'
                          ? `Tidak ada pengguna yang cocok dengan filter yang dipilih`
                          : "Belum ada pengguna yang terdaftar"}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, index) => (
                  <TableRow key={user.id} className={`hover:bg-gray-50/50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}>
                    <TableCell className="font-medium py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-indigo-700">
                            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-gray-900">{user.name || "Tanpa Nama"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-gray-600">{user.email}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{getFormattedDate(user.trial_start)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{getFormattedDate(user.trial_end)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className={`font-semibold px-2 py-1 rounded-lg text-sm ${
                        getDaysLeft(user.trial_end) <= 0 
                          ? 'text-red-700 bg-red-50' 
                          : user.subscription_type?.includes('pro') 
                            ? 'text-green-700 bg-green-50' 
                            : 'text-amber-700 bg-amber-50'
                      }`}>
                        {user.subscription_type === 'pro_lifetime' ? '∞' : `${getDaysLeft(user.trial_end)} hari`}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      {getUserStatusBadge(user)}
                    </TableCell>
                    <TableCell className="py-4">
                      <Select
                        value={user.subscription_type || 'free'}
                        onValueChange={(value) => updateUserSubscription(user.id, value)}
                        disabled={processingUser === user.id}
                      >
                        <SelectTrigger className="w-[160px] h-9 text-sm border-0 bg-gray-50 hover:bg-white transition-colors">
                          {processingUser === user.id ? (
                            <div className="flex items-center">
                              <Loader2 className="h-3 w-3 animate-spin mr-2" />
                              <span>Processing...</span>
                            </div>
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro_1m" className="text-green-600">
                            Pro 1 Bulan (Rp49.000)
                          </SelectItem>
                          <SelectItem value="pro_6m" className="text-green-600">
                            Pro 6 Bulan (Rp99.000)
                          </SelectItem>
                          <SelectItem value="pro_12m" className="text-green-600">
                            Pro 12 Bulan (Rp150.000)
                          </SelectItem>
                          <SelectItem value="pro_lifetime" className="text-purple-600 font-semibold">
                            Lifetime Pro (Rp999.000)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Users; 