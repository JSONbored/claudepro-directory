/**
 * Dynamic detail pages for all content categories
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
import {
  type ContentItem,
  getContentByCategory,
  getContentBySlug,
  getFullContentBySlug,
} from '@/src/lib/content/supabase-content-loader';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
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

  const itemMeta = await getContentBySlug(category, slug);
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

  // Load item metadata first for validation
  const itemMeta = await getContentBySlug(category, slug);

  if (!itemMeta) {
    logger.warn('Item not found', { category, slug });
    notFound();
  }

  // Optimized fetch strategy: Load full content from individual table (ALL fields)
  // Use getFullContentBySlug to get category-specific fields like configuration, content, etc.
  const fullItem = await getFullContentBySlug(category, slug);
  const itemData = (fullItem || itemMeta) as ContentItem; // Fallback to metadata if full item fails

  // Analytics data already included in itemMeta from get_enriched_content() RPC
  // No need for separate mv_analytics_summary query
  const viewCount =
    'viewCount' in itemMeta && typeof itemMeta.viewCount === 'number' ? itemMeta.viewCount : 0;
  const relatedItems: ContentItem[] = [];

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
