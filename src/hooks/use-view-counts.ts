/**
 * useViewCounts Hook
 *
 * Client-side hook for fetching view/copy counts with aggressive caching.
 * CRITICAL: Multi-tier caching to stay under 3-5k Redis commands/day budget.
 *
 * Caching Strategy:
 * 1. localStorage (24 hours) - eliminates API calls for repeat visitors
 * 2. In-memory cache (5 minutes) - eliminates API calls within session
 * 3. Stale-while-revalidate - shows stale data while refreshing
 * 4. Batch requests - fetches multiple items at once
 * 5. Debouncing - prevents duplicate requests
 *
 * Redis Impact:
 * - Without client cache: Every page view = 1 API call = potential Redis read
 * - With localStorage: Only 1 API call per 24 hours per user
 * - Estimated reduction: 95-99% fewer API calls
 *
 * Usage:
 * ```tsx
 * const { viewCount, copyCount, loading } = useViewCounts('agents', 'code-reviewer');
 * ```
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * Cache entry structure
 */
interface CacheEntry {
  viewCount: number;
  copyCount: number;
  timestamp: number;
}

/**
 * localStorage cache manager
 */
class ViewCountsCache {
  private static readonly CACHE_KEY_PREFIX = 'stats:';
  private static readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly STALE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (stale-while-revalidate)

  /**
   * Get cache key for item
   */
  private static getCacheKey(category: string, slug: string): string {
    return `${ViewCountsCache.CACHE_KEY_PREFIX}${category}:${slug}`;
  }

  /**
   * Get cached entry from localStorage
   */
  static get(category: string, slug: string): CacheEntry | null {
    if (typeof window === 'undefined') return null;

    try {
      const key = ViewCountsCache.getCacheKey(category, slug);
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const entry: CacheEntry = JSON.parse(cached);
      const age = Date.now() - entry.timestamp;

      // Return null if beyond stale threshold (7 days)
      if (age > ViewCountsCache.STALE_TTL_MS) {
        localStorage.removeItem(key);
        return null;
      }

      return entry;
    } catch {
      return null;
    }
  }

  /**
   * Check if cache entry is fresh
   */
  static isFresh(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < ViewCountsCache.CACHE_TTL_MS;
  }

  /**
   * Set cache entry in localStorage
   */
  static set(category: string, slug: string, viewCount: number, copyCount: number): void {
    if (typeof window === 'undefined') return;

    try {
      const key = ViewCountsCache.getCacheKey(category, slug);
      const entry: CacheEntry = {
        viewCount,
        copyCount,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // localStorage might be full or disabled - silently fail
    }
  }

  /**
   * Clean old cache entries (optional maintenance)
   */
  static clean(): void {
    if (typeof window === 'undefined') return;

    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(ViewCountsCache.CACHE_KEY_PREFIX)) continue;

        const cached = localStorage.getItem(key);
        if (!cached) continue;

        const entry: CacheEntry = JSON.parse(cached);
        if (now - entry.timestamp > ViewCountsCache.STALE_TTL_MS) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch {
      // Silent fail
    }
  }
}

/**
 * In-memory cache (within React session)
 * Faster than localStorage, prevents duplicate fetches
 */
const memoryCache = new Map<string, CacheEntry>();
const MEMORY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Pending fetch promises (deduplication)
 */
const pendingFetches = new Map<string, Promise<CacheEntry>>();

/**
 * Fetch counts from API
 */
async function fetchCounts(category: string, slug: string): Promise<CacheEntry> {
  const cacheKey = `${category}:${slug}`;

  // Check if fetch is already in progress (deduplication)
  const pending = pendingFetches.get(cacheKey);
  if (pending) {
    return pending;
  }

  // Create new fetch promise
  const fetchPromise = (async () => {
    try {
      const response = await fetch(`/api/stats/batch?items=${cacheKey}`, {
        // Use SWR cache strategy
        next: { revalidate: 300 }, // 5 minutes
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!(data.success && data.data && data.data[cacheKey])) {
        throw new Error('Invalid response format');
      }

      const counts = data.data[cacheKey];
      const entry: CacheEntry = {
        viewCount: counts.viewCount || 0,
        copyCount: counts.copyCount || 0,
        timestamp: Date.now(),
      };

      // Store in both caches
      memoryCache.set(cacheKey, entry);
      ViewCountsCache.set(category, slug, entry.viewCount, entry.copyCount);

      return entry;
    } finally {
      // Remove from pending fetches
      pendingFetches.delete(cacheKey);
    }
  })();

  pendingFetches.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Hook for fetching view/copy counts
 */
export function useViewCounts(category: string, slug: string) {
  const [viewCount, setViewCount] = useState<number>(0);
  const [copyCount, setCopyCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const cacheKey = `${category}:${slug}`;

    // 1. Check memory cache first
    const memoryCached = memoryCache.get(cacheKey);
    if (memoryCached && Date.now() - memoryCached.timestamp < MEMORY_CACHE_TTL_MS) {
      setViewCount(memoryCached.viewCount);
      setCopyCount(memoryCached.copyCount);
      setLoading(false);
      return;
    }

    // 2. Check localStorage cache
    const localCached = ViewCountsCache.get(category, slug);
    if (localCached) {
      // Show cached data immediately
      setViewCount(localCached.viewCount);
      setCopyCount(localCached.copyCount);
      setLoading(false);

      // If fresh, no need to fetch
      if (ViewCountsCache.isFresh(localCached)) {
        // Also store in memory cache
        memoryCache.set(cacheKey, localCached);
        return;
      }

      // If stale but within 7 days, show stale data and refresh in background
      fetchCounts(category, slug).then((fresh) => {
        setViewCount(fresh.viewCount);
        setCopyCount(fresh.copyCount);
      });
      return;
    }

    // 3. No cache - fetch from API
    setLoading(true);
    fetchCounts(category, slug)
      .then((fresh) => {
        setViewCount(fresh.viewCount);
        setCopyCount(fresh.copyCount);
      })
      .catch(() => {
        // Silent fail - show 0 counts
        setViewCount(0);
        setCopyCount(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [category, slug]);

  return { viewCount, copyCount, loading };
}

/**
 * Hook for batch fetching multiple items
 * More efficient when displaying lists
 */
export function useBatchViewCounts(items: Array<{ category: string; slug: string }>) {
  const [counts, setCounts] = useState<Record<string, { viewCount: number; copyCount: number }>>(
    {}
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!items.length) {
      setLoading(false);
      return;
    }

    // Check which items need fetching
    const itemsToFetch: typeof items = [];
    const cachedCounts: typeof counts = {};

    for (const item of items) {
      const cacheKey = `${item.category}:${item.slug}`;

      // Check memory cache
      const memoryCached = memoryCache.get(cacheKey);
      if (memoryCached && Date.now() - memoryCached.timestamp < MEMORY_CACHE_TTL_MS) {
        cachedCounts[cacheKey] = {
          viewCount: memoryCached.viewCount,
          copyCount: memoryCached.copyCount,
        };
        continue;
      }

      // Check localStorage
      const localCached = ViewCountsCache.get(item.category, item.slug);
      if (localCached && ViewCountsCache.isFresh(localCached)) {
        cachedCounts[cacheKey] = {
          viewCount: localCached.viewCount,
          copyCount: localCached.copyCount,
        };
        memoryCache.set(cacheKey, localCached);
        continue;
      }

      itemsToFetch.push(item);
    }

    // Set cached counts immediately
    setCounts(cachedCounts);

    // Fetch remaining items
    if (itemsToFetch.length === 0) {
      setLoading(false);
      return;
    }

    const itemsParam = itemsToFetch.map((item) => `${item.category}:${item.slug}`).join(',');

    fetch(`/api/stats/batch?items=${itemsParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (!(data.success && data.data)) return;

        const freshCounts = { ...cachedCounts };
        for (const [key, value] of Object.entries(data.data)) {
          const typedValue = value as { viewCount: number; copyCount: number };
          freshCounts[key] = {
            viewCount: typedValue.viewCount,
            copyCount: typedValue.copyCount,
          };

          // Cache in localStorage and memory
          const [category = '', slug = ''] = key.split(':');
          ViewCountsCache.set(category, slug, typedValue.viewCount, typedValue.copyCount);
          memoryCache.set(key, {
            viewCount: typedValue.viewCount,
            copyCount: typedValue.copyCount,
            timestamp: Date.now(),
          });
        }

        setCounts(freshCounts);
      })
      .catch(() => {
        // Silent fail
      })
      .finally(() => {
        setLoading(false);
      });
  }, [items]);

  return { counts, loading };
}

// Clean old cache entries on mount (once per session)
if (typeof window !== 'undefined') {
  setTimeout(() => ViewCountsCache.clean(), 5000);
}
