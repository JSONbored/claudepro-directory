import Fuse, { type IFuseOptions } from 'fuse.js';
import { logger } from './logger';
import { contentCache } from './redis';
import type { FuseSearchableItem, SearchCacheKey, SearchFilters } from './schemas/search.schema';

// Re-export types for backward compatibility
export type { FuseSearchableItem as SearchableItem, SearchFilters, SearchCacheKey };

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

// Sort function factory
function createSortFunction(sort: string) {
  switch (sort) {
    case 'newest':
      return (a: FuseSearchableItem, b: FuseSearchableItem) => {
        // Assume newer items have higher popularity for now
        return (b.popularity || 0) - (a.popularity || 0);
      };
    case 'alphabetical':
      return (a: FuseSearchableItem, b: FuseSearchableItem) => {
        const aTitle = a.title || a.name || '';
        const bTitle = b.title || b.name || '';
        return aTitle.localeCompare(bTitle);
      };
    case 'popularity':
      return (a: FuseSearchableItem, b: FuseSearchableItem) =>
        (b.popularity || 0) - (a.popularity || 0);
    case 'trending':
      // For trending, factor in recency with popularity
      return (a: FuseSearchableItem, b: FuseSearchableItem) => {
        const aScore = (a.popularity || 0) * 1.2; // Weight trending higher
        const bScore = (b.popularity || 0) * 1.2;
        return bScore - aScore;
      };
    default:
      return (a: FuseSearchableItem, b: FuseSearchableItem) =>
        (b.popularity || 0) - (a.popularity || 0);
  }
}

// Filter function
function applyFilters<T extends FuseSearchableItem>(items: T[], filters: SearchFilters): T[] {
  let filtered = items;

  // Category filter
  if (filters.categories.length > 0) {
    filtered = filtered.filter((item) => filters.categories.includes(item.category));
  }

  // Tags filter
  if (filters.tags.length > 0) {
    filtered = filtered.filter((item) =>
      filters.tags.some((tag) =>
        item.tags.some((itemTag) => itemTag.toLowerCase().includes(tag.toLowerCase()))
      )
    );
  }

  // Popularity range filter
  const [min, max] = filters.popularity;
  if (min > 0 || max < 100) {
    filtered = filtered.filter((item) => {
      const popularity = item.popularity || 0;
      return popularity >= min && popularity <= max;
    });
  }

  return filtered;
}

// Main search cache class
export class SearchCache {
  private fuseCache = new Map<string, Fuse<FuseSearchableItem>>();
  private lastCacheCleanup = Date.now();
  private readonly CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 100;

  // Get or create Fuse instance for a dataset
  private getFuseInstance<T extends FuseSearchableItem>(
    items: T[],
    cacheKey: string,
    options?: IFuseOptions<T>
  ): Fuse<T> {
    if (this.fuseCache.has(cacheKey)) {
      return this.fuseCache.get(cacheKey) as Fuse<T>;
    }

    const defaultOptions: IFuseOptions<T> = {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'name', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'tags', weight: 0.2 },
        { name: 'category', weight: 0.1 },
      ],
      threshold: 0.3,
      includeScore: true,
      ignoreLocation: true,
      ...options,
    };

    const fuse = new Fuse(items, defaultOptions);

    // Clean up cache if it's getting too large
    if (this.fuseCache.size >= this.MAX_CACHE_SIZE) {
      this.cleanupCache();
    }

    this.fuseCache.set(cacheKey, fuse as Fuse<FuseSearchableItem>);
    return fuse;
  }

  // Clean up old cache entries
  private cleanupCache(): void {
    const now = Date.now();
    if (now - this.lastCacheCleanup < this.CACHE_CLEANUP_INTERVAL) {
      return;
    }

    // Simple cleanup: remove half the cache entries
    const entries = Array.from(this.fuseCache.entries());
    const toRemove = Math.floor(entries.length / 2);

    for (let i = 0; i < toRemove && i < entries.length; i++) {
      const entry = entries[i];
      if (entry) {
        this.fuseCache.delete(entry[0]);
      }
    }

    this.lastCacheCleanup = now;
  }

  // Cached search function
  async search<T extends FuseSearchableItem>(
    items: T[],
    query: string,
    filters: SearchFilters = {
      categories: [],
      tags: [],
      authors: [],
      sort: 'trending',
      popularity: [0, 100],
    },
    options?: IFuseOptions<T>
  ): Promise<T[]> {
    const cacheKey = generateSearchCacheKey(query, filters);

    try {
      // Try to get cached results first
      const cached = await contentCache.getAPIResponse<T[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Perform search if not cached
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

  // Perform the actual search
  private async performSearch<T extends FuseSearchableItem>(
    items: T[],
    query: string,
    filters: SearchFilters = {
      categories: [],
      tags: [],
      authors: [],
      sort: 'trending',
      popularity: [0, 100],
    },
    options?: IFuseOptions<T>
  ): Promise<T[]> {
    // Apply filters first
    const filtered = applyFilters(items, filters);

    // If no query, just return sorted filtered results
    if (!query.trim()) {
      const sortFunction = createSortFunction(filters.sort);
      return filtered.sort(sortFunction);
    }

    // Use Fuse for text search
    const fuse = this.getFuseInstance(
      filtered,
      `${items.length}-${JSON.stringify(options)}`,
      options
    );

    const fuseResults = fuse.search(query);

    // Extract items from Fuse results and apply additional sorting
    const searchResults = fuseResults.map((result) => result.item as T);

    // Apply final sorting
    const sortFunction = createSortFunction(filters.sort);
    return searchResults.sort(sortFunction);
  }

  // Invalidate cache for a specific pattern
  async invalidateSearchCache(pattern: string = 'search:*'): Promise<void> {
    try {
      await contentCache.invalidatePattern(pattern);
      this.fuseCache.clear();
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
    fuseInstances: number;
    lastCleanup: Date;
  } {
    return {
      fuseInstances: this.fuseCache.size,
      lastCleanup: new Date(this.lastCacheCleanup),
    };
  }
}

// Global search cache instance
export const searchCache = new SearchCache();
