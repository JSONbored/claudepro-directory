/**
 * Dynamic detail pages for all content categories
 * Optimized: Uses get_content_detail_complete() RPC (2-3 calls → 1, 50-67% reduction)
 */

import { notFound } from 'next/navigation';
import { ReadProgress } from '@/src/components/content/read-progress';
import { UnifiedDetailPage } from '@/src/components/content/unified-detail-page';
import { CollectionDetailView } from '@/src/components/content/unified-detail-page/collection-detail-view';
import { BreadcrumbSchema } from '@/src/components/infra/structured-data/breadcrumb-schema';
import { UnifiedStructuredData } from '@/src/components/infra/structured-data/unified-structured-data';
import { UnifiedTracker } from '@/src/components/infra/unified-tracker';
import {
  type CategoryId,
  getCategoryConfig,
  isValidCategory,
  VALID_CATEGORIES,
} from '@/src/lib/config/category-config';
import { APP_CONFIG } from '@/src/lib/constants';
import { type ContentItem, getContentByCategory } from '@/src/lib/content/supabase-content-loader';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import type { Database } from '@/src/types/database.types';

export const revalidate = 21600;

export async function generateStaticParams() {
  const allParams: Array<{ category: string; slug: string }> = [];

  for (const category of VALID_CATEGORIES) {
    const items = await getContentByCategory(category);

    for (const item of items) {
      allParams.push({
        category,
        slug: item.slug,
      });
    }
  }

  return allParams;
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
  const supabase = createAnonClient();
  const { data } = await supabase.rpc('get_content_detail_complete', {
    p_category: category,
    p_slug: slug,
  });

  const itemMeta = data ? (data as { content: ContentItem }).content : null;
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
    notFound();
  }

  logger.info('Detail page accessed', {
    category,
    slug,
    validated: true,
  });

  // Consolidated RPC: 2-3 calls → 1 (50-67% reduction)
  // get_content_detail_complete() includes: content + analytics + related items + collection items
  // Use anon client for ISR/static generation (no cookies/auth)
  const supabase = createAnonClient();
  const { data: detailData, error: detailError } = await supabase.rpc(
    'get_content_detail_complete',
    {
      p_category: category,
      p_slug: slug,
    }
  );

  if (detailError || !detailData) {
    logger.warn('Item not found', { category, slug });
    notFound();
  }

  // Extract data from RPC response (returns Json type, cast to expected structure)
  const response = detailData as Record<string, unknown>;
  const fullItem = response.content as ContentItem;
  const itemData = fullItem;
  const analytics = response.analytics as { view_count: number } | null;
  const viewCount = analytics?.view_count || 0;
  const relatedItems = (response.related as ContentItem[]) || [];

  // No transformation needed - displayTitle computed at build time
  // This eliminates runtime overhead and follows DRY principles

  // Type-safe breadcrumb name with discriminated union
  const breadcrumbName =
    fullItem && 'display_title' in fullItem ? fullItem.display_title : itemData.title;

  // Conditional rendering: Collections use specialized CollectionDetailView
  // TypeScript narrows fullItem type based on category check
  if (category === 'collections' && fullItem && fullItem.category === 'collections') {
    return (
      <>
        {/* Read Progress Bar - Shows reading progress at top of page */}
        <ReadProgress />

        <UnifiedTracker variant="view" category={category} slug={slug} />
        <UnifiedTracker variant="page-view" category={category} slug={slug} />
        <UnifiedStructuredData item={fullItem} />
        <BreadcrumbSchema
          items={[
            {
              name: config.title || category,
              url: `${APP_CONFIG.url}/${category}`,
            },
            {
              name: breadcrumbName || slug,
              url: `${APP_CONFIG.url}/${category}/${slug}`,
            },
          ]}
        />
        <CollectionDetailView
          collection={
            fullItem as Database['public']['Tables']['content']['Row'] & { category: 'collections' }
          }
        />
      </>
    );
  }

  // Default rendering: All other categories use UnifiedDetailPage
  return (
    <>
      {/* Read Progress Bar - Shows reading progress at top of page */}
      <ReadProgress />

      <UnifiedTracker variant="view" category={category} slug={slug} />
      <UnifiedTracker variant="page-view" category={category} slug={slug} />
      <UnifiedStructuredData item={fullItem || itemData} />
      <BreadcrumbSchema
        items={[
          {
            name: config.title || category,
            url: `${APP_CONFIG.url}/${category}`,
          },
          {
            name: breadcrumbName || slug,
            url: `${APP_CONFIG.url}/${category}/${slug}`,
          },
        ]}
      />
      <UnifiedDetailPage
        item={fullItem || itemData}
        relatedItems={relatedItems}
        viewCount={viewCount}
      />
    </>
  );
}
