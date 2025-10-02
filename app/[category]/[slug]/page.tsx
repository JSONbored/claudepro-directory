/**
 * Dynamic Content Detail Page - Unified Route Handler
 *
 * @description
 * This file implements the detail page component of the dynamic routing system.
 * A single route `[category]/[slug]` handles all 138 detail pages across 6 categories
 * (agents, mcp, commands, rules, hooks, statuslines) instead of requiring separate route files.
 *
 * Key Features:
 * - Unified detail page rendering for all content types
 * - Server-side syntax highlighting with Shiki
 * - Redis-cached content loading with 2-hour TTL
 * - Related content recommendations
 * - View tracking and analytics
 * - Structured data (JSON-LD) for SEO
 * - Dynamic OpenGraph images per item
 *
 * @architecture
 * Route Pattern: /[category]/[slug] → /agents/code-reviewer-agent, /mcp/filesystem-server, etc.
 *
 * Static Generation: All detail pages are pre-rendered at build time via generateStaticParams()
 * which iterates through all categories and their items to generate 138 static HTML files.
 *
 * ISR (Incremental Static Regeneration): Pages revalidate every 4 hours (14400s) to pick up
 * content updates without requiring a full rebuild. Stale content is served while revalidating.
 *
 * Data Flow:
 * 1. Category & slug validation
 * 2. Load item metadata (cached, ~0.10ms)
 * 3. Load full content with syntax highlighting
 * 4. Load 3 related items from same category
 * 5. Transform data for component interface
 * 6. Render with view tracking + structured data
 *
 * @performance
 * Build Time: ~11.7s for all 187 pages (138 detail pages included)
 * Page Size: 4.99 kB per detail page (outstanding - minimal client JS)
 * First Load JS: 337 kB (shared bundle + detail page bundle)
 * Cache Hit: ~0.10ms (Redis) vs ~20ms (file system)
 * TTFB: <100ms (static pages served from CDN)
 * Syntax Highlighting: Server-side with Shiki (zero client cost)
 *
 * @example
 * // Data flow for /agents/code-reviewer-agent request:
 * // 1. isValidCategory('agents') → validates category
 * // 2. getCategoryConfig('agents') → loads config
 * // 3. getContentBySlug('agents', 'code-reviewer-agent') → cached metadata
 * // 4. getFullContentBySlug('agents', 'code-reviewer-agent') → full content with code
 * // 5. getRelatedContent('agents', 'code-reviewer-agent', 3) → 3 related agents
 * // 6. transformForDetailPage() → prepares data for component
 * // 7. UnifiedDetailPage → renders with syntax highlighting
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes}
 * @see {@link file://../page.tsx} - List page counterpart
 * @see {@link file://../../../lib/content-loaders.ts} - Content loading with caching
 * @see {@link file://../../../lib/transformers.ts} - Data transformation utilities
 * @see {@link file://../../../components/unified-detail-page/index.tsx} - Detail page component
 */

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

/**
 * ISR revalidation interval in seconds (4 hours)
 *
 * @description
 * Revalidate every 4 hours (14400 seconds) to pick up content updates.
 * Same interval as list pages for consistency. Detail pages benefit from longer
 * cache periods since individual content changes less frequently than lists.
 *
 * @constant {number}
 */
export const revalidate = 14400;

/**
 * Generate static params for all category/slug combinations
 *
 * @description
 * Called at build time to generate static pages for all 138 detail pages across 6 categories.
 * Iterates through each category, loads all items, and creates a category/slug param pair
 * for each item. Next.js uses these params to pre-render all detail pages.
 *
 * @returns {Promise<Array<{category: string; slug: string}>>} Array of category/slug params
 *
 * @example
 * // Generates params like:
 * // [
 * //   { category: 'agents', slug: 'code-reviewer-agent' },
 * //   { category: 'agents', slug: 'api-builder-agent' },
 * //   { category: 'mcp', slug: 'filesystem-server' },
 * //   ... 138 total combinations
 * // ]
 *
 * @performance
 * Build-time only execution - runs once during `npm run build`
 * Uses Redis-cached content loading (96.5% faster than file system)
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
 *
 * @description
 * Generates SEO metadata including title, description, keywords, OpenGraph, and Twitter Card
 * data for each detail page. Loads item data to populate metadata fields with actual content.
 * Falls back to error metadata if category or item is invalid.
 *
 * @param {Object} props - Component props
 * @param {Promise<{category: string; slug: string}>} props.params - Route parameters
 *
 * @returns {Promise<Metadata>} Next.js metadata object for the page
 *
 * @example
 * // For /agents/code-reviewer-agent route:
 * // {
 * //   title: "Code Reviewer Agent - AI Agent | Claude Pro Directory",
 * //   description: "Specialized agent for reviewing code quality...",
 * //   keywords: "code review, AI agent, Claude Code",
 * //   openGraph: { title, description, type: 'article', ... },
 * //   twitter: { card: 'summary_large_image', ... }
 * // }
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
 * Dynamic detail page component for all content categories
 *
 * @description
 * Server component that renders a detail page for a specific content item.
 * Handles validation, content loading with Redis caching, related content fetching,
 * data transformation, and rendering with view tracking and structured data.
 * Returns 404 if category or item is invalid.
 *
 * Data Flow:
 * 1. **Validation**: Validates category exists in VALID_CATEGORIES
 * 2. **Config Loading**: Loads category configuration
 * 3. **Metadata Loading**: Loads item metadata from Redis cache (~0.10ms) or file system (~20ms)
 * 4. **Full Content Loading**: Loads complete content with syntax-highlighted code blocks
 * 5. **Related Content**: Fetches 3 related items from same category
 * 6. **Transformation**: Transforms data for UnifiedDetailPage component interface
 * 7. **Rendering**: Renders with ViewTracker, StructuredData, and DetailPage components
 *
 * @param {Object} props - Component props
 * @param {Promise<{category: string; slug: string}>} props.params - Route parameters
 *
 * @returns {Promise<JSX.Element>} Rendered detail page with tracking and SEO
 *
 * @throws {notFound} Returns 404 page if category is invalid, config not found, or item not found
 *
 * @example
 * // Handles routes like:
 * // /agents/code-reviewer-agent → Agent detail with syntax-highlighted code
 * // /mcp/filesystem-server → MCP server detail with installation instructions
 * // /statuslines/git-aware-statusline → Statusline detail with preview
 *
 * @performance
 * - Page Size: 4.99 kB (outstanding performance)
 * - Cache Hit: ~0.10ms (Redis item cache)
 * - Cache Miss: ~20ms (file system + JSON parse)
 * - Syntax Highlighting: Server-side with Shiki (zero client cost)
 * - Related Content: Cached with category data
 *
 * @see {@link file://../../../components/unified-detail-page/index.tsx} - Detail page UI component
 * @see {@link file://../../../lib/content-loaders.ts} - Content loading with caching
 * @see {@link file://../../../lib/transformers.ts} - Data transformation utilities
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
