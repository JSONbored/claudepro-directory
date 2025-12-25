/**
 * Request Deduplication Middleware
 *
 * Prevents duplicate requests within a short time window by caching responses.
 * This reduces redundant database queries and API calls, improving performance
 * and reducing resource usage.
 *
 * Features:
 * - In-memory cache with TTL (default: 5 seconds)
 * - Automatic cache invalidation
 * - Configurable cache key generation
 * - Thread-safe (for Node.js) / Request-scoped (for Cloudflare Workers)
 */

/**
 * Cache entry with expiration
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Request deduplication cache
 * Uses Map for O(1) lookups
 */
class RequestDeduplicationCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtl: number;

  constructor(defaultTtl: number = 5000) {
    this.defaultTtl = defaultTtl;
  }

  /**
   * Get cached value if not expired
   *
   * @param key - Cache key
   * @returns Cached value or undefined if not found/expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * Set cache value with TTL
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds (optional, uses default if not provided)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.defaultTtl);
    this.cache.set(key, { data: value, expiresAt });
  }

  /**
   * Delete cache entry
   *
   * @param key - Cache key to delete
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all expired entries
   * Call this periodically to prevent memory leaks
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Global cache instance (request-scoped in Cloudflare Workers, shared in Node.js)
// In Cloudflare Workers, this is scoped per request execution context
// In Node.js, this is shared across requests (use with caution for multi-tenant)
const globalCache = new RequestDeduplicationCache(5000); // 5 second default TTL

/**
 * Generate cache key from request parameters
 *
 * @param toolName - MCP tool name
 * @param input - Tool input parameters
 * @returns Cache key string
 */
export function generateCacheKey(toolName: string, input: unknown): string {
  // Create deterministic key from tool name and input
  // Sort object keys to ensure consistent key generation
  const sortedInput = JSON.stringify(input, Object.keys(input as Record<string, unknown>).sort());
  return `${toolName}:${sortedInput}`;
}

/**
 * Request deduplication options
 */
export interface RequestDeduplicationOptions {
  /**
   * Cache TTL in milliseconds (default: 5000)
   */
  ttl?: number;

  /**
   * Whether to enable deduplication (default: true)
   */
  enabled?: boolean;

  /**
   * Custom cache key generator
   */
  keyGenerator?: (toolName: string, input: unknown) => string;
}

/**
 * Wrap a tool handler with request deduplication
 *
 * @param toolName - Name of the tool (for cache key)
 * @param handler - Tool handler function
 * @param options - Deduplication options
 * @returns Wrapped handler with deduplication
 */
export function withRequestDeduplication<TInput, TOutput, TContext = unknown>(
  toolName: string,
  handler: (input: TInput, context: TContext) => Promise<TOutput>,
  options: RequestDeduplicationOptions = {}
): (input: TInput, context: TContext) => Promise<TOutput> {
  const { ttl = 5000, enabled = true, keyGenerator = generateCacheKey } = options;

  return async (input: TInput, context: TContext): Promise<TOutput> => {
    // Skip deduplication if disabled
    if (!enabled) {
      return handler(input, context);
    }

    // Generate cache key
    const cacheKey = keyGenerator(toolName, input);

    // Check cache
    const cached = globalCache.get<TOutput>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Execute handler
    const result = await handler(input, context);

    // Cache result
    globalCache.set(cacheKey, result, ttl);

    return result;
  };
}

/**
 * Clear expired cache entries
 * Call this periodically (e.g., every 60 seconds) to prevent memory leaks
 */
export function clearExpiredCache(): void {
  globalCache.clearExpired();
}

/**
 * Clear all cache entries
 * Useful for testing or manual cache invalidation
 */
export function clearCache(): void {
  globalCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number } {
  return {
    size: globalCache.size(),
  };
}
