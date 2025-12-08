/**
 * Dynamic detail pages for all content categories
 * Optimized: Uses getContentDetailCore() to split core content (blocking) from analytics/related (deferred)
 * for Partial Prerendering (PPR) - enables faster LCP by prioritizing critical content
 *
 * ISR: 2 hours (7200s) - Detail pages change less frequently than list pages
 */
import { type Database } from '@heyclaude/database-types';
import { env } from '@heyclaude/shared-runtime/schemas/env';
import { ensureStringArray, isValidCategory } from '@heyclaude/web-runtime/core';
import { type RecentlyViewedCategory } from '@heyclaude/web-runtime/hooks';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  generatePageMetadata,
  getCategoryConfig,
  getContentAnalytics,
  getContentDetailCore,
  getRelatedContent,
} from '@heyclaude/web-runtime/server';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { CollectionDetailView } from '@/src/components/content/detail-page/collection-view';
import { UnifiedDetailPage } from '@/src/components/content/detail-page/content-detail-view';
import { ReadProgress } from '@/src/components/content/read-progress';
import { Pulse } from '@/src/components/core/infra/pulse';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { RecentlyViewedTracker } from '@/src/components/features/navigation/recently-viewed-tracker';

/**
 * Produce static route parameters ({ category, slug }) for a subset of homepage categories to pre-render at build time.
 *
 * Selects up to MAX_ITEMS_PER_CATEGORY items per homepage category and returns their `{ category, slug }` pairs. If no valid parameters are found, returns a single placeholder entry to satisfy build-time requirements.
 *
 * @returns An array of objects each containing `category` and `slug` for use as static params
 *
 * @see getHomepageCategoryIds
 * @see getContentByCategory
 */
export async function generateStaticParams() {
  // Dynamic imports only for data modules (category/content)
  // Note: Server logging utilities are statically imported at the top of the file
  // since this is a server component and can safely import server-only code
  const { getHomepageCategoryIds } = await import('@heyclaude/web-runtime/data/config/category');
  const { getContentByCategory } = await import('@heyclaude/web-runtime/data/content');

  const categories = getHomepageCategoryIds;
  const parameters: Array<{ category: string; slug: string }> = [];

  // Limit to top 20 items per category to optimize build time
  // Increased from 10 to 20 after database query optimizations (80% faster queries)
  // ISR with dynamicParams=true handles remaining pages on-demand with 2hr revalidation
  const MAX_ITEMS_PER_CATEGORY = 30;

  // Process all categories in parallel
  // OPTIMIZATION: Skip validation - rely on dynamicParams=true for on-demand rendering
  // This saves ~8-10s on every build. Invalid slugs will be handled on-demand via ISR.
  const categoryResults = await Promise.allSettled(
    categories.map(async (category: string) => {
      try {
        // Type assertion: categories from getHomepageCategoryIds are valid category enum values
        const items = await getContentByCategory(
          category as Database['public']['Enums']['content_category']
        );
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
        const modulePath = 'apps/web/src/app/[category]/[slug]/page';
        const reqLogger = logger.child({
          requestId,
          operation,
          route,
          module: modulePath,
        });
        const normalized = normalizeError(error, 'Failed to load content for category');
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

  // Return empty array if no parameters found - Suspense boundaries will handle dynamic rendering
  // This follows Next.js best practices by avoiding placeholder patterns
  return parameters;
}

// Map route categories (plural) to RecentlyViewedCategory (singular)
// Use explicit string keys instead of fragile array indexing to prevent breakage if enum order changes
const CATEGORY_TO_RECENTLY_VIEWED: Record<string, RecentlyViewedCategory> = {
  agents: 'agent',
  commands: 'command',
  hooks: 'hook',
  mcp: 'mcp',
  rules: 'rule',
  statuslines: 'statusline',
  skills: 'skill',
  jobs: 'job',
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
function mapCategoryToRecentlyViewed(category: string): null | RecentlyViewedCategory {
  return CATEGORY_TO_RECENTLY_VIEWED[category] ?? null;
}

/**
 * Generate page metadata for a detail route from route params and category configuration.
 *
 * @param params - An object containing `category` and `slug` route parameters.
 * @returns The Metadata for the detail page. If `category` is invalid, returns the default metadata for `/:category/:slug`.
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

  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate requestId for metadata generation (separate from page render, after connection() to allow Date.now())
  const metadataRequestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const metadataLogger = logger.child({
    requestId: metadataRequestId,
    operation: 'DetailPageMetadata',
    route: `/${category}/${slug}`,
    module: 'apps/web/src/app/[category]/[slug]',
  });

  // Validate category at compile time
  if (!isValidCategory(category)) {
    metadataLogger.warn('Invalid category in generateMetadata', {
      section: 'category-validation',
      category,
    });
    return generatePageMetadata('/:category/:slug', {
      params: { category, slug },
    });
  }

  const config = getCategoryConfig(category);

  metadataLogger.info('DetailPage: generating metadata', {
    section: 'metadata-generation',
    category,
    slug,
  });

  return generatePageMetadata('/:category/:slug', {
    params: { category, slug },
    categoryConfig: config ?? undefined,
    category,
    slug,
  });
}

/**
 * Render the detail page for a content item identified by `category` and `slug`.
 *
 * Uses Suspense boundaries to defer non-deterministic operations to request time.
 * Core content fetching is wrapped in Suspense to enable progressive rendering and
 * avoid placeholder patterns. Analytics and related content are loaded in separate
 * Suspense boundaries for optimal streaming.
 *
 * @param params - A promise that resolves to an object with `category` and `slug` route parameters
 * @returns A React element representing the detail page for the specified `category` and `slug`
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
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();
  const operation = 'DetailPage';
  const modulePath = 'apps/web/src/app/[category]/[slug]/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    module: modulePath,
  });

  // Resolve params early for validation, but defer content fetching to Suspense
  const { category, slug } = await params;

  // Handle placeholder slugs (if any remain from old generateStaticParams)
  if (slug === '__placeholder__') {
    reqLogger.warn('DetailPage: placeholder slug detected, returning 404', {
      section: 'placeholder-handling',
      category,
      slug,
    });
    notFound();
  }

  // Validate category early (before Suspense boundary)
  if (!isValidCategory(category)) {
    reqLogger.warn('Invalid category in detail page', {
      section: 'category-validation',
      category,
    });
    notFound();
  }

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading content...</div>}>
      <DetailPageContent category={category} slug={slug} reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Render the detail page content for a given category and slug, fetching core content in a Suspense boundary.
 *
 * This component validates the category configuration, fetches core content necessary for LCP (404s if missing),
 * starts non-blocking fetches for analytics and related items, and renders the unified detail UI including
 * optional RecentlyViewed tracking and collection-specific sections.
 *
 * @param category - The content category identifying the type of content to display
 * @param slug - The content slug identifying the specific item to display
 * @param reqLogger - A request-scoped logger; a route-scoped child logger will be created for logging within this component.
 * @returns A React fragment containing progress UI, structured data, optional recently-viewed tracking, and the unified detail page with deferred data promises.
 *
 * @see UnifiedDetailPage
 * @see getContentDetailCore
 * @see RecentlyViewedTracker
 */
async function DetailPageContent({
  category,
  slug,
  reqLogger,
}: {
  category: string;
  reqLogger: ReturnType<typeof logger.child>;
  slug: string;
}) {
  const route = `/${category}/${slug}`;

  // Create route-specific logger
  const routeLogger = reqLogger.child({ route });

  // Section: Category Validation
  if (!isValidCategory(category)) {
    routeLogger.warn('Invalid category in detail page', {
      section: 'category-validation',
    });
    notFound();
  }

  // Type narrowing: category is now a valid category enum
  const validCategory = category;
  const config = getCategoryConfig(validCategory);
  if (!config) {
    // logger.error() normalizes errors internally, so pass raw error
    routeLogger.error('DetailPage: missing category config', new Error('Category config is null'), {
      section: 'category-validation',
    });
    notFound();
  }

  // Section: Core Content Fetch
  // Fetch core content in Suspense boundary to enable progressive rendering
  // This allows the page shell to render while content loads
  const coreData = await getContentDetailCore({ category, slug });

  if (!coreData) {
    // Content may not exist (deleted, never existed, or invalid slug)
    // This is expected behavior during build-time static generation when generateStaticParams
    // generates paths for content that may have been removed from the database
    // During build, missing content is expected - only log at debug level
    // During runtime, log at warn level to catch real issues (except in production where it's also expected)
    const suppressMissingContentWarning =
      env.NEXT_PHASE === 'phase-production-build' || env.VERCEL_ENV === 'production';

    if (suppressMissingContentWarning) {
      routeLogger.debug('DetailPage: content not found during build/production (expected)', {
        section: 'core-content-fetch',
        category,
        slug,
      });
    } else {
      routeLogger.warn(
        'DetailPage: get_content_detail_core returned null - content may not exist',
        {
          section: 'core-content-fetch',
          category,
          slug,
        }
      );
    }
    notFound();
  }

  const fullItem = coreData.content as Database['public']['Tables']['content']['Row'] | null;

  // Null safety: If content doesn't exist in database, return 404
  if (!fullItem) {
    routeLogger.warn('Content not found in RPC response', {
      section: 'core-content-fetch',
      rpcFunction: 'get_content_detail_core',
    });
    notFound();
  }

  routeLogger.info('DetailPage: core content loaded', {
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
  routeLogger.info('DetailPage: page render completed', {
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

      <Pulse variant="view" category={validCategory} slug={slug} />
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
          ('display_title' in fullItem && typeof fullItem.display_title === 'string'
            ? fullItem.display_title
            : undefined) ??
          ('title' in fullItem && typeof fullItem.title === 'string'
            ? fullItem.title
            : undefined) ??
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
