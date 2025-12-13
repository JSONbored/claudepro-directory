import { trackRPCFailure } from '@heyclaude/web-runtime/core';
import { getSearchFacets } from '@heyclaude/web-runtime/server';
import { type SearchFilterOptions } from '@heyclaude/web-runtime/types/component.types';

/**
 * Homepage Search Facets Server Component
 *
 * OPTIMIZATION: Fetches search facets for streaming SSR
 * This allows the hero section to stream immediately while facets load in parallel
 *
 * Returns search filters that can be passed to HomePageClient
 */
export async function HomepageSearchFacetsServer(): Promise<SearchFilterOptions> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  const { connection } = await import('next/server');
  await connection();

  const facetData = await getSearchFacets().catch((error: unknown) => {
    trackRPCFailure('get_search_facets', error, {
      section: 'search-facets',
    });
    // Return empty facets on error
    return {
      facets: [],
      tags: [],
      authors: [],
      categories: [],
    };
  });

  const searchFilters: SearchFilterOptions = {
    tags: facetData.tags,
    authors: facetData.authors,
    categories: facetData.categories,
  };

  return searchFilters;
}
