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
  const { getContentDetailCore } = await import('@heyclaude/web-runtime/server');
  const { logger, createWebAppContextWithId, generateRequestId, normalizeError } = await import(
    '@heyclaude/web-runtime/core'
  );

  const categories = getHomepageCategoryIds;
  const parameters: Array<{ category: string; slug: string }> = [];

  // Limit to top 50 items per category to balance build time vs. performance
  const MAX_ITEMS_PER_CATEGORY = 50;
  // Process validations in parallel batches to optimize build performance
  // Using 16 to match Next.js staticGenerationMaxConcurrency setting
  const VALIDATION_BATCH_SIZE = 16;

  // Process all categories in parallel
  const categoryResults = await Promise.allSettled(
    categories.map(async (category) => {
      try {
        const items = await getContentByCategory(category);
        const topItems = items.slice(0, MAX_ITEMS_PER_CATEGORY);

        // Process validations in parallel batches
        const categoryParameters: Array<{ category: string; slug: string }> = [];
        
        // Process items in batches to avoid overwhelming the database
        for (let index = 0; index < topItems.length; index += VALIDATION_BATCH_SIZE) {
          const batch = topItems.slice(index, index + VALIDATION_BATCH_SIZE);
          
          // Validate all items in the batch in parallel
          const validationResults = await Promise.allSettled(
            batch.map(async (item) => {
              if (!item.slug) {
                return null;
              }
              
              try {
                // Verify content exists before adding to static params
                const coreData = await getContentDetailCore({ category, slug: item.slug });
                if (coreData?.content) {
                  return { category, slug: item.slug };
                } else {
                  // Content doesn't exist - skip it (may have been deleted)
                   
                  const validationRequestId = generateRequestId();
                   
                  const validationLogContext = createWebAppContextWithId(
                    validationRequestId,
                    `/${category}/${item.slug}`,
                    'generateStaticParams',
                    {
                      category,
                      slug: item.slug,
                      section: 'static-params-validation',
                    }
                  );
                  logger.warn(
                    'generateStaticParams: skipping non-existent content',
                    undefined,
                    {
                      ...validationLogContext,
                      requestId: validationRequestId,
                      operation: 'generateStaticParams',
                    }
                  );
                  return null;
                }
              } catch (validationError) {
                // If validation fails, skip this item but continue with others
                 
                const catchRequestId = generateRequestId();
                 
                const logContext = createWebAppContextWithId(
                  catchRequestId,
                  `/${category}/${item.slug}`,
                  'generateStaticParams',
                  {
                    category,
                    slug: item.slug,
                    section: 'static-params-validation',
                  }
                );
                const normalized = normalizeError(
                  validationError,
                  'generateStaticParams: failed to validate content, skipping'
                );
                logger.error('generateStaticParams: failed to validate content, skipping', normalized, {
                  ...logContext,
                  requestId: catchRequestId,
                  operation: 'generateStaticParams',
                });
                return null;
              }
            })
          );

          // Collect successful validations from this batch
          for (const result of validationResults) {
            if (result.status === 'fulfilled' && result.value) {
              categoryParameters.push(result.value);
            }
          }
        }

        return { category, params: categoryParameters };
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
          requestId: staticParamsRequestId,
          operation: 'generateStaticParams',
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
import {
  createWebAppContextWithId,
  ensureStringArray,
  generateRequestId,
  isValidCategory,
  logger,
  normalizeError,
  withDuration,
} from '@heyclaude/web-runtime/core';
import type { RecentlyViewedCategory } from '@heyclaude/web-runtime/hooks';
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
    // Content may not exist (deleted, never existed, or invalid slug)
    // This is expected behavior during build-time static generation when generateStaticParams
    // generates paths for content that may have been removed from the database
    logger.warn(
      'DetailPage: get_content_detail_core returned null - content may not exist',
      undefined,
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
