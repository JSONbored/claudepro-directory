'use server';

import { ContentService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../../logger.ts';
import { generateRequestId } from '../../utils/request-id.ts';

/**
 * Get homepage data
 * Uses 'use cache' to cache homepage data. This data is public and same for all users.
 */
export async function getHomepageData(
  categoryIds: readonly string[]
): Promise<Database['public']['Functions']['get_homepage_optimized']['Returns'] | null> {
  'use cache';

  const { getCacheTtl } = await import('../../cache-config.ts');
  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');

  // CRITICAL: Use sorted, joined string for cache key to ensure stability
  // The categoryIds array order might vary, so we sort and join to create a stable key
  // This prevents cache misses due to array order differences
  const sortedCategoryIds = [...categoryIds].toSorted().join(',');

  // Configure cache
  const ttl = getCacheTtl('cache.homepage.ttl_seconds');
  cacheLife({ stale: ttl / 2, revalidate: ttl, expire: ttl * 2 });
  cacheTag('homepage');
  cacheTag('content');
  cacheTag('trending');

  // Create request-scoped child logger to avoid race conditions
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getHomepageData',
    route: 'utility-function', // Utility function - no specific route
    module: 'packages/web-runtime/src/data/content/homepage',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new ContentService(client).getHomepageOptimized({
      p_category_ids: [...categoryIds],
      p_limit: 6, // 6 items per category for featured sections (8 categories × 6 = 48 items total)
    });

    reqLogger.info('getHomepageData: fetched successfully', {
      categoryIds: sortedCategoryIds,
      categoryCount: categoryIds.length,
      limit: 6,
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getHomepageData failed', errorForLogging, {
      categoryIds,
      categoryCount: categoryIds.length,
    });
    return null;
  }
}
