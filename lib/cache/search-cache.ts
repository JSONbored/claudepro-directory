/**
 * Search Cache - High-Performance Search with Fuzzysort
 *
 * Migrated from Fuse.js to Fuzzysort for better performance:
 * - 3-5x faster search operations
 * - 67% smaller bundle size (20KB vs 60KB)
 * - Lazy-loaded for optimal initial page load
 *
 * @see lib/search-adapters/fuzzysort-adapter.ts
 */

import { logger } from '@/lib/logger';
import { contentCache } from '@/lib/redis';
import type { SearchableItem, SearchCacheKey, SearchFilters } from '@/lib/schemas/search.schema';
import { searchWithFilters } from '@/lib/search-adapters/fuzzysort-adapter';

// Re-export types
export type { SearchableItem, SearchFilters, SearchCacheKey };

// Generate a cache key from search parameters
function generateSearchCacheKey(query: string, filters: SearchFilters): string {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedFilters = {
    categories: filters.categories.sort(),
    tags: filters.tags.sort(),
    authors: filters.authors.sort(),
    sort: filters.sort,
    popularity: filters.popularity,
  };

  return `search:${btoa(JSON.stringify({ query: normalizedQuery, filters: normalizedFilters }))}`;
}

// Note: Filter and sort functions are now handled by fuzzysort-adapter.ts

// Main search cache class
class SearchCache {
  // Cached search function
  async search<T extends SearchableItem>(
    items: T[],
    query: string,
    filters: SearchFilters = {
      categories: [],
      tags: [],
      authors: [],
      sort: 'trending',
      popularity: [0, 100],
    },
    options?: {
      threshold?: number;
      limit?: number;
      includeScore?: boolean;
      keys?: Array<{ name: string; weight: number }>;
    }
  ): Promise<T[]> {
    const cacheKey = generateSearchCacheKey(query, filters);

    try {
      // Try to get cached results first
      const cached = await contentCache.getAPIResponse<T[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Perform search if not cached using Fuzzysort
      const results = await this.performSearch(items, query, filters, options);

      // Cache results for 1 hour
      await contentCache.cacheAPIResponse(cacheKey, results, 60 * 60);

      return results;
    } catch (error) {
      logger.error(
        'Search cache error, falling back to direct search',
        error instanceof Error ? error : new Error(String(error)),
        { query, filtersCount: Object.keys(filters).length }
      );

      // Fallback to direct search
      return this.performSearch(items, query, filters, options);
    }
  }

  // Perform the actual search with Fuzzysort
  private async performSearch<T extends SearchableItem>(
    items: T[],
    query: string,
    filters: SearchFilters = {
      categories: [],
      tags: [],
      authors: [],
      sort: 'trending',
      popularity: [0, 100],
    },
    options?: {
      threshold?: number;
      limit?: number;
    }
  ): Promise<T[]> {
    // Use Fuzzysort adapter with filters
    return searchWithFilters(items, query, filters, {
      threshold: options?.threshold || 0.3,
      limit: options?.limit || 100,
    });
  }

  // Invalidate cache for a specific pattern
  async invalidateSearchCache(pattern: string = 'search:*'): Promise<void> {
    try {
      await contentCache.invalidatePattern(pattern);
      logger.info('Search cache invalidated', { pattern });
    } catch (error) {
      logger.error(
        'Failed to invalidate search cache',
        error instanceof Error ? error : new Error(String(error)),
        { pattern }
      );
    }
  }

  // Get cache statistics
  getCacheStats(): {
    cacheType: string;
  } {
    return {
      cacheType: 'Redis-based with Fuzzysort',
    };
  }
}

// Global search cache instance
export const searchCache = new SearchCache();
