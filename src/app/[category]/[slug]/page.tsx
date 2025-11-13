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
} from '@/src/lib/config/category-config';
import { type ContentItem, getContentByCategory } from '@/src/lib/content/supabase-content-loader';
import { featureFlags } from '@/src/lib/flags';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
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

  // Use consolidated RPC for metadata (anon client for ISR/static generation)
  const data = await cachedRPCWithDedupe(
    'get_content_detail_complete',
    {
      p_category: category,
      p_slug: slug,
    },
    {
      tags: ['content', `content-${slug}`],
      ttlConfigKey: 'cache.content_detail.ttl_seconds',
      keySuffix: `${category}-${slug}`,
    }
  );

  const itemMeta = data ? (data as { content: ContentItem }).content : null;

  if (!itemMeta) {
    logger.warn('No content found in generateMetadata', {
      category,
      slug,
      phase: 'generateMetadata',
      hasData: !!data,
    });
  }

  const config = await getCategoryConfig(category as CategoryId);

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

  const config = await getCategoryConfig(category as CategoryId);
  if (!config) {
    logger.warn('No category config found', { category, slug });
    notFound();
  }

  // Consolidated RPC: 2-3 calls → 1 (50-67% reduction)
  // get_content_detail_complete() includes: content + analytics + related items + collection items
  // Use anon client for ISR/static generation (no cookies/auth)
  const detailData = await cachedRPCWithDedupe(
    'get_content_detail_complete',
    {
      p_category: category,
      p_slug: slug,
    },
    {
      tags: ['content', `content-${slug}`],
      ttlConfigKey: 'cache.content_detail.ttl_seconds',
      keySuffix: `${category}-${slug}`,
    }
  );

  if (!detailData) {
    logger.warn('No content data returned from RPC', {
      category,
      slug,
      rpcFunction: 'get_content_detail_complete',
      phase: 'page-render',
    });
    notFound();
  }

  // Extract data from RPC response (returns Json type, cast to expected structure)
  const response = detailData as Record<string, unknown>;
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
