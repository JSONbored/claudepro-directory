/**
 * Dynamic detail pages for all content categories
 * Optimized: Uses get_content_detail_complete() RPC (2-3 calls → 1, 50-67% reduction)
 */

import { notFound } from 'next/navigation';
import { CollectionDetailView } from '@/src/components/content/detail-page/collection-view';
import { UnifiedDetailPage } from '@/src/components/content/detail-page/content-detail-view';
import { ReadProgress } from '@/src/components/content/read-progress';
import { Pulse } from '@/src/components/core/infra/pulse';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { RecentlyViewedTracker } from '@/src/components/features/navigation/recently-viewed-tracker';
import type { RecentlyViewedCategory } from '@/src/hooks/use-recently-viewed';
import {
  type ContentCategory,
  getCategoryConfig,
  isValidCategory,
  VALID_CATEGORIES,
} from '@/src/lib/data/config/category';
import { getContentByCategory } from '@/src/lib/data/content';
import { getContentDetailComplete } from '@/src/lib/data/content/detail';
// NOTE: featureFlags is NOT imported at module level to avoid flags/next accessing
// Vercel Edge Config during module initialization. It's lazy-loaded in the component
// only when the page is actually rendered (runtime, not build-time).
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { ensureStringArray } from '@/src/lib/utils/data.utils';
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

  let config: Awaited<ReturnType<typeof getCategoryConfig>> | null = null;
  try {
    config = await getCategoryConfig(category as ContentCategory);
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
    config = await getCategoryConfig(category as ContentCategory);
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

  // detailData is already typed as GetGetContentDetailCompleteReturn | null
  const { content: fullItem, analytics, related } = detailData;

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

  // Check feature flags (lazy-loaded to avoid Edge Config access during build)
  // CRITICAL: Check build-time BEFORE importing flags.ts to prevent Edge Config access
  const { isBuildTime } = await import('@/src/lib/utils/build-time');

  let tabsEnabled = false;
  let recentlyViewedEnabled = false;

  // CRITICAL: NEVER import flags.ts during build-time static generation
  // Even with isBuildTime() checks, Next.js analyzes the module and sees require('flags/next')
  // which triggers Edge Config access. Always use defaults during build.
  if (!isBuildTime()) {
    // Only import flags.ts at runtime (not during build)
    const { featureFlags } = await import('@/src/lib/flags');
    tabsEnabled = await featureFlags.contentDetailTabs();
    recentlyViewedEnabled = await featureFlags.recentlyViewed();
  }
  // During build-time, tabsEnabled and recentlyViewedEnabled remain false (defaults)

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
          {...('tags' in fullItem
            ? (() => {
                const tags = ensureStringArray(fullItem.tags).slice(0, 3);
                return tags.length ? { tags } : {};
              })()
            : {})}
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
