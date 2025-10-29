/**
 * Content Detail Page - Unified route for [category]/[slug] with database-cached content and view tracking.
 */

import { notFound } from 'next/navigation';
import { ReadProgress } from '@/src/components/content/read-progress';
import { UnifiedDetailPage } from '@/src/components/content/unified-detail-page';
import { CollectionDetailView } from '@/src/components/content/unified-detail-page/collection-detail-view';
import { BreadcrumbSchema } from '@/src/components/infra/structured-data/breadcrumb-schema';
import { UnifiedStructuredData } from '@/src/components/infra/structured-data/unified-structured-data';
import { UnifiedTracker } from '@/src/components/infra/unified-tracker';
import {
  isValidCategory,
  UNIFIED_CATEGORY_REGISTRY,
  VALID_CATEGORIES,
} from '@/src/lib/config/category-config';
import { APP_CONFIG } from '@/src/lib/constants';
import {
  type ContentItem,
  getContentByCategory,
  getContentBySlug,
  getFullContentBySlug,
} from '@/src/lib/content/supabase-content-loader';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';

export const revalidate = 21600;

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
 * Uses database-cached content loading
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
 * //   title: "Code Reviewer Agent - Agents - Claude Pro Directory",
 * //   description: "Specialized agent for reviewing code quality...",
 * //   keywords: ["code", "review", "ai", "agent", "claude"],
 * //   openGraph: { title, description, type: 'article', ... },
 * //   twitter: { card: 'summary_large_image', ... }
 * // }
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  // Validate category at compile time
  if (!isValidCategory(category)) {
    return generatePageMetadata('/:category/:slug', {
      params: { category, slug },
    });
  }

  // Load item and category config for metadata generation
  const itemMeta = await getContentBySlug(category, slug);
  const config = UNIFIED_CATEGORY_REGISTRY[category];

  return generatePageMetadata('/:category/:slug', {
    params: { category, slug },
    item: itemMeta as any,
    categoryConfig: config || undefined,
    category,
    slug,
  });
}

/**
 * Dynamic detail page component for all content categories
 *
 * @description
 * Server component that renders a detail page for a specific content item.
 * Handles validation, content loading from database, related content fetching,
 * data transformation, and rendering with view tracking and structured data.
 * Returns 404 if category or item is invalid.
 *
 * Data Flow:
 * 1. **Validation**: Validates category exists in VALID_CATEGORIES
 * 2. **Config Loading**: Loads category configuration
 * 3. **Metadata Loading**: Loads item metadata from database (~5-20ms)
 * 4. **Parallel Data Fetching** (30-40ms gain via batchFetch):
 *    - Full content with syntax-highlighted code blocks
 *    - 3 related items from same category
 *    - View count from database
 * 5. **Transformation**: Transforms data for UnifiedDetailPage component interface
 * 6. **Rendering**: Renders with ViewTracker, StructuredData, and DetailPage components
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
 * - Cache Hit: ~5-20ms (database cache)
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

  const config = UNIFIED_CATEGORY_REGISTRY[category];
  if (!config) {
    notFound();
  }

  logger.info('Detail page accessed', {
    category,
    slug,
    validated: true,
  });

  // Load item metadata first for validation
  const itemMeta = await getContentBySlug(category, slug);

  if (!itemMeta) {
    logger.warn('Item not found', { category, slug });
    notFound();
  }

  // Optimized fetch strategy: Load full content from individual table (ALL fields)
  // Use getFullContentBySlug to get category-specific fields like configuration, content, etc.
  const fullItem = await getFullContentBySlug(category, slug);
  const itemData = (fullItem || itemMeta) as ContentItem; // Fallback to metadata if full item fails

  const supabase = await createClient();
  const { data: analyticsData } = await supabase
    .from('mv_analytics_summary')
    .select('view_count')
    .eq('category', category)
    .eq('slug', slug)
    .maybeSingle<{ view_count: number | null }>();
  const viewCount = analyticsData?.view_count ?? 0;
  const relatedItems: ContentItem[] = [];

  // No transformation needed - displayTitle computed at build time
  // This eliminates runtime overhead and follows DRY principles

  // Type-safe breadcrumb name with discriminated union
  const breadcrumbName =
    fullItem && 'display_title' in fullItem ? fullItem.display_title : itemData.title;

  // Conditional rendering: Collections use specialized CollectionDetailView
  // TypeScript narrows fullItem type based on category check
  if (category === 'collections' && fullItem && fullItem.category === 'collections') {
    return (
      <>
        {/* Read Progress Bar - Shows reading progress at top of page */}
        <ReadProgress />

        <UnifiedTracker variant="view" category={category} slug={slug} />
        <UnifiedTracker variant="page-view" category={category} slug={slug} />
        <UnifiedStructuredData item={fullItem} />
        <BreadcrumbSchema
          items={[
            {
              name: config.title || category,
              url: `${APP_CONFIG.url}/${category}`,
            },
            {
              name: breadcrumbName || slug,
              url: `${APP_CONFIG.url}/${category}/${slug}`,
            },
          ]}
        />
        <CollectionDetailView collection={fullItem as any} />
      </>
    );
  }

  // Default rendering: All other categories use UnifiedDetailPage
  return (
    <>
      {/* Read Progress Bar - Shows reading progress at top of page */}
      <ReadProgress />

      <UnifiedTracker variant="view" category={category} slug={slug} />
      <UnifiedTracker variant="page-view" category={category} slug={slug} />
      <UnifiedStructuredData item={fullItem || itemData} />
      <BreadcrumbSchema
        items={[
          {
            name: config.title || category,
            url: `${APP_CONFIG.url}/${category}`,
          },
          {
            name: breadcrumbName || slug,
            url: `${APP_CONFIG.url}/${category}/${slug}`,
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
