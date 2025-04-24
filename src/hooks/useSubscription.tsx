import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Mendefinisikan tipe untuk statistik penggunaan fitur
interface UsageStats {
  analysisViewsToday: number;
  hasViewedAnalysisToday: boolean;
  lastAnalysisView?: string;
}

// Mendefinisikan tipe untuk profil pengguna dengan tambahan bidang langganan
interface UserProfile {
  id: string;
  subscription_type?: string;
  trial_start?: string;
  trial_end?: string;
  is_admin?: boolean;
  email?: string;
  name?: string;
  [key: string]: any;
}

// Status langganan yang dapat digunakan di seluruh aplikasi
interface SubscriptionState {
  isLoading: boolean;
  isProUser: boolean;
  userProfile: UserProfile | null;
  usageStats: UsageStats;
  // Fungsi utilitas
  canAccessAnalysis: () => boolean;
  canCreateWallet: (currentWalletCount: number) => boolean;
  canAccessBudget: () => boolean;
  canAccessSavings: () => boolean;
  canAccessLoans: () => boolean;
  recordAnalysisView: () => Promise<boolean>;
  getActiveWalletsLimit: () => number;
  getRemainingWalletsCount: (currentWalletCount: number) => number;
  getRemainingSavingsCount: (currentSavingsCount: number) => number;
  refreshSubscription: () => Promise<void>;
}

// Nilai default untuk context
const defaultSubscriptionState: SubscriptionState = {
  isLoading: true,
  isProUser: false,
  userProfile: null,
  usageStats: {
    analysisViewsToday: 0,
    hasViewedAnalysisToday: false
  },
  canAccessAnalysis: () => false,
  canCreateWallet: () => false,
  canAccessBudget: () => false,
  canAccessSavings: () => false,
  canAccessLoans: () => false,
  recordAnalysisView: async () => false,
  getActiveWalletsLimit: () => 0,
  getRemainingWalletsCount: () => 0,
  getRemainingSavingsCount: () => 0,
  refreshSubscription: async () => {}
};

// Context untuk menyediakan status langganan ke seluruh aplikasi
const SubscriptionContext = createContext<SubscriptionState>(defaultSubscriptionState);

// Key untuk menyimpan data penggunaan di localStorage
const USAGE_STATS_KEY = 'money_friend_usage_stats';

// Provider untuk subscription context
export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    analysisViewsToday: 0,
    hasViewedAnalysisToday: false
  });

  // Fungsi untuk memuat data penggunaan dari localStorage
  const loadUsageStats = useCallback(() => {
    try {
      const savedStats = localStorage.getItem(USAGE_STATS_KEY);
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        // Periksa apakah statistik masih untuk hari ini
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const lastViewDate = parsedStats.lastAnalysisView?.split('T')[0];
        
        if (lastViewDate === today) {
          setUsageStats(parsedStats);
        } else {
          // Reset statistik jika bukan hari ini
          const newStats = {
            analysisViewsToday: 0,
            hasViewedAnalysisToday: false,
            lastAnalysisView: undefined
          };
          setUsageStats(newStats);
          localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(newStats));
        }
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  }, []);

  // Fungsi untuk menyimpan data penggunaan ke localStorage
  const saveUsageStats = useCallback((stats: UsageStats) => {
    try {
      localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving usage stats:', error);
    }
  }, []);

  // Memuat profil pengguna
  const fetchUserProfile = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setUserProfile(null);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Menentukan apakah pengguna adalah pro user
  const isProUser = useCallback(() => {
    if (!userProfile) return false;

    const { subscription_type, trial_end, is_admin } = userProfile;
    
    // Admin selalu memiliki akses Pro
    if (is_admin) return true;

    // Jika pengguna memiliki tipe langganan Pro
    if (subscription_type === 'pro_6m' || subscription_type === 'pro_12m') {
      // Periksa jika masa trial belum berakhir
      if (trial_end) {
        const now = new Date();
        const endDate = new Date(trial_end);
        return now <= endDate;
      }
    }
    
    return false;
  }, [userProfile]);

  // Fungsi untuk memeriksa akses ke fitur analisis
  const canAccessAnalysis = useCallback(() => {
    // Pengguna Pro selalu bisa mengakses analisis
    if (isProUser()) return true;
    
    // Pengguna Free hanya boleh mengakses 1x sehari
    return !usageStats.hasViewedAnalysisToday;
  }, [usageStats.hasViewedAnalysisToday, isProUser]);

  // Fungsi untuk memeriksa akses ke pembuatan dompet baru
  const canCreateWallet = useCallback((currentWalletCount: number) => {
    // Pengguna Pro selalu bisa membuat dompet baru
    if (isProUser()) return true;
    
    // Pengguna Free dibatasi hanya 3 dompet
    return currentWalletCount < 3;
  }, [isProUser]);

  // Fungsi untuk memeriksa akses ke fitur budget
  const canAccessBudget = useCallback(() => {
    // Hanya pengguna Pro yang bisa mengakses fitur budget
    return isProUser();
  }, [isProUser]);

  // Fungsi untuk memeriksa akses ke fitur tabungan
  const canAccessSavings = useCallback(() => {
    // Hanya pengguna Pro yang bisa mengakses fitur tabungan
    return isProUser();
  }, [isProUser]);

  // Fungsi untuk memeriksa akses ke fitur hutang piutang
  const canAccessLoans = useCallback(() => {
    // Hanya pengguna Pro yang bisa mengakses fitur hutang piutang
    return isProUser();
  }, [isProUser]);

  // Fungsi untuk mencatat akses ke halaman analisis
  const recordAnalysisView = useCallback(async () => {
    // Jika sudah mengakses hari ini dan bukan pro user, tolak akses
    if (usageStats.hasViewedAnalysisToday && !isProUser()) {
      return false;
    }
    
    // Update statistik penggunaan
    const now = new Date().toISOString();
    const newStats: UsageStats = {
      analysisViewsToday: usageStats.analysisViewsToday + 1,
      hasViewedAnalysisToday: true,
      lastAnalysisView: now
    };
    
    setUsageStats(newStats);
    saveUsageStats(newStats);
    return true;
  }, [usageStats, isProUser, saveUsageStats]);

  // Fungsi untuk mendapatkan batas dompet aktif
  const getActiveWalletsLimit = useCallback(() => {
    return isProUser() ? Infinity : 3; // Pro: tanpa batas, Free: maksimal 3
  }, [isProUser]);

  // Fungsi untuk mendapatkan jumlah dompet yang masih bisa ditambahkan
  const getRemainingWalletsCount = useCallback((currentWalletCount: number) => {
    if (isProUser()) return Infinity;
    return Math.max(0, 3 - currentWalletCount);
  }, [isProUser]);

  // Fungsi untuk mendapatkan jumlah tabungan yang masih bisa dibuat
  const getRemainingSavingsCount = useCallback((currentSavingsCount: number) => {
    // Pro user tidak terbatas
    if (isProUser()) return Infinity;
    // Free user tidak boleh membuat tabungan (0)
    return 0;
  }, [isProUser]);

  // Fungsi untuk memperbaharui data langganan
  const refreshSubscription = useCallback(async () => {
    await fetchUserProfile();
    loadUsageStats();
  }, [fetchUserProfile, loadUsageStats]);

  // Load data saat komponen dimuat
  useEffect(() => {
    loadUsageStats();
    fetchUserProfile();
  }, [fetchUserProfile, loadUsageStats, user]);

  // Nilai yang akan disediakan ke konsumen context
  const value: SubscriptionState = {
    isLoading,
    isProUser: isProUser(),
    userProfile,
    usageStats,
    canAccessAnalysis,
    canCreateWallet,
    canAccessBudget,
    canAccessSavings,
    canAccessLoans,
    recordAnalysisView,
    getActiveWalletsLimit,
    getRemainingWalletsCount,
    getRemainingSavingsCount,
    refreshSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Hook untuk menggunakan subscription context
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};

export default useSubscription; 