/**
 * Content filter types - database validates via CHECK constraints.
 */

import type { SortDirection, SortOption } from '@/src/types/database-overrides';

// Re-export for convenience (these are now defined in database-overrides.ts)
export type { SortOption, SortDirection };

export type ContentFilterOptions = {
  categories: string[];
  tags: string[];
  authors: string[];
};

export function extractFilterOptions(
  data: Array<{
    category?: unknown;
    author?: unknown;
    tags?: unknown[];
  }>
): ContentFilterOptions {
  const categories = [...new Set(data.map((item) => item.category).filter(Boolean))] as string[];
  const authors = [...new Set(data.map((item) => item.author).filter(Boolean))] as string[];
  const allTags = data.flatMap((item) => (Array.isArray(item.tags) ? item.tags : []));
  const tags = [...new Set(allTags.filter(Boolean))] as string[];

  return { categories, tags, authors };
}
