/**
 * Guides Detail Page - Database-First Architecture
 * Unified with main content detail pages using get_enriched_content() RPC
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReadProgress } from '@/src/components/content/read-progress';
import { UnifiedDetailPage } from '@/src/components/content/unified-detail-page';
import { BreadcrumbSchema } from '@/src/components/infra/structured-data/breadcrumb-schema';
import { UnifiedStructuredData } from '@/src/components/infra/structured-data/unified-structured-data';
import { UnifiedTracker } from '@/src/components/infra/unified-tracker';
import { APP_CONFIG } from '@/src/lib/constants';
import {
  type ContentItem,
  getContentBySlug,
  getFullContentBySlug,
} from '@/src/lib/content/supabase-content-loader';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const revalidate = 21600; // 6 hours

export async function generateStaticParams() {
  // Guides are now in database - no static params needed
  // Dynamic rendering with ISR revalidation
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;

  // Construct guides slug format: "category/slug"
  const guideSlug = `${category}/${slug}`;

  const itemMeta = await getContentBySlug('guides', guideSlug);

  return generatePageMetadata('/guides/:category/:slug', {
    params: { category, slug },
    item: itemMeta as any,
    category,
    slug,
  });
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  // Construct guides slug format: "category/slug" (e.g., "tutorials/desktop-mcp-setup")
  const guideSlug = `${category}/${slug}`;

  logger.info('Guide detail page accessed', {
    category,
    slug,
    guideSlug,
  });

  // Load item metadata for validation
  const itemMeta = await getContentBySlug('guides', guideSlug);

  if (!itemMeta) {
    logger.warn('Guide not found', { category, slug, guideSlug });
    notFound();
  }

  // Load full content from database
  const fullItem = await getFullContentBySlug('guides', guideSlug);
  const itemData = (fullItem || itemMeta) as ContentItem;

  // Analytics data already included in itemMeta from get_enriched_content() RPC
  const viewCount =
    'viewCount' in itemMeta && typeof itemMeta.viewCount === 'number' ? itemMeta.viewCount : 0;
  const relatedItems: ContentItem[] = [];

  // Breadcrumb name
  const breadcrumbName =
    fullItem && 'display_title' in fullItem ? fullItem.display_title : itemData.title;

  return (
    <>
      <ReadProgress />

      <UnifiedTracker variant="view" category="guides" slug={guideSlug} />
      <UnifiedTracker variant="page-view" category="guides" slug={guideSlug} />
      <UnifiedStructuredData item={fullItem || itemData} />
      <BreadcrumbSchema
        items={[
          {
            name: 'Guides',
            url: `${APP_CONFIG.url}/guides`,
          },
          {
            name: category,
            url: `${APP_CONFIG.url}/guides/${category}`,
          },
          {
            name: breadcrumbName || slug,
            url: `${APP_CONFIG.url}/guides/${category}/${slug}`,
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
