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
