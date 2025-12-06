'use server';

import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../../index.ts';
import { generateRequestId } from '../../utils/request-id.ts';

type SearchFacetsRow = Database['public']['Functions']['get_search_facets']['Returns'][number];

export interface SearchFacetSummary {
  authors: string[];
  category: Database['public']['Enums']['content_category'];
  contentCount: number;
  tags: string[];
}

export interface SearchFacetAggregate {
  authors: string[];
  categories: Database['public']['Enums']['content_category'][];
  facets: SearchFacetSummary[];
  tags: string[];
}

function normalizeFacetRow(row: SearchFacetsRow): SearchFacetSummary {
  return {
    category: row.category,
    contentCount: row.content_count,
    tags: Array.isArray(row.all_tags)
      ? row.all_tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    authors: Array.isArray(row.authors)
      ? row.authors.filter((author): author is string => typeof author === 'string')
      : [],
  };
}

/**
 * Get search facets
 * Uses 'use cache' to cache search facets. This data is public and same for all users.
 */
export async function getSearchFacets(): Promise<SearchFacetAggregate> {
  'use cache';

  const { getCacheTtl } = await import('../../cache-config.ts');
  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');

  // Configure cache
  const ttl = getCacheTtl('cache.search_facets.ttl_seconds');
  cacheLife({ stale: ttl / 2, revalidate: ttl, expire: ttl * 2 });
  cacheTag('search');
  cacheTag('search-facets');

  // Create request-scoped child logger to avoid race conditions
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    operation: 'getSearchFacets',
    module: 'data/search/facets',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const { data, error } = await client.rpc('get_search_facets');
    if (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : typeof error === 'string' ? error : String(error);
    requestLogger.error('getSearchFacets: RPC call failed', errorForLogging, {
      rpcName: 'get_search_facets',
    });
    throw error;
    }

    const facets = data.map((row) => normalizeFacetRow(row));

    const tags = new Set<string>();
    const authors = new Set<string>();
    const categories = new Set<Database['public']['Enums']['content_category']>();

    for (const facet of facets) {
      categories.add(facet.category);
      for (const tag of facet.tags) tags.add(tag);
      for (const author of facet.authors) authors.add(author);
    }

    requestLogger.info('getSearchFacets: fetched successfully', {
      facetCount: facets.length,
      tagCount: tags.size,
      authorCount: authors.size,
      categoryCount: categories.size,
    });

    return {
      facets,
      tags: [...tags].toSorted((a, b) => a.localeCompare(b)),
      authors: [...authors].toSorted((a, b) => a.localeCompare(b)),
      categories: [...categories].toSorted((a, b) => a.localeCompare(b)),
    };
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : typeof error === 'string' ? error : String(error);
    requestLogger.error('getSearchFacets: failed', errorForLogging);
    throw error;
  }
}
