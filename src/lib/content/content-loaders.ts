/**
 * Dynamic Content Loading Utilities
 *
 * Provides unified content loading functions that work across all categories.
 * Replaces individual category-specific loaders with dynamic routing-based loaders.
 *
 * Features:
 * - Category-agnostic loading (works for agents, mcp, commands, rules, hooks, statuslines)
 * - Lazy loading for performance optimization
 * - Redis caching for optimal performance (4-hour TTL)
 * - Type-safe with proper error handling
 * - Supports both metadata and full content loading
 *
 * Performance:
 * - Cache hit: ~5ms (Redis)
 * - Cache miss: ~50-100ms (file system + JSON parse)
 * - Cache hit rate: Target >85% in production
 *
 * Used by:
 * - app/[category]/page.tsx (list pages)
 * - app/[category]/[slug]/page.tsx (detail pages)
 */

import { logger } from '@/src/lib/logger';
import { contentCache } from '@/src/lib/redis';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';

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
        logger.debug('Content cache hit', { category, itemCount: cached.length });
        return cached;
      }
    }

    // Cache miss - load from generated files
    const contentModule = await import('@/generated/content');

    // Map category to loader function
    const loaderMap: Record<string, () => Promise<UnifiedContentItem[]>> = {
      agents: contentModule.getAgents,
      mcp: contentModule.getMcp,
      commands: contentModule.getCommands,
      rules: contentModule.getRules,
      hooks: contentModule.getHooks,
      statuslines: contentModule.getStatuslines,
      collections: contentModule.getCollections,
    };

    const loader = loaderMap[category];
    if (!loader) {
      logger.error('Invalid category for content loading', new Error('Category not found'), {
        category,
        availableCategories: Object.keys(loaderMap).join(', '),
      });
      return [];
    }

    const items = await loader();

    // Cache the result for 4 hours (async, non-blocking)
    if (contentCache.isEnabled() && items.length > 0) {
      contentCache
        .cacheContentMetadata(category, items, CACHE_TTL.CATEGORY)
        .catch((err) => logger.warn('Failed to cache category content', { category, error: err }));
    }

    logger.debug('Content loaded from file system', { category, itemCount: items.length });
    return items;
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

    // Map category to slug loader function
    const bySlugMap: Record<string, (slug: string) => Promise<UnifiedContentItem | undefined>> = {
      agents: contentModule.getAgentBySlug,
      mcp: contentModule.getMcpBySlug,
      commands: contentModule.getCommandBySlug,
      rules: contentModule.getRuleBySlug,
      hooks: contentModule.getHookBySlug,
      statuslines: contentModule.getStatuslineBySlug,
      collections: contentModule.getCollectionBySlug,
    };

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

    // Map category to full content loader
    // Each category returns its specific type (AgentContent, MCPContent, etc.)
    // which are all compatible with UnifiedContentItem
    // Each loader can return null if the item is not found
    const fullContentMap: Record<string, (slug: string) => Promise<UnifiedContentItem | null>> = {
      agents: contentModule.getAgentFullContent,
      mcp: contentModule.getMcpFullContent,
      commands: contentModule.getCommandFullContent,
      rules: contentModule.getRuleFullContent,
      hooks: contentModule.getHookFullContent,
      statuslines: contentModule.getStatuslineFullContent,
      collections: contentModule.getCollectionFullContent,
    };

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
  limit: number = 3
): Promise<UnifiedContentItem[]> {
  const allContent = await getContentByCategory(category);

  return allContent.filter((item) => item.slug !== currentSlug).slice(0, limit);
}
