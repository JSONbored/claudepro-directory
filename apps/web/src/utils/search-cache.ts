/**
 * Client-side search result cache
 * 
 * Caches recent search results to provide instant feedback for repeated searches.
 * Cache is in-memory and cleared on page refresh.
 */

interface CacheEntry {
  results: unknown[];
  timestamp: number;
  query: string;
  filters: Record<string, unknown>;
}

const CACHE_TTL = 30_000; // 30 seconds
const MAX_CACHE_SIZE = 10;

class SearchCache {
  private cache = new Map<string, CacheEntry>();

  /**
   * Generate cache key from query and filters
   */
  private getKey(query: string, filters: Record<string, unknown>): string {
    const filterString = JSON.stringify(filters);
    return `${query}:${filterString}`;
  }

  /**
   * Get cached results for a query
   * Returns null if not found or expired
   */
  get(query: string, filters: Record<string, unknown>): unknown[] | null {
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
  set(query: string, filters: Record<string, unknown>, results: unknown[]): void {
    const key = this.getKey(query, filters);

    // Enforce max cache size (remove oldest entry)
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
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
   * Clear all cached results
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics (for debugging)
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      ttl: CACHE_TTL,
    };
  }
}

export const searchCache = new SearchCache();
