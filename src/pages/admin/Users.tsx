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
  CalendarClock
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
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

  // Filter dan sort users
  const filteredUsers = users
    .filter(user => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (user.name && user.name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      let fieldA = a[sortField as keyof UserProfile];
      let fieldB = b[sortField as keyof UserProfile];
      
      // Handle special case for days_left
      if (sortField === 'days_left') {
        fieldA = getDaysLeft(a.trial_end);
        fieldB = getDaysLeft(b.trial_end);
      }
      
      // Handle dates
      if (sortField === 'trial_start' || sortField === 'trial_end') {
        fieldA = fieldA ? new Date(fieldA as string).getTime() : 0;
        fieldB = fieldB ? new Date(fieldB as string).getTime() : 0;
      }
      
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Kelola Pengguna</h1>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Cari Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama atau email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={fetchUsers}>
              Refresh
            </Button>
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
                      {searchTerm
                        ? `Tidak ada pengguna yang cocok dengan "${searchTerm}"`
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
                      {user.subscription_type === 'pro_6m' ? (
                        <span className="text-green-600 font-medium">180 hari</span>
                      ) : user.subscription_type === 'pro_12m' ? (
                        <span className="text-green-600 font-medium">365 hari</span>
                      ) : (
                        <span className={`font-medium ${getDaysLeft(user.trial_end) <= 0 ? 'text-red-500' : 'text-amber-500'}`}>
                          {getDaysLeft(user.trial_end)} hari
                        </span>
                      )}
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
      </Card>
    </div>
  );
};

export default Users; 