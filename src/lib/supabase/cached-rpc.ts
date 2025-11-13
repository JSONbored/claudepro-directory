/**
 * Cached RPC Utilities - Edge-layer caching for Supabase RPC calls
 * Caches responses at Vercel's global edge network
 */

import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { cacheConfigs } from '@/src/lib/flags';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';
import { createAnonClient } from '@/src/lib/supabase/server-anon';

export interface CachedRPCOptions {
  /** Cache key suffix (will be prepended with function name) */
  keySuffix?: string;
  /** Cache tags for invalidation */
  tags: string[];
  /** TTL config key from cacheConfigs (e.g., 'cache.homepage.ttl_seconds') */
  ttlConfigKey: string;
  /** Use authenticated client (default: false, uses anon client) */
  useAuthClient?: boolean;
}

/**
 * Wraps a Supabase RPC call with edge-layer caching
 *
 * @example
 * const data = await cachedRPC(
 *   'get_homepage_complete',
 *   { p_limit: 10 },
 *   {
 *     tags: ['homepage', 'content'],
 *     ttlConfigKey: 'cache.homepage.ttl_seconds',
 *   }
 * );
 */
export async function cachedRPC<T = unknown>(
  functionName: string,
  params: Record<string, unknown> = {},
  options: CachedRPCOptions
): Promise<T | null> {
  const { keySuffix, tags, ttlConfigKey, useAuthClient = false } = options;

  // Fetch TTL from Statsig
  const config = await cacheConfigs();
  const ttl = (config as Record<string, unknown>)[ttlConfigKey] as number;

  // Generate cache key
  const cacheKey = keySuffix
    ? `rpc-${functionName}-${keySuffix}`
    : `rpc-${functionName}-${JSON.stringify(params)}`;

  return unstable_cache(
    async () => {
      try {
        const supabase = useAuthClient ? await createClient() : createAnonClient();
        const { data, error } = await supabase.rpc(functionName as any, params);

        if (error) {
          logger.error(`RPC call failed: ${functionName}`, error, {
            functionName,
            params: JSON.stringify(params),
          });
          return null;
        }

        return data as T;
      } catch (error) {
        logger.error(
          `Cached RPC error: ${functionName}`,
          error instanceof Error ? error : new Error(String(error)),
          { functionName }
        );
        return null;
      }
    },
    [cacheKey],
    {
      revalidate: ttl,
      tags,
    }
  )();
}

/**
 * React cache wrapper for cachedRPC to prevent duplicate requests in same render
 */
export const cachedRPCWithDedupe = cache(cachedRPC);
