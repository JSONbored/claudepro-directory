/**
 * Dynamic detail pages for all content categories
 * Optimized: Uses getContentDetailCore() to split core content (blocking) from analytics/related (deferred)
 * for Partial Prerendering (PPR) - enables faster LCP by prioritizing critical content
 *
 * ISR: 2 hours (7200s) - Detail pages change less frequently than list pages
 */
export const revalidate = 7200;
export const dynamicParams = true; // Allow unknown slugs to be rendered on demand (will 404 if invalid)

/**
 * Produce static route parameters for a subset of popular content to pre-render at build time.
 *
 * Returns an array of { category, slug } entries containing up to 30 top items per homepage category.
 * Invalid or missing slugs are excluded; other pages remain available for on-demand rendering via dynamicParams.
 *
 * @returns An array of objects with `category` and `slug` to be used as static params for pre-rendering
 *
 * @see getHomepageCategoryIds
 * @see getContentByCategory
 * @see dynamicParams
 */
export async function generateStaticParams() {
  // Dynamic imports only for data modules (category/content)
  const { getHomepageCategoryIds } = await import('@heyclaude/web-runtime/data/config/category');
  const { getContentByCategory } = await import('@heyclaude/web-runtime/data/content');
  const { logger, generateRequestId, normalizeError } = await import(
    '@heyclaude/web-runtime/logging/server'
  );

  const categories = getHomepageCategoryIds;
  const parameters: Array<{ category: string; slug: string }> = [];

  // Limit to top 30 items per category to balance build time vs. performance
  // Reduced from 50 to optimize build performance while maintaining good SEO coverage
  const MAX_ITEMS_PER_CATEGORY = 30;

  // Process all categories in parallel
  // OPTIMIZATION: Skip validation - rely on dynamicParams=true for on-demand rendering
  // This saves ~8-10s on every build. Invalid slugs will be handled on-demand via ISR.
  const categoryResults = await Promise.allSettled(
    categories.map(async (category) => {
      try {
        const items = await getContentByCategory(category);
        const topItems = items.slice(0, MAX_ITEMS_PER_CATEGORY);

        // Return all items with slugs - no validation needed
        // dynamicParams=true will handle invalid slugs on-demand
        const categoryParameters = topItems
          .filter((item): item is typeof item & { slug: string } => Boolean(item.slug))
          .map((item) => ({ category, slug: item.slug }));

        return { category, params: categoryParameters };
      } catch (error) {
        // Log error but continue with other categories
        const requestId = generateRequestId();
        const operation = 'generateStaticParams';
        const route = `/${category}`;
        const module = 'apps/web/src/app/[category]/[slug]/page';
        const reqLogger = logger.child({
          requestId,
          operation,
          route,
          module,
        });
        const normalized = normalizeError(
          error,
          'Failed to load content for category in generateStaticParams'
        );
        reqLogger.error('generateStaticParams: failed to load content for category', normalized, {
          category,
          section: 'static-params-generation',
        });
        return { category, params: [] };
      }
    })
  );

  // Collect all parameters from all categories
  for (const result of categoryResults) {
    if (result.status === 'fulfilled') {
      parameters.push(...result.value.params);
    }
  }

  return parameters;
}

import { Constants, type Database } from '@heyclaude/database-types';
import { ensureStringArray, isValidCategory } from '@heyclaude/web-runtime/core';
import type { RecentlyViewedCategory } from '@heyclaude/web-runtime/hooks';
import {
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/logging/server';
import {
  generatePageMetadata,
  getCategoryConfig,
  getContentAnalytics,
  getContentDetailCore,
  getRelatedContent,
} from '@heyclaude/web-runtime/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CollectionDetailView } from '@/src/components/content/detail-page/collection-view';
import { UnifiedDetailPage } from '@/src/components/content/detail-page/content-detail-view';
import { ReadProgress } from '@/src/components/content/read-progress';
import { Pulse } from '@/src/components/core/infra/pulse';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { RecentlyViewedTracker } from '@/src/components/features/navigation/recently-viewed-tracker';

// Map route categories (plural) to RecentlyViewedCategory (singular)
// Use Constants.public.Enums.content_category to avoid hardcoded enum values
const CONTENT_CATEGORY_ENUMS = Constants.public.Enums.content_category;
const CATEGORY_TO_RECENTLY_VIEWED: Record<string, RecentlyViewedCategory> = {
  [CONTENT_CATEGORY_ENUMS[0]]: 'agent', // agents
  [CONTENT_CATEGORY_ENUMS[3]]: 'command', // commands
  [CONTENT_CATEGORY_ENUMS[4]]: 'hook', // hooks
  [CONTENT_CATEGORY_ENUMS[1]]: 'mcp', // mcp
  [CONTENT_CATEGORY_ENUMS[2]]: 'rule', // rules
  [CONTENT_CATEGORY_ENUMS[5]]: 'statusline', // statuslines
  [CONTENT_CATEGORY_ENUMS[6]]: 'skill', // skills
  [CONTENT_CATEGORY_ENUMS[9]]: 'job', // jobs
  job: 'job', // Alias for consistency
} as const;

// Stable constant for collections category (replaces brittle array index access)
const COLLECTION_CATEGORY = 'collections' as const;

/**
 * Map a category key to its RecentlyViewedCategory equivalent.
 *
 * @param category - The category key to map (for example, "articles" or "collections")
 * @returns The corresponding `RecentlyViewedCategory`, or `null` if the category has no mapping
 *
 * @see CATEGORY_TO_RECENTLY_VIEWED
 * @see RecentlyViewedCategory
 */
function mapCategoryToRecentlyViewed(category: string): RecentlyViewedCategory | null {
  return CATEGORY_TO_RECENTLY_VIEWED[category] ?? null;
}

/**
 * Produce page metadata for a detail route based on the route params and category configuration.
 *
 * @param params - Promise resolving to an object with `category` and `slug` route parameters.
 * @returns A Metadata object for the detail page. If `category` is invalid, returns the default metadata for `/:category/:slug`.
 *
 * @see generatePageMetadata
 * @see getCategoryConfig
 * @see isValidCategory
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;

  // Validate category at compile time
  if (!isValidCategory(category)) {
    return generatePageMetadata('/:category/:slug', {
      params: { category, slug },
    });
  }

  const config = getCategoryConfig(category);

  return generatePageMetadata('/:category/:slug', {
    params: { category, slug },
    categoryConfig: config ?? undefined,
    category,
    slug,
  });
}

/**
 * Render the content detail page for a given category and slug.
 *
 * Validates the category and category configuration (returns a 404 for invalid or missing config), ensures the core content exists (returns a 404 if missing), and composes the page using the core item plus deferred analytics and related-item data. Conditionally includes recently-viewed tracking for supported categories and a collection-specific section when the item is a collection.
 *
 * @param params - Promise resolving to the route parameters object with `category` and `slug`
 * @returns A React element representing the content detail page
 *
 * @see getContentDetailCore
 * @see getContentAnalytics
 * @see getRelatedContent
 * @see UnifiedDetailPage
 * @see RecentlyViewedTracker
 * @see CollectionDetailView
 */
export default async function DetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const operation = 'DetailPage';
  const route = `/${category}/${slug}`;
  const module = 'apps/web/src/app/[category]/[slug]/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module,
  });

  // Section: Category Validation
  if (!isValidCategory(category)) {
    reqLogger.warn('Invalid category in detail page', {
      section: 'category-validation',
    });
    notFound();
  }

  const config = getCategoryConfig(category);
  if (!config) {
    const normalized = normalizeError(
      new Error('Category config is null'),
      'DetailPage: missing category config'
    );
    reqLogger.error('DetailPage: missing category config', normalized, {
      section: 'category-validation',
    });
    notFound();
  }

  // Section: Core Content Fetch
  // Optimized for PPR: Split core content (critical) from analytics/related (deferred)
  // 1. Fetch Core Content (Blocking - for LCP)
  const coreData = await getContentDetailCore({ category, slug });

  if (!coreData) {
    // Content may not exist (deleted, never existed, or invalid slug)
    // This is expected behavior during build-time static generation when generateStaticParams
    // generates paths for content that may have been removed from the database
    // During build, missing content is expected - only log at debug level
    // During runtime, log at warn level to catch real issues
    const isBuildTime =
      process.env['NEXT_PHASE'] === 'phase-production-build' ||
      process.env['VERCEL_ENV'] === 'production';
    
    if (isBuildTime) {
      reqLogger.debug('DetailPage: content not found during build (expected)', {
        section: 'core-content-fetch',
        category,
        slug,
      });
    } else {
      reqLogger.warn('DetailPage: get_content_detail_core returned null - content may not exist', {
        section: 'core-content-fetch',
        category,
        slug,
      });
    }
    notFound();
  }

  const fullItem = coreData.content as Database['public']['Tables']['content']['Row'] | null;

  // Null safety: If content doesn't exist in database, return 404
  if (!fullItem) {
    reqLogger.warn('Content not found in RPC response', {
      section: 'core-content-fetch',
      rpcFunction: 'get_content_detail_core',
    });
    notFound();
  }

  reqLogger.info('DetailPage: core content loaded', {
    section: 'core-content-fetch',
  });

  // Section: Analytics & Related Fetch (Non-blocking - for Suspense)
  // 2. Fetch Analytics & Related (Non-blocking promise - for Suspense)
  const analyticsPromise = getContentAnalytics({ category, slug });

  const viewCountPromise = analyticsPromise.then((data) => data?.view_count ?? 0);
  const copyCountPromise = analyticsPromise.then((data) => data?.copy_count ?? 0);

  const relatedItemsPromise = getRelatedContent({
    currentPath: `/${category}/${slug}`,
    currentCategory: category,
    currentTags: 'tags' in fullItem ? ensureStringArray(fullItem.tags) : [],
  }).then((result) => result.items);

  // Content detail tabs - currently hardcoded to true
  // TODO: Implement lazy-loading feature flag pattern to avoid Edge Config access during builds
  // See: https://github.com/vercel/next.js/issues/XXX (ticket reference TBD)
  const tabsEnabled = true;

  // No transformation needed - displayTitle computed at build time
  // This eliminates runtime overhead and follows DRY principles

  // Final summary log
  reqLogger.info('DetailPage: page render completed', {
    section: 'page-render',
    category,
    slug,
  });

  // Unified rendering: All categories use UnifiedDetailPage
  // Collections pass their specialized sections via collectionSections prop
  return (
    <>
      {/* Read Progress Bar - Shows reading progress at top of page */}
      <ReadProgress />

      <Pulse variant="view" category={category} slug={slug} />
      <Pulse variant="page-view" category={category} slug={slug} />
      <StructuredData route={`/${category}/${slug}`} />

      {/* Recently Viewed Tracking - only for supported categories */}
      {(() => {
        const recentlyViewedCategory = mapCategoryToRecentlyViewed(category);
        if (!recentlyViewedCategory) return null;
        
        // Extract tags safely before passing to client component
        const itemTags = 'tags' in fullItem ? ensureStringArray(fullItem.tags).slice(0, 3) : [];
        const tagsProp = itemTags.length > 0 ? { tags: itemTags } : {};
        
        // Extract title safely
        const itemTitle = 
          ('display_title' in fullItem && typeof fullItem.display_title === 'string' ? fullItem.display_title : undefined) ??
          ('title' in fullItem && typeof fullItem.title === 'string' ? fullItem.title : undefined) ??
          slug;
        
        // Extract description safely - ensure it's a string
        const itemDescription = 
          typeof fullItem.description === 'string' ? fullItem.description : '';
        
        return (
          <RecentlyViewedTracker
            category={recentlyViewedCategory}
            slug={slug}
            title={itemTitle}
            description={itemDescription}
            {...tagsProp}
          />
        );
      })()}

      <UnifiedDetailPage
        item={fullItem}
        viewCountPromise={viewCountPromise}
        copyCountPromise={copyCountPromise}
        relatedItemsPromise={relatedItemsPromise}
        tabsEnabled={tabsEnabled}
        collectionSections={
          category === COLLECTION_CATEGORY && fullItem.category === COLLECTION_CATEGORY ? (
            <CollectionDetailView
              collection={
                fullItem as Database['public']['Tables']['content']['Row'] & {
                  category: 'collections';
                }
              }
            />
          ) : undefined
        }
      />
    </>
  );
}