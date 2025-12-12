import {
  trackMissingData,
  trackRPCFailure,
  trackValidationFailure,
} from '@heyclaude/web-runtime/core';
import { getHomepageCategoryIds, getHomepageData } from '@heyclaude/web-runtime/server';
import { type SearchFilterOptions } from '@heyclaude/web-runtime/types/component.types';
import { normalizeError } from '@heyclaude/shared-runtime/logger/index.ts';

import { HomePageClient } from '@/src/components/features/home/home-sections';

/**
 * Homepage Content Server Component
 *
 * OPTIMIZATION: Fetches homepage data inside Suspense boundary for streaming SSR
 * This allows the hero section and search facets to stream immediately while content loads
 */
async function HomepageContentData() {
  // Use cache-safe logger for Suspense boundary components that run during prerendering
  // Dynamically import to avoid serialization issues
  const { createLogger } = await import('@heyclaude/shared-runtime/logger/index.ts');
  const cacheLogger = createLogger({ timestamp: false });
  const reqLogger = cacheLogger.child({
    operation: 'HomepageContentData',
    route: '/',
    module: 'apps/web/src/components/features/home/homepage-content-server',
  });

  const categoryIds = getHomepageCategoryIds;

  const homepageResult = await getHomepageData(categoryIds).catch((error: unknown) => {
    trackRPCFailure('get_homepage_optimized', error, {
      categoryIds: categoryIds.length,
      categoryIdsList: categoryIds,
    });
    return null;
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

  // Log what we received from RPC for debugging
  reqLogger.info(
    {
      hasContent: !!homepageResult.content,
      contentType: typeof homepageResult.content,
      memberCount: homepageResult.member_count ?? 0,
      featuredJobsCount: Array.isArray(homepageResult.featured_jobs)
        ? homepageResult.featured_jobs.length
        : 0,
    },
    'HomepageContentData: RPC result received'
  );

  const memberCount = homepageResult.member_count ?? 0;
  const featuredJobs = (homepageResult.featured_jobs as Array<unknown> | null) ?? [];

  // CRITICAL: content is Json type (JSONB from database) - Supabase should auto-parse it
  // But we need to ensure it's actually an object, not a string
  let content: unknown = homepageResult.content;

  // If content is a string (shouldn't happen, but defensive), try to parse it
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
      reqLogger.warn({ note: 'Content was string, parsed to object' }, 'HomepageContentData: Content was a string, parsed it');
    } catch (parseError) {
      const normalized = normalizeError(parseError, 'Failed to parse content string');
      reqLogger.error({ err: normalized }, 'HomepageContentData: Failed to parse content string');
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
      const categoryData = content['categoryData'] as Record<string, unknown>;
      const stats = content['stats'] as Record<string, { featured: number; total: number }>;
      const weekStart = content['weekStart'] as string;

      // Log categoryData structure for debugging
      const categoryKeys = Object.keys(categoryData);
      const categoryCounts = Object.fromEntries(
        categoryKeys.map((key) => [
          key,
          Array.isArray(categoryData[key]) ? (categoryData[key] as unknown[]).length : 0,
        ])
      );
      const totalItems = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

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
        'HomepageContentData: Parsed categoryData'
      );

      // Validate that we have data for expected categories
      if (categoryKeys.length === 0) {
        reqLogger.warn(
          {
            expectedCategories: categoryIds.length,
            categoryIds,
            note: 'RPC returned empty categoryData - this may indicate a database or RPC issue',
          },
          'HomepageContentData: categoryData is empty'
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
          'HomepageContentData: categoryData has fewer items than expected'
        );
      }

      return {
        categoryData: categoryData as Record<string, unknown[]>,
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
 */
export async function HomepageContentServer({
  searchFilters,
}: {
  searchFilters: SearchFilterOptions;
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

  const { homepageContentData, featuredJobs, categoryIds } = await HomepageContentData();

  // CRITICAL: Ensure data is properly serialized for Next.js Client Component
  // Next.js requires all props to be serializable (JSON-compatible)
  // Convert the data to ensure it's properly serialized
  const serializedCategoryData: Record<string, unknown[]> = {};
  for (const [key, value] of Object.entries(homepageContentData.categoryData)) {
    // Ensure each value is an array and is serializable
    if (Array.isArray(value)) {
      serializedCategoryData[key] = value;
    } else {
      reqLogger.warn(
        {
          key,
          valueType: typeof value,
          value,
        },
        'HomepageContentServer: Non-array categoryData value'
      );
      serializedCategoryData[key] = [];
    }
  }

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

  return (
    <HomePageClient
      initialData={serializedCategoryData}
      featuredByCategory={serializedCategoryData}
      stats={homepageContentData.stats}
      featuredJobs={featuredJobs}
      searchFilters={searchFilters}
      weekStart={homepageContentData.weekStart}
      serverCategoryIds={categoryIds}
    />
  );
}
