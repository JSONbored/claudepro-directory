import { z } from 'zod';
import type { ContentItem } from '@/lib/schemas/content';
import { logger } from './logger';
import { contentCache, statsRedis } from './redis';
import { cacheCategorySchema } from './schemas/cache.schema';
import { getDisplayTitle } from './utils';

// Production-grade sort option validation schema
export const sortOptionSchema = z.enum(['trending', 'newest', 'alphabetical', 'popularity']);
export type SortOption = z.infer<typeof sortOptionSchema>;

// Sorting options schema for production-grade validation
export const sortingOptionsSchema = z.object({
  sort: sortOptionSchema,
  category: z.string().optional(),
  useViewData: z.boolean().optional(),
});
export type SortingOptions = z.infer<typeof sortingOptionsSchema>;

// View data map schema for type safety
export const viewDataMapSchema = z.record(z.string(), z.number());
export type ViewDataMap = z.infer<typeof viewDataMapSchema>;

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
      const aPopularity = (a as typeof a & { popularity?: number }).popularity ?? 0;
      const bPopularity = (b as typeof b & { popularity?: number }).popularity ?? 0;
      const aViews = viewData[a.slug] ?? aPopularity;
      const bViews = viewData[b.slug] ?? bPopularity;

      // For trending, weight recent activity higher
      const aScore = aViews * (1 + aPopularity * 0.1);
      const bScore = bViews * (1 + bPopularity * 0.1);

      return bScore - aScore;
    });
  },

  newest: (items: ContentItem[]) => {
    return [...items].sort((a, b) => {
      const aDate = a.dateAdded != null ? new Date(a.dateAdded).getTime() : 0;
      const bDate = b.dateAdded != null ? new Date(b.dateAdded).getTime() : 0;
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
      const aBasePopularity = (a as typeof a & { popularity?: number }).popularity ?? 0;
      const bBasePopularity = (b as typeof b & { popularity?: number }).popularity ?? 0;
      const aViewBonus = (viewData[a.slug] ?? 0) * 0.1;
      const bViewBonus = (viewData[b.slug] ?? 0) * 0.1;
      const aPopularity = aBasePopularity + aViewBonus;
      const bPopularity = bBasePopularity + bViewBonus;
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
        category: options.category ?? 'none',
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
  if (useViewData && category != null && (sort === 'trending' || sort === 'popularity')) {
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

// Generic content sorting function - consolidates all duplicate sorting logic
export async function sortContent(
  items: ContentItem[],
  category: string,
  sort: SortOption = 'trending'
): Promise<ContentItem[]> {
  // Validate inputs using existing schemas for production safety
  const validatedCategory = cacheCategorySchema.parse(category);
  const validatedSort = sortOptionSchema.parse(sort);
  return sortContentWithCache(items, {
    sort: validatedSort,
    category: validatedCategory,
    useViewData: true,
  });
}

// Clear sorting cache for a specific category
export async function clearSortingCache(category?: string): Promise<void> {
  try {
    const pattern = category != null ? `sort:*:*"category":"${category}"*` : 'sort:*';
    await contentCache.invalidatePattern(pattern);
  } catch (error) {
    logger.error(
      'Failed to clear sorting cache',
      error instanceof Error ? error : new Error(String(error)),
      {
        category: category ?? 'none',
        pattern: category != null ? `sort:*:*"category":"${category}"*` : 'sort:*',
      }
    );
  }
}

// Simple synchronous sorting functions for backward compatibility
// Moved from sorting.ts
export function sortByPopularity<T extends ContentItem>(items: readonly T[] | T[]): T[] {
  return [...items].sort(
    (a, b) =>
      ((b as typeof b & { popularity?: number }).popularity ?? 0) -
      ((a as typeof a & { popularity?: number }).popularity ?? 0)
  );
}

export function sortByNewest<T extends { createdAt?: string; date?: string }>(
  items: readonly T[] | T[]
): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt ?? a.date ?? '1970-01-01').getTime();
    const dateB = new Date(b.createdAt ?? b.date ?? '1970-01-01').getTime();
    return dateB - dateA;
  });
}

export function sortAlphabetically<
  T extends { name?: string | undefined; title?: string | undefined; slug: string },
>(items: readonly T[] | T[]): T[] {
  return [...items].sort((a, b) => {
    // Use a type-safe approach for getting display title
    const nameA = (a.title ?? a.name ?? a.slug).toLowerCase();
    const nameB = (b.title ?? b.name ?? b.slug).toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

// Note: ViewDataMap is already exported via the viewDataMapSchema type inference above
