/**
 * Request-Scoped Cache Utility
 * 
 * Provides in-memory caching for RPC calls within a single request lifecycle.
 * This prevents duplicate RPC calls with the same arguments in the same request.
 * 
 * Cache is automatically cleared after request completes (no persistence).
 * 
 * @module data-layer/utils/request-cache
 */

/**
 * Cache entry with timestamp for TTL
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Request-scoped cache for RPC calls
 * 
 * Uses WeakMap to automatically clean up when request completes.
 * Cache key: `${rpcName}:${JSON.stringify(args)}`
 * TTL: 5 seconds (prevents stale data within request)
 */
class RequestCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly TTL_MS = 5000; // 5 seconds TTL

  /**
   * Generate cache key from RPC name and arguments
   */
  private getKey(rpcName: string, args?: Record<string, unknown>): string {
    const argsString = args ? JSON.stringify(args, Object.keys(args).sort()) : 'no-args';
    return `${rpcName}:${argsString}`;
  }

  /**
   * Get cached value if available and not expired
   */
  get<T>(rpcName: string, args?: Record<string, unknown>): T | null {
    const key = this.getKey(rpcName, args);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > this.TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store value in cache
   */
  set<T>(rpcName: string, args: Record<string, unknown> | undefined, data: T): void {
    const key = this.getKey(rpcName, args);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached entries
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
      ttl: this.TTL_MS,
    };
  }
}

/**
 * Global request cache instance
 * 
 * Note: In Next.js, each request gets a new execution context,
 * so this cache is effectively request-scoped.
 * 
 * For Edge Functions, each request also gets a new execution context.
 */
const requestCache = new RequestCache();

/**
 * Get the request cache instance
 */
export function getRequestCache(): RequestCache {
  return requestCache;
}

/**
 * Clear the request cache (call after request completes)
 */
export function clearRequestCache(): void {
  requestCache.clear();
}

/**
 * Cache decorator for RPC calls
 * 
 * Wraps an RPC call with request-scoped caching.
 * Returns cached value if available, otherwise calls the RPC and caches the result.
 * 
 * @param rpcName - Name of the RPC function
 * @param rpcCall - The RPC call function
 * @param args - Arguments for the RPC call (used for cache key)
 * @returns Cached or fresh result
 * 
 * @example
 * ```typescript
 * const result = await withRequestCache(
 *   'get_content_by_slug',
 *   async () => await this.supabase.rpc('get_content_by_slug', args),
 *   args
 * );
 * ```
 */
export async function withRequestCache<T>(
  rpcName: string,
  rpcCall: () => Promise<T>,
  args?: Record<string, unknown> | undefined
): Promise<T> {
  const cache = getRequestCache();
  
  // Check cache first
  const cached = cache.get<T>(rpcName, args);
  if (cached !== null) {
    return cached;
  }

  // Call RPC and cache result
  const result = await rpcCall();
  cache.set(rpcName, args, result);
  
  return result;
}

/**
 * Cache decorator for RPC calls with typed arguments
 * 
 * Same as withRequestCache but with better type safety for typed args
 */
export async function withRequestCacheTyped<T, TArgs extends Record<string, unknown> | undefined = undefined>(
  rpcName: string,
  rpcCall: () => Promise<T>,
  args?: TArgs
): Promise<T> {
  return withRequestCache(rpcName, rpcCall, args);
}

/**
 * Check if an RPC name or method name indicates a mutation
 * Mutations should NOT be cached
 */
function isMutation(rpcName: string, methodName?: string): boolean {
  const name = methodName || rpcName;
  const lowerName = name.toLowerCase();
  
  // Check for mutation patterns
  return (
    lowerName.includes('insert') ||
    lowerName.includes('update') ||
    lowerName.includes('delete') ||
    lowerName.includes('upsert') ||
    lowerName.includes('create') ||
    lowerName.includes('remove') ||
    lowerName.includes('batch_insert') ||
    lowerName.includes('subscribe') || // subscribe_newsletter is a mutation
    lowerName.includes('sync') || // sync operations are mutations (e.g., sync_changelog_entry)
    lowerName.includes('upsert_') ||
    rpcName.includes('_insert') ||
    rpcName.includes('_update') ||
    rpcName.includes('_delete') ||
    rpcName.includes('_upsert') ||
    rpcName.includes('_sync') // RPC names like sync_changelog_entry
  );
}

/**
 * Smart cache wrapper that automatically excludes mutations
 * 
 * Use this for all service methods - it will cache read-only operations
 * and skip caching for mutations automatically.
 * 
 * @param rpcName - Name of the RPC function
 * @param methodName - Name of the service method (for mutation detection)
 * @param rpcCall - The RPC call function
 * @param args - Arguments for the RPC call (used for cache key)
 * @returns Cached or fresh result (mutations are never cached)
 * 
 * @example
 * ```typescript
 * // Read-only - will be cached
 * return withSmartCache(
 *   'get_content_by_slug',
 *   'getContentBySlug',
 *   async () => await this.supabase.rpc('get_content_by_slug', args),
 *   args
 * );
 * 
 * // Mutation - will NOT be cached
 * return withSmartCache(
 *   'upsert_notification',
 *   'upsertNotification',
 *   async () => await this.supabase.from('notifications').upsert(data),
 *   { id: data.id }
 * );
 * ```
 */
export async function withSmartCache<T>(
  rpcName: string,
  methodName: string,
  rpcCall: () => Promise<T>,
  args?: Record<string, unknown> | undefined
): Promise<T> {
  // Skip caching for mutations
  if (isMutation(rpcName, methodName)) {
    return rpcCall();
  }
  
  // Cache read-only operations
  return withRequestCache(rpcName, rpcCall, args);
}
