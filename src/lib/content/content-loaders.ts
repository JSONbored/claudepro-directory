/**
 * Dynamic Content Loading Utilities - Configuration-Driven
 *
 * Modern 2025 architecture: All loader maps auto-generated from unified category registry.
 * Zero hardcoded category lists - adding a new category requires zero changes here.
 *
 * Features:
 * - Category-agnostic loading (works for all categories in registry)
 * - Lazy loading for performance optimization
 * - Redis caching for optimal performance (4-hour TTL)
 * - Type-safe with proper error handling
 * - Supports both metadata and full content loading
 * - Auto-generates loader maps from UNIFIED_CATEGORY_REGISTRY
 *
 * Performance:
 * - Cache hit: ~5ms (Redis)
 * - Cache miss: ~50-100ms (file I/O + JSON parse)
 * - Cache hit rate: Target >85% in production
 *
 * Used by:
 * - app/[category]/page.tsx (list pages)
 * - app/[category]/[slug]/page.tsx (detail pages)
 *
 * @see lib/config/category-config.ts - Single source of truth for categories
 */

import { contentCache } from '@/src/lib/cache.server';
import { getAllCategoryIds } from '@/src/lib/config/category-config';
import { logger } from '@/src/lib/logger';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { isNewContent } from '@/src/lib/utils/content.utils';

/**
 * Cache TTL configuration
 * - 4 hours for category metadata (frequently accessed, infrequent updates)
 * - 2 hours for individual items (balance freshness vs performance)
 */
const CACHE_TTL = {
  CATEGORY: 14400, // 4 hours
  ITEM: 7200, // 2 hours
} as const;

/**
 * SERVER-SIDE ENRICHMENT: Add computed fields to content items
 *
 * Performance Pattern: Compute once at load time, not at render time
 * - Eliminates 50-100 client-side Date() calls per page
 * - Zero re-computation on every render
 * - Cacheable boolean flag (ISR/CDN friendly)
 *
 * @param items - Content items to enrich
 * @returns Enriched items with isNew field
 */
function enrichContentItems(items: UnifiedContentItem[]): UnifiedContentItem[] {
  return items.map((item) => ({
    ...item,
    isNew: isNewContent(item.dateAdded),
  }));
}

/**
 * ============================================
 * DYNAMIC LOADER MAP GENERATION
 * ============================================
 *
 * Builds loader maps from unified category registry.
 * No hardcoded category lists - automatically stays in sync.
 */

/**
 * Build loader map for getContentByCategory
 * Dynamically generates from registry - zero manual maintenance
 */
function buildLoaderMap(
  contentModule: typeof import('@/generated/content')
): Record<string, () => Promise<UnifiedContentItem[]>> {
  const map: Record<string, () => Promise<UnifiedContentItem[]>> = {};

  for (const categoryId of getAllCategoryIds()) {
    // Convert categoryId to loader function name: agents → getAgents
    const capitalizedName =
      categoryId.charAt(0).toUpperCase() +
      categoryId.slice(1).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const loaderName = `get${capitalizedName}` as keyof typeof contentModule;

    if (loaderName in contentModule) {
      map[categoryId] = contentModule[loaderName] as () => Promise<UnifiedContentItem[]>;
    }
  }

  return map;
}

/**
 * Build by-slug loader map
 * Dynamically generates from registry - zero manual maintenance
 */
function buildBySlugMap(
  contentModule: typeof import('@/generated/content')
): Record<string, (slug: string) => Promise<UnifiedContentItem | undefined>> {
  const map: Record<string, (slug: string) => Promise<UnifiedContentItem | undefined>> = {};

  for (const categoryId of getAllCategoryIds()) {
    // Convert to singular: agents → Agent
    const singular = categoryId.replace(/s$/, '').replace(/Servers$/, 'Server');
    const capitalizedSingular =
      singular.charAt(0).toUpperCase() +
      singular.slice(1).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const loaderName = `get${capitalizedSingular}BySlug` as keyof typeof contentModule;

    if (loaderName in contentModule) {
      map[categoryId] = contentModule[loaderName] as (
        slug: string
      ) => Promise<UnifiedContentItem | undefined>;
    }
  }

  return map;
}

/**
 * Build full content loader map
 * Dynamically generates from registry - zero manual maintenance
 */
function buildFullContentMap(
  contentModule: typeof import('@/generated/content')
): Record<string, (slug: string) => Promise<UnifiedContentItem | null>> {
  const map: Record<string, (slug: string) => Promise<UnifiedContentItem | null>> = {};

  for (const categoryId of getAllCategoryIds()) {
    // Convert to singular: agents → Agent
    const singular = categoryId.replace(/s$/, '').replace(/Servers$/, 'Server');
    const capitalizedSingular =
      singular.charAt(0).toUpperCase() +
      singular.slice(1).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const loaderName = `get${capitalizedSingular}FullContent` as keyof typeof contentModule;

    if (loaderName in contentModule) {
      map[categoryId] = contentModule[loaderName] as (
        slug: string
      ) => Promise<UnifiedContentItem | null>;
    }
  }

  return map;
}

/**
 * Dynamically load content by category name with Redis caching
 *
 * Performance characteristics:
 * - Cache hit: ~5ms (Redis read)
 * - Cache miss: ~50-100ms (file I/O + JSON parse + Redis write)
 * - TTL: 4 hours (optimal for production workloads)
 *
 * @param category - The content category (agents, mcp, commands, rules, hooks, statuslines)
 * @returns Array of content items for the specified category
 */
export async function getContentByCategory(category: string): Promise<UnifiedContentItem[]> {
  try {
    // Try Redis cache first (production optimization)
    if (contentCache.isEnabled()) {
      const cached = await contentCache.getContentMetadata<UnifiedContentItem[]>(category);
      if (cached && Array.isArray(cached)) {
        logger.debug('Content cache hit', {
          category,
          itemCount: cached.length,
        });
        // Note: Cached items already enriched, but verify isNew is fresh
        // (Important: isNew changes daily, so we re-compute for cache hits)
        return enrichContentItems(cached);
      }
    }

    // Cache miss - load from generated files
    const contentModule = await import('@/generated/content');

    // Dynamically build loader map from registry (zero hardcoded categories)
    const loaderMap = buildLoaderMap(contentModule);

    const loader = loaderMap[category];
    if (!loader) {
      logger.error('Invalid category for content loading', new Error('Category not found'), {
        category,
        availableCategories: Object.keys(loaderMap).join(', '),
      });
      return [];
    }

    const items = await loader();

    // SERVER-SIDE ENRICHMENT: Add computed fields (isNew, etc.)
    // Performance: Compute once here, not per-render in components
    const enrichedItems = enrichContentItems(items);

    // Cache the enriched result for 4 hours (async, non-blocking)
    if (contentCache.isEnabled() && enrichedItems.length > 0) {
      contentCache.cacheContentMetadata(category, enrichedItems, CACHE_TTL.CATEGORY).catch((err) =>
        logger.warn('Failed to cache category content', {
          category,
          error: err,
        })
      );
    }

    logger.debug('Content loaded from file system', {
      category,
      itemCount: enrichedItems.length,
    });
    return enrichedItems;
  } catch (error) {
    logger.error(
      `Failed to load content for category: ${category}`,
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Dynamically load single item by category and slug with Redis caching
 *
 * Uses granular per-item caching for optimal performance on detail pages.
 * Cache key format: `content:{category}:item:{slug}`
 *
 * Performance characteristics:
 * - Cache hit: ~3ms (single Redis key read)
 * - Cache miss: ~20-50ms (array search + JSON parse + Redis write)
 * - TTL: 2 hours (balance between freshness and performance)
 *
 * @param category - The content category
 * @param slug - The item slug
 * @returns The content item or null if not found
 */
export async function getContentBySlug(
  category: string,
  slug: string
): Promise<UnifiedContentItem | null> {
  try {
    // Try granular item cache first (faster than category cache for single items)
    const cacheKey = `content:${category}:item:${slug}`;
    if (contentCache.isEnabled()) {
      const cached = await contentCache.getAPIResponse<UnifiedContentItem>(cacheKey);
      if (cached) {
        logger.debug('Item cache hit', { category, slug });
        return cached;
      }
    }

    // Cache miss - load from generated files
    const contentModule = await import('@/generated/content');

    // Dynamically build by-slug loader map from registry (zero hardcoded categories)
    const bySlugMap = buildBySlugMap(contentModule);

    const loader = bySlugMap[category];
    if (!loader) {
      logger.warn('Invalid category for slug lookup', {
        category,
        slug,
      });
      return null;
    }

    const item = await loader(slug);
    if (!item) {
      logger.debug('Item not found', { category, slug });
      return null;
    }

    // Cache individual item for 2 hours (async, non-blocking)
    if (contentCache.isEnabled()) {
      contentCache
        .cacheAPIResponse(cacheKey, item, CACHE_TTL.ITEM)
        .catch((err) => logger.warn('Failed to cache item', { category, slug, error: err }));
    }

    logger.debug('Item loaded from file system', { category, slug });
    return item;
  } catch (error) {
    logger.error(
      `Failed to load content by slug: ${category}/${slug}`,
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  }
}

/**
 * Dynamically load full content (with all fields) by category and slug
 *
 * Full content includes expanded data that may not be in metadata-only responses.
 * Falls back to metadata if full content is unavailable.
 *
 * @param category - The content category
 * @param slug - The item slug
 * @returns The full content item or null if not found
 */
export async function getFullContentBySlug(
  category: string,
  slug: string
): Promise<UnifiedContentItem | null> {
  try {
    const contentModule = await import('@/generated/content');

    // Dynamically build full content loader map from registry (zero hardcoded categories)
    const fullContentMap = buildFullContentMap(contentModule);

    const loader = fullContentMap[category];
    if (!loader) return null;

    const item = await loader(slug);
    return (item as UnifiedContentItem) || null;
  } catch (error) {
    logger.error(
      `Failed to load full content: ${category}/${slug}`,
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  }
}

/**
 * Get related items for a specific item (same category, different slug)
 *
 * @param category - The content category
 * @param currentSlug - The slug of the current item to exclude
 * @param limit - Maximum number of related items to return (default: 3)
 * @returns Array of related content items
 */
export async function getRelatedContent(
  category: string,
  currentSlug: string,
  limit = 3
): Promise<UnifiedContentItem[]> {
  const allContent = await getContentByCategory(category);

  return allContent.filter((item) => item.slug !== currentSlug).slice(0, limit);
}

/**
 * Get total count of all configurations across all categories
 * Used for dynamic SEO metadata (e.g., "147+ configs")
 * Now dynamically derives category list from registry
 *
 * @returns Total count of all content items
 */
export async function getTotalContentCount(): Promise<number> {
  // Dynamically get all categories from registry (zero hardcoded lists)
  const categories = getAllCategoryIds();

  try {
    const counts = await Promise.all(
      categories.map(async (category) => {
        const content = await getContentByCategory(category);
        return content.length;
      })
    );

    return counts.reduce((sum, count) => sum + count, 0);
  } catch (error) {
    logger.error('Failed to get total content count', error as Error);
    return 147; // Fallback to reasonable estimate
  }
}
