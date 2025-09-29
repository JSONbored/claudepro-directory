/**
 * Lazy Content Loaders
 * Provides lazy-loaded access to large generated content files
 * CONSOLIDATION: Enhanced with split content index support for better performance
 */

import { z } from 'zod';
import { MAIN_CONTENT_CATEGORIES } from '@/lib/constants';
import type { ContentItem } from '@/lib/related-content/service';
import type { HookContent, MCPServerContent } from '@/lib/schemas/content.schema';
import { BatchLazyLoader, createLazyModule, PaginatedLazyLoader } from './lazy-loader';

// Schema for metadata lookup
const metadataLookupSchema = z.record(z.string(), z.any());

// Type aliases for consistency
export type McpContent = MCPServerContent;

// Lazy load the full MCP content
export const mcpFullLoader = createLazyModule<McpContent[]>(
  () => import('@/generated/mcp-full').then((m) => [...m.mcpFull]),
  {
    preload: false, // Don't preload by default
    cacheTimeout: 5 * 60 * 1000, // Clear cache after 5 minutes of inactivity
  }
);

// Lazy load the full hooks content
export const hooksFullLoader = createLazyModule<HookContent[]>(
  () => import('@/generated/hooks-full').then((m) => [...m.hooksFull]),
  {
    preload: false,
    cacheTimeout: 5 * 60 * 1000,
  }
);

// Batch loader for all metadata files
export const metadataLoader = new BatchLazyLoader(
  {
    mcpMetadata: () => import('@/generated/mcp-metadata').then((m) => m.mcpMetadata),
    hooksMetadata: () => import('@/generated/hooks-metadata').then((m) => m.hooksMetadata),
    agentsMetadata: () => import('@/generated/agents-metadata').then((m) => m.agentsMetadata),
    commandsMetadata: () => import('@/generated/commands-metadata').then((m) => m.commandsMetadata),
    rulesMetadata: () => import('@/generated/rules-metadata').then((m) => m.rulesMetadata),
  },
  {
    preloadKeys: [], // Don't preload any by default
    cacheTimeout: 10 * 60 * 1000, // 10 minutes
  }
);

// Paginated loader for large content lists
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
        maxCachedPages: 5, // Keep max 5 pages in memory
      }
    );
  }

  /**
   * Get total item count
   */
  async getTotalCount(): Promise<number> {
    const content = await this.allContent();
    return content.length;
  }

  /**
   * Search within content
   */
  async search(predicate: (item: T) => boolean, limit?: number): Promise<T[]> {
    const content = await this.allContent();
    const results = content.filter(predicate);
    return limit ? results.slice(0, limit) : results;
  }
}

// Create paginated loaders for large content
export const mcpPaginatedLoader = new ContentPaginatedLoader(() => mcpFullLoader.get());

export const hooksPaginatedLoader = new ContentPaginatedLoader(() => hooksFullLoader.get());

/**
 * Helper function to get specific content by slug
 */
export async function getMcpContentBySlug(slug: string): Promise<McpContent | null> {
  const allContent = await mcpFullLoader.get();
  return allContent.find((item) => item.slug === slug) || null;
}

export async function getHookContentBySlug(slug: string): Promise<HookContent | null> {
  const allContent = await hooksFullLoader.get();
  return allContent.find((item) => item.slug === slug) || null;
}

/**
 * Helper to get metadata without loading full content
 */
export async function getMcpMetadataBySlug(slug: string) {
  const metadata = await metadataLoader.get('mcpMetadata');
  const parsed = metadataLookupSchema.parse(metadata);
  return parsed[slug] || null;
}

export async function getHooksMetadataBySlug(slug: string) {
  const metadata = await metadataLoader.get('hooksMetadata');
  const parsed = metadataLookupSchema.parse(metadata);
  return parsed[slug] || null;
}

/**
 * Memory management utilities
 */
export const contentMemoryManager = {
  /**
   * Clear all cached content to free memory
   */
  clearAll(): void {
    mcpFullLoader.clear();
    hooksFullLoader.clear();
    metadataLoader.clear();
    mcpPaginatedLoader.clear();
    hooksPaginatedLoader.clear();
  },

  /**
   * Clear specific content type
   */
  clear(contentType: 'mcp' | 'hooks' | 'metadata'): void {
    switch (contentType) {
      case 'mcp':
        mcpFullLoader.clear();
        mcpPaginatedLoader.clear();
        break;
      case 'hooks':
        hooksFullLoader.clear();
        hooksPaginatedLoader.clear();
        break;
      case 'metadata':
        metadataLoader.clear();
        break;
    }
  },

  /**
   * Get memory usage statistics
   */
  getStats(): {
    mcpLoaded: boolean;
    hooksLoaded: boolean;
    metadataLoaded: string[];
    paginatedStats: {
      mcp: ReturnType<PaginatedLazyLoader<unknown>['getCacheStats']>;
      hooks: ReturnType<PaginatedLazyLoader<unknown>['getCacheStats']>;
    };
  } {
    return {
      mcpLoaded: mcpFullLoader.isLoaded(),
      hooksLoaded: hooksFullLoader.isLoaded(),
      metadataLoaded: metadataLoader.getLoadedKeys() as string[],
      paginatedStats: {
        mcp: mcpPaginatedLoader.getCacheStats(),
        hooks: hooksPaginatedLoader.getCacheStats(),
      },
    };
  },
};

// CONSOLIDATION: Split Content Index Loaders
// Leverage existing lazy loading patterns for the new split content structure

// CONSOLIDATION: Removed unused schema

// Create individual loaders for each main category using centralized constants
export const splitContentLoaders = Object.fromEntries(
  MAIN_CONTENT_CATEGORIES.map((category) => [
    `${category}IndexLoader`,
    createLazyModule<{ items: unknown[]; category: string; count: number }>(
      // Use unknown[] for JSON compatibility
      () => import(`@/generated/content-index-${category}.json`).then((m) => m.default),
      {
        preload: false,
        cacheTimeout: 10 * 60 * 1000, // 10 minutes cache
      }
    ),
  ])
) as Record<string, ReturnType<typeof createLazyModule>>;

// Create a batch loader for all split indices
export const splitIndicesLoader = new BatchLazyLoader(
  Object.fromEntries(
    MAIN_CONTENT_CATEGORIES.map((category) => [
      category,
      () => import(`@/generated/content-index-${category}.json`).then((m) => m.default),
    ])
  ),
  {
    preloadKeys: [], // Load on demand
    cacheTimeout: 10 * 60 * 1000,
  }
);

// Loader for the "other" categories index
export const otherContentLoader = createLazyModule<{
  items: unknown[]; // Use unknown[] for JSON import compatibility
  categories: string[];
  count: number;
}>(() => import('@/generated/content-index-other.json').then((m) => m.default), {
  preload: false,
  cacheTimeout: 10 * 60 * 1000,
});

// Loader for the summary index (lightweight)
export const contentSummaryLoader = createLazyModule<{
  categories: Array<{ category: string; count: number }>;
  totalItems: number;
}>(() => import('@/generated/content-index-summary.json').then((m) => m.default), {
  preload: true, // Preload this since it's small and frequently needed
  cacheTimeout: 30 * 60 * 1000, // 30 minutes cache
});

/**
 * CONSOLIDATION: Unified content access helpers
 * Provides optimized access to split content with fallback to original structure
 */
export const contentIndexHelpers = {
  /**
   * Get content for a specific category (uses split indices for better performance)
   */
  async getContentByCategory(category: string): Promise<ContentItem[]> {
    // For main categories, use split indices
    if (MAIN_CONTENT_CATEGORIES.includes(category as (typeof MAIN_CONTENT_CATEGORIES)[number])) {
      const categoryData = await splitIndicesLoader.get(category);
      return categoryData.items as ContentItem[];
    }

    // For other categories, use the "other" index
    const otherData = await otherContentLoader.get();
    return (otherData.items as ContentItem[]).filter((item) => item.category === category);
  },

  /**
   * Get content summary without loading full indices
   */
  async getContentSummary() {
    return contentSummaryLoader.get();
  },

  /**
   * Search across all categories efficiently
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
          item.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
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
   */
  calculateRelevanceScore(item: ContentItem, query: string): number {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    // Title match (highest priority)
    if (item.title?.toLowerCase().includes(lowerQuery)) score += 10;

    // Description match
    if (item.description.toLowerCase().includes(lowerQuery)) score += 5;

    // Tag matches
    const tagMatches = item.tags.filter((tag) => tag.toLowerCase().includes(lowerQuery)).length;
    score += tagMatches * 3;

    // Featured boost
    if (item.featured) score += 2;

    return score;
  },

  /**
   * Memory management for split loaders
   */
  clearSplitCaches(): void {
    splitIndicesLoader.clear();
    otherContentLoader.clear();
    contentSummaryLoader.clear();

    // Clear individual category loaders
    Object.values(splitContentLoaders).forEach((loader) => {
      if (typeof loader.clear === 'function') {
        loader.clear();
      }
    });
  },

  /**
   * Get loading statistics for split content
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
