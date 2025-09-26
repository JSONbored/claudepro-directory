import { getDisplayTitle } from '@/lib/utils';
import type { ContentItem } from '@/types/content';

// Sort items by popularity in descending order
export function sortByPopularity<T extends { popularity?: number }>(
  items: readonly T[] | T[]
): T[] {
  return [...items].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
}

// Sort items by date (newest first)
export function sortByNewest<T extends { createdAt?: string; date?: string }>(
  items: readonly T[] | T[]
): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date || '1970-01-01').getTime();
    const dateB = new Date(b.createdAt || b.date || '1970-01-01').getTime();
    return dateB - dateA;
  });
}

// Sort items alphabetically by name/title
export function sortAlphabetically<T extends { name?: string; title?: string; slug: string }>(
  items: readonly T[] | T[]
): T[] {
  return [...items].sort((a, b) => {
    const nameA = getDisplayTitle(a).toLowerCase();
    const nameB = getDisplayTitle(b).toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

// Generic sorting function that accepts a sort type
export function sortItems<T extends ContentItem>(
  items: T[],
  sortType: 'popularity' | 'newest' | 'alphabetical' = 'popularity'
): T[] {
  switch (sortType) {
    case 'newest':
      return sortByNewest(items);
    case 'alphabetical':
      return sortAlphabetically(items);
    default:
      return sortByPopularity(items);
  }
}
