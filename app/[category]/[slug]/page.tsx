import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ViewTracker } from '@/components/shared/view-tracker';
import { UnifiedStructuredData } from '@/components/structured-data/unified-structured-data';
import { UnifiedDetailPage } from '@/components/unified-detail-page';
import { getCategoryConfig, isValidCategory, VALID_CATEGORIES } from '@/lib/config/category-config';
import { APP_CONFIG } from '@/lib/constants';
import {
  getContentByCategory,
  getContentBySlug,
  getFullContentBySlug,
  getRelatedContent,
} from '@/lib/content-loaders';
import { logger } from '@/lib/logger';
import { transformForDetailPage } from '@/lib/transformers';
import { getDisplayTitle } from '@/lib/utils';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

/**
 * Generate static params for all category/slug combinations
 */
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

/**
 * Generate metadata for detail pages
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;

  // Validate category
  if (!isValidCategory(category)) {
    return {
      title: 'Not Found',
      description: 'The requested content could not be found.',
    };
  }

  const config = getCategoryConfig(category);
  if (!config) {
    return {
      title: 'Not Found',
      description: 'The requested content could not be found.',
    };
  }

  // Load item metadata
  const item = await getContentBySlug(category, slug);

  if (!item) {
    return {
      title: `${config.title} Not Found`,
      description: `The requested ${config.title.toLowerCase()} could not be found.`,
    };
  }

  const displayTitle = getDisplayTitle(item);

  return {
    title: `${displayTitle} - ${config.title} | ${APP_CONFIG.name}`,
    description: item.description,
    keywords: item.tags?.join(', '),
    alternates: {
      canonical: `${APP_CONFIG.url}/${category}/${slug}`,
    },
    openGraph: {
      title: displayTitle,
      description: item.description,
      type: 'article',
      url: `${APP_CONFIG.url}/${category}/${slug}`,
      siteName: APP_CONFIG.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description: item.description,
    },
  };
}

/**
 * Dynamic detail page for all content categories
 */
export default async function DetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  // Validate category
  if (!isValidCategory(category)) {
    logger.warn('Invalid category in detail page', { category, slug });
    notFound();
  }

  const config = getCategoryConfig(category);
  if (!config) {
    notFound();
  }

  logger.info('Detail page accessed', {
    category,
    slug,
    validated: true,
  });

  // Load item metadata
  const itemMeta = await getContentBySlug(category, slug);

  if (!itemMeta) {
    logger.warn('Item not found', { category, slug });
    notFound();
  }

  // Load full content
  const fullItem = await getFullContentBySlug(category, slug);
  const itemData = fullItem || itemMeta;

  // Load related items (same category, different slug)
  const relatedItemsData = await getRelatedContent(category, slug, 3);

  // Transform for component interface
  // Type assertion needed because runtime validation ensures type safety
  const { item, relatedItems } = transformForDetailPage(
    itemData as Parameters<typeof transformForDetailPage>[0],
    relatedItemsData as Parameters<typeof transformForDetailPage>[1]
  );

  return (
    <>
      <ViewTracker
        category={category as 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'guides'}
        slug={slug}
      />
      <UnifiedStructuredData
        item={itemData as Parameters<typeof UnifiedStructuredData>[0]['item']}
      />
      <UnifiedDetailPage item={item} relatedItems={relatedItems} />
    </>
  );
}
