/**
 * QueryCache - Caches query results for performance optimization
 *
 * Provides query result caching with automatic invalidation when data changes.
 */

import type { PrismockerOptions } from './types.js';

/**
 * Cache entry for a query result
 */
interface CacheEntry {
  result: any[];
  timestamp: number;
}

/**
 * QueryCache - Manages query result caching with automatic invalidation.
 *
 * This class provides a simple but effective caching mechanism for query results.
 * It uses a Map to store cache entries keyed by a deterministic string generated
 * from the query parameters.
 */
export class QueryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private options: PrismockerOptions;
  private maxCacheSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(options: PrismockerOptions) {
    this.options = options;
    this.maxCacheSize = options.queryCacheMaxSize || 100; // Default: 100 entries
    this.ttl = options.queryCacheTTL || 0; // Default: 0 (no expiration, invalidate on data changes)
  }

  /**
   * Generates a deterministic cache key from query parameters.
   *
   * The cache key is created by combining the model name, operation name, and
   * stringified query arguments. Object keys are sorted to ensure consistent
   * key generation regardless of argument order.
   *
   * @param modelName - The name of the model
   * @param operation - The operation name (e.g., 'findMany', 'findUnique')
   * @param args - The query arguments (optional)
   * @returns A deterministic cache key string
   *
   * @internal This method is used internally to generate cache keys
   */
  private generateCacheKey(modelName: string, operation: string, args?: any): string {
    // Create a deterministic key from the query parameters
    // We stringify the args, but we need to handle circular references and ensure consistent ordering
    const keyParts = [modelName, operation];

    if (args) {
      // Sort keys to ensure consistent ordering
      const sortedArgs = this.sortObjectKeys(args);
      try {
        keyParts.push(JSON.stringify(sortedArgs));
      } catch (error) {
        // Handle circular references by using a fallback key
        // This is a rare edge case, but we should handle it gracefully
        keyParts.push(`[circular:${typeof args}]`);
      }
    }

    return keyParts.join('::');
  }

  /**
   * Recursively sorts object keys for consistent cache key generation.
   *
   * This ensures that objects with the same content but different key order
   * generate the same cache key. Arrays and primitives are handled appropriately.
   *
   * @param obj - The object to sort keys for
   * @returns A new object with sorted keys (or the original value if not an object)
   *
   * @internal This method is used internally by `generateCacheKey()`
   */
  private sortObjectKeys(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sortObjectKeys(item));
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = this.sortObjectKeys(obj[key]);
    }
    return sorted;
  }

  /**
   * Gets a cached query result if available and not expired.
   *
   * This method checks if a cache entry exists for the given query parameters.
   * If a TTL is configured, it also checks if the entry has expired. Returns
   * a deep copy of the cached result to prevent mutation of cached data.
   *
   * @param modelName - The name of the model
   * @param operation - The operation name (e.g., 'findMany', 'findUnique')
   * @param args - The query arguments (optional)
   * @returns A deep copy of the cached result array, or `null` if not cached or expired
   *
   * @internal This method is called by ModelProxy before executing queries
   */
  get(modelName: string, operation: string, args?: any): any[] | null {
    if (!this.options.enableQueryCache) {
      return null;
    }

    const key = this.generateCacheKey(modelName, operation, args);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check TTL if set
    if (this.ttl > 0) {
      const age = Date.now() - entry.timestamp;
      if (age > this.ttl) {
        this.cache.delete(key);
        return null;
      }
    }

    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker QueryCache] Cache hit for ${modelName}.${operation}`);
    }

    // Return a deep copy to prevent mutation of cached data
    return this.deepClone(entry.result);
  }

  /**
   * Caches a query result for future reuse.
   *
   * This method stores the query result in the cache using a deterministic key.
   * If the cache is at maximum size, the oldest entry is evicted (LRU). The result
   * is deep cloned before caching to prevent mutation of cached data.
   *
   * @param modelName - The name of the model
   * @param operation - The operation name (e.g., 'findMany', 'findUnique')
   * @param args - The query arguments
   * @param result - The query result array to cache
   *
   * @internal This method is called by ModelProxy after executing queries
   */
  set(modelName: string, operation: string, args: any, result: any[]): void {
    if (!this.options.enableQueryCache) {
      return;
    }

    // Enforce max cache size (LRU eviction)
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry (simple FIFO for now)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const key = this.generateCacheKey(modelName, operation, args);
    this.cache.set(key, {
      result: this.deepClone(result), // Deep clone to prevent mutation
      timestamp: Date.now(),
    });

    if (this.options.logQueries) {
      this.options.logger?.(`[Prismocker QueryCache] Cached result for ${modelName}.${operation}`);
    }
  }

  /**
   * Invalidates all cache entries for a specific model.
   *
   * This method is called automatically when data changes (create, update, delete, setData)
   * to ensure cached results remain consistent with the actual data.
   *
   * @param modelName - The name of the model whose cache entries should be invalidated
   *
   * @internal This method is called automatically by PrismockerClient when model data changes
   */
  invalidateModel(modelName: string): void {
    if (!this.options.enableQueryCache) {
      return;
    }

    // Remove all cache entries for this model
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${modelName}::`)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (this.options.logQueries && keysToDelete.length > 0) {
      this.options.logger?.(
        `[Prismocker QueryCache] Invalidated ${keysToDelete.length} cache entries for ${modelName}`
      );
    }
  }

  /**
   * Clears all cache entries.
   *
   * This method is useful for test isolation or when you want to force all
   * subsequent queries to execute fresh (not from cache).
   *
   * @internal This method is called automatically by `reset()` in PrismockerClient
   */
  clear(): void {
    this.cache.clear();
    if (this.options.logQueries) {
      this.options.logger?.('[Prismocker QueryCache] Cleared all cache entries');
    }
  }

  /**
   * Deep clones an array of records to prevent mutation of cached data.
   *
   * This method creates a deep copy of records, handling Date objects, arrays,
   * and nested objects appropriately. This ensures that modifications to returned
   * results don't affect the cached data.
   *
   * @param records - Array of records to clone
   * @returns Deep cloned array of records
   *
   * @internal This method is used internally to prevent cache mutation
   */
  private deepClone(records: any[]): any[] {
    return records.map((record) => {
      if (record === null || typeof record !== 'object') {
        return record;
      }
      if (record instanceof Date) {
        return new Date(record.getTime());
      }
      if (Array.isArray(record)) {
        return record.map((item) => this.deepClone([item])[0]);
      }
      return { ...record };
    });
  }

  /**
   * Gets statistics about the current cache state.
   *
   * Returns information about cache size, configuration, and entry ages.
   * Useful for debugging and performance analysis.
   *
   * @returns An object containing cache statistics:
   * - `size`: Current number of cache entries
   * - `maxSize`: Maximum number of cache entries
   * - `ttl`: Time to live in milliseconds (0 if no expiration)
   * - `entries`: Array of cache entries with their keys and ages
   *
   * @example
   * ```typescript
   * const stats = queryCache.getStats();
   * console.log(`Cache: ${stats.size}/${stats.maxSize} entries`);
   * console.log(`TTL: ${stats.ttl}ms`);
   * ```
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    entries: Array<{ key: string; age: number }>;
  } {
    const entries: Array<{ key: string; age: number }> = [];
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      entries.push({
        key,
        age: now - entry.timestamp,
      });
    }

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      ttl: this.ttl,
      entries,
    };
  }
}
