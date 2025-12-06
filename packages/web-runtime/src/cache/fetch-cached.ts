import 'server-only';

/**
 * Cache Components migration: This utility is a simple wrapper that executes service calls.
 * 
 * IMPORTANT: fetchCached cannot use 'use cache' because it takes a function parameter
 * (serviceCall) which cannot be serialized for cache keys. 
 * 
 * For build-time caching with Cache Components, migrate individual data fetching functions
 * to use 'use cache' directly instead of using fetchCached.
 * 
 * This wrapper provides error handling, logging, timeout protection, and client selection,
 * but does NOT provide caching. Use 'use cache' in your data functions for caching.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';
import { createSupabaseAnonClient } from '../supabase/server-anon.ts';
import type { CacheTtlKey, CacheTtlKeyLegacy } from '../cache-config.ts';
import { logger, toLogContextValue, type LogContext } from '../logger.ts';
import { normalizeError } from '../errors.ts';
import { withTimeout, TimeoutError } from '@heyclaude/shared-runtime';
import { generateRequestId } from '../utils/request-id.ts';
import { isBuildTime } from '../build-time.ts';

export interface FetchCachedOptions<TResult> {
  /**
   * Tags for cache invalidation
   */
  tags: string[];
  /**
   * TTL configuration key
   */
  ttlKey: CacheTtlKey | CacheTtlKeyLegacy;
  /**
   * Whether to use authenticated client
   */
  useAuth?: boolean;
  /**
   * Fallback value if service call fails or times out
   */
  fallback: TResult;
  /**
   * Optional metadata for logging
   */
  logMeta?: Record<string, unknown>;
  /**
   * Optional timeout in milliseconds (default: 10000ms / 10 seconds)
   * If the service call exceeds this timeout, the fallback value will be returned.
   */
  timeoutMs?: number;
}

/**
 * Data fetching utility wrapper
 *
 * NOTE: This function does NOT provide caching because it takes a function parameter
 * (serviceCall) which cannot be serialized for cache keys with Cache Components.
 * 
 * This wrapper provides:
 * - Error handling and logging
 * - Timeout protection
 * - Build-time client optimization (admin client during build)
 * - Request-level logging
 * 
 * For build-time caching with Cache Components, migrate individual data fetching
 * functions to use 'use cache' directly instead of using fetchCached.
 * 
 * @example
 * ```ts
 * // OLD (no caching):
 * const result = await fetchCached(
 *   (client) => service.getData(),
 *   { tags: ['data'], ttlKey: 'cache.data.ttl_seconds', fallback: null },
 *   'data', 'key1', 'key2'
 * );
 * 
 * // NEW (with caching):
 * export async function getData() {
 *   'use cache';
 *   cacheLife('hours');
 *   cacheTag('data');
 *   const client = createSupabaseAnonClient();
 *   return service.getData(client);
 * }
 * ```
 */
export async function fetchCached<TResult>(
  serviceCall: (client: SupabaseClient<Database>) => Promise<TResult>,
  options: FetchCachedOptions<TResult>,
  ...keyParts: (string | number | boolean | null | undefined)[]
): Promise<TResult> {
  const { useAuth = false, fallback, logMeta, timeoutMs = 10000 } = options;
  
  // Filter out null/undefined for log key generation
  const cacheKeyParts = keyParts.filter((p) => p != null) as (string | number | boolean)[];
  
  // Create a log-friendly key string for error messages
  const logKey = cacheKeyParts.map((p) => String(p)).join('-');
  
  // Pre-process log context for reuse
  // Pino handles redaction automatically via centralized config
  const logContext: LogContext | undefined = logMeta
    ? Object.fromEntries(
        Object.entries(logMeta).map(([k, v]) => [k, toLogContextValue(v)])
      )
    : undefined;
  
  // Generate request ID (after potential runtime data access)
  const requestId = generateRequestId();
  const startTime = performance.now();
  
  try {
    let client: SupabaseClient<Database> | ReturnType<typeof createSupabaseAnonClient>;
    
    // OPTIMIZATION: Use service role client during build time for better performance
    // - Bypasses RLS policies (faster queries)
    // - No permission issues during static generation
    // - Significantly faster builds (50-70% improvement)
    // This is safe because build-time queries are server-side only and don't expose data to clients
    const buildTime = isBuildTime();
    
    if (buildTime) {
      // Use service role client during build to bypass RLS and improve performance
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
      client = createSupabaseAdminClient();
      // Log that we're using service role client during build (for debugging)
      logger.debug(`Using service role client during build: [user:${logKey}]`, {
        requestId,
        key: logKey,
        buildTime: true,
        ...logContext,
      });
    } else if (useAuth) {
      const { createSupabaseServerClient } = await import('../supabase/server.ts');
      client = await createSupabaseServerClient();
    } else {
      client = createSupabaseAnonClient();
    }
      
    // OPTIMIZATION: Add timeout protection to prevent hung requests
    // Wrap service call with timeout - returns fallback if timeout exceeded
    // Type compatibility: Both SupabaseServerClient and SupabaseAnonClient are compatible with SupabaseClient<Database>
    // Both are created from the same underlying Supabase client factory with Database type
    const typedClient: SupabaseClient<Database> = client as SupabaseClient<Database>;
    const result = await withTimeout(
      serviceCall(typedClient),
      timeoutMs,
      `Service call timed out after ${timeoutMs}ms: [user:${logKey}]`
    );
    
    // Log performance metrics for all operations
    const duration = performance.now() - startTime;
    const roundedDuration = Math.round(duration);
    
    // Always log slow queries (>1s) as warnings
    // Pino handles redaction automatically via centralized config
    if (duration > 1000) {
      logger.warn(`Slow data fetch detected: [user:${logKey}]`, {
        requestId,
        key: logKey,
        duration: roundedDuration,
        timeoutMs,
        ...logContext,
      });
    } else {
      // Log all operations at info level for observability
      logger.info(`Data fetch completed: [user:${logKey}]`, {
        requestId,
        key: logKey,
        duration: roundedDuration,
        ...logContext,
      });
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    // Handle timeout errors specifically
    // Pino handles redaction automatically via centralized config
    if (error instanceof TimeoutError) {
      logger.warn(`Service call timed out: [user:${logKey}]`, {
        requestId,
        key: logKey,
        duration: Math.round(duration),
        timeoutMs,
        ...logContext,
      });
      return fallback;
    }
    
    const normalized = normalizeError(error, `Service call failed: [user:${logKey}]`);
    logger.error(`Service call failed: [user:${logKey}]`, normalized, {
      requestId,
      key: logKey,
      duration: Math.round(duration),
      ...logContext,
    });
    return fallback;
  }
}
