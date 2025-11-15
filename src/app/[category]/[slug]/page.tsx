/**
 * Dynamic detail pages for all content categories
 * Optimized: Uses get_content_detail_complete() RPC (2-3 calls → 1, 50-67% reduction)
 */

import { notFound } from 'next/navigation';
import { CollectionDetailView } from '@/src/components/content/detail-page/collection-view';
import { UnifiedDetailPage } from '@/src/components/content/detail-page/content-detail-view';
import { ReadProgress } from '@/src/components/content/read-progress';
import { UnifiedTracker } from '@/src/components/core/infra/analytics-tracker';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { RecentlyViewedTracker } from '@/src/components/features/navigation/recently-viewed-tracker';
import type { RecentlyViewedCategory } from '@/src/hooks/use-recently-viewed';
import {
  type CategoryId,
  getCategoryConfig,
  isValidCategory,
  VALID_CATEGORIES,
} from '@/src/lib/data/config/category';
import { type ContentItem, getContentByCategory } from '@/src/lib/data/content';
import { type ContentDetailResult, getContentDetailComplete } from '@/src/lib/data/content/detail';
import { featureFlags } from '@/src/lib/flags';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

export const revalidate = false; // Static generation - zero database egress during serving

export async function generateStaticParams() {
  try {
    const allParams: Array<{ category: string; slug: string }> = [];

    for (const category of VALID_CATEGORIES) {
      try {
        const items = await getContentByCategory(category);

        for (const item of items) {
          allParams.push({
            category,
            slug: item.slug,
          });
        }
      } catch (error) {
        logger.error(
          'getContentByCategory error in generateStaticParams',
          error instanceof Error ? error : new Error(String(error)),
          {
            category,
            phase: 'build-time',
            route: '[category]/[slug]/page.tsx',
          }
        );
        // Continue with next category (partial build better than full failure)
      }
    }

    return allParams;
  } catch (error) {
    logger.error(
      'generateStaticParams error in [category]/[slug]',
      error instanceof Error ? error : new Error(String(error)),
      {
        phase: 'build-time',
        route: '[category]/[slug]/page.tsx',
      }
    );
    // Return empty array (prevents build failure, skips detail pages)
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  // Validate category at compile time
  if (!isValidCategory(category)) {
    return generatePageMetadata('/:category/:slug', {
      params: { category, slug },
    });
  }

  let itemMeta: ContentItem | null = null;
  try {
    const data = await getContentDetailComplete({ category, slug });
    itemMeta = data?.content ?? null;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load content detail for metadata');
    logger.error('DetailPage: metadata RPC threw', normalized, {
      category,
      slug,
    });
  }

  if (!itemMeta) {
    logger.warn('No content found in generateMetadata', {
      category,
      slug,
      phase: 'generateMetadata',
      hasData: false,
    });
  }

  let config: Awaited<ReturnType<typeof getCategoryConfig>> | null = null;
  try {
    config = await getCategoryConfig(category as CategoryId);
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
    item: itemMeta ?? undefined,
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
    config = await getCategoryConfig(category as CategoryId);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load category config');
    logger.error('DetailPage: category config lookup threw', normalized, {
      category,
      slug,
    });
  }
  if (!config) {
    logger.error('DetailPage: missing category config', new Error('Category config is null'), {
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
    logger.error(
      'DetailPage: get_content_detail_complete returned null',
      new Error('Content detail data is null'),
      {
        category,
        slug,
      }
    );
    notFound();
  }

  // Extract data from RPC response (returns Json type, cast to expected structure)
  const response = detailData as ContentDetailResult;
  const fullItem = response.content as ContentItem;
  const itemData = fullItem;

  // Null safety: If content doesn't exist in database, return 404
  if (!fullItem) {
    logger.warn('Content not found in RPC response', {
      category,
      slug,
      rpcFunction: 'get_content_detail_complete',
      phase: 'page-render',
      hasResponse: !!response,
    });
    notFound();
  }

  const analytics = response.analytics as { view_count: number; copy_count: number } | null;
  const viewCount = analytics?.view_count || 0;
  const copyCount = analytics?.copy_count || 0;
  const relatedItems = (response.related as ContentItem[]) || [];

  // Check feature flags
  const tabsEnabled = await featureFlags.contentDetailTabs();
  const recentlyViewedEnabled = await featureFlags.recentlyViewed();

  // No transformation needed - displayTitle computed at build time
  // This eliminates runtime overhead and follows DRY principles

  // Unified rendering: All categories use UnifiedDetailPage
  // Collections pass their specialized sections via collectionSections prop
  return (
    <>
      {/* Read Progress Bar - Shows reading progress at top of page */}
      <ReadProgress />

      <UnifiedTracker variant="view" category={category} slug={slug} />
      <UnifiedTracker variant="page-view" category={category} slug={slug} />
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
          {...('tags' in fullItem &&
          Array.isArray(fullItem.tags) &&
          fullItem.tags.length > 0 &&
          fullItem.tags.every((tag) => typeof tag === 'string')
            ? { tags: (fullItem.tags as string[]).slice(0, 3) }
            : {})}
        />
      )}

      <UnifiedDetailPage
        item={fullItem || itemData}
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
