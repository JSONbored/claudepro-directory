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
 * Generate static params for popular/recent content items
 * Pre-renders top 50 items per category at build time for optimal SEO and performance
 *
 * Strategy: Pre-render popular content (most likely to be accessed) while allowing
 * other content to be rendered on-demand via ISR. This balances build time with performance.
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
// Use string literals instead of array indices to avoid brittleness if enum order changes
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

function mapCategoryToRecentlyViewed(category: string): RecentlyViewedCategory | null {
  return CATEGORY_TO_RECENTLY_VIEWED[category] ?? null;
}

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
    const isBuildTime = process.env['NEXT_PHASE'] === 'phase-production-build' || 
                        process.env['NEXT_PUBLIC_VERCEL_ENV'] === undefined;
    
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

  // Content detail tabs - static default
  // Set to false to disable tabbed layout, true to enable
  const tabsEnabled = false;

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
        return (
          <RecentlyViewedTracker
            category={recentlyViewedCategory}
            slug={slug}
            title={
              ('display_title' in fullItem && typeof fullItem.display_title === 'string' ? fullItem.display_title : undefined) ??
              ('title' in fullItem && typeof fullItem.title === 'string' ? fullItem.title : undefined) ??
              slug
            }
            description={fullItem.description}
            {...(() => {
              const itemTags =
                'tags' in fullItem ? ensureStringArray(fullItem.tags).slice(0, 3) : [];
              return itemTags.length > 0 ? { tags: itemTags } : {};
            })()}
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
          category === Constants.public.Enums.content_category[8] &&
          fullItem.category === Constants.public.Enums.content_category[8] ? (
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
