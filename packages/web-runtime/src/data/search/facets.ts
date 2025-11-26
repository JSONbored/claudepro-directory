'use server';

import type { Database } from '@heyclaude/database-types';

import { fetchCached } from '../../cache/fetch-cached.ts';

type SearchFacetsRow =
  Database['public']['Functions']['get_search_facets']['Returns'][number];

export interface SearchFacetSummary {
  category: Database['public']['Enums']['content_category'];
  contentCount: number;
  tags: string[];
  authors: string[];
}

export interface SearchFacetAggregate {
  facets: SearchFacetSummary[];
  tags: string[];
  authors: string[];
  categories: Database['public']['Enums']['content_category'][];
}

function normalizeFacetRow(row: SearchFacetsRow): SearchFacetSummary {
  return {
    category: row.category,
    contentCount: row.content_count,
    tags: Array.isArray(row.all_tags) ? row.all_tags.filter((tag): tag is string => typeof tag === 'string') : [],
    authors: Array.isArray(row.authors) ? row.authors.filter((author): author is string => typeof author === 'string') : [],
  };
}

export async function getSearchFacets(): Promise<SearchFacetAggregate> {
  const facets = await fetchCached(
    async (client) => {
      const { data, error } = await client.rpc('get_search_facets');
      if (error) {
        throw error;
      }
      return data.map((row) => normalizeFacetRow(row));
    },
    {
      keyParts: ['search-facets'],
      tags: ['search', 'search-facets'],
      ttlKey: 'cache.search_facets.ttl_seconds',
      fallback: [] as SearchFacetSummary[],
      logMeta: { source: 'getSearchFacets' },
    }
  );

  const tags = new Set<string>();
  const authors = new Set<string>();
  const categories = new Set<Database['public']['Enums']['content_category']>();

  for (const facet of facets) {
    categories.add(facet.category);
    for (const tag of facet.tags) tags.add(tag);
    for (const author of facet.authors) authors.add(author);
  }

  return {
    facets,
    tags: [...tags].toSorted((a, b) => a.localeCompare(b)),
    authors: [...authors].toSorted((a, b) => a.localeCompare(b)),
    categories: [...categories].toSorted((a, b) => a.localeCompare(b)),
  };
}
