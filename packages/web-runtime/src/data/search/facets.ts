'use server';

import type { Database } from '@heyclaude/database-types';

import { fetchCached } from '../../cache/fetch-cached.ts';
import { logger, normalizeError } from '../../index.ts';
import { generateRequestId } from '../../utils/request-id.ts';

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
  // Create request-scoped child logger to avoid race conditions
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    operation: 'getSearchFacets',
    module: 'data/search/facets',
  });

  try {
    const facets = await fetchCached(
      async (client) => {
        const { data, error } = await client.rpc('get_search_facets');
        if (error) {
          // Log RPC error with proper context before throwing
          // Note: Using explicit context here since this is a nested function scope
          const normalized = normalizeError(error, 'RPC get_search_facets failed');
          requestLogger.error('getSearchFacets: RPC call failed', normalized, {
            rpcName: 'get_search_facets',
          });
          throw normalized;
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
  } catch (error) {
    // Log and rethrow - note: RPC errors logged above may also propagate here
    // Skip re-logging if this is already an RPC error (detected by error message pattern)
    const isRpcError = error instanceof Error && 
      (error.message.includes('RPC get_search_facets failed') || 
       error.message.includes('get_search_facets'));
    
    if (!isRpcError) {
      // Only log if this is a cache error, not an RPC error
      const normalized = normalizeError(error, 'getSearchFacets failed');
      requestLogger.error('getSearchFacets: fetchCached failed', normalized);
      throw normalized;
    }
    // RPC error already logged above, just rethrow
    throw error;
  }
}
