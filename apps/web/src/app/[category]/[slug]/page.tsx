/**
 * Dynamic detail pages for all content categories
 * Optimized: Uses get_content_detail_complete() RPC (2-3 calls → 1, 50-67% reduction)
 */

import type { Database } from '@heyclaude/database-types';
import {
  ensureStringArray,
  isValidCategory,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
// NOTE: featureFlags is NOT imported at module level to avoid flags/next accessing
// Vercel Edge Config during module initialization. It's lazy-loaded in the component
// only when the page is actually rendered (runtime, not build-time).
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

  let config: Awaited<ReturnType<typeof getCategoryConfig>> | null = null;
  try {
    config = await getCategoryConfig(category as Database['public']['Enums']['content_category']);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load category config for metadata');
    logger.error('DetailPage: category config lookup failed', normalized, {
      category,
      slug,
      phase: 'generateMetadata',
    });
  }

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

  if (!isValidCategory(category)) {
    logger.warn('Invalid category in detail page', { category, slug });
    notFound();
  }

  let config: Awaited<ReturnType<typeof getCategoryConfig>> | null = null;
  try {
    config = await getCategoryConfig(category as Database['public']['Enums']['content_category']);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load category config');
    logger.error('DetailPage: category config lookup threw', normalized, {
      category,
      slug,
    });
  }
  if (!config) {
    const normalized = normalizeError(
      'Category config is null',
      'DetailPage: missing category config'
    );
    logger.error('DetailPage: missing category config', normalized, {
      category,
      slug,
    });
    notFound();
  }

  // Optimized for PPR: Split core content (critical) from analytics/related (deferred)
  // 1. Fetch Core Content (Blocking - for LCP)
  const coreData = await getContentDetailCore({ category, slug });

  if (!coreData) {
    const normalized = normalizeError(
      'Content detail core data is null',
      'DetailPage: get_content_detail_core returned null'
    );
    logger.error('DetailPage: get_content_detail_core returned null', normalized, {
      category,
      slug,
    });
    notFound();
  }

  const fullItem = coreData.content as Database['public']['Tables']['content']['Row'] | null;

  // Null safety: If content doesn't exist in database, return 404
  if (!fullItem) {
    logger.warn('Content not found in RPC response', {
      category,
      slug,
      rpcFunction: 'get_content_detail_core',
      phase: 'page-render',
    });
    notFound();
  }

  // 2. Fetch Analytics & Related (Non-blocking promise - for Suspense)
  const analyticsPromise = getContentAnalytics({ category, slug });

  const viewCountPromise = analyticsPromise.then((data) => data?.view_count || 0);
  const copyCountPromise = analyticsPromise.then((data) => data?.copy_count || 0);

  const relatedItemsPromise = getRelatedContent({
    currentPath: `/${category}/${slug}`,
    currentCategory: category,
    currentTags: 'tags' in fullItem ? ensureStringArray(fullItem.tags) : [],
  }).then((res) => res.items);

  // Use defaults during static generation/ISR
  // For client-side toggling, components should use useFeatureFlags() hook
  const tabsEnabled = true;

  // No transformation needed - displayTitle computed at build time
  // This eliminates runtime overhead and follows DRY principles

  // Unified rendering: All categories use UnifiedDetailPage
  // Collections pass their specialized sections via collectionSections prop
  return (
    <>
      {/* Read Progress Bar - Shows reading progress at top of page */}
      <ReadProgress />

      <Pulse variant="view" category={category} slug={slug} />
      <Pulse variant="page-view" category={category} slug={slug} />
      <StructuredData route={`/${category}/${slug}`} />

      {/* Recently Viewed Tracking */}
      <RecentlyViewedTracker
        category={category as RecentlyViewedCategory}
        slug={slug}
        title={
          ('display_title' in fullItem && fullItem.display_title) ||
          ('title' in fullItem && fullItem.title) ||
          slug
        }
        description={fullItem.description}
        {...(() => {
          const itemTags = 'tags' in fullItem ? ensureStringArray(fullItem.tags).slice(0, 3) : [];
          return itemTags.length ? { tags: itemTags } : {};
        })()}
      />

      <UnifiedDetailPage
        item={fullItem}
        viewCountPromise={viewCountPromise}
        copyCountPromise={copyCountPromise}
        relatedItemsPromise={relatedItemsPromise}
        tabsEnabled={tabsEnabled}
        collectionSections={
          category === 'collections' && fullItem && fullItem.category === 'collections' ? (
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
