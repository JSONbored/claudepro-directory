import {
  generateRequestId,
  logger,
  normalizeError,
  trackMissingData,
  trackRPCFailure,
  trackValidationFailure,
} from '@heyclaude/web-runtime/core';
import { createWebAppContextWithId } from '@heyclaude/web-runtime/logging/server';
import { getHomepageCategoryIds, getHomepageData } from '@heyclaude/web-runtime/server';
import type { SearchFilterOptions } from '@heyclaude/web-runtime/types/component.types';
import { HomePageClient } from '@/src/components/features/home/home-sections';

/**
 * Homepage Content Server Component
 *
 * OPTIMIZATION: Fetches homepage data inside Suspense boundary for streaming SSR
 * This allows the hero section and search facets to stream immediately while content loads
 */
async function HomepageContentData() {
  // Generate single requestId for this component
  const requestId = generateRequestId();
  const logContext = createWebAppContextWithId(requestId, '/', 'HomepageContentData');

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

  const memberCount = homepageResult.member_count ?? 0;
  const featuredJobs = (homepageResult.featured_jobs as Array<unknown> | null) ?? [];

  // CRITICAL: content is Json type (JSONB from database) - Supabase should auto-parse it
  // But we need to ensure it's actually an object, not a string
  let content: unknown = homepageResult.content;

  // If content is a string (shouldn't happen, but defensive), try to parse it
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
      logger.warn('HomepageContentData: Content was a string, parsed it', {
        ...logContext,
        note: 'Content was string, parsed to object',
      });
    } catch (parseError) {
      const normalized = normalizeError(parseError, 'Failed to parse content string');
      logger.error('HomepageContentData: Failed to parse content string', normalized, logContext);
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
      const stats = content['stats'] as Record<string, { total: number; featured: number }>;
      const weekStart = content['weekStart'] as string;

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
  // Generate single requestId for this component (parent of HomepageContentData)
  const requestId = generateRequestId();
  const logContext = createWebAppContextWithId(requestId, '/', 'HomepageContentServer');

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
      logger.warn('HomepageContentServer: Non-array categoryData value', {
        ...logContext,
        key,
        valueType: typeof value,
        value,
      });
      serializedCategoryData[key] = [];
    }
  }

  logger.info('HomepageContentServer: Serialized data for client', {
    ...logContext,
    serializedKeys: Object.keys(serializedCategoryData),
    serializedCounts: Object.fromEntries(
      Object.keys(serializedCategoryData).map((key) => [
        key,
        Array.isArray(serializedCategoryData[key]) ? serializedCategoryData[key].length : 0,
      ])
    ),
  });

  if (Object.keys(serializedCategoryData).length === 0) {
    trackMissingData('featured', 'categoryData', {
      originalCategoryDataKeys: Object.keys(homepageContentData.categoryData),
      categoryIds: categoryIds.length,
      statsKeys: Object.keys(homepageContentData.stats),
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
