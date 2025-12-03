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
import {
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/logging/server';
import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import  { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentListServer } from '@/src/components/content/content-grid-list';

/**
 * Dynamic Rendering Required
 *
 * This page uses dynamic rendering for server-side data fetching and user-specific content.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const dynamic = 'force-dynamic';
export const dynamicParams = true; // Allow unknown categories to be rendered on demand (will 404 if invalid)

/**
 * Build SEO metadata for a category list page.
 *
 * Generates page metadata (title, description, OpenGraph, Twitter card, etc.) for the given category.
 * If the category is invalid, returns fallback/error metadata for the category route.
 *
 * @param params - Promise resolving to route parameters containing the `category` slug
 * @returns The Metadata object to use for the page
 *
 * @see isValidCategory
 * @see getCategoryConfig
 * @see generatePageMetadata
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
 * Render a category-specific list page with configuration-driven UI and content.
 *
 * Validates the requested category and its configuration, loads the category's items on the server,
 * and returns the rendered list UI. If the category is invalid or its configuration is missing,
 * this component triggers Next.js' 404 via `notFound()`. If loading items fails, the page renders
 * with an empty list (the error is logged).
 *
 * @param props - Component props
 * @param props.params - Route parameters
 * @param props.params.category - Category slug to render (e.g., "agents", "mcp", "statuslines")
 * @returns The JSX element for the category list page
 *
 * @see isValidCategory
 * @see getCategoryConfig
 * @see getContentByCategory
 * @see ContentListServer
 */
export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;

  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const operation = 'CategoryPage';
  const route = `/${category}`;
  const module = 'apps/web/src/app/[category]/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module,
  });

  if (!isValidCategory(category)) {
    reqLogger.warn('Invalid category in list page', {
      category,
    });
    notFound();
  }

  // Type narrowing: after isValidCategory check, we know category is a valid enum value
  const typedCategory = category;

  const config = getCategoryConfig(typedCategory);
  if (!config) {
    const normalized = normalizeError(
      new Error('Category config is null'),
      'CategoryPage: missing category config'
    );
    reqLogger.error('CategoryPage: missing category config', normalized, {
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
    const normalized = normalizeError(error, 'Failed to load category list content');
    reqLogger.error('CategoryPage: getContentByCategory threw', normalized, {
      category,
    });
    // Use empty array instead of re-throwing to prevent page crash
    // The page will render with empty content, which is better than crashing
    items = [];
    hadError = true;
  }
  // Only log warning if no error occurred (to avoid duplicate logging)
  if (items.length === 0 && !hadError) {
    reqLogger.warn('CategoryPage: getContentByCategory returned no items', {
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

  // Safely extract icon name from component
  const iconComponent = config.icon as unknown as { displayName?: string; name?: string };
  const iconName = iconComponent.displayName?.toLowerCase() ?? iconComponent.name?.toLowerCase() ?? 'sparkles';

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