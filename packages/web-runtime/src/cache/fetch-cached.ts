import 'server-only';

import { unstable_cache } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';
import { createSupabaseAnonClient } from '../supabase/server-anon.ts';
import { getCacheTtl, type CacheTtlKey, type CacheTtlKeyLegacy } from '../cache-config.ts';
import { logger, toLogContextValue, type LogContext } from '../logger.ts';
import { normalizeError } from '../errors.ts';
import { withTimeout, TimeoutError } from '@heyclaude/shared-runtime';
import { generateRequestId } from '../utils/request-id.ts';

export interface FetchCachedOptions<TResult> {
  /**
   * Cache key parts array - Next.js will automatically serialize this deterministically
   * Use an array of strings/numbers/booleans instead of a single string key
   */
  keyParts: (string | number | boolean | null | undefined)[];
  tags: string[];
  ttlKey: CacheTtlKey | CacheTtlKeyLegacy;
  useAuth?: boolean;
  fallback: TResult;
  logMeta?: Record<string, unknown>;
  /**
   * Optional timeout in milliseconds (default: 10000ms / 10 seconds)
   * If the service call exceeds this timeout, the fallback value will be returned.
   */
  timeoutMs?: number;
}

/**
 * Custom error class to signal that a cache error occurred
 * This is used internally to prevent caching of error responses
 */
class CacheableError extends Error {
  constructor(
    message: string,
    public readonly originalError: unknown,
    public readonly isTimeout: boolean = false
  ) {
    super(message);
    this.name = 'CacheableError';
  }
}

export async function fetchCached<TResult>(
  serviceCall: (client: SupabaseClient<Database>) => Promise<TResult>,
  options: FetchCachedOptions<TResult>
): Promise<TResult> {
  const { keyParts, tags, ttlKey, useAuth = false, fallback, logMeta, timeoutMs = 10000 } = options;
  
  const ttl = getCacheTtl(ttlKey);
  
  // Filter out null/undefined and convert to strings for Next.js unstable_cache
  // Next.js expects keyParts to be string[]
  const cacheKeyParts = keyParts
    .filter((p) => p != null)
    .map((p) => String(p));
  
  // Create a log-friendly key string for error messages
  const logKey = cacheKeyParts.join('-');
  
  // Generate request ID for tracing
  const requestId = generateRequestId();
  
  // Pre-process log context for reuse
  // Pino handles redaction automatically via centralized config
  const logContext: LogContext | undefined = logMeta
    ? Object.fromEntries(
        Object.entries(logMeta).map(([k, v]) => [k, toLogContextValue(v)])
      )
    : undefined;
  
  // CRITICAL FIX: Errors thrown inside unstable_cache are NOT cached
  // We must throw errors (not return fallback) inside the cache callback
  // to prevent caching of error/failure states
  try {
    return await unstable_cache(
      async () => {
        const startTime = performance.now();
        try {
          let client: SupabaseClient<Database> | ReturnType<typeof createSupabaseAnonClient>;
          
          if (useAuth) {
            const { createSupabaseServerClient } = await import('../supabase/server.ts');
            client = await createSupabaseServerClient();
          } else {
            client = createSupabaseAnonClient();
          }
            
          // OPTIMIZATION: Add timeout protection to prevent hung requests
          // Wrap service call with timeout
          // Type compatibility: Both SupabaseServerClient and SupabaseAnonClient are compatible with SupabaseClient<Database>
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
          if (duration > 1000) {
            logger.warn(`Slow data fetch detected: [user:${logKey}]`, {
              requestId,
              key: logKey,
              duration: roundedDuration,
              timeoutMs,
              cacheHit: false,
              ...logContext,
            });
          } else {
            logger.info(`Data fetch completed: [user:${logKey}]`, {
              requestId,
              key: logKey,
              duration: roundedDuration,
              cacheHit: false,
              ...logContext,
            });
          }
          
          return result;
        } catch (error) {
          const duration = performance.now() - startTime;
          
          // CRITICAL: Throw error instead of returning fallback
          // This prevents Next.js from caching the error state
          if (error instanceof TimeoutError) {
            logger.warn(`Service call timed out: [user:${logKey}]`, {
              requestId,
              key: logKey,
              duration: Math.round(duration),
              timeoutMs,
              ...logContext,
            });
            // Throw to prevent caching - will be caught outside unstable_cache
            throw new CacheableError('Timeout', error, true);
          }
          
          const normalized = normalizeError(error, `Service call failed: [user:${logKey}]`);
          logger.error(`Service call failed: [user:${logKey}]`, normalized, {
            requestId,
            key: logKey,
            duration: Math.round(duration),
            ...logContext,
          });
          // Throw to prevent caching - will be caught outside unstable_cache
          throw new CacheableError('Service call failed', error, false);
        }
      },
      cacheKeyParts,
      { revalidate: ttl, tags }
    )();
  } catch (error) {
    // Handle errors OUTSIDE the cache - return fallback without caching it
    if (error instanceof CacheableError) {
      // Already logged inside, just return fallback
      return fallback;
    }
    // Unexpected error - log and return fallback
    const normalized = normalizeError(error, `Unexpected cache error: [user:${logKey}]`);
    logger.error(`Unexpected cache error: [user:${logKey}]`, normalized, {
      requestId,
      key: logKey,
      ...logContext,
    });
    return fallback;
  }
}
