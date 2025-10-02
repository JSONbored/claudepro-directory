import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentListServer } from '@/components/content-list-server';
import { getCategoryConfig, isValidCategory } from '@/lib/config/category-config';
import { APP_CONFIG } from '@/lib/constants';
import { getContentByCategory } from '@/lib/content-loaders';
import { logger } from '@/lib/logger';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

/**
 * Generate static params for all valid categories
 */
export async function generateStaticParams() {
  const { VALID_CATEGORIES } = await import('@/lib/config/category-config');

  return VALID_CATEGORIES.map((category) => ({
    category,
  }));
}

/**
 * Generate metadata for category list pages
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;

  // Validate category
  if (!isValidCategory(category)) {
    return {
      title: 'Category Not Found',
      description: 'The requested content category could not be found.',
    };
  }

  const config = getCategoryConfig(category);
  if (!config) {
    return {
      title: 'Category Not Found',
      description: 'The requested content category could not be found.',
    };
  }

  return {
    title: `${config.pluralTitle} - ${APP_CONFIG.name}`,
    description: config.metaDescription,
    keywords: config.keywords,
    alternates: {
      canonical: `${APP_CONFIG.url}/${category}`,
    },
    openGraph: {
      title: `${config.pluralTitle} - ${APP_CONFIG.name}`,
      description: config.metaDescription,
      type: 'website',
      url: `${APP_CONFIG.url}/${category}`,
      siteName: APP_CONFIG.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${config.pluralTitle} - ${APP_CONFIG.name}`,
      description: config.metaDescription,
    },
  };
}

/**
 * Dynamic category list page
 */
export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;

  // Validate category
  if (!isValidCategory(category)) {
    logger.warn('Invalid category requested', { category });
    notFound();
  }

  // Get category configuration
  const config = getCategoryConfig(category);
  if (!config) {
    notFound();
  }

  // Load content for this category
  const items = await getContentByCategory(category);

  // Process badges (handle dynamic count badges)
  const badges = config.listPage.badges.map((badge) => ({
    ...(badge.icon && { icon: badge.icon }),
    text: typeof badge.text === 'function' ? badge.text(items.length) : badge.text,
  }));

  logger.info('Category page rendered', {
    category,
    itemCount: items.length,
  });

  return (
    <ContentListServer
      title={config.pluralTitle}
      description={config.description}
      icon={config.icon.displayName?.toLowerCase() || 'sparkles'}
      items={items}
      type={category as 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'guides'}
      searchPlaceholder={config.listPage.searchPlaceholder}
      badges={badges}
    />
  );
}
