/**
 * Dynamic Category List Page - Unified Route Handler
 *
 * @description
 * This file implements the core of the dynamic routing system for claudepro-directory.
 * A single route `[category]` handles all 6 content categories (agents, mcp, commands, rules, hooks, statuslines)
 * instead of requiring 6 separate route files. This provides:
 * - Consistent behavior across all categories
 * - Single source of truth for list page logic
 * - Easy addition of new categories without code duplication
 *
 * @architecture
 * Route Pattern: /[category] → /agents, /mcp, /commands, /rules, /hooks, /statuslines
 *
 * Static Generation: All category pages are pre-rendered at build time via generateStaticParams()
 * which returns the 6 valid categories from VALID_CATEGORIES. Next.js creates 6 static HTML files.
 *
 * ISR (Incremental Static Regeneration): Pages revalidate every 4 hours (14400s) to pick up new
 * content without requiring a full rebuild. Stale content is served while revalidating in background.
 *
 * @performance
 * Build Time: ~11.7s for all 187 pages (including 6 category pages)
 * Page Size: 7 kB per category page (minimal client JavaScript)
 * First Load JS: 382 kB (shared bundle + category page bundle)
 * Cache Hit: ~5-20ms (database) vs 48ms (file system)
 * TTFB: <100ms (static pages served from CDN)
 *
 * @example
 * // Data flow for /agents request:
 * // 1. isValidCategory('agents') → validates category exists
 * // 2. getCategoryConfig('agents') → loads display config
 * // 3. getContentByCategory('agents') → loads items from database
 * // 4. ContentListServer → renders list with search/filters
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes}
 * @see {@link file://./[slug]/page.tsx} - Detail page counterpart
 * @see {@link file://../../lib/config/category-config.ts} - Category configuration
 * @see {@link file://../../lib/content-loaders.ts} - Content loading with caching
 */

import { notFound } from 'next/navigation';
import { ContentListServer } from '@/src/components/content/content-grid-list';
import {
  type CategoryId,
  getCategoryConfig,
  isValidCategory,
} from '@/src/lib/config/category-config';
import { getContentByCategory } from '@/src/lib/content/supabase-content-loader';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { normalizeError } from '@/src/lib/utils/error.utils';

export const revalidate = false;

/**
 * Generate static params for all valid categories
 *
 * @description
 * Called at build time to generate static pages for all 6 categories.
 * Returns array of category slugs that Next.js uses to pre-render pages.
 *
 * @returns {Promise<Array<{category: string}>>} Array of category params for static generation
 *
 * @example
 * // Returns:
 * // [
 * //   { category: 'agents' },
 * //   { category: 'mcp' },
 * //   { category: 'commands' },
 * //   { category: 'rules' },
 * //   { category: 'hooks' },
 * //   { category: 'statuslines' }
 * // ]
 */
export async function generateStaticParams() {
  try {
    const { VALID_CATEGORIES } = await import('@/src/lib/config/category-config');

    return VALID_CATEGORIES.map((category) => ({
      category,
    }));
  } catch (error) {
    logger.error(
      'generateStaticParams error in [category]',
      error instanceof Error ? error : new Error(String(error)),
      {
        phase: 'build-time',
        route: '[category]/page.tsx',
      }
    );
    // Return empty array (prevents build failure, skips category pages)
    return [];
  }
}

/**
 * Generate metadata for category list pages
 *
 * @description
 * Generates SEO metadata including title, description, OpenGraph, and Twitter Card
 * data for each category list page. Falls back to error metadata if category is invalid.
 *
 * @param {Object} props - Component props
 * @param {Promise<{category: string}>} props.params - Route parameters containing category slug
 *
 * @returns {Promise<Metadata>} Next.js metadata object for the page
 *
 * @example
 * // For /agents route, generates metadata:
 * // {
 * //   title: "AI Agents - Claude Pro Directory",
 * //   description: "Browse specialized AI agents...",
 * //   openGraph: { ... },
 * //   twitter: { ... }
 * // }
 */
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;

  // Validate category and load config
  if (!isValidCategory(category)) {
    return generatePageMetadata('/:category', {
      params: { category },
      category,
    });
  }

  let categoryConfig: Awaited<ReturnType<typeof getCategoryConfig>> | null = null;
  try {
    categoryConfig = await getCategoryConfig(category as CategoryId);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load category config for metadata');
    logger.error('CategoryPage: category config lookup failed in metadata', normalized, {
      category,
    });
  }

  return generatePageMetadata('/:category', {
    params: { category },
    categoryConfig: categoryConfig || undefined,
    category,
  });
}

/**
 * Dynamic category list page component
 *
 * @description
 * Server component that renders a list of content items for a given category.
 * Handles validation, config loading, content fetching from database, and rendering.
 * Returns 404 if category is invalid.
 *
 * @param {Object} props - Component props
 * @param {Promise<{category: string}>} props.params - Route parameters with category slug
 *
 * @returns {Promise<JSX.Element>} Rendered category list page
 *
 * @throws {notFound} Returns 404 page if category is invalid or config not found
 *
 * @example
 * // Handles routes like:
 * // /agents → Lists all AI agents with search/filter
 * // /mcp → Lists all MCP servers with search/filter
 * // /statuslines → Lists all statuslines with search/filter
 */
export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;

  if (!isValidCategory(category)) {
    logger.warn('Invalid category in list page', { category });
    notFound();
  }

  let config: Awaited<ReturnType<typeof getCategoryConfig>> | null = null;
  try {
    config = await getCategoryConfig(category as CategoryId);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load category config for page render');
    logger.error('CategoryPage: getCategoryConfig threw', normalized, { category });
  }
  if (!config) {
    logger.error('CategoryPage: missing category config', new Error('Category config is null'), {
      category,
    });
    notFound();
  }

  // Load content for this category (enriched with analytics, sponsorship, etc.)
  let items: Awaited<ReturnType<typeof getContentByCategory>> = [];
  try {
    items = await getContentByCategory(category);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load category list content');
    logger.error('CategoryPage: getContentByCategory threw', normalized, {
      category,
      route: '[category]/page.tsx',
    });
    throw normalized;
  }
  if (!items || items.length === 0) {
    logger.warn('CategoryPage: getContentByCategory returned no items', { category });
  }

  // Process badges (handle dynamic count badges)
  const badges = config.listPage.badges.map((badge) => {
    const processed: { icon?: string; text: string } = {
      text: typeof badge.text === 'function' ? badge.text(items.length) : badge.text,
    };

    if ('icon' in badge && badge.icon) {
      processed.icon = badge.icon;
    }

    return processed;
  });

  return (
    <ContentListServer
      title={config.pluralTitle}
      description={config.description}
      icon={config.icon.displayName?.toLowerCase() || 'sparkles'}
      items={items}
      type={category}
      searchPlaceholder={config.listPage.searchPlaceholder}
      badges={badges}
    />
  );
}
