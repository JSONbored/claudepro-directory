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
 * Rendering Strategy: Dynamic Rendering (force-dynamic)
 * This page uses dynamic rendering to ensure compatibility with the Vercel Flags SDK,
 * which requires request-time evaluation for feature flags.
 *
 * @performance
 * TTFB: Dependent on database query performance + serverless cold start
 * Optimization: Database queries are optimized with proper indexing
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
 * @see {@link file://../../lib/data/config/category/index.ts} - Category configuration
 * @see {@link file://../../lib/content-loaders.ts} - Content loading with caching
 */

import {
  createWebAppContextWithId,
  generateRequestId,
  isValidCategory,
  logger,
  normalizeError,
  withDuration,
} from '@heyclaude/web-runtime/core';
import { getCategoryConfig } from '@heyclaude/web-runtime/data/config/category';
import { getContentByCategory } from '@heyclaude/web-runtime/data/content';
import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentListServer } from '@/src/components/content/content-grid-list';

/**
 * Dynamic Rendering Required
 *
 * This page must use dynamic rendering because it imports from @heyclaude/web-runtime
 * which transitively imports feature-flags/flags.ts. The Vercel Flags SDK's flags/next
 * module contains module-level code that calls server functions, which cannot be
 * executed during static site generation.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const dynamic = 'force-dynamic';
// eslint-disable-next-line unicorn/prevent-abbreviations -- Next.js API convention
export const dynamicParams = true; // Allow unknown categories to be rendered on demand (will 404 if invalid)

/**
 * Generate metadata for category list pages
 *
 * @description
 * Generates SEO metadata including title, description, OpenGraph, and Twitter Card
 * data for each category list page. Falls back to error metadata if category is invalid.
 *
 * @param {object} props - Component props
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
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;

  // Validate category and load config
  if (!isValidCategory(category)) {
    return generatePageMetadata('/:category', {
      params: { category },
      category,
    });
  }

  // Type narrowing: after isValidCategory check, we know category is a valid enum value
  const typedCategory = category;

  const categoryConfig = getCategoryConfig(typedCategory);

  return generatePageMetadata('/:category', {
    params: { category },
    categoryConfig: categoryConfig ?? undefined,
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
 * @param {object} props - Component props
 * @param {{ category: string }} props.params - Route parameters containing category slug
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
  const startTime = Date.now();
  const { category } = await params;

  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const logContext = createWebAppContextWithId(requestId, `/${category}`, 'CategoryPage');

  if (!isValidCategory(category)) {
    logger.warn(
      'Invalid category in list page',
      undefined,
      withDuration(
        {
          ...logContext,
          category,
        },
        startTime
      )
    );
    notFound();
  }

  // Type narrowing: after isValidCategory check, we know category is a valid enum value
  const typedCategory = category;

  const config = getCategoryConfig(typedCategory);
  if (!config) {
    const normalized = normalizeError(
      'Category config is null',
      'CategoryPage: missing category config'
    );
    logger.error(
      'CategoryPage: missing category config',
      normalized,
      withDuration(
        {
          ...logContext,
          category,
        },
        startTime
      )
    );
    notFound();
  }

  // Load content for this category (enriched with analytics, sponsorship, etc.)
  let items: Awaited<ReturnType<typeof getContentByCategory>> = [];
  try {
    items = await getContentByCategory(typedCategory);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load category list content');
    logger.error(
      'CategoryPage: getContentByCategory threw',
      normalized,
      withDuration(
        {
          ...logContext,
          category,
        },
        startTime
      )
    );
    // Use empty array instead of re-throwing to prevent page crash
    // The page will render with empty content, which is better than crashing
    items = [];
  }
  if (items.length === 0) {
    logger.warn(
      'CategoryPage: getContentByCategory returned no items',
      undefined,
      withDuration(
        {
          ...logContext,
          category,
        },
        startTime
      )
    );
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
      icon={config.icon.displayName?.toLowerCase() ?? 'sparkles'}
      items={items}
      type={category}
      searchPlaceholder={config.listPage.searchPlaceholder}
      badges={badges}
    />
  );
}
