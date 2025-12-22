/**
 * Cloudflare KV Cache Utility for MCP Resources
 *
 * Provides persistent caching for MCP resource content using Cloudflare KV.
 * Cache keys are URI-based, and cache entries include content, MIME type, and metadata.
 *
 * Features:
 * - URI-based cache keys
 * - TTL configuration (environment-specific)
 * - Cache versioning for schema changes
 * - ETag generation for conditional requests
 * - Automatic cache invalidation support
 */

/**
 * Cache entry structure stored in KV
 */
interface CacheEntry {
  /** Resource content (text) */
  text: string;
  /** MIME type of the content */
  mimeType: string;
  /** ETag for conditional requests */
  etag: string;
  /** Cache timestamp (ISO string) */
  cachedAt: string;
  /** Cache version (for schema changes) */
  cacheVersion: number;
}


/**
 * Current cache version (increment when schema changes)
 */
const CACHE_VERSION = 1;

/**
 * Default TTL in seconds (1 hour)
 */
const DEFAULT_TTL_SECONDS = 3600;

/**
 * Generate cache key from resource URI
 *
 * @param uri - Resource URI
 * @returns Cache key string
 */
export function generateCacheKey(uri: string): string {
  // Sanitize URI for cache key (remove special chars, normalize)
  const sanitized = uri
    .toLowerCase()
    .replace(/[^a-z0-9:\/]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `mcp:resource:${sanitized}`;
}

/**
 * Generate ETag from content
 *
 * @param content - Content string
 * @returns ETag string
 */
function generateETag(content: string): string {
  // Simple hash-based ETag (for production, consider crypto.subtle)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

/**
 * Cloudflare KV namespace interface (runtime-agnostic)
 * Re-exported from types/runtime.ts for convenience
 */
import type { KvNamespace } from '../types/runtime.js';

export type { KvNamespace };

import type { RuntimeLogger } from '../types/runtime.js';

/**
 * KV Cache options
 */
export interface KvCacheOptions {
  /** KV namespace binding */
  kv: KvNamespace | null;
  /** Cache TTL in seconds (default: 3600) */
  ttl?: number;
  /** Cache version (default: 1) */
  cacheVersion?: number;
  /** Enable caching (default: true) */
  enabled?: boolean;
  /** Optional logger for error logging */
  logger?: RuntimeLogger;
}

/**
 * KV Cache implementation
 */
export class KvResourceCache {
  private kv: KvNamespace | null;
  private ttl: number;
  private cacheVersion: number;
  private enabled: boolean;
  private logger: RuntimeLogger | undefined;

  constructor(options: KvCacheOptions) {
    this.kv = options.kv;
    this.ttl = options.ttl ?? DEFAULT_TTL_SECONDS;
    this.cacheVersion = options.cacheVersion ?? CACHE_VERSION;
    this.enabled = options.enabled ?? true;
    this.logger = options.logger;
  }

  /**
   * Get cached resource if available and not expired
   *
   * @param uri - Resource URI
   * @returns Cached entry or null if not found/expired
   */
  async get(uri: string): Promise<{ text: string; mimeType: string; etag: string; cachedAt: string } | null> {
    if (!this.enabled || !this.kv) {
      return null;
    }

    try {
      const cacheKey = generateCacheKey(uri);
      const cached = await this.kv.get(cacheKey, { type: 'json' });

      if (!cached) {
        return null;
      }

      // KV.get with type: 'json' returns parsed JSON or string - handle both cases
      const entry = (typeof cached === 'string' ? JSON.parse(cached) : cached) as unknown as CacheEntry;

      // Check cache version
      if (entry.cacheVersion !== this.cacheVersion) {
        // Version mismatch - invalidate cache
        await this.delete(uri);
        return null;
      }

      // Check expiration (TTL-based)
      const cachedAt = new Date(entry.cachedAt).getTime();
      const now = Date.now();
      const age = (now - cachedAt) / 1000; // Age in seconds

      if (age > this.ttl) {
        // Expired - delete and return null
        await this.delete(uri);
        return null;
      }

      return {
        text: entry.text,
        mimeType: entry.mimeType,
        etag: entry.etag,
        cachedAt: entry.cachedAt,
      };
    } catch (error) {
      // Cache read error - return null (graceful degradation)
      if (this.logger) {
        this.logger.error('KV cache read error', error instanceof Error ? error : new Error(String(error)), { uri });
      }
      return null;
    }
  }

  /**
   * Store resource in cache
   *
   * @param uri - Resource URI
   * @param text - Resource content
   * @param mimeType - MIME type
   * @param ttl - Optional TTL override (in seconds)
   */
  async set(uri: string, text: string, mimeType: string, ttl?: number): Promise<void> {
    if (!this.enabled || !this.kv) {
      return;
    }

    try {
      const cacheKey = generateCacheKey(uri);
      const etag = generateETag(text);
      const cachedAt = new Date().toISOString();

      const entry: CacheEntry = {
        text,
        mimeType,
        etag,
        cachedAt,
        cacheVersion: this.cacheVersion,
      };

      // Store with TTL (Cloudflare KV expiration)
      const expirationTtl = ttl ?? this.ttl;
      await this.kv.put(cacheKey, JSON.stringify(entry), {
        expirationTtl,
      });
    } catch (error) {
      // Cache write error - log but don't throw (graceful degradation)
      if (this.logger) {
        this.logger.error('KV cache write error', error instanceof Error ? error : new Error(String(error)), { uri });
      }
    }
  }

  /**
   * Delete cached resource
   *
   * @param uri - Resource URI
   */
  async delete(uri: string): Promise<void> {
    if (!this.enabled || !this.kv) {
      return;
    }

    try {
      const cacheKey = generateCacheKey(uri);
      await this.kv.delete(cacheKey);
    } catch (error) {
      // Cache delete error - log but don't throw
      if (this.logger) {
        this.logger.error('KV cache delete error', error instanceof Error ? error : new Error(String(error)), { uri });
      }
    }
  }

  /**
   * Get cache metadata (ETag, cachedAt) without full content
   * Useful for conditional requests (If-None-Match)
   *
   * @param uri - Resource URI
   * @returns Cache metadata or null
   */
  async getMetadata(uri: string): Promise<{ etag: string; cachedAt: string } | null> {
    if (!this.enabled || !this.kv) {
      return null;
    }

    try {
      const cacheKey = generateCacheKey(uri);
      const cached = await this.kv.get(cacheKey, { type: 'json' });

      if (!cached) {
        return null;
      }

      // KV.get with type: 'json' returns parsed JSON or string - handle both cases
      const entry = (typeof cached === 'string' ? JSON.parse(cached) : cached) as unknown as CacheEntry;

      // Check cache version
      if (entry.cacheVersion !== this.cacheVersion) {
        return null;
      }

      // Check expiration
      const cachedAt = new Date(entry.cachedAt).getTime();
      const now = Date.now();
      const age = (now - cachedAt) / 1000;

      if (age > this.ttl) {
        return null;
      }

      return {
        etag: entry.etag,
        cachedAt: entry.cachedAt,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear all cached resources (use with caution)
   * Note: This requires listing all keys, which KV doesn't support directly
   * For production, use cache versioning or manual invalidation per URI
   */
  async clearAll(): Promise<void> {
    // KV doesn't support listing all keys
    // This would require maintaining a key index, which is complex
    // Instead, increment cacheVersion to invalidate all entries
    throw new Error('clearAll() not supported - use cache versioning instead');
  }

  /**
   * Check if cache is available and enabled
   */
  isAvailable(): boolean {
    return this.enabled && this.kv !== null;
  }
}

/**
 * Create KV cache instance from Cloudflare Workers env
 *
 * @param kvBinding - KV namespace binding from env (or null)
 * @param options - Cache options
 * @returns KV cache instance
 */
export function createKvCache(
  kvBinding: KvNamespace | null,
  options: Omit<KvCacheOptions, 'kv'> = {}
): KvResourceCache {
  return new KvResourceCache({
    kv: kvBinding,
    ...options,
  });
}

