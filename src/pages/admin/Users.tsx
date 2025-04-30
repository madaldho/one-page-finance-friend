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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Filter
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
      
      // Hitung tanggal akhir berdasarkan tipe subscription
      const now = new Date();
      const endDate = new Date();
      
      if (subscriptionType === 'pro_6m') {
        endDate.setMonth(now.getMonth() + 6);
      } else if (subscriptionType === 'pro_12m') {
        endDate.setMonth(now.getMonth() + 12);
      } else if (subscriptionType === 'free') {
        // Untuk free user, set trial_end ke 7 hari dari sekarang
        endDate.setDate(now.getDate() + 7);
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_type: subscriptionType,
          trial_start: now.toISOString(),
          trial_end: endDate.toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            subscription_type: subscriptionType,
            trial_start: now.toISOString(),
            trial_end: endDate.toISOString()
          };
        }
        return user;
      }));

      toast({
        title: "Berhasil mengupdate langganan",
        description: `Status langganan pengguna berhasil diubah ke ${
          subscriptionType === 'pro_6m' ? 'Pro 6 Bulan' : 
          subscriptionType === 'pro_12m' ? 'Pro 12 Bulan' : 'Free'
        }`,
      });
    } catch (error) {
      console.error('Error updating user subscription:', error);
      toast({
        title: "Gagal mengupdate langganan",
        description: "Terjadi kesalahan saat mengubah status langganan",
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
    const daysLeft = getDaysLeft(user.trial_end);
    
    if (user.subscription_type === 'pro_6m' || user.subscription_type === 'pro_12m') {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <Award className="h-3 w-3" />
          <span>
            {user.subscription_type === 'pro_6m' ? 'Pro 6 Bulan' : 'Pro 12 Bulan'}
          </span>
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
        matchesExpiration = daysLeft <= 0;
      } else if (expirationFilter === 'expiring_soon') {
        matchesExpiration = daysLeft > 0 && daysLeft <= 7;
      } else if (expirationFilter === 'active') {
        matchesExpiration = daysLeft > 7;
      }
      
      return matchesSearch && matchesSubscription && matchesExpiration;
    })
    .sort((a, b) => {
      let fieldA: string | number | undefined = a[sortField as keyof UserProfile];
      let fieldB: string | number | undefined = b[sortField as keyof UserProfile];
      
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
      
      if (fieldA === undefined || fieldA === null) fieldA = 0;
      if (fieldB === undefined || fieldB === null) fieldB = 0;
      
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Kelola Pengguna</h1>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Filter Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div className="relative col-span-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama atau email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Subscription Type Filter */}
            <div>
              <label className="text-sm font-medium block mb-2">Tipe Langganan</label>
              <Select 
                value={subscriptionFilter} 
                onValueChange={setSubscriptionFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Langganan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Langganan</SelectItem>
                  <SelectItem value="pro_12m">Pro 12 Bulan</SelectItem>
                  <SelectItem value="pro_6m">Pro 6 Bulan</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Expiration Filter */}
            <div>
              <label className="text-sm font-medium block mb-2">Status Langganan</label>
              <Select 
                value={expirationFilter} 
                onValueChange={setExpirationFilter}
              >
                <SelectTrigger>
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
              <label className="text-sm font-medium block mb-2">Urutkan Berdasarkan</label>
              <Select 
                value={sortField} 
                onValueChange={(value) => {
                  setSortField(value);
                  setSortDirection('asc');
                }}
              >
                <SelectTrigger>
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
            
            {/* Refresh Button */}
            <div className="self-end lg:col-start-4 lg:justify-self-end">
              <Button variant="outline" onClick={fetchUsers} className="w-full lg:w-auto">
                Refresh Data
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {userColumns.map((column) => (
                  <TableHead key={column.id} className="font-medium">
                    <div className="flex items-center gap-1">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <button
                          className="p-1 hover:bg-gray-100 rounded"
                          onClick={() => handleSort(column.id === 'days_left' ? 'trial_end' : column.id)}
                        >
                          {sortField === column.id || (column.id === 'days_left' && sortField === 'trial_end') ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          ) : (
                            <div className="h-3 w-3" />
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
                  <TableCell colSpan={userColumns.length} className="h-24 text-center">
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Memuat data pengguna...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userColumns.length} className="h-24 text-center">
                    <AlertCircle className="h-6 w-6 mx-auto text-muted-foreground" />
                    <div className="mt-2 text-sm text-muted-foreground">
                      {searchTerm || subscriptionFilter !== 'all' || expirationFilter !== 'all'
                        ? `Tidak ada pengguna yang cocok dengan filter yang dipilih`
                        : "Belum ada pengguna yang terdaftar"}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name || "Tanpa Nama"}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5 text-gray-400" />
                        <span>{getFormattedDate(user.trial_start)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5 text-gray-400" />
                        <span>{getFormattedDate(user.trial_end)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        getDaysLeft(user.trial_end) <= 0 
                          ? 'text-red-500' 
                          : user.subscription_type?.includes('pro') 
                            ? 'text-green-600' 
                            : 'text-amber-500'
                      }`}>
                          {getDaysLeft(user.trial_end)} hari
                        </span>
                    </TableCell>
                    <TableCell>
                      {getUserStatusBadge(user)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.subscription_type || 'free'}
                        onValueChange={(value) => updateUserSubscription(user.id, value)}
                        disabled={processingUser === user.id}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
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
                          <SelectItem value="pro_6m" className="text-green-600">
                            Pro 6 Bulan (Rp99.000)
                          </SelectItem>
                          <SelectItem value="pro_12m" className="text-green-600">
                            Pro 12 Bulan (Rp150.000)
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
        <div className="p-4 text-sm text-gray-500 border-t">
          Total: {filteredUsers.length} dari {users.length} pengguna
        </div>
      </Card>
    </div>
  );
};

export default Users; 