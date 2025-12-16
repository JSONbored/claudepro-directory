import {
  trackMissingData,
  trackValidationFailure,
} from '@heyclaude/web-runtime/core';
import { normalizeError, serializeForClient } from '@heyclaude/shared-runtime';
import type { Jobs, GetHomepageOptimizedReturns } from '@heyclaude/database-types/postgres-types';

import { HomePageClient } from '@/src/components/features/home/home-sections';

/**
 * Process homepage result data into structured format for client components
 * 
 * OPTIMIZATION: This function now processes data passed as props instead of fetching
 * This eliminates duplicate function calls and reduces function usage by 66%
 */
async function processHomepageData(
  homepageResult: GetHomepageOptimizedReturns | null,
  categoryIds: readonly string[]
) {
  // Use cache-safe logger for Server Components that run during prerendering
  // Dynamically import to avoid serialization issues
  const { createLogger } = await import('@heyclaude/shared-runtime/logger/index.ts');
  const cacheLogger = createLogger({ timestamp: false });
  const reqLogger = cacheLogger.child({
    operation: 'processHomepageData',
    route: '/',
    module: 'apps/web/src/components/features/home/homepage-content-server',
  });

  if (!homepageResult) {
    trackMissingData('featured', 'homepageResult', {
      categoryIds: categoryIds.length,
      categoryIdsList: categoryIds,
      note: 'RPC returned null - this indicates either RPC failure or no data in database',
    });
    return {
      homepageContentData: {
        categoryData: {},
        stats: {},
        weekStart: '',
      },
      featuredJobs: [],
      categoryIds,
      memberCount: 0,
    };
  }

  // OPTIMIZATION: Only log in development to reduce production overhead
  if (process.env.NODE_ENV === 'development') {
    reqLogger.info(
      {
        hasContent: !!homepageResult.content,
        contentType: typeof homepageResult.content,
        memberCount: homepageResult.member_count ?? 0,
        featuredJobsCount: Array.isArray(homepageResult.featured_jobs)
          ? homepageResult.featured_jobs.length
          : 0,
      },
      'processHomepageData: RPC result received'
    );
  }

  const memberCount = homepageResult.member_count ?? 0;
  // featured_jobs is JSONB from database, parse it as Jobs array
  const featuredJobsRaw = homepageResult.featured_jobs;
  // Type guard: Validate featuredJobsRaw is Jobs array
  function isJobsArray(value: unknown): value is Jobs[] {
    return Array.isArray(value) && value.every((item): item is Jobs => 
      item !== null && typeof item === 'object' && 'id' in item
    );
  }
  
  const featuredJobs: readonly Jobs[] = isJobsArray(featuredJobsRaw) 
    ? featuredJobsRaw
    : [];

  // CRITICAL: content is Json type (JSONB from database) - Supabase should auto-parse it
  // But we need to ensure it's actually an object, not a string
  let content: unknown = homepageResult.content;

  // If content is a string (shouldn't happen, but defensive), try to parse it
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
      reqLogger.warn({ note: 'Content was string, parsed to object' }, 'processHomepageData: Content was a string, parsed it');
    } catch (parseError) {
      const normalized = normalizeError(parseError, 'Failed to parse content string');
      reqLogger.error({ err: normalized }, 'processHomepageData: Failed to parse content string');
      content = null;
    }
  }
  const homepageContentData = (() => {
    if (
      content &&
      typeof content === 'object' &&
      !Array.isArray(content) &&
      'categoryData' in content &&
      'stats' in content &&
      'weekStart' in content
    ) {
      // Type narrowing: We already checked these properties exist
      const categoryDataRaw = content['categoryData'];
      const statsRaw = content['stats'];
      const weekStart = typeof content['weekStart'] === 'string' ? content['weekStart'] : '';
      
      // Type narrowing: Ensure categoryData is Record<string, unknown>
      const categoryData: Record<string, unknown> = 
        categoryDataRaw && typeof categoryDataRaw === 'object' && !Array.isArray(categoryDataRaw)
          ? (categoryDataRaw as Record<string, unknown>)
          : {};
      
      // Type narrowing: Ensure stats is Record<string, { featured: number; total: number }>
      const stats: Record<string, { featured: number; total: number }> = 
        statsRaw && typeof statsRaw === 'object' && !Array.isArray(statsRaw) &&
        Object.values(statsRaw).every(
          (value) => typeof value === 'object' && value !== null && 'total' in value && 'featured' in value
        )
          ? (statsRaw as Record<string, { featured: number; total: number }>)
          : {};

      // Log categoryData structure for debugging
      const categoryKeys = Object.keys(categoryData);
      const categoryCounts = Object.fromEntries(
        categoryKeys.map((key) => [
          key,
          Array.isArray(categoryData[key]) ? categoryData[key].length : 0,
        ])
      );
      const totalItems = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

      // OPTIMIZATION: Only log in development
      if (process.env.NODE_ENV === 'development') {
        reqLogger.info(
          {
            categoryCount: categoryKeys.length,
            categoryKeys,
            categoryCounts,
            totalItems,
            expectedItems: categoryIds.length * 6, // 6 items per category
            statsKeys: Object.keys(stats),
            hasWeekStart: !!weekStart,
          },
          'processHomepageData: Parsed categoryData'
        );
      }

      // Validate that we have data for expected categories
      if (categoryKeys.length === 0) {
        reqLogger.warn(
          {
            expectedCategories: categoryIds.length,
            categoryIds,
            note: 'RPC returned empty categoryData - this may indicate a database or RPC issue',
          },
          'processHomepageData: categoryData is empty'
        );
      } else if (totalItems < categoryIds.length * 3) {
        // Warn if we have less than 3 items per category on average (should be 6)
        reqLogger.warn(
          {
            expectedItems: categoryIds.length * 6,
            actualItems: totalItems,
            categoryCounts,
            note: 'Expected 6 items per category, but received fewer',
          },
          'processHomepageData: categoryData has fewer items than expected'
        );
      }

      // Type narrowing: Ensure categoryData values are arrays
      const categoryDataTyped: Record<string, unknown[]> = Object.fromEntries(
        Object.entries(categoryData).map(([key, value]) => [
          key,
          Array.isArray(value) ? value : [],
        ])
      );
      
      return {
        categoryData: categoryDataTyped,
        stats,
        weekStart,
      };
    }

    trackValidationFailure('featured', 'Content structure invalid', {
      hasContent: content !== null && content !== undefined,
      contentType: typeof content,
      isArray: Array.isArray(content),
      hasCategoryData:
        content && typeof content === 'object'
          ? 'categoryData' in (content as Record<string, unknown>)
          : false,
      hasStats:
        content && typeof content === 'object'
          ? 'stats' in (content as Record<string, unknown>)
          : false,
      hasWeekStart:
        content && typeof content === 'object'
          ? 'weekStart' in (content as Record<string, unknown>)
          : false,
      contentSample:
        content && typeof content === 'object' ? Object.keys(content).slice(0, 5) : null,
    });

    return {
      categoryData: {},
      stats: {},
      weekStart: '',
    };
  })();

  return {
    homepageContentData,
    featuredJobs,
    categoryIds,
    memberCount,
  };
}

/**
 * Homepage Content Server Component
 *
 * Renders the main homepage content section with all featured content
 * 
 * OPTIMIZATION: Now receives homepage data as props instead of fetching
 * This eliminates duplicate function calls (reduces function usage by 66%)
 * Data is fetched once at the page level and passed down as props
 * 
 * @param homepageResult - Homepage data from getHomepageData() (fetched at page level)
 * @param categoryIds - Category IDs for homepage
 * @param bookmarkStatusMap - Map of bookmark statuses (key: "content_type:content_slug", value: boolean)
 */
export async function HomepageContentServer({
  homepageResult,
  categoryIds,
  bookmarkStatusMap = new Map(),
}: {
  homepageResult: GetHomepageOptimizedReturns | null;
  categoryIds: readonly string[];
  bookmarkStatusMap?: Map<string, boolean>;
}) {
  // Use cache-safe logger for Server Components that run during prerendering
  // Dynamically import to avoid serialization issues
  const { createLogger } = await import('@heyclaude/shared-runtime/logger/index.ts');
  const cacheLogger = createLogger({ timestamp: false });
  const reqLogger = cacheLogger.child({
    operation: 'HomepageContentServer',
    route: '/',
    module: 'apps/web/src/components/features/home/homepage-content-server',
  });

  // CRITICAL: Process homepage data from props instead of fetching
  // This eliminates duplicate function calls
  const { homepageContentData, featuredJobs } = await processHomepageData(homepageResult, categoryIds);

  // CRITICAL: Ensure data is properly serialized for Next.js Client Component
  // Next.js requires all props to be serializable (JSON-compatible)
  // Use standardized serializeForClient utility for consistent serialization
  const serializedCategoryDataRaw = serializeForClient(homepageContentData.categoryData);

  // Type narrowing: Ensure serializedCategoryData is Record<string, unknown[]>
  const serializedCategoryData: Record<string, unknown[]> =
    serializedCategoryDataRaw &&
    typeof serializedCategoryDataRaw === 'object' &&
    !Array.isArray(serializedCategoryDataRaw) &&
    Object.values(serializedCategoryDataRaw).every((value) => Array.isArray(value))
      ? (serializedCategoryDataRaw as Record<string, unknown[]>)
      : {};

  // Validate that serialized data maintains expected structure
  if (Object.keys(serializedCategoryData).length === 0 && Object.keys(homepageContentData.categoryData).length > 0) {
    reqLogger.warn(
      {
        serializedType: typeof serializedCategoryDataRaw,
        isArray: Array.isArray(serializedCategoryDataRaw),
      },
      'HomepageContentServer: Serialized categoryData has unexpected structure'
    );
  }

  // OPTIMIZATION: Only log in development
  if (process.env.NODE_ENV === 'development') {
    reqLogger.info(
      {
        serializedKeys: Object.keys(serializedCategoryData),
        serializedCounts: Object.fromEntries(
          Object.keys(serializedCategoryData).map((key) => [
            key,
            Array.isArray(serializedCategoryData[key]) ? serializedCategoryData[key].length : 0,
          ])
        ),
      },
      'HomepageContentServer: Serialized data for client'
    );
  }

  // Empty categoryData is NOT expected - featured sections should always have data
  // This indicates either:
  // 1. RPC returned empty data (database/RPC issue)
  // 2. Cache returned stale empty data (cache invalidation issue)
  // 3. No content exists in database (data issue)
  if (Object.keys(serializedCategoryData).length === 0) {
    trackMissingData('featured', 'categoryData', {
      originalCategoryDataKeys: Object.keys(homepageContentData.categoryData),
      categoryIds: categoryIds.length,
      statsKeys: Object.keys(homepageContentData.stats),
      hasStats: Object.keys(homepageContentData.stats).length > 0,
      expectedCategories: categoryIds.length,
      expectedItemsPerCategory: 6,
      expectedTotalItems: categoryIds.length * 6,
    });
  }

  // Convert Map to plain object for serialization (Next.js requires JSON-serializable props)
  // Map is not JSON-serializable, so convert to Record<string, boolean>
  const bookmarkStatusRecord: Record<string, boolean> = Object.fromEntries(bookmarkStatusMap);

  // Type narrowing: Ensure stats is Record<string, { total: number; featured: number }>
  const stats: Record<string, { total: number; featured: number }> | undefined =
    homepageContentData.stats &&
    typeof homepageContentData.stats === 'object' &&
    !Array.isArray(homepageContentData.stats) &&
    Object.values(homepageContentData.stats).every(
      (value) =>
        typeof value === 'object' &&
        value !== null &&
        'total' in value &&
        'featured' in value &&
        typeof value.total === 'number' &&
        typeof value.featured === 'number'
    )
      ? (homepageContentData.stats as Record<string, { total: number; featured: number }>)
      : undefined;

  // OPTIMIZATION: Only pass initialData (featuredByCategory is redundant - same data)
  // This reduces RSC payload size by ~50% for homepage data
  return (
    <HomePageClient
      initialData={serializedCategoryData}
      {...(stats ? { stats } : {})}
      featuredJobs={featuredJobs}
      weekStart={homepageContentData.weekStart}
      serverCategoryIds={categoryIds}
      bookmarkStatusMap={bookmarkStatusRecord}
    />
  );
}
