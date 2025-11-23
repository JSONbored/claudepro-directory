/**
 * Dynamic detail pages for all content categories
 * Optimized: Uses get_content_detail_complete() RPC (2-3 calls → 1, 50-67% reduction)
 */

import type { Database } from '@heyclaude/database-types';
// NOTE: featureFlags is NOT imported at module level to avoid flags/next accessing
// Vercel Edge Config during module initialization. It's lazy-loaded in the component
// only when the page is actually rendered (runtime, not build-time).
import {
  ensureStringArray,
  generatePageMetadata,
  getCategoryConfig,
  getContentByCategory,
  getContentDetailComplete,
  isBuildTime,
  isValidCategory,
  logger,
  normalizeError,
  VALID_CATEGORIES,
} from '@heyclaude/web-runtime';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CollectionDetailView } from '@/src/components/content/detail-page/collection-view';
import { UnifiedDetailPage } from '@/src/components/content/detail-page/content-detail-view';
import { ReadProgress } from '@/src/components/content/read-progress';
import { Pulse } from '@/src/components/core/infra/pulse';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { RecentlyViewedTracker } from '@/src/components/features/navigation/recently-viewed-tracker';
import type { RecentlyViewedCategory } from '@/src/hooks/use-recently-viewed';

export const revalidate = false; // Static generation - zero database egress during serving

export async function generateStaticParams() {
  try {
    const allParams: Array<{ category: string; slug: string }> = [];

    for (const category of VALID_CATEGORIES) {
      try {
        const items = await getContentByCategory(category);

        for (const item of items) {
          if (item.slug) {
            allParams.push({
              category,
              slug: item.slug,
            });
          }
        }
      } catch (error) {
        const normalized = normalizeError(
          error,
          'getContentByCategory error in generateStaticParams'
        );
        logger.error('getContentByCategory error in generateStaticParams', normalized, {
          category,
          phase: 'build-time',
          route: '[category]/[slug]/page.tsx',
        });
        // Continue with next category (partial build better than full failure)
      }
    }

    return allParams;
  } catch (error) {
    const normalized = normalizeError(error, 'generateStaticParams error in [category]/[slug]');
    logger.error('generateStaticParams error in [category]/[slug]', normalized, {
      phase: 'build-time',
      route: '[category]/[slug]/page.tsx',
    });
    // Return empty array (prevents build failure, skips detail pages)
    return [];
  }
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

  // Consolidated RPC: 2-3 calls → 1 (50-67% reduction)
  // get_content_detail_complete() includes: content + analytics + related items + collection items
  // Use anon client for ISR/static generation (no cookies/auth)
  const detailData = await getContentDetailComplete({ category, slug });

  if (!detailData) {
    const normalized = normalizeError(
      'Content detail data is null',
      'DetailPage: get_content_detail_complete returned null'
    );
    logger.error('DetailPage: get_content_detail_complete returned null', normalized, {
      category,
      slug,
    });
    notFound();
  }

  // detailData.content is Json | null, but we know it's a content table row
  // Use generated type directly (tags/features/use_cases are already text[] in database)
  const fullItem = detailData.content as Database['public']['Tables']['content']['Row'] | null;
  const { analytics, related } = detailData;

  // Null safety: If content doesn't exist in database, return 404
  if (!fullItem) {
    logger.warn('Content not found in RPC response', {
      category,
      slug,
      rpcFunction: 'get_content_detail_complete',
      phase: 'page-render',
    });
    notFound();
  }

  const viewCount = analytics?.view_count || 0;
  const copyCount = analytics?.copy_count || 0;
  const relatedItems = related || [];

  // Lazy-load feature flags at render-time (runtime, not build-time)
  // Use defaults during static generation to avoid Edge Config access
  let tabsEnabled = false;
  let recentlyViewedEnabled = false;

  if (!isBuildTime()) {
    try {
      // Lazy-load featureFlags only at runtime (not during build)
      const { featureFlags } = await import('@heyclaude/web-runtime');
      tabsEnabled = await featureFlags.contentDetailTabs();
      recentlyViewedEnabled = await featureFlags.recentlyViewed();
    } catch (error) {
      // Fallback to defaults on error (prevents page failure)
      const normalized = normalizeError(error, 'Failed to load feature flags');
      logger.warn('DetailPage: feature flags load failed, using defaults', {
        category,
        slug,
        error: normalized.message,
      });
    }
  }

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

      {/* Recently Viewed Tracking - gated by feature flag */}
      {recentlyViewedEnabled && (
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
      )}

      <UnifiedDetailPage
        item={fullItem}
        relatedItems={relatedItems}
        viewCount={viewCount}
        copyCount={copyCount}
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
