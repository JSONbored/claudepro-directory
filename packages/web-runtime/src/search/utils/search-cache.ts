/**
 * Enhanced Search Cache with Request Deduplication
 *
 * Caches recent search results and deduplicates concurrent requests
 * to prevent race conditions and reduce API calls.
 *
 * @module web-runtime/search/utils/search-cache
 */

import type { DisplayableContent } from '@heyclaude/web-runtime/types/component.types';
import type { FilterState } from '@heyclaude/web-runtime/types/component.types';

interface CacheEntry {
  results: DisplayableContent[];
  timestamp: number;
  query: string;
  filters: FilterState;
}

interface PendingRequest {
  promise: Promise<DisplayableContent[]>;
  timestamp: number;
}

const CACHE_TTL = 30_000; // 30 seconds
const MAX_CACHE_SIZE = 20; // Increased from 10 for better cache hit rate
const REQUEST_DEDUP_WINDOW = 1000; // 1 second window for request deduplication

class EnhancedSearchCache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, PendingRequest>();

  /**
   * Generate cache key from query and filters
   */
  private getKey(query: string, filters: FilterState): string {
    // Normalize filters for consistent cache keys
    const normalizedFilters: FilterState = {
      ...(filters.sort && { sort: filters.sort }),
      ...(filters.category && { category: filters.category }),
      ...(filters.author && { author: filters.author }),
      ...(filters.tags && filters.tags.length > 0 && { tags: [...filters.tags].sort() }),
      ...(filters.dateRange && { dateRange: filters.dateRange }),
      ...(filters.popularity && { popularity: filters.popularity }),
    };

    const filterString = JSON.stringify(normalizedFilters);
    return `${query.trim().toLowerCase()}:${filterString}`;
  }

  /**
   * Get cached results for a query
   * Returns null if not found or expired
   */
  get(query: string, filters: FilterState): DisplayableContent[] | null {
    const key = this.getKey(query, filters);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.results;
  }

  /**
   * Store results in cache
   */
  set(
    query: string,
    filters: FilterState,
    results: DisplayableContent[]
  ): void {
    const key = this.getKey(query, filters);

    // Enforce max cache size (remove oldest entry)
    if (this.cache.size >= MAX_CACHE_SIZE) {
      // Find oldest entry
      let oldestKey: string | null = null;
      let oldestTimestamp = Date.now();

      for (const [cacheKey, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
          oldestKey = cacheKey;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      results,
      timestamp: Date.now(),
      query,
      filters,
    });
  }

  /**
   * Deduplicate concurrent requests
   * Returns existing promise if request is pending, otherwise creates new one
   */
  deduplicateRequest(
    query: string,
    filters: FilterState,
    requestFn: () => Promise<DisplayableContent[]>
  ): Promise<DisplayableContent[]> {
    const key = this.getKey(query, filters);
    const pending = this.pendingRequests.get(key);

    // Check if request is still within deduplication window
    if (pending && Date.now() - pending.timestamp < REQUEST_DEDUP_WINDOW) {
      return pending.promise;
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Clear all cached results
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics (for debugging)
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      ttl: CACHE_TTL,
      pendingRequests: this.pendingRequests.size,
    };
  }
}

export const enhancedSearchCache = new EnhancedSearchCache();

// Clean up expired entries periodically (every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    enhancedSearchCache.clearExpired();
  }, 5 * 60 * 1000);
}
