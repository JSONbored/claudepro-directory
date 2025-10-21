/**
 * useViewCounts Hook
 *
 * Client-side hook for fetching view/copy counts with aggressive caching.
 * CRITICAL: Multi-tier caching to stay under ~10k Redis commands/day budget (Upstash free tier ~16k/day).
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
 * - Estimated reduction: 95-99% fewer API calls (keeps us under Upstash free tier 16k/day)
 *
 * Usage:
 * ```tsx
 * const { viewCount, copyCount, loading } = useViewCounts('agents', 'code-reviewer');
 * ```
 */

'use client';

import { useEffect, useState } from 'react';
import type { StatsBatchRequestBody, StatsBatchResponse } from '@/src/lib/stats/types';

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

interface BatchResolver {
  resolve: (entry: CacheEntry) => void;
  reject: (error: unknown) => void;
}

const batchRequests = new Map<string, { category: string; slug: string }>();
const batchResolvers = new Map<string, BatchResolver[]>();
const BATCH_FLUSH_DELAY_MS = 25;
const MAX_BATCH_SIZE = 50;

export const STATS_BATCH_FLUSH_DELAY_MS = BATCH_FLUSH_DELAY_MS;
export const STATS_BATCH_MAX_SIZE = MAX_BATCH_SIZE;

let batchTimer: ReturnType<typeof setTimeout> | null = null;

function enqueueBatch(category: string, slug: string): Promise<CacheEntry> {
  const cacheKey = `${category}:${slug}`;

  return new Promise<CacheEntry>((resolve, reject) => {
    // Ensure we only store the last request for a given key
    batchRequests.set(cacheKey, { category, slug });
    const resolvers = batchResolvers.get(cacheKey) ?? [];
    resolvers.push({ resolve, reject });
    batchResolvers.set(cacheKey, resolvers);

    if (!batchTimer) {
      batchTimer = setTimeout(flushBatch, BATCH_FLUSH_DELAY_MS);
    }
  });
}

async function flushBatch() {
  const requests = Array.from(batchRequests.values());
  const resolversMap = new Map(batchResolvers);

  batchRequests.clear();
  batchResolvers.clear();

  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  if (requests.length === 0) {
    return;
  }

  const chunks: Array<Array<{ category: string; slug: string }>> = [];
  for (let i = 0; i < requests.length; i += MAX_BATCH_SIZE) {
    chunks.push(requests.slice(i, i + MAX_BATCH_SIZE));
  }

  for (const chunk of chunks) {
    // Create keys for this specific chunk
    const chunkKeys = chunk.map((item) => `${item.category}:${item.slug}`);

    const body: StatsBatchRequestBody = {
      items: chunk.map((item) => ({
        category: item.category,
        slug: item.slug,
        type: 'both' as const,
      })),
      mode: 'cached',
    };

    try {
      const response = await fetch('/api/stats/batch', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        next: { revalidate: 300 },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json: StatsBatchResponse = await response.json();

      if (!(json.success && json.data)) {
        throw new Error(json.error || 'Invalid response format');
      }

      for (const itemKey of chunkKeys) {
        const [category = '', slug = ''] = itemKey.split(':');
        const counts = json.data[itemKey] ?? {};
        const entry: CacheEntry = {
          viewCount: typeof counts.viewCount === 'number' ? counts.viewCount : 0,
          copyCount: typeof counts.copyCount === 'number' ? counts.copyCount : 0,
          timestamp: Date.now(),
        };

        memoryCache.set(itemKey, entry);
        ViewCountsCache.set(category, slug, entry.viewCount, entry.copyCount);

        const resolvers = resolversMap.get(itemKey);
        if (resolvers) {
          resolvers.forEach(({ resolve }) => resolve(entry));
          resolversMap.delete(itemKey);
        }
      }
    } catch (error) {
      for (const itemKey of chunkKeys) {
        const resolvers = resolversMap.get(itemKey);
        if (resolvers) {
          resolvers.forEach(({ reject }) => reject(error));
          resolversMap.delete(itemKey);
        }
      }
    }
  }

  if (resolversMap.size > 0) {
    const fallbackError = new Error('Stats batch request not fulfilled');
    resolversMap.forEach((resolvers) => {
      resolvers.forEach(({ reject }) => reject(fallbackError));
    });
  }
}

function requestCounts(category: string, slug: string): Promise<CacheEntry> {
  const cacheKey = `${category}:${slug}`;
  const pending = pendingFetches.get(cacheKey);
  if (pending) {
    return pending;
  }

  const promise = enqueueBatch(category, slug)
    .catch((error) => {
      throw error;
    })
    .finally(() => {
      pendingFetches.delete(cacheKey);
    });

  pendingFetches.set(cacheKey, promise);
  return promise;
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
      requestCounts(category, slug).then((fresh) => {
        setViewCount(fresh.viewCount);
        setCopyCount(fresh.copyCount);
      });
      return;
    }

    // 3. No cache - fetch from API
    setLoading(true);
    requestCounts(category, slug)
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

    Promise.all(
      itemsToFetch.map((item) =>
        requestCounts(item.category, item.slug)
          .then((entry) => {
            const key = `${item.category}:${item.slug}`;
            cachedCounts[key] = {
              viewCount: entry.viewCount,
              copyCount: entry.copyCount,
            };
          })
          .catch(() => {
            // Silent fail - leave cached value (defaults to 0)
          })
      )
    )
      .then(() => {
        setCounts({ ...cachedCounts });
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
