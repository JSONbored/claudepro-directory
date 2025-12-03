/**
 * Content Statistics Utilities
 *
 * Pure utility functions for aggregating content statistics.
 * These functions can be used by both server and client components.
 */

/**
 * Aggregate statistics from an array of content items
 *
 * @param items - Array of content items with optional count fields
 * @returns Aggregated statistics object
 */
export function aggregateContentStats(items: Array<{
  view_count?: number | null;
  bookmark_count?: number | null;
  copy_count?: number | null;
  use_count?: number | null;
}>): {
  totalViews: number;
  totalBookmarks: number;
  totalCopies: number;
  totalUses: number;
  itemCount: number;
} {
  return items.reduce(
    (acc, item) => ({
      totalViews: acc.totalViews + (item.view_count ?? 0),
      totalBookmarks: acc.totalBookmarks + (item.bookmark_count ?? 0),
      totalCopies: acc.totalCopies + (item.copy_count ?? 0),
      totalUses: acc.totalUses + (item.use_count ?? 0),
      itemCount: acc.itemCount + 1,
    }),
    { totalViews: 0, totalBookmarks: 0, totalCopies: 0, totalUses: 0, itemCount: 0 }
  );
}
