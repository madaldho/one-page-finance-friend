import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ArrowLeft, 
  ChevronLeft, 
  MoreHorizontal, 
  Search, 
  X, 
  LockIcon,
  DollarSign,
  ShoppingCart,
  Car,
  Home,
  Utensils,
  GraduationCap,
  Heart,
  Gamepad2,
  Gift,
  Plane,
  Briefcase,
  Bus,
  Shirt,
  Coffee,
  Calendar,
  PiggyBank,
  CreditCard,
  Banknote,
  HandHeart,
  ShoppingBag,
  Stethoscope,
  Book,
  Smartphone,
  Wifi,
  University
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Database } from '@/integrations/supabase/types';
import { PostgrestError } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { hasProAccess, UserSubscriptionProfile } from "@/utils/subscription";

type Category = Database['public']['Tables']['categories']['Row'];

interface UserProfile {
  subscription_type?: string;
  trial_start?: string | null;
  trial_end?: string | null;
  [key: string]: any;
}

const MAX_FREE_CATEGORIES = 10;

// Icon mapping untuk menampilkan Lucide icons
const iconMap: { [key: string]: any } = {
  'DollarSign': DollarSign,
  'ShoppingCart': ShoppingCart,
  'Car': Car,
  'Home': Home,
  'Utensils': Utensils,
  'GraduationCap': GraduationCap,
  'Heart': Heart,
  'Gamepad2': Gamepad2,
  'Gift': Gift,
  'Plane': Plane,
  'Briefcase': Briefcase,
  'Bus': Bus,
  'Shirt': Shirt,
  'Coffee': Coffee,
  'Calendar': Calendar,
  'PiggyBank': PiggyBank,
  'CreditCard': CreditCard,
  'Banknote': Banknote,
  'HandHeart': HandHeart,
  'ShoppingBag': ShoppingBag,
  'Stethoscope': Stethoscope,
  'Book': Book,
  'Smartphone': Smartphone,
  'Wifi': Wifi,
  'University': University,
  // Fallback untuk icon lama yang mungkin masih ada di database
  'dollar': DollarSign,
  'shopping-cart': ShoppingCart,
  'car': Car,
  'home': Home,
  'utensils': Utensils,
  'coffee': Coffee,
  'wifi': Wifi,
  'money-bill': Banknote,
};

const Categories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedType, setSelectedType] = useState<'income' | 'expense' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [upgradeDialog, setUpgradeDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data as UserSubscriptionProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const isProUser = hasProAccess(userProfile as UserSubscriptionProfile);

  const fetchCategories = async () => {
    try {
      if (!user) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data);
    } catch (error) {
      if (error instanceof PostgrestError) {
        console.error('Database error:', error.message);
      } else {
        console.error('Unknown error:', error);
      }
      toast({
        title: "Gagal memuat kategori",
        description: "Terjadi kesalahan saat mengambil data kategori",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShowDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setCategoryToDelete(null);
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      if (!user) return;
      setDeleting(id);

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(categories.filter(c => c.id !== id));
      
      toast({
        title: "Berhasil",
        description: "Kategori telah dihapus",
      });
    } catch (error) {
      if (error instanceof PostgrestError) {
        console.error('Database error:', error.message);
      } else {
        console.error('Unknown error:', error);
      }
      toast({
        title: "Gagal menghapus kategori",
        description: "Terjadi kesalahan saat menghapus kategori. Mungkin kategori ini masih digunakan dalam transaksi.",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'd MMM yyyy', { locale: id });
    } catch {
      return '-';
    }
  };

  const filteredCategories = categories
    .filter(cat => selectedType === 'all' ? true : cat.type === selectedType)
    .filter(cat => 
      searchQuery === '' ? true : 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCategory = () => {
    // Jika user free dan sudah mencapai batas kategori
    if (!isProUser && categories.length >= MAX_FREE_CATEGORIES) {
      setUpgradeDialog(true);
      return;
    }
    
    // Jika pro user atau masih dalam batas, lanjutkan
    navigate('/categories/add');
  };

  const handleUpgrade = () => {
    navigate('/upgrade');
    setUpgradeDialog(false);
  };

  return (
    <Layout>
      <div className="container mx-auto py-2 px-2 md:px-6 max-w-3xl">
        {/* Header dengan glassmorphism effect */}
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-4 mb-6 shadow-sm border border-white/20 sticky top-4 z-10">
          <div className="flex items-center justify-between gap-2">
            {showSearch ? (
              <div className="relative w-full animation-fade-in">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Cari kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 h-10 w-full rounded-full border-gray-200 focus:border-primary"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearch(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-10 h-10 bg-white/70 hover:bg-white rounded-xl border border-white/30 flex-shrink-0"
                    onClick={() => navigate("/settings")}
                    aria-label="Kembali"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </Button>
                  <div className="min-w-0">
                    <h1 className="text-lg font-bold text-gray-800 truncate">Kategori</h1>
                    <p className="text-xs text-gray-500 truncate">Kelola kategori transaksi</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl" 
                    onClick={() => setShowSearch(true)}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                  
                  <Button 
                    size="sm"
                    className="h-10 rounded-xl px-3"
                    onClick={handleAddCategory}
                  >
                    <Plus className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Tambah</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs Filter */}
        <Tabs 
          defaultValue="all" 
          value={selectedType}
          onValueChange={(value) => setSelectedType(value as 'all' | 'income' | 'expense')}
          className="w-full mb-4"
        >
          <TabsList className="grid w-full grid-cols-3 h-9 rounded-full p-0.5">
            <TabsTrigger value="all" className="rounded-full text-xs h-8">Semua</TabsTrigger>
            <TabsTrigger value="income" className="rounded-full text-xs h-8">Pemasukan</TabsTrigger>
            <TabsTrigger value="expense" className="rounded-full text-xs h-8">Pengeluaran</TabsTrigger>
          </TabsList>
        </Tabs>        {/* Category List */}
        <main className="mt-4">
        {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse border border-gray-100">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50 rounded-lg text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <i className="fas fa-layer-group text-gray-400 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'Tidak ada hasil' : 'Belum Ada Kategori'}
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mb-6">
                {searchQuery 
                  ? `Tidak ada kategori yang cocok dengan "${searchQuery}"`
                  : selectedType === 'all' 
                    ? 'Tambahkan kategori untuk mengelompokkan transaksi keuangan Anda' 
                    : selectedType === 'income' 
                      ? 'Belum ada kategori pemasukan. Tambahkan kategori baru.' 
                      : 'Belum ada kategori pengeluaran. Tambahkan kategori baru.'}
                </p>
              {!searchQuery && (
                <Button 
                  onClick={handleAddCategory}
                  className="rounded-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Kategori
                </Button>
              )}
            </div>
        ) : (
            <div className="space-y-2">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                  className="flex items-center p-3 rounded-lg bg-white border border-gray-100 hover:border-gray-200 transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: category.color || '#6E59A5' }}
                        >
                    {(() => {
                      const IconComponent = iconMap[category.icon] || DollarSign;
                      return <IconComponent className="w-5 h-5" />;
                    })()}
                        </div>
                  
                  <div className="ml-3 flex-1 min-w-0">
                    <h3 className="font-medium truncate">{category.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={category.type === 'income' ? 'success' : 'destructive'}
                        className="text-[10px] h-4 px-1.5 font-normal"
                          >
                            {category.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                          </Badge>
                        </div>
                      </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-lg">
                      <DropdownMenuItem 
                        onClick={() => navigate(`/categories/edit/${category.id}`)}
                        className="cursor-pointer"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => handleShowDeleteDialog(category)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </div>
            ))}
          </div>
        )}
        </main>

      

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="max-w-xs mx-auto rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus kategori{' '}
                <span className="font-semibold">{categoryToDelete?.name}</span>?
                <br />
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-col gap-2">
              <AlertDialogAction
                onClick={() => {
                  if (categoryToDelete) {
                    handleDeleteCategory(categoryToDelete.id);
                  }
                  handleCloseDeleteDialog();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full"
                disabled={deleting === categoryToDelete?.id}
              >
                {deleting === categoryToDelete?.id ? 'Menghapus...' : 'Hapus'}
              </AlertDialogAction>
              <AlertDialogCancel onClick={handleCloseDeleteDialog} className="w-full mt-0">Batal</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Upgrade Dialog */}
        <AlertDialog open={upgradeDialog} onOpenChange={setUpgradeDialog}>
          <AlertDialogContent className="max-w-xs mx-auto rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Upgrade Akun</AlertDialogTitle>
              <AlertDialogDescription>
                Anda telah mencapai batas kategori gratis.
                <br />
                Silakan upgrade ke paket Pro untuk mendapatkan kategori tanpa batas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-col gap-2">
              <AlertDialogAction
                onClick={handleUpgrade}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
              >
                Upgrade
              </AlertDialogAction>
              <AlertDialogCancel onClick={() => setUpgradeDialog(false)} className="w-full mt-0">Batal</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animation-fade-in {
            animation: fadeIn 0.2s ease-in-out;
          }
        `}} />
      </div>
    </Layout>
  );
};

export default Categories; 