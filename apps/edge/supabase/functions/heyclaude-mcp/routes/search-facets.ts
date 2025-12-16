/**
 * getSearchFacets Tool Handler
 *
 * Get available search facets (categories, tags, authors) for filtering content.
 * Helps AI agents understand what filters are available.
 */

import type { GetSearchFacetsReturns } from '@heyclaude/database-types/postgres-types';
import { SearchService } from '@heyclaude/data-layer/services/search.ts';
import { logError } from '@heyclaude/shared-runtime/logging.ts';

/**
 * Fetches available search facets (categories, tags, authors).
 *
 * @returns Search facets with categories, tags, and authors
 * @throws If service call fails
 */
export async function handleGetSearchFacets() {
  const searchService = new SearchService();
  
  // Get search facets using SearchService
  let data: GetSearchFacetsReturns;
  try {
    data = await searchService.getSearchFacets();
  } catch (error) {
    await logError('SearchService.getSearchFacets failed', {}, error);
    throw new Error(`Failed to fetch search facets: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Format response
  interface FacetRow {
    all_tags?: null | readonly string[];
    authors?: null | readonly string[];
    category: null | string;
    content_count: null | number;
  }

  const rows: FacetRow[] = Array.isArray(data) ? (data as FacetRow[]) : [];
  const facets = rows.map((item) => ({
    category: item.category ?? 'unknown',
    contentCount: Number(item.content_count ?? 0),
    tags: Array.isArray(item.all_tags)
      ? item.all_tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    authors: Array.isArray(item.authors)
      ? item.authors.filter((author): author is string => typeof author === 'string')
      : [],
  }));

  // Create text summary
  const totalCategories = facets.length;
  const totalContent = facets.reduce((sum, f) => sum + f.contentCount, 0);
  const allTags = new Set<string>();
  const allAuthors = new Set<string>();
  
  facets.forEach((f) => {
    f.tags.forEach((tag) => allTags.add(tag));
    f.authors.forEach((author) => allAuthors.add(author));
  });

  const textSummary = `Available search facets:\n\n` +
    `**Categories:** ${totalCategories} categories with ${totalContent} total content items\n` +
    `**Tags:** ${allTags.size} unique tags available\n` +
    `**Authors:** ${allAuthors.size} unique authors\n\n` +
    `**By Category:**\n${facets.map((f) => `- ${f.category}: ${f.contentCount} items, ${f.tags.length} tags, ${f.authors.length} authors`).join('\n')}\n\n` +
    `Use these facets to filter content with searchContent or getContentByTag tools.`;

  return {
    content: [
      {
        type: 'text' as const,
        text: textSummary,
      },
    ],
    _meta: {
      facets,
      summary: {
        totalCategories,
        totalContent,
        totalTags: allTags.size,
        totalAuthors: allAuthors.size,
      },
    },
  };
}
