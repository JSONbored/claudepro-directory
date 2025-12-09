/**
 * getSearchFacets Tool Handler
 *
 * Get available search facets (categories, tags, authors) for filtering content.
 * Helps AI agents understand what filters are available.
 */

import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@heyclaude/shared-runtime/logging.ts';

/**
 * Fetches available search facets (categories, tags, authors).
 *
 * @param supabase - Authenticated Supabase client
 * @returns Search facets with categories, tags, and authors
 * @throws If RPC fails
 */
export async function handleGetSearchFacets(
  supabase: SupabaseClient<Database>
) {
  // Call RPC for search facets
  const { data, error } = await supabase.rpc('get_search_facets');

  if (error) {
    await logError('Search facets RPC failed', {
      rpcName: 'get_search_facets',
    }, error);
    throw new Error(`Failed to fetch search facets: ${error.message}`);
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
