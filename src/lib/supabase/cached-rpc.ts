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
  params: Record<string, unknown>,
  options: CachedRPCOptions
): Promise<T | null> {
  const { keySuffix, tags, ttlConfigKey, useAuthClient = false } = options;

  // Fetch TTL from Statsig (runtime) or use defaults (build time)
  let ttl: number;
  try {
    const config = await cacheConfigs();
    ttl = (config as Record<string, unknown>)[ttlConfigKey] as number;
  } catch {
    // Build time: headers() unavailable, use hardcoded defaults matching Statsig config
    const BUILD_TIME_DEFAULTS: Record<string, number> = {
      'cache.homepage.ttl_seconds': 3600,
      'cache.content_detail.ttl_seconds': 7200,
      'cache.content_list.ttl_seconds': 1800,
      'cache.jobs.ttl_seconds': 1800,
      'cache.jobs_detail.ttl_seconds': 1800,
      'cache.changelog_list.ttl_seconds': 3600,
      'cache.recommendations.ttl_seconds': 3600,
      'cache.newsletter_count_ttl_s': 300,
      'cache.company_profile.ttl_seconds': 1800,
      'cache.content_export.ttl_seconds': 604800,
      'cache.content_paginated.ttl_seconds': 86400,
      'cache.feeds.ttl_seconds': 600,
      'cache.seo.ttl_seconds': 86400,
      'cache.sitemap.ttl_seconds': 86400,
      'cache.status.ttl_seconds': 60,
    };
    ttl = BUILD_TIME_DEFAULTS[ttlConfigKey] || 3600;
  }

  // Generate cache key
  const cacheKey = keySuffix
    ? `rpc-${functionName}-${keySuffix}`
    : `rpc-${functionName}-${JSON.stringify(params)}`;

  return unstable_cache(
    async () => {
      try {
        const supabase = useAuthClient ? await createClient() : createAnonClient();
        // Type assertion needed as Supabase's RPC types don't support dynamic function names
        const { data, error } = await supabase.rpc(functionName as never, params as never);

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
