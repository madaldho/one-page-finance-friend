import { 
  ShoppingBag, 
  Utensils, 
  Car, 
  Home, 
  Heart, 
  GraduationCap, 
  GamepadIcon, 
  Shirt, 
  Fuel, 
  Phone, 
  Zap, 
  Stethoscope,
  DollarSign,
  TrendingUp,
  Gift,
  CreditCard,
  PiggyBank,
  Briefcase,
  Users,
  Coffee,
  Film,
  Plane,
  ShoppingCart,
  Wrench,
  Building
} from 'lucide-react';

export interface CategorySuggestion {
  name: string;
  icon: string;
  type: 'income' | 'expense';
  color?: string;
  keywords: string[];
  description?: string;
}

export const PREDEFINED_EXPENSE_CATEGORIES: CategorySuggestion[] = [
  {
    name: 'Makanan & Minuman',
    icon: 'Utensils',
    type: 'expense',
    color: '#ef4444',
    keywords: ['makan', 'makanan', 'restoran', 'cafe', 'kopi', 'minuman', 'delivery', 'gofood', 'grabfood'],
    description: 'Pengeluaran untuk makanan, minuman, dan dining'
  },
  {
    name: 'Belanja',
    icon: 'ShoppingBag',
    type: 'expense',
    color: '#8b5cf6',
    keywords: ['belanja', 'shopping', 'beli', 'toko', 'mall', 'online', 'marketplace', 'tokopedia', 'shopee'],
    description: 'Belanja kebutuhan sehari-hari dan lifestyle'
  },
  {
    name: 'Transportasi',
    icon: 'Car',
    type: 'expense',
    color: '#3b82f6',
    keywords: ['transport', 'ojek', 'taxi', 'bus', 'motor', 'mobil', 'bensin', 'parkir', 'gojek', 'grab'],
    description: 'Biaya transportasi dan perjalanan'
  },
  {
    name: 'Tagihan & Utilities',
    icon: 'Zap',
    type: 'expense',
    color: '#f59e0b',
    keywords: ['listrik', 'air', 'gas', 'internet', 'telepon', 'wifi', 'tagihan', 'pln', 'pdam'],
    description: 'Tagihan bulanan dan utilitas rumah'
  },
  {
    name: 'Kesehatan',
    icon: 'Stethoscope',
    type: 'expense',
    color: '#10b981',
    keywords: ['dokter', 'obat', 'hospital', 'klinik', 'vitamin', 'medical', 'kesehatan', 'rumah sakit'],
    description: 'Biaya kesehatan dan pengobatan'
  },
  {
    name: 'Hiburan',
    icon: 'Film',
    type: 'expense',
    color: '#ec4899',
    keywords: ['bioskop', 'game', 'hiburan', 'netflix', 'spotify', 'youtube', 'subscription', 'streaming'],
    description: 'Hiburan dan langganan digital'
  },
  {
    name: 'Pendidikan',
    icon: 'GraduationCap',
    type: 'expense',
    color: '#6366f1',
    keywords: ['sekolah', 'kursus', 'buku', 'training', 'seminar', 'pendidikan', 'les', 'kuliah'],
    description: 'Biaya pendidikan dan pengembangan diri'
  },
  {
    name: 'Fashion & Kecantikan',
    icon: 'Shirt',
    type: 'expense',
    color: '#f97316',
    keywords: ['baju', 'sepatu', 'kosmetik', 'salon', 'fashion', 'skincare', 'makeup', 'barbershop'],
    description: 'Fashion dan perawatan diri'
  },
  {
    name: 'Rumah Tangga',
    icon: 'Home',
    type: 'expense',
    color: '#84cc16',
    keywords: ['rumah', 'furniture', 'cleaning', 'sabun', 'detergen', 'peralatan', 'maintenance'],
    description: 'Kebutuhan dan perawatan rumah tangga'
  },
  {
    name: 'Asuransi',
    icon: 'Heart',
    type: 'expense',
    color: '#06b6d4',
    keywords: ['asuransi', 'insurance', 'bpjs', 'premi', 'proteksi'],
    description: 'Premi asuransi dan proteksi'
  }
];

export const PREDEFINED_INCOME_CATEGORIES: CategorySuggestion[] = [
  {
    name: 'Gaji',
    icon: 'Briefcase',
    type: 'income',
    color: '#22c55e',
    keywords: ['gaji', 'salary', 'payroll', 'upah', 'penghasilan'],
    description: 'Gaji dan penghasilan tetap'
  },
  {
    name: 'Bonus',
    icon: 'Gift',
    type: 'income',
    color: '#f59e0b',
    keywords: ['bonus', 'tunjangan', 'insentif', 'reward', 'gratifikasi'],
    description: 'Bonus dan insentif kerja'
  },
  {
    name: 'Investasi',
    icon: 'TrendingUp',
    type: 'income',
    color: '#3b82f6',
    keywords: ['investasi', 'dividen', 'reksadana', 'saham', 'crypto', 'return', 'profit'],
    description: 'Hasil investasi dan dividen'
  },
  {
    name: 'Freelance',
    icon: 'Users',
    type: 'income',
    color: '#8b5cf6',
    keywords: ['freelance', 'project', 'kontrak', 'konsultan', 'jasa'],
    description: 'Penghasilan freelance dan project'
  },
  {
    name: 'Bisnis',
    icon: 'Building',
    type: 'income',
    color: '#ef4444',
    keywords: ['bisnis', 'usaha', 'jualan', 'dagang', 'omzet', 'penjualan'],
    description: 'Penghasilan dari bisnis dan usaha'
  },
  {
    name: 'Tabungan',
    icon: 'PiggyBank',
    type: 'income',
    color: '#10b981',
    keywords: ['tabungan', 'bunga', 'deposito', 'bank', 'saving'],
    description: 'Bunga tabungan dan deposito'
  },
  {
    name: 'Lainnya',
    icon: 'DollarSign',
    type: 'income',
    color: '#6b7280',
    keywords: ['lain', 'misc', 'other', 'tambahan', 'extra'],
    description: 'Penghasilan lainnya'
  }
];

// Smart suggestion based on title and amount
export function getSmartCategorySuggestions(
  title: string, 
  amount: number, 
  type: 'income' | 'expense'
): CategorySuggestion[] {
  const categories = type === 'income' ? PREDEFINED_INCOME_CATEGORIES : PREDEFINED_EXPENSE_CATEGORIES;
  const titleLower = title.toLowerCase();
  
  // Score categories based on keyword matches
  const scoredCategories = categories.map(category => {
    let score = 0;
    
    // Check keyword matches
    category.keywords.forEach(keyword => {
      if (titleLower.includes(keyword.toLowerCase())) {
        score += 10;
      }
    });
    
    // Boost common categories for certain amount ranges
    if (type === 'expense') {
      if (amount < 50000 && ['Makanan & Minuman', 'Transportasi'].includes(category.name)) {
        score += 5;
      } else if (amount > 500000 && ['Belanja', 'Tagihan & Utilities'].includes(category.name)) {
        score += 3;
      }
    }
    
    return { ...category, score };
  });
  
  // Sort by score and return top suggestions
  return scoredCategories
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// Get icon component by name
export function getCategoryIcon(iconName: string) {
  const iconMap: Record<string, any> = {
    Utensils,
    ShoppingBag,
    Car,
    Home,
    Heart,
    GraduationCap,
    GamepadIcon,
    Shirt,
    Fuel,
    Phone,
    Zap,
    Stethoscope,
    DollarSign,
    TrendingUp,
    Gift,
    CreditCard,
    PiggyBank,
    Briefcase,
    Users,
    Coffee,
    Film,
    Plane,
    ShoppingCart,
    Wrench,
    Building
  };
  
  return iconMap[iconName] || DollarSign;
}

// Create a new category from suggestion
export async function createCategoryFromSuggestion(
  suggestion: CategorySuggestion,
  userId: string,
  supabase: any
): Promise<any> {
  const { data, error } = await supabase
    .from('categories')
    .insert([
      {
        name: suggestion.name,
        type: suggestion.type,
        icon: suggestion.icon,
        color: suggestion.color,
        user_id: userId,
        sort_order: 0
      }
    ])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}