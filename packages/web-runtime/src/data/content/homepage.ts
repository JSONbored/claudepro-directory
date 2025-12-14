'use server';

import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

/**
 * Get homepage data
 * Uses 'use cache' to cache homepage data. This data is public and same for all users.
 * @param categoryIds
 */
export async function getHomepageData(
  categoryIds: readonly string[]
): Promise<Database['public']['Functions']['get_homepage_optimized']['Returns'] | null> {
  'use cache';

  // CRITICAL: Defer to request time before any non-deterministic operations (Date.now(), etc.)
  // Required by Next.js Cache Components for functions using 'use cache'
  const { connection } = await import('next/server');
  await connection();

  // CRITICAL: Use sorted, joined string for cache key to ensure stability
  // The categoryIds array order might vary, so we sort and join to create a stable key
  // This prevents cache misses due to array order differences
  const sortedCategoryIds = [...categoryIds].toSorted().join(',');

  // Configure cache - use 'hours' profile for homepage data that changes hourly
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  cacheTag('homepage');
  cacheTag('content');
  cacheTag('trending');

  try {
    // ContentService now uses Prisma (no constructor needed)
    const { ContentService } = await import('@heyclaude/data-layer');
    const result = await new ContentService().getHomepageOptimized({
      p_category_ids: [...categoryIds],
      p_limit: 6, // 6 items per category for featured sections (8 categories × 6 = 48 items total)
    });

    // Use cache-safe logging (createLogger with timestamp: false) for cached components
    // Dynamically import logger only when needed to avoid serialization issues
    const { createLogger } = await import('@heyclaude/shared-runtime/logger/index.ts');
    const cacheLogger = createLogger({ timestamp: false });
    const reqLogger = cacheLogger.child({
      module: 'packages/web-runtime/src/data/content/homepage',
      operation: 'getHomepageData',
      route: 'utility-function', // Utility function - no specific route
    });

    reqLogger.info(
      {
        categoryCount: categoryIds.length,
        categoryIds: sortedCategoryIds,
        limit: 6,
      },
      'getHomepageData: fetched successfully'
    );

    return result;
  } catch (error) {
    // Use cache-safe logging with error normalization
    const { createLogger, normalizeError } =
      await import('@heyclaude/shared-runtime/logger/index.ts');
    const cacheLogger = createLogger({ timestamp: false });
    const reqLogger = cacheLogger.child({
      module: 'packages/web-runtime/src/data/content/homepage',
      operation: 'getHomepageData',
      route: 'utility-function',
    });

    const normalized = normalizeError(error, 'getHomepageData failed');
    reqLogger.error(
      {
        categoryCount: categoryIds.length,
        categoryIds: sortedCategoryIds,
        err: normalized,
      },
      'getHomepageData failed'
    );

    return null;
  }
}
