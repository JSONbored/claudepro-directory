/**
 * Cached RPC Utilities - Edge-layer caching for Supabase RPC calls
 * Caches responses at Vercel's global edge network
 */

import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { type CacheTtlKey, getCacheTtl } from '@/src/lib/data/config/cache-config';
import { logger, toLogContextValue } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

export interface CachedRPCOptions {
  /** Cache key suffix (will be prepended with function name) */
  keySuffix?: string;
  /** Cache tags for invalidation */
  tags: string[];
  /** TTL config key from cacheConfigs (e.g., 'cache.homepage.ttl_seconds') */
  ttlConfigKey: CacheTtlKey;
  /** Use authenticated client (default: false, uses anon client) */
  useAuthClient?: boolean;
}

/**
 * Type-safe RPC client interface
 * Works around Supabase's type inference limitations while preserving runtime behavior
 */
type RpcClient = {
  rpc: <T extends keyof Database['public']['Functions']>(
    name: T,
    args: Database['public']['Functions'][T]['Args']
  ) => Promise<{
    data: Database['public']['Functions'][T]['Returns'] | null;
    error: unknown;
  }>;
};

/**
 * Wraps a Supabase RPC call with edge-layer caching
 * Uses centralized Database types for full type safety
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
export async function cachedRPC<T extends keyof Database['public']['Functions']>(
  functionName: T,
  params: Database['public']['Functions'][T]['Args'],
  options: CachedRPCOptions
): Promise<Database['public']['Functions'][T]['Returns'] | null> {
  const { keySuffix, tags, ttlConfigKey, useAuthClient = false } = options;

  // Fetch TTL from Statsig (runtime) or use defaults (build time)
  const ttl = await getCacheTtl(ttlConfigKey);

  // Generate cache key
  const cacheKey = keySuffix
    ? `rpc-${String(functionName)}-${keySuffix}`
    : `rpc-${String(functionName)}-${JSON.stringify(params)}`;

  return unstable_cache(
    async () => {
      try {
        const supabase = useAuthClient ? await createClient() : createAnonClient();
        // Use satisfies to validate params type, then use the client directly
        const validatedParams = params satisfies Database['public']['Functions'][T]['Args'];
        // The Supabase client may infer 'never' but we validate the params type with satisfies
        // Type assertion needed due to Supabase client type inference limitation
        // Params are validated with satisfies, but client infers 'never' - this is a known Supabase limitation
        const { data, error } = await (supabase as unknown as RpcClient).rpc(
          functionName,
          validatedParams
        );

        if (error) {
          const normalized = normalizeError(error, `RPC call failed: ${String(functionName)}`);
          logger.error(`RPC call failed: ${String(functionName)}`, normalized, {
            functionName: String(functionName),
            params: toLogContextValue(params),
          });
          return null;
        }

        return data;
      } catch (error) {
        const normalized = normalizeError(error, `Cached RPC error: ${String(functionName)}`);
        logger.error(`Cached RPC error: ${String(functionName)}`, normalized, {
          functionName: String(functionName),
        });
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
