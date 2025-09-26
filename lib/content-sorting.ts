import type { ContentItem } from '@/types/content';
import { logger } from './logger';
import { contentCache, statsRedis } from './redis';
import { getDisplayTitle } from './utils';

export type SortOption = 'trending' | 'newest' | 'alphabetical' | 'popularity';

export interface SortingOptions {
  sort: SortOption;
  category?: string;
  useViewData?: boolean;
}

interface ViewDataMap {
  [key: string]: number;
}

// Generate cache key for sorted content
function generateSortCacheKey(items: ContentItem[], options: SortingOptions): string {
  const itemsHash =
    items.length > 0
      ? `${items.length}-${items[0]?.slug || 'no-slug'}-${items[items.length - 1]?.slug || 'no-slug'}`
      : 'empty';

  return `sort:${itemsHash}:${JSON.stringify(options)}`;
}

// Get view data for items from Redis
async function getViewDataForItems(items: ContentItem[], category: string): Promise<ViewDataMap> {
  if (!statsRedis.isEnabled()) return {};

  try {
    const viewRequests = items.map((item) => ({
      category,
      slug: item.slug,
    }));

    const viewCounts = await statsRedis.getViewCounts(viewRequests);

    // Convert to item ID based map
    const viewDataMap: ViewDataMap = {};
    items.forEach((item) => {
      const key = `${category}:${item.slug}`;
      viewDataMap[item.slug] = viewCounts[key] || 0;
    });

    return viewDataMap;
  } catch (error) {
    logger.error(
      'Failed to get view data for sorting',
      error instanceof Error ? error : new Error(String(error)),
      { category, itemCount: items.length }
    );
    return {};
  }
}

// Sorting functions
const sortingFunctions = {
  trending: (items: ContentItem[], viewData: ViewDataMap = {}) => {
    return [...items].sort((a, b) => {
      // Use Redis view data if available, otherwise fall back to popularity
      const aViews = viewData[a.slug] ?? a.popularity ?? 0;
      const bViews = viewData[b.slug] ?? b.popularity ?? 0;

      // For trending, weight recent activity higher
      const aScore = aViews * (1 + (a.popularity || 0) * 0.1);
      const bScore = bViews * (1 + (b.popularity || 0) * 0.1);

      return bScore - aScore;
    });
  },

  newest: (items: ContentItem[]) => {
    return [...items].sort((a, b) => {
      const aDate = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
      const bDate = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
      return bDate - aDate;
    });
  },

  alphabetical: (items: ContentItem[]) => {
    return [...items].sort((a, b) => {
      const aName = getDisplayTitle(a).toLowerCase();
      const bName = getDisplayTitle(b).toLowerCase();
      return aName.localeCompare(bName);
    });
  },

  popularity: (items: ContentItem[], viewData: ViewDataMap = {}) => {
    return [...items].sort((a, b) => {
      // Combine static popularity with actual view data
      const aPopularity = (a.popularity || 0) + (viewData[a.slug] || 0) * 0.1;
      const bPopularity = (b.popularity || 0) + (viewData[b.slug] || 0) * 0.1;
      return bPopularity - aPopularity;
    });
  },
};

// Main sorting function with caching
export async function sortContentWithCache<T extends ContentItem>(
  items: T[],
  options: SortingOptions
): Promise<T[]> {
  if (items.length === 0) return items;

  const cacheKey = generateSortCacheKey(items, options);

  try {
    // Try to get cached result
    const cached = await contentCache.getAPIResponse<T[]>(cacheKey);
    if (cached && cached.length > 0) {
      // Validate cached data integrity
      if (cached.length === items.length && cached.every((item) => item.slug)) {
        return cached;
      }
    }

    // Perform sorting
    const sorted = await performSort(items, options);

    // Cache result for 30 minutes
    await contentCache.cacheAPIResponse(cacheKey, sorted, 30 * 60);

    return sorted;
  } catch (error) {
    logger.error(
      'Content sorting cache error, falling back to direct sort',
      error instanceof Error ? error : new Error(String(error)),
      {
        itemCount: items.length,
        sort: options.sort,
        category: options.category || 'none',
      }
    );

    // Fallback to direct sorting
    return performSort(items, options);
  }
}

// Perform the actual sorting
async function performSort<T extends ContentItem>(
  items: T[],
  options: SortingOptions
): Promise<T[]> {
  const { sort, category, useViewData = true } = options;

  // Get view data if needed and available
  let viewData: ViewDataMap = {};
  if (useViewData && category && (sort === 'trending' || sort === 'popularity')) {
    viewData = await getViewDataForItems(items, category);
  }

  // Apply sorting function
  const sortFunction = sortingFunctions[sort];
  if (!sortFunction) {
    logger.error('Unknown sort option', new Error('Invalid sort option'), { sort });
    return items;
  }

  return sortFunction(items, viewData) as T[];
}

// Specialized sorting for different content types
export async function sortAgents(
  items: ContentItem[],
  sort: SortOption = 'trending'
): Promise<ContentItem[]> {
  return sortContentWithCache(items, { sort, category: 'agents', useViewData: true });
}

export async function sortMcp(
  items: ContentItem[],
  sort: SortOption = 'trending'
): Promise<ContentItem[]> {
  return sortContentWithCache(items, { sort, category: 'mcp', useViewData: true });
}

export async function sortRules(
  items: ContentItem[],
  sort: SortOption = 'trending'
): Promise<ContentItem[]> {
  return sortContentWithCache(items, { sort, category: 'rules', useViewData: true });
}

export async function sortCommands(
  items: ContentItem[],
  sort: SortOption = 'trending'
): Promise<ContentItem[]> {
  return sortContentWithCache(items, { sort, category: 'commands', useViewData: true });
}

export async function sortHooks(
  items: ContentItem[],
  sort: SortOption = 'trending'
): Promise<ContentItem[]> {
  return sortContentWithCache(items, { sort, category: 'hooks', useViewData: true });
}

export async function sortGuides(
  items: ContentItem[],
  sort: SortOption = 'trending'
): Promise<ContentItem[]> {
  return sortContentWithCache(items, { sort, category: 'guides', useViewData: true });
}

// Clear sorting cache for a specific category
export async function clearSortingCache(category?: string): Promise<void> {
  try {
    const pattern = category ? `sort:*:*"category":"${category}"*` : 'sort:*';
    await contentCache.invalidatePattern(pattern);
  } catch (error) {
    logger.error(
      'Failed to clear sorting cache',
      error instanceof Error ? error : new Error(String(error)),
      {
        category: category || 'none',
        pattern: category ? `sort:*:*"category":"${category}"*` : 'sort:*',
      }
    );
  }
}

// Export for components that need direct access
export type { ViewDataMap };
