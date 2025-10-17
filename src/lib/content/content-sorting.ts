import { z } from 'zod';
import type { ContentItem } from '@/src/lib/schemas/content/content-item-union.schema';

// Production-grade sort option validation schema
const sortOptionSchema = z.enum(['trending', 'newest', 'alphabetical', 'popularity']);
export type SortOption = z.infer<typeof sortOptionSchema>;

// Sorting options schema for production-grade validation
const sortingOptionsSchema = z.object({
  sort: sortOptionSchema,
  category: z.string().optional(),
  useViewData: z.boolean().optional(),
});
export type SortingOptions = z.infer<typeof sortingOptionsSchema>;

// View data map schema for type safety
const viewDataMapSchema = z.record(z.string(), z.number());
export type ViewDataMap = z.infer<typeof viewDataMapSchema>;

/**
 * Core sorting functions for content items
 */
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
  T extends {
    name?: string | undefined;
    title?: string | undefined;
    slug: string;
  },
>(items: readonly T[] | T[]): T[] {
  return [...items].sort((a, b) => {
    // Use a type-safe approach for getting display title
    const nameA = (a.title ?? a.name ?? a.slug).toLowerCase();
    const nameB = (b.title ?? b.name ?? b.slug).toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

// Note: ViewDataMap is already exported via the viewDataMapSchema type inference above
