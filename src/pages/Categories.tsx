import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, FileDown, ChevronLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryForm } from '@/components/CategoryForm';
import { Database } from '@/integrations/supabase/types';
import { PostgrestError } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Category = Database['public']['Tables']['categories']['Row'];

const Categories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedType, setSelectedType] = useState<'income' | 'expense' | 'all'>('all');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [user]);

  const fetchCategories = async () => {
    try {
      if (!user) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('type', { ascending: true })  // Sementara hanya sort berdasarkan type
        .order('name', { ascending: true }); // Dan sort berdasarkan nama

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

  const exportCategories = async () => {
    try {
      if (!user) return;

      const headers = ['id', 'name', 'type', 'color', 'icon', 'user_id', 'created_at', 'updated_at'];
      
      const csvContent = [
        headers.join(','),
        ...categories.map(category => 
          headers.map(header => {
            const value = category[header as keyof typeof category];
            if (value === undefined || value === null) return '""';
            return `"${value}"`;
          }).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kategori-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Berhasil",
        description: "Data kategori berhasil diekspor ke CSV",
      });
    } catch (error) {
      console.error('Error exporting categories:', error);
      toast({
        title: "Gagal mengekspor data",
        description: "Terjadi kesalahan saat mengekspor kategori",
        variant: "destructive"
      });
    }
  };

  const filteredCategories = categories.filter(cat => 
    selectedType === 'all' ? true : cat.type === selectedType
  );

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-32">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full" 
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Kategori</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportCategories}
              className="hidden sm:flex items-center"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => {
                setSelectedCategory(undefined);
                setShowCategoryForm(true);
              }}
              className="bg-[#6E59A5] hover:bg-[#5D4A8F]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah
            </Button>
          </div>
        </div>

        {/* Tab Filter */}
        <Tabs 
          defaultValue="all" 
          value={selectedType}
          onValueChange={(value) => setSelectedType(value as 'all' | 'income' | 'expense')}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="income">Pemasukan</TabsTrigger>
            <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Category List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <i className="fas fa-list text-gray-400 text-2xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">Belum Ada Kategori</h3>
                <p className="text-gray-500 mb-4">
                  {selectedType === 'all' 
                    ? 'Tambahkan kategori untuk mengelompokkan transaksi Anda' 
                    : selectedType === 'income' 
                      ? 'Belum ada kategori pemasukan. Tambahkan kategori baru.' 
                      : 'Belum ada kategori pengeluaran. Tambahkan kategori baru.'}
                </p>
                <Button 
                  onClick={() => {
                    setSelectedCategory(undefined);
                    setShowCategoryForm(true);
                  }}
                  className="bg-[#6E59A5] hover:bg-[#5D4A8F]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Kategori {selectedType !== 'all' && (selectedType === 'income' ? 'Pemasukan' : 'Pengeluaran')}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="opacity-100 transform-none"
              >
                <Card 
                  className="overflow-hidden hover:shadow-md transition-shadow"
                  style={{ borderLeft: `4px solid ${category.color}` }}
                >
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: category.color || '#6E59A5' }}
                        >
                          <i className={`fas fa-${category.icon} text-lg`}></i>
                        </div>
                        <div>
                          <h3 className="font-medium">{category.name}</h3>
                          <Badge 
                            variant={category.type === 'income' ? 'success' : 'destructive'}
                            className="text-xs font-normal mt-1"
                          >
                            {category.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 rounded-none text-xs py-2 h-10"
                        onClick={() => {
                          setSelectedCategory(category);
                          setShowCategoryForm(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <div className="w-px bg-gray-200"></div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 rounded-none text-xs py-2 h-10 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
                            handleDeleteCategory(category.id);
                          }
                        }}
                        disabled={deleting === category.id}
                      >
                        {deleting === category.id ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Menghapus...
                          </span>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Mobile Export Button */}
        <div className="sm:hidden mt-6 flex justify-center">
          <Button 
            variant="outline" 
            onClick={exportCategories}
            className="w-full max-w-xs"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export Kategori
          </Button>
        </div>

        {/* Floating Action Button for Mobile */}
        <div className="fixed bottom-20 right-4 sm:hidden">
          <Button 
            size="icon" 
            className="h-14 w-14 rounded-full shadow-lg bg-[#6E59A5] hover:bg-[#5D4A8F]"
            onClick={() => {
              setSelectedCategory(undefined);
              setShowCategoryForm(true);
            }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {/* Add Category Dialog */}
        <Dialog
          open={showCategoryForm}
          onOpenChange={(open) => {
            setShowCategoryForm(open);
            if (!open) {
              setSelectedCategory(undefined);
              fetchCategories();
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedCategory ? 'Edit Kategori' : 'Tambah Kategori'}
              </DialogTitle>
            </DialogHeader>
            <CategoryForm
              category={selectedCategory}
              onClose={() => setShowCategoryForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Categories; 