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

import { isValidCategory } from '@heyclaude/web-runtime/core';
import { getCategoryConfig } from '@heyclaude/web-runtime/data/config/category';
import { getContentByCategory } from '@heyclaude/web-runtime/data/content';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import { ICON_NAME_MAP } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { ContentListServer } from '@/src/components/content/content-grid-list';

// MIGRATED: Removed export const dynamic = 'force-dynamic' (incompatible with Cache Components)
// MIGRATED: Removed export const dynamicParams = true (incompatible with Cache Components)
// TODO: Will add Suspense boundaries or "use cache" after analyzing build errors

/**
 * Dynamic Rendering Required
 *
 * This page uses dynamic rendering for server-side data fetching and user-specific content.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */

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
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
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
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();
  const operation = 'CategoryPage';
  const modulePath = 'apps/web/src/app/[category]/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    module: modulePath,
  });

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading category...</div>}>
      <CategoryPageContent params={params} reqLogger={reqLogger} />
    </Suspense>
  );
}

async function CategoryPageContent({
  params,
  reqLogger,
}: {
  params: Promise<{ category: string }>;
  reqLogger: ReturnType<typeof logger.child>;
}) {
  const { category } = await params;
  const route = `/${category}`;

  // Create route-specific logger
  const routeLogger = reqLogger.child({ route });

  if (!isValidCategory(category)) {
    routeLogger.warn('Invalid category in list page', {
      category,
    });
    notFound();
  }

  // Type narrowing: after isValidCategory check, we know category is a valid enum value
  const typedCategory = category;

  const config = getCategoryConfig(typedCategory);
  if (!config) {
    // logger.error() normalizes errors internally, so pass raw error
    routeLogger.error('CategoryPage: missing category config', new Error('Category config is null'), {
      category,
    });
    notFound();
  }

  // Load content for this category (enriched with analytics, sponsorship, etc.)
  let items: Awaited<ReturnType<typeof getContentByCategory>> = [];
  let hadError = false;
  try {
    items = await getContentByCategory(typedCategory);
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    routeLogger.error('CategoryPage: getContentByCategory threw', errorForLogging, {
      category,
    });
    // Use empty array instead of re-throwing to prevent page crash
    // The page will render with empty content, which is better than crashing
    items = [];
    hadError = true;
  }
  // Only log warning if no error occurred (to avoid duplicate logging)
  if (items.length === 0 && !hadError) {
    routeLogger.warn('CategoryPage: getContentByCategory returned no items', {
      category,
    });
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

  // Get icon name from component by finding it in ICON_NAME_MAP
  // Reverse lookup: find the key in ICON_NAME_MAP that has the same component reference
  const iconEntry = Object.entries(ICON_NAME_MAP).find(
    ([, IconComponent]) => IconComponent === config.icon
  );
  const iconName = iconEntry?.[0] ?? 'sparkles';

  return (
    <ContentListServer
      title={config.pluralTitle}
      description={config.description}
      icon={iconName}
      items={items}
      type={category}
      searchPlaceholder={config.listPage.searchPlaceholder}
      badges={badges}
    />
  );
}
