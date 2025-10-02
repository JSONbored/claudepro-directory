/**
 * Modern Lazy Content Loaders (2025)
 *
 * Factory-based lazy loading system with dynamic loader generation.
 * Consolidates repetitive loader definitions using config-driven architecture.
 *
 * Performance improvements:
 * - Dynamic loader generation from category config
 * - Type-safe generic helpers
 * - Automatic cache management
 *
 * Reduction: ~50 lines through factory pattern consolidation
 *
 * @see lib/config/build-category-config.ts - Category configuration
 */

import type { BuildCategoryId } from '@/lib/config/build-category-config';
import { getAllBuildCategoryConfigs } from '@/lib/config/build-category-config';
import { MAIN_CONTENT_CATEGORIES } from '@/lib/constants';
import type { ContentItem } from '@/lib/schemas/related-content.schema';
import { BatchLazyLoader, createLazyModule, PaginatedLazyLoader } from './lazy-loader';

/**
 * Generic content type for type-safe loaders
 * Modern pattern with minimal type constraint
 */
type GenericContent = { slug: string; [key: string]: unknown };

/**
 * Factory function to create full content loaders dynamically
 * Modern approach: One function to generate all loaders
 *
 * @param categoryId - Category identifier
 * @returns Lazy loader for full content
 */
function createFullContentLoader<T extends GenericContent>(categoryId: BuildCategoryId) {
  const varName = categoryId.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
  return createLazyModule<T[]>(
    () =>
      import(`@/generated/${categoryId}-full`).then((m) => {
        const fullKey = `${varName}Full`;
        return [...m[fullKey]];
      }),
    {
      preload: false,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Factory function to create metadata loaders dynamically
 * Modern approach: Dynamic import path generation
 *
 * @param categoryId - Category identifier
 * @returns Loader function for metadata
 */
function createMetadataLoaderFactory(categoryId: BuildCategoryId) {
  const varName = categoryId.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
  return () =>
    import(`@/generated/${categoryId}-metadata`).then((m) => {
      const metadataKey = `${varName}Metadata`;
      return m[metadataKey];
    });
}

/**
 * Full content loaders registry
 * Modern pattern: Dynamic generation from config
 */
export const fullContentLoaders = Object.fromEntries(
  getAllBuildCategoryConfigs().map((config) => [
    config.id,
    createFullContentLoader(config.id as BuildCategoryId),
  ])
) as Record<BuildCategoryId, ReturnType<typeof createLazyModule>>;

/**
 * Batch loader for all metadata files
 * Modern approach: Dynamic generation from config
 */
export const metadataLoader = new BatchLazyLoader(
  Object.fromEntries(
    getAllBuildCategoryConfigs().map((config) => {
      const varName = config.id.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
      return [`${varName}Metadata`, createMetadataLoaderFactory(config.id as BuildCategoryId)];
    })
  ),
  {
    preloadKeys: [],
    cacheTimeout: 10 * 60 * 1000, // 10 minutes
  }
);

/**
 * Paginated loader for large content lists
 * Modern generic class with type safety
 */
export class ContentPaginatedLoader<T> extends PaginatedLazyLoader<T> {
  constructor(
    private allContent: () => Promise<T[]>,
    pageSize: number = 20
  ) {
    super(
      async (page, size) => {
        const content = await allContent();
        const start = page * size;
        const end = start + size;
        return content.slice(start, end);
      },
      {
        pageSize,
        maxCachedPages: 5,
      }
    );
  }

  /**
   * Get total item count
   * Modern async pattern
   */
  async getTotalCount(): Promise<number> {
    const content = await this.allContent();
    return content.length;
  }

  /**
   * Search within content
   * Modern pattern with optional limit
   */
  async search(predicate: (item: T) => boolean, limit?: number): Promise<T[]> {
    const content = await this.allContent();
    const results = content.filter(predicate);
    return limit ? results.slice(0, limit) : results;
  }
}

/**
 * Paginated loaders registry
 * Modern pattern: Dynamic generation from full content loaders
 */
export const paginatedLoaders = Object.fromEntries(
  getAllBuildCategoryConfigs().map((config) => [
    config.id,
    new ContentPaginatedLoader(
      () => fullContentLoaders[config.id as BuildCategoryId].get() as Promise<GenericContent[]>
    ),
  ])
) as Record<BuildCategoryId, ContentPaginatedLoader<GenericContent>>;

/**
 * Generic helper to get content by slug
 * Modern approach: Single function for all categories
 *
 * @param categoryId - Category identifier
 * @param slug - Content slug
 * @returns Content item or null
 */
export async function getContentBySlug<T extends GenericContent>(
  categoryId: BuildCategoryId,
  slug: string
): Promise<T | null> {
  const loader = fullContentLoaders[categoryId];
  if (!loader) return null;

  const allContent = (await loader.get()) as GenericContent[];
  return (allContent.find((item: GenericContent) => item.slug === slug) as T) || null;
}

/**
 * Generic helper to get metadata by slug
 * Modern approach: Single function for all categories
 *
 * @param categoryId - Category identifier
 * @param slug - Content slug
 * @returns Metadata item or null
 */
export async function getMetadataBySlug(
  categoryId: BuildCategoryId,
  slug: string
): Promise<GenericContent | null> {
  const varName = categoryId.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
  const metadataKey = `${varName}Metadata`;

  const metadata = await metadataLoader.get(metadataKey);
  const items = Array.isArray(metadata) ? metadata : [];
  return items.find((item: GenericContent) => item.slug === slug) || null;
}

/**
 * Memory management utilities
 * Modern approach: Dynamic cache clearing
 */
export const contentMemoryManager = {
  /**
   * Clear all cached content to free memory
   */
  clearAll(): void {
    metadataLoader.clear();

    // Clear all full content loaders dynamically
    for (const loader of Object.values(fullContentLoaders)) {
      loader.clear();
    }

    // Clear all paginated loaders dynamically
    for (const loader of Object.values(paginatedLoaders)) {
      loader.clear();
    }
  },

  /**
   * Clear specific content type
   * Modern approach: Dynamic lookup
   */
  clear(categoryId: BuildCategoryId): void {
    fullContentLoaders[categoryId]?.clear();
    paginatedLoaders[categoryId]?.clear();
  },

  /**
   * Clear all metadata
   */
  clearMetadata(): void {
    metadataLoader.clear();
  },

  /**
   * Get memory usage statistics
   * Modern approach: Dynamic stats generation
   */
  getStats(): {
    fullLoadersLoaded: Record<BuildCategoryId, boolean>;
    metadataLoaded: string[];
    paginatedStats: Record<
      BuildCategoryId,
      ReturnType<PaginatedLazyLoader<unknown>['getCacheStats']>
    >;
  } {
    return {
      fullLoadersLoaded: Object.fromEntries(
        getAllBuildCategoryConfigs().map((config) => [
          config.id,
          fullContentLoaders[config.id as BuildCategoryId]?.isLoaded() ?? false,
        ])
      ) as Record<BuildCategoryId, boolean>,
      metadataLoaded: metadataLoader.getLoadedKeys() as string[],
      paginatedStats: Object.fromEntries(
        getAllBuildCategoryConfigs().map((config) => [
          config.id,
          paginatedLoaders[config.id as BuildCategoryId]?.getCacheStats(),
        ])
      ) as Record<BuildCategoryId, ReturnType<PaginatedLazyLoader<unknown>['getCacheStats']>>,
    };
  },
};

// ============================================================================
// CONSOLIDATION: Split Content Index Loaders
// ============================================================================

/**
 * Split content loaders for main categories
 * Modern pattern: Dynamic generation from constants
 */
export const splitContentLoaders = Object.fromEntries(
  MAIN_CONTENT_CATEGORIES.map((category) => [
    `${category}IndexLoader`,
    createLazyModule<{ items: unknown[]; category: string; count: number }>(
      () => import(`@/generated/content-index-${category}.json`).then((m) => m.default),
      {
        preload: false,
        cacheTimeout: 10 * 60 * 1000,
      }
    ),
  ])
) as Record<string, ReturnType<typeof createLazyModule>>;

/**
 * Batch loader for all split indices
 * Modern pattern: Dynamic generation from constants
 */
export const splitIndicesLoader = new BatchLazyLoader(
  Object.fromEntries(
    MAIN_CONTENT_CATEGORIES.map((category) => [
      category,
      () => import(`@/generated/content-index-${category}.json`).then((m) => m.default),
    ])
  ),
  {
    preloadKeys: [],
    cacheTimeout: 10 * 60 * 1000,
  }
);

/**
 * Loader for the "other" categories index
 * Modern lazy loading with type safety
 */
export const otherContentLoader = createLazyModule<{
  items: unknown[];
  categories: string[];
  count: number;
}>(() => import('@/generated/content-index-other.json').then((m) => m.default), {
  preload: false,
  cacheTimeout: 10 * 60 * 1000,
});

/**
 * Loader for the summary index (lightweight)
 * Modern pattern: Preload small frequently-used data
 */
export const contentSummaryLoader = createLazyModule<{
  categories: Array<{ category: string; count: number }>;
  totalItems: number;
}>(() => import('@/generated/content-index-summary.json').then((m) => m.default), {
  preload: true,
  cacheTimeout: 30 * 60 * 1000,
});

/**
 * Unified content access helpers
 * Modern approach with optimized split content access
 */
export const contentIndexHelpers = {
  /**
   * Get content for a specific category
   * Uses split indices for better performance
   */
  async getContentByCategory(category: string): Promise<ContentItem[]> {
    if (MAIN_CONTENT_CATEGORIES.includes(category as (typeof MAIN_CONTENT_CATEGORIES)[number])) {
      const categoryData = await splitIndicesLoader.get(category);
      return categoryData.items as ContentItem[];
    }

    const otherData = await otherContentLoader.get();
    return (otherData.items as ContentItem[]).filter((item) => item.category === category);
  },

  /**
   * Get content summary without loading full indices
   * Modern async pattern
   */
  async getContentSummary() {
    return contentSummaryLoader.get();
  },

  /**
   * Search across all categories efficiently
   * Modern approach with parallel search and relevance scoring
   */
  async searchContent(
    query: string,
    categories?: string[],
    limit?: number
  ): Promise<ContentItem[]> {
    const results: ContentItem[] = [];
    const searchCategories = categories || MAIN_CONTENT_CATEGORIES;

    // Search in parallel across requested categories
    const searchPromises = searchCategories.map(async (category) => {
      const items = await this.getContentByCategory(category);
      return items.filter(
        (item) =>
          item.title?.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()) ||
          item.tags?.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))
      );
    });

    const categoryResults = await Promise.all(searchPromises);
    results.push(...categoryResults.flat());

    // Sort by relevance and apply limit
    const sorted = results.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, query);
      const bScore = this.calculateRelevanceScore(b, query);
      return bScore - aScore;
    });

    return limit ? sorted.slice(0, limit) : sorted;
  },

  /**
   * Calculate relevance score for search results
   * Modern scoring algorithm with weighted factors
   */
  calculateRelevanceScore(item: ContentItem, query: string): number {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    if (item.title?.toLowerCase().includes(lowerQuery)) score += 10;
    if (item.description.toLowerCase().includes(lowerQuery)) score += 5;

    const tagMatches =
      item.tags?.filter((tag: string) => tag.toLowerCase().includes(lowerQuery)).length ?? 0;
    score += tagMatches * 3;

    if (item.featured) score += 2;

    return score;
  },

  /**
   * Memory management for split loaders
   * Modern approach: Clear all split content caches
   */
  clearSplitCaches(): void {
    splitIndicesLoader.clear();
    otherContentLoader.clear();
    contentSummaryLoader.clear();

    Object.values(splitContentLoaders).forEach((loader) => {
      if (typeof loader.clear === 'function') {
        loader.clear();
      }
    });
  },

  /**
   * Get loading statistics for split content
   * Modern diagnostics with comprehensive stats
   */
  getSplitContentStats() {
    return {
      splitIndicesLoaded: splitIndicesLoader.getLoadedKeys(),
      otherContentLoaded: otherContentLoader.isLoaded(),
      summaryLoaded: contentSummaryLoader.isLoaded(),
      individualLoadersLoaded: Object.entries(splitContentLoaders).map(([key, loader]) => ({
        category: key,
        loaded: typeof loader.isLoaded === 'function' ? loader.isLoaded() : false,
      })),
    };
  },
};

/**
 * Legacy exports for backward compatibility
 * Modern pattern: Re-export from dynamic loaders
 */
export const mcpFullLoader = fullContentLoaders.mcp;
export const hooksFullLoader = fullContentLoaders.hooks;
export const mcpPaginatedLoader = paginatedLoaders.mcp;
export const hooksPaginatedLoader = paginatedLoaders.hooks;

/**
 * Legacy helper functions for backward compatibility
 * Modern pattern: Delegate to generic helpers
 */
export const getMcpContentBySlug = (slug: string) => getContentBySlug('mcp', slug);
export const getHookContentBySlug = (slug: string) => getContentBySlug('hooks', slug);
export const getMcpMetadataBySlug = (slug: string) => getMetadataBySlug('mcp', slug);
export const getHooksMetadataBySlug = (slug: string) => getMetadataBySlug('hooks', slug);
