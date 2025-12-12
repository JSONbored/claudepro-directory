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

import { type Database } from '@heyclaude/database-types';
import { isValidCategory, type UnifiedCategoryConfig } from '@heyclaude/web-runtime/core';
import { getCategoryConfig } from '@heyclaude/web-runtime/data/config/category';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { getContentByCategory } from '@heyclaude/web-runtime/data/content';
import { ExternalLink, HelpCircle } from '@heyclaude/web-runtime/icons';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import { Button, ICON_NAME_MAP, UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React, { Suspense } from 'react';

import { ContentSearchSkeleton } from '@/src/components/content/content-grid-list';
import { ContentSearchClient } from '@/src/components/content/content-search';
import { ExploreDropdown } from '@/src/components/content/explore-dropdown';
import { ContentSidebar } from '@/src/components/core/layout/content-sidebar';

/**
 * Dynamic Rendering Required
 *
 * This page uses dynamic rendering for server-side data fetching and user-specific content.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */

/***
 * Get icon name from component by reverse lookup in ICON_NAME_MAP
 * @param {React.ComponentType} icon - Icon component to look up
 * @returns Icon name string or 'sparkles' as fallback
 */
function getIconNameFromComponent(icon: React.ComponentType): string {
  const iconEntry = Object.entries(ICON_NAME_MAP).find(
    ([, IconComponent]) => IconComponent === icon
  );
  return iconEntry?.[0] ?? 'sparkles';
}

/**
 * Produce page Metadata for a category list, using the route category or error metadata when invalid.
 *
 * Generates SEO metadata (title, description, Open Graph, and Twitter Card) for the requested category.
 * This function awaits a server connection to permit request-time non-deterministic operations (e.g., Date.now()).
 *
 * @param props.params - Promise resolving to route params containing the `category` slug
 * @param root0
 * @param root0.params
 * @returns The Next.js Metadata object for the page
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
      category,
      params: { category },
    });
  }

  // Type narrowing: after isValidCategory check, we know category is a valid enum value
  const typedCategory = category;

  const categoryConfig = getCategoryConfig(typedCategory);

  return generatePageMetadata('/:category', {
    category,
    categoryConfig: categoryConfig ?? undefined,
    params: { category },
  });
}

/**
 * Render the category list page for a given content category.
 *
 * Renders a static hero shell from the generated category config and streams in dynamic badges
 * and the main content list. Validates the category slug and resolves runtime resources
 * (e.g., request-scoped logger, DB connection) before rendering.
 *
 * @param props - Component props
 * @param props.params - Route parameters promise containing the category slug (`{ category: string }`)
 * @returns The rendered page element for the category
 * @throws Triggers Next.js `notFound()` to render a 404 page if the category slug is invalid or the category config is missing
 *
 * @see CategoryHeroShell
 * @see CategoryBadges
 * @see CategoryPageContent
 * @see getCategoryConfig
 * @see isValidCategory
 */
export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  'use cache';
  // Use 'static' preset: 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes
  cacheLife('static');

  // Params is runtime data - cache key includes params, so different categories create different cache entries
  const { category } = await params;

  const operation = 'CategoryPage';
  const modulePath = 'apps/web/src/app/[category]/page';

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: modulePath,
    operation,
    route: `/${category}`,
  });

  if (!isValidCategory(category)) {
    reqLogger.warn(
      {
        category,
        section: 'data-fetch',
      },
      'Invalid category in list page'
    );
    notFound();
  }

  // Type narrowing: after isValidCategory check, we know category is a valid enum value
  const typedCategory = category;

  // Category config is from a generated file (static), so it can be in the static shell
  const config = getCategoryConfig(typedCategory);
  if (!config) {
    reqLogger.error(
      {
        category,
        err: new Error('Category config is null'),
        section: 'data-fetch',
      },
      'CategoryPage: missing category config'
    );
    notFound();
  }

  // Get icon name from component by finding it in ICON_NAME_MAP
  // Reverse lookup: find the key in ICON_NAME_MAP that has the same component reference
  const iconName = getIconNameFromComponent(config.icon);

  // OPTIMIZATION: Fetch content once at page level to avoid duplicate calls
  // Both CategoryBadges and CategoryPageContent need the same data
  let items: Awaited<ReturnType<typeof getContentByCategory>> = [];
  let hadError = false;
  try {
    items = await getContentByCategory(typedCategory);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load category content');
    reqLogger.error(
      {
        category: typedCategory,
        err: normalized,
        section: 'data-fetch',
      },
      'CategoryPage: getContentByCategory threw'
    );
    items = [];
    hadError = true;
  }
  if (items.length === 0 && !hadError) {
    reqLogger.warn(
      {
        category: typedCategory,
        section: 'data-fetch',
      },
      'CategoryPage: getContentByCategory returned no items'
    );
  }

  // PPR Optimization: Static shell (hero with config) renders immediately
  // Dynamic content (badges + items list) streams in Suspense
  // Items are loaded once and passed to both components
  return (
    <div className="bg-background min-h-screen">
      {/* Static Hero Section - Renders immediately (config is from generated file) */}
      <CategoryHeroShell
        category={category}
        description={config.description}
        icon={iconName}
        title={config.pluralTitle}
      >
        {/* Badges stream in Suspense */}
        <Suspense fallback={<CategoryBadgesSkeleton />}>
          <CategoryBadges config={config} items={items} />
        </Suspense>
      </CategoryHeroShell>

      {/* Content section - Outside hero, streams separately */}
      <Suspense fallback={<ContentSearchSkeleton />}>
        <CategoryPageContent category={typedCategory} config={config} items={items} />
      </Suspense>
    </div>
  );
}

/**
 * Renders the static hero section for a category list page and streams dynamic parts as children.
 *
 * The hero is rendered immediately (suitable for PPR) and displays the category icon, title,
 * description, and a Submit button. Badges and other dynamic content are provided via the
 * `children` slot and are expected to stream in (e.g., wrapped in a Suspense boundary).
 *
 * @param root0
 * @param root0.category
 * @param root0.children
 * @param root0.description
 * @param root0.icon
 * @param props.title - The plural title of the category (displayed as the main heading)
 * @param props.description - A short description or subtitle for the category
 * @param props.icon - The icon key used to look up a component in ICON_NAME_MAP; falls back to a help icon
 * @param props.children - Child nodes (typically streamed badges or content) that render beneath the description
 * @param root0.title
 * @returns The hero section JSX element for the category page
 *
 * @see CategoryBadges
 * @see CategoryPageContent
 */
function CategoryHeroShell({
  category,
  children,
  description,
  icon,
  title,
}: {
  category: Database['public']['Enums']['content_category'];
  children: React.ReactNode;
  description: string;
  icon: string;
  title: string;
}) {
  const IconComponent = ICON_NAME_MAP[icon] ?? HelpCircle;

  return (
    <section
      aria-labelledby="category-title"
      className="border-border border-b backdrop-blur-sm"
      style={{ backgroundColor: 'color-mix(in srgb, var(--code-bg) 30%, transparent)' }}
    >
      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            <div aria-hidden="true" className="bg-accent/10 rounded-full p-3">
              <IconComponent className="text-primary h-12 w-12" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <h1
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              id="category-title"
            >
              {title}
            </h1>
            <div className="hidden sm:block">
              <ExploreDropdown category={category} pageType="category" />
            </div>
          </div>

          <p className="text-muted-foreground mt-4 text-lg sm:text-xl">{description}</p>

          {/* Badges and content stream in via children */}
          <div className="mb-8">{children}</div>

          <div className="flex items-center justify-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link
                aria-label={`Submit a new ${title.slice(0, -1).toLowerCase()}`}
                className="flex items-center gap-2"
                href={ROUTES.SUBMIT}
              >
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
                Submit {title.slice(0, -1)}
              </Link>
            </Button>
            <div className="sm:hidden">
              <ExploreDropdown category={category} pageType="category" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Renders a lightweight animated skeleton placeholder for category badges while real badges load.
 *
 * Displays three pill-shaped pulsing placeholders sized to approximate typical badges.
 *
 * @see CategoryBadges
 
 * @returns JSX.Element - A skeleton placeholder with three animated pill-shaped divs
 */
function CategoryBadgesSkeleton() {
  return (
    <div className="flex list-none flex-wrap justify-center gap-2">
      <div className="bg-muted h-8 w-24 animate-pulse rounded-full" />
      <div className="bg-muted h-8 w-32 animate-pulse rounded-full" />
      <div className="bg-muted h-8 w-28 animate-pulse rounded-full" />
    </div>
  );
}

/**
 * Renders the category badges shown in the hero area, computing dynamic counts from the category's items.
 *
 * Loads items for the given `category` to produce badge text (some badges may be functions of the item count).
 * If loading fails or no configured badges exist, renders a sensible fallback set that includes a dynamic count badge.
 *
 * @param category - The content category for which to load items and compute badges
 * @param config - Unified category configuration that may include `listPage.badges` and `pluralTitle`
 * @param reqLogger - Request-scoped logger used to record load warnings or errors
 * @param category.config
 * @param category.items
 * @returns A list (<ul>) of rendered UnifiedBadge elements for the category
 *
 * @see getContentByCategory
 * @see UnifiedBadge
 * @see ICON_NAME_MAP
 */
function CategoryBadges({
  config,
  items,
}: {
  config: UnifiedCategoryConfig<Database['public']['Enums']['content_category']>;
  items: Awaited<ReturnType<typeof getContentByCategory>>;
}) {
  // OPTIMIZATION: Items are now passed as prop from parent (fetched once at page level)
  // This eliminates duplicate getContentByCategory() calls

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

  // Fallback badges if none configured
  const displayBadges =
    badges.length > 0
      ? badges
      : [
          { icon: 'sparkles', text: `${items.length} ${config.pluralTitle} Available` },
          { text: 'Community Driven' },
          { text: 'Production Ready' },
        ];

  return (
    <ul className="flex list-none flex-wrap justify-center gap-2">
      {displayBadges.map((badge, idx) => (
        <li key={badge.text || `badge-${idx}`}>
          <UnifiedBadge style={idx === 0 ? 'secondary' : 'outline'} variant="base">
            {badge.icon && typeof badge.icon === 'string'
              ? React.createElement(ICON_NAME_MAP[badge.icon] ?? HelpCircle, {
                  'aria-hidden': true,
                  className: 'h-3 w-3 leading-none',
                })
              : null}
            {badge.text}
          </UnifiedBadge>
        </li>
      ))}
    </ul>
  );
}

/**
 * Render the main content list and sidebar for a given category using runtime-loaded items.
 *
 * Loads items for `category` via `getContentByCategory` (this call uses cache) and renders
 * a ContentSearchClient populated with those items alongside the ContentSidebar.
 *
 * @param params.category - The content category to load and render
 * @param root0
 * @param root0.category
 * @param params.config - Unified category configuration used for titles, placeholders, and icon resolution
 * @param params.reqLogger - Request-scoped logger used for route-level logging
 *
 * @param root0.config
 * @param root0.items
 * @see getContentByCategory
 * @see ContentSearchClient
 * @see ContentSidebar
 * @see ICON_NAME_MAP
 
 * @returns JSX.Element - The category page content with search interface and sidebar
 */
function CategoryPageContent({
  category,
  config,
  items,
}: {
  category: Database['public']['Enums']['content_category'];
  config: UnifiedCategoryConfig<Database['public']['Enums']['content_category']>;
  items: Awaited<ReturnType<typeof getContentByCategory>>;
}) {
  // OPTIMIZATION: Items are now passed as prop from parent (fetched once at page level)
  // This eliminates duplicate getContentByCategory() calls

  // Get icon name from component by finding it in ICON_NAME_MAP
  const iconName = getIconNameFromComponent(config.icon);

  return (
    <>
      {/* Content section - Full width like homepage, sidebar on the side */}
      <section
        aria-label={`${config.pluralTitle} content and search`}
        className="container mx-auto px-4 py-12"
      >
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
          {/* Main content area - Full width within grid column */}
          <div className="min-w-0">
            <ContentSearchClient
              category={category}
              icon={iconName}
              items={items}
              searchPlaceholder={config.listPage.searchPlaceholder}
              title={config.pluralTitle}
              type={category}
              zeroStateSuggestions={items.slice(0, 6)}
            />
          </div>

          {/* Sidebar - Unified ContentSidebar with JobsPromo + RecentlyViewed */}
          <ContentSidebar />
        </div>
      </section>
    </>
  );
}
