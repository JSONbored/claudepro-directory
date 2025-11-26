/**
 * Dynamic detail pages for all content categories
 * Optimized: Uses getContentDetailCore() to split core content (blocking) from analytics/related (deferred)
 * for Partial Prerendering (PPR) - enables faster LCP by prioritizing critical content
 *
 * ISR: 2 hours (7200s) - Detail pages change less frequently than list pages
 */
export const revalidate = 7200;
// eslint-disable-next-line unicorn/prevent-abbreviations -- Next.js API requires this exact name
export const dynamicParams = true; // Allow unknown slugs to be rendered on demand (will 404 if invalid)

/**
 * Generate static params for popular/recent content items
 * Pre-renders top 50 items per category at build time for optimal SEO and performance
 *
 * Strategy: Pre-render popular content (most likely to be accessed) while allowing
 * other content to be rendered on-demand via ISR. This balances build time with performance.
 */
// eslint-disable-next-line unicorn/prevent-abbreviations -- Next.js API requires this exact name
export async function generateStaticParams() {
  const { getHomepageCategoryIds } = await import('@heyclaude/web-runtime/data/config/category');
  const { getContentByCategory } = await import('@heyclaude/web-runtime/data/content');
  const { logger, createWebAppContextWithId, generateRequestId, normalizeError } = await import(
    '@heyclaude/web-runtime/core'
  );

  const categories = getHomepageCategoryIds;
  const parameters: Array<{ category: string; slug: string }> = [];

  // Limit to top 50 items per category to balance build time vs. performance
  const MAX_ITEMS_PER_CATEGORY = 50;

  for (const category of categories) {
    try {
      const items = await getContentByCategory(category);
      const topItems = items.slice(0, MAX_ITEMS_PER_CATEGORY);

      for (const item of topItems) {
        if (item.slug) {
          parameters.push({ category, slug: item.slug });
        }
      }
    } catch (error) {
      // Log error but continue with other categories
      // Generate requestId for static params generation (separate from page render)
      // eslint-disable-next-line unicorn/prevent-abbreviations -- Must match architectural rule expectation
      const staticParamsRequestId = generateRequestId();
      // eslint-disable-next-line unicorn/prevent-abbreviations -- Must match architectural rule expectation
      const staticParamsLogContext = createWebAppContextWithId(
        staticParamsRequestId,
        `/${category}`,
        'generateStaticParams',
        {
          category,
        }
      );
      const normalized = normalizeError(
        error,
        'Failed to load content for category in generateStaticParams'
      );
      logger.error('generateStaticParams: failed to load content for category', normalized, {
        ...staticParamsLogContext,
        section: 'static-params-generation',
      });
    }
  }

  return parameters;
}

import { Constants, type Database } from '@heyclaude/database-types';
import {
  createWebAppContextWithId,
  ensureStringArray,
  generateRequestId,
  isValidCategory,
  logger,
  normalizeError,
  withDuration,
} from '@heyclaude/web-runtime/core';
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
import type { RecentlyViewedCategory } from '@/src/hooks/use-recently-viewed';

// Map route categories (plural) to RecentlyViewedCategory (singular)
function mapCategoryToRecentlyViewed(category: string): RecentlyViewedCategory | null {
  // Use Constants for enum values
  const mapping: Record<string, RecentlyViewedCategory> = {
    [Constants.public.Enums.content_category[0]]: 'agent', // agents
    [Constants.public.Enums.content_category[3]]: 'command', // commands
    [Constants.public.Enums.content_category[4]]: 'hook', // hooks
    [Constants.public.Enums.content_category[1]]: 'mcp', // mcp
    [Constants.public.Enums.content_category[2]]: 'rule', // rules
    [Constants.public.Enums.content_category[5]]: 'statusline', // statuslines
    [Constants.public.Enums.content_category[6]]: 'skill', // skills
    [Constants.public.Enums.content_category[9]]: 'job', // jobs
    job: 'job',
  };
  return mapping[category] ?? null;
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
  const startTime = Date.now();
  const { category, slug } = await params;

  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(requestId, `/${category}/${slug}`, 'DetailPage', {
    category,
    slug,
  });

  // Section: Category Validation
  const validationSectionStart = Date.now();
  if (!isValidCategory(category)) {
    logger.warn(
      'Invalid category in detail page',
      undefined,
      withDuration(
        {
          ...baseLogContext,
          section: 'category-validation',
        },
        validationSectionStart
      )
    );
    notFound();
  }

  const config = getCategoryConfig(category);
  if (!config) {
    const normalized = normalizeError(
      new Error('Category config is null'),
      'DetailPage: missing category config'
    );
    logger.error(
      'DetailPage: missing category config',
      normalized,
      withDuration(
        {
          ...baseLogContext,
          section: 'category-validation',
          sectionDuration_ms: Date.now() - validationSectionStart,
        },
        startTime
      )
    );
    notFound();
  }

  // Section: Core Content Fetch
  const coreContentSectionStart = Date.now();
  // Optimized for PPR: Split core content (critical) from analytics/related (deferred)
  // 1. Fetch Core Content (Blocking - for LCP)
  const coreData = await getContentDetailCore({ category, slug });

  if (!coreData) {
    const normalized = normalizeError(
      'Content detail core data is null',
      'DetailPage: get_content_detail_core returned null'
    );
    logger.error(
      'DetailPage: get_content_detail_core returned null',
      normalized,
      withDuration(
        {
          ...baseLogContext,
          section: 'core-content-fetch',
          sectionDuration_ms: Date.now() - coreContentSectionStart,
        },
        startTime
      )
    );
    notFound();
  }

  const fullItem = coreData.content as Database['public']['Tables']['content']['Row'] | null;

  // Null safety: If content doesn't exist in database, return 404
  if (!fullItem) {
    logger.warn(
      'Content not found in RPC response',
      undefined,
      withDuration(
        {
          ...baseLogContext,
          section: 'core-content-fetch',
          sectionDuration_ms: Date.now() - coreContentSectionStart,
          rpcFunction: 'get_content_detail_core',
        },
        startTime
      )
    );
    notFound();
  }

  logger.info(
    'DetailPage: core content loaded',
    withDuration(
      {
        ...baseLogContext,
        section: 'core-content-fetch',
      },
      coreContentSectionStart
    )
  );

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

  // Lazy-load feature flags only at runtime (not during static generation)
  // Default to false during static generation/ISR for optimal performance
  let tabsEnabled = false;
  // Only load feature flags when not running on Edge runtime
  // Edge runtime doesn't support dynamic imports of server-only modules
  if (process.env['NEXT_RUNTIME'] !== 'edge') {
    try {
      const { featureFlags } = await import('@heyclaude/web-runtime/feature-flags/flags');
      tabsEnabled = await featureFlags.contentDetailTabs();
    } catch (error) {
      // Gracefully fall back to default if feature flags fail to load
      // This ensures the page still renders during static generation
      const normalized = normalizeError(error, 'feature-flag-load-failed');
      logger.warn(
        'Failed to load contentDetailTabs feature flag, using default',
        undefined,
        withDuration(
          {
            ...baseLogContext,
            section: 'feature-flags-fetch',
            error: normalized.message,
          },
          startTime
        )
      );
    }
  }

  // No transformation needed - displayTitle computed at build time
  // This eliminates runtime overhead and follows DRY principles

  // Final summary log
  logger.info(
    'DetailPage: page render completed',
    withDuration(
      {
        ...baseLogContext,
        section: 'page-render',
        category,
        slug,
      },
      startTime
    )
  );

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
