/**
 * Unified cache invalidation utility for edge functions
 * Uses Statsig config with fallback to defaults
 * Non-blocking error handling
 */

import { edgeEnv } from '../config/env.ts';
import { getCacheConfigStringArray } from '../config/statsig-cache.ts';
import type { Database } from '@heyclaude/database-types';

const REVALIDATE_SECRET = edgeEnv.revalidate.secret;
const SITE_URL = edgeEnv.site.siteUrl;

export interface InvalidateCacheOptions {
  category?: Database['public']['Enums']['content_category'] | null | undefined;
  slug?: string | null | undefined;
  logContext?: Record<string, unknown>;
  contentId?: string | null | undefined;
  jobId?: string | null | undefined;
  changelogId?: string | null | undefined;
}

export interface InvalidateCacheResult {
  success: boolean;
  error?: string;
  tags?: string[];
}

/**
 * Invalidate cache tags via Next.js API route
 * Non-blocking - errors are logged but don't throw
 */
export async function invalidateCacheTags(
  tags: string[],
  options?: InvalidateCacheOptions
): Promise<InvalidateCacheResult> {
  if (!REVALIDATE_SECRET) {
    if (options?.logContext) {
      console.warn('[cache] Invalidation skipped (no secret)', options.logContext);
    }
    return { success: false, error: 'REVALIDATE_SECRET not configured' };
  }

  if (tags.length === 0) {
    return { success: false, error: 'No tags provided' };
  }

  try {
    const response = await fetch(`${SITE_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: REVALIDATE_SECRET,
        ...(options?.category !== null && options?.category !== undefined
          ? { category: options.category }
          : {}),
        ...(options?.slug !== null && options?.slug !== undefined ? { slug: options.slug } : {}),
        tags,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (options?.logContext) {
        console.warn('[cache] Invalidation failed', {
          ...options.logContext,
          status: response.status,
          error: errorText,
          tags,
        });
      }
      return { success: false, error: errorText, tags };
    }

    if (options?.logContext) {
      console.log('[cache] Tags invalidated', {
        ...options.logContext,
        success: true,
        tags,
      });
    }

    return { success: true, tags };
  } catch (error) {
    const { errorToString } = await import('@heyclaude/shared-runtime');
    const errorMsg = errorToString(error);
    if (options?.logContext) {
      console.warn('[cache] Invalidation error', {
        ...options.logContext,
        error: errorMsg,
        tags,
      });
    }
    return { success: false, error: errorMsg, tags };
  }
}

/**
 * Invalidate cache by Statsig config key
 * Fetches tags from Statsig with fallback to defaults
 */
export async function invalidateCacheByKey(
  cacheKey: string,
  fallbackTags: string[],
  options?: InvalidateCacheOptions
): Promise<InvalidateCacheResult> {
  const tags = getCacheConfigStringArray(cacheKey, fallbackTags);
  return invalidateCacheTags(tags, options);
}
