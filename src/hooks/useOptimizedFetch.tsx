import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { setCache, getCache, throttle } from '@/lib/utils';

interface FetchOptions {
  table: string;
  columns?: string;
  filter?: Record<string, any>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  cacheKey?: string;
  cacheDuration?: number; // dalam menit
  skipCache?: boolean;
}

/**
 * Custom hook untuk mengoptimalkan fetching data dari Supabase
 * dengan caching dan throttling untuk performa lebih baik di mobile
 */
export function useOptimizedFetch<T>(options: FetchOptions) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Membuat cache key dari options
  const getCacheKeyFromOptions = useCallback((opts: FetchOptions): string => {
    if (opts.cacheKey) return opts.cacheKey;
    
    const { table, columns, filter, order, limit } = opts;
    const key = `fetch_${table}_${columns || '*'}_${JSON.stringify(filter || {})}_${JSON.stringify(order || {})}_${limit || 'all'}`;
    return key;
  }, []);

  // Fungsi throttled untuk mencegah terlalu banyak request simultan
  const throttledFetchFromDB = useCallback(
    throttle(async (client: SupabaseClient, opts: FetchOptions, cacheKey: string) => {
      try {
        let query = client.from(opts.table).select(opts.columns || '*');
        
        if (opts.filter) {
          Object.entries(opts.filter).forEach(([key, value]) => {
            if (value !== undefined) {
              if (Array.isArray(value)) {
                query = query.in(key, value);
              } else {
                query = query.eq(key, value);
              }
            }
          });
        }
        
        if (opts.order) {
          query = query.order(opts.order.column, { ascending: opts.order.ascending ?? false });
        }
        
        if (opts.limit) {
          query = query.limit(opts.limit);
        }
        
        const { data: dbData, error: dbError } = await query;
        
        if (dbError) throw dbError;
        
        // Cache data untuk penggunaan berikutnya
        if (!opts.skipCache) {
          setCache({
            key: cacheKey,
            data: dbData,
            expiresInMinutes: opts.cacheDuration || 30
          });
        }
        
        setData(dbData as T[]);
        setError(null);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }, 300), // Throttle selama 300ms untuk mencegah terlalu banyak request
    []
  );
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    
    const cacheKey = getCacheKeyFromOptions(options);
    
    // Cek apakah data tersedia di cache
    if (!options.skipCache) {
      const cachedData = getCache<T[]>(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        setError(null);
        // Simpan timestamp akses untuk pemeliharaan cache
        localStorage.setItem(`lastAccess_${cacheKey}`, Date.now().toString());
        return;
      }
    }
    
    // Jika tidak ada di cache, ambil dari database
    throttledFetchFromDB(supabase, options, cacheKey);
    
  }, [options, getCacheKeyFromOptions, throttledFetchFromDB]);
  
  // Refresh data ketika options berubah atau refresh dipicu
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);
  
  // Fungsi untuk memaksa refresh data
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  return { data, loading, error, refresh };
}

export default useOptimizedFetch; 