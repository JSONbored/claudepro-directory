import 'server-only';

import { unstable_cache } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';
import { createSupabaseAnonClient } from '../supabase/server-anon.ts';
import { getCacheTtl, type CacheTtlKey } from '../cache-config.ts';
import { logger, sanitizeLogMessage, sanitizeLogContext, toLogContextValue, type LogContext } from '../logger.ts';
import { normalizeError } from '../errors.ts';
import { withTimeout, TimeoutError } from '@heyclaude/shared-runtime';
import { generateRequestId } from '../utils/request-context.ts';

export interface FetchCachedOptions<TResult> {
  /**
   * Cache key parts array - Next.js will automatically serialize this deterministically
   * Use an array of strings/numbers/booleans instead of a single string key
   */
  keyParts: (string | number | boolean | null | undefined)[];
  tags: string[];
  ttlKey: CacheTtlKey;
  useAuth?: boolean;
  fallback: TResult;
  logMeta?: Record<string, unknown>;
  /**
   * Optional timeout in milliseconds (default: 10000ms / 10 seconds)
   * If the service call exceeds this timeout, the fallback value will be returned.
   */
  timeoutMs?: number;
}

export async function fetchCached<TResult>(
  serviceCall: (client: SupabaseClient<Database>) => Promise<TResult>,
  options: FetchCachedOptions<TResult>
): Promise<TResult> {
  const { keyParts, tags, ttlKey, useAuth = false, fallback, logMeta, timeoutMs = 10000 } = options;
  
  const ttl = await getCacheTtl(ttlKey);
  
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
  const logContext: LogContext | undefined = logMeta
    ? Object.fromEntries(
        Object.entries(logMeta).map(([k, v]) => [k, toLogContextValue(v)])
      )
    : undefined;
  const sanitizedLogMeta = sanitizeLogContext(logContext);
  const sanitizedKey = sanitizeLogMessage(logKey);
  
  return unstable_cache(
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
        // Wrap service call with timeout - returns fallback if timeout exceeded
        const typedClient = client as unknown as SupabaseClient<Database>;
        const result = await withTimeout(
          serviceCall(typedClient),
          timeoutMs,
          `Service call timed out after ${timeoutMs}ms: ${sanitizedKey}`
        );
        
        // Log performance metrics for slow queries (>1s)
        const duration = performance.now() - startTime;
        if (duration > 1000) {
          logger.warn(`Slow data fetch detected: ${sanitizedKey}`, {
            requestId,
            key: sanitizedKey,
            duration: Math.round(duration),
            timeoutMs,
            ...sanitizedLogMeta,
          });
        }
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        // Handle timeout errors specifically
        if (error instanceof TimeoutError) {
          logger.warn(`Service call timed out: ${sanitizedKey}`, {
            requestId,
            key: sanitizedKey,
            duration: Math.round(duration),
            timeoutMs,
            ...sanitizedLogMeta,
          });
          return fallback;
        }
        
        const normalized = normalizeError(error, `Service call failed: ${sanitizedKey}`);
        logger.error(`Service call failed: ${sanitizedKey}`, normalized, {
          requestId,
          key: sanitizedKey,
          duration: Math.round(duration),
          ...sanitizedLogMeta,
        });
        return fallback;
      }
    },
    cacheKeyParts,
    { revalidate: ttl, tags }
  )();
}
