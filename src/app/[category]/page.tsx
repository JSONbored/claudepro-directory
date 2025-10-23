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
 * Cache Hit: ~1.66ms (Redis) vs 48ms (file system)
 * TTFB: <100ms (static pages served from CDN)
 *
 * @example
 * // Data flow for /agents request:
 * // 1. isValidCategory('agents') → validates category exists
 * // 2. getCategoryConfig('agents') → loads display config
 * // 3. getContentByCategory('agents') → loads items with Redis caching
 * // 4. ContentListServer → renders list with search/filters
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes}
 * @see {@link file://./[slug]/page.tsx} - Detail page counterpart
 * @see {@link file://../../lib/config/category-config.ts} - Category configuration
 * @see {@link file://../../lib/content-loaders.ts} - Content loading with caching
 */

import { cacheLife } from 'next/cache';
import { notFound } from 'next/navigation';
import { ContentListServer } from '@/src/components/content-list-server';
import { statsRedis } from '@/src/lib/cache.server';
import { isValidCategory, UNIFIED_CATEGORY_REGISTRY } from '@/src/lib/config/category-config';
import { getContentByCategory } from '@/src/lib/content/content-loaders';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

/**
 * ISR revalidation interval in seconds (4 hours)
 *
 * @description
 * Revalidate every 4 hours (14400 seconds) to pick up new content.
 * Balances freshness with build frequency - content doesn't change often enough
 * to warrant hourly revalidation, but 4 hours ensures same-day updates appear.
 *
 * @constant {number}
 */

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
  const { VALID_CATEGORIES } = await import('@/src/lib/config/category-config');

  return VALID_CATEGORIES.map((category) => ({
    category,
  }));
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
  'use cache';
  cacheLife('minutes'); // 5 min cache (replaces revalidate: 300)

  const { category } = await params;

  // Validate category and load config
  if (!isValidCategory(category)) {
    return generatePageMetadata('/:category', {
      params: { category },
      category,
    });
  }

  const categoryConfig = UNIFIED_CATEGORY_REGISTRY[category];

  return generatePageMetadata('/:category', {
    params: { category },
    categoryConfig,
    category,
  });
}

/**
 * Dynamic category list page component
 *
 * @description
 * Server component that renders a list of content items for a given category.
 * Handles validation, config loading, content fetching with Redis caching, and rendering.
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
  'use cache';
  cacheLife('minutes'); // 5 min cache (replaces revalidate: 300)

  const { category } = await params;

  // Validate category
  if (!isValidCategory(category)) {
    logger.warn('Invalid category requested', { category });
    notFound();
  }

  // Get category configuration
  const config = UNIFIED_CATEGORY_REGISTRY[category];
  if (!config) {
    notFound();
  }

  // Load content for this category
  const itemsData = await getContentByCategory(category);

  // Enrich with view and copy counts from Redis (parallel batch operation)
  const items = await statsRedis.enrichWithAllCounts(
    itemsData.map((item) => ({
      ...item,
      category,
    }))
  );

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
      type={category} // MODERNIZATION: No cast needed - category already CategoryId from route params
      searchPlaceholder={config.listPage.searchPlaceholder}
      badges={badges}
    />
  );
}
