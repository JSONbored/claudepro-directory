'use server';

import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../../index.ts';

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
 * Aggregates unique tags, authors, and categories from facet summaries
 * @param facets - Array of normalized facet summaries
 * @returns Object containing sets of unique tags, authors, and categories
 */
function aggregateFacetData(facets: SearchFacetSummary[]): {
  authors: Set<string>;
  categories: Set<Database['public']['Enums']['content_category']>;
  tags: Set<string>;
} {
  const tags = new Set<string>();
  const authors = new Set<string>();
  const categories = new Set<Database['public']['Enums']['content_category']>();

  for (const facet of facets) {
    categories.add(facet.category);
    for (const tag of facet.tags) {
      tags.add(tag);
    }
    for (const author of facet.authors) {
      authors.add(author);
    }
  }

  return { tags, authors, categories };
}

/**
 * Get search facets
 * Uses 'use cache' to cache search facets. This data is public and same for all users.
 * @returns Aggregated search facets with authors, categories, tags, and facet summaries
 */
export async function getSearchFacets(): Promise<SearchFacetAggregate> {
  'use cache';

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');

  // Configure cache - use 'hours' profile for search facets (changes hourly)
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  cacheTag('search');
  cacheTag('search-facets');

  // Create request-scoped child logger to avoid race conditions
  const requestLogger = logger.child({
    operation: 'getSearchFacets',
    module: 'data/search/facets',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      // NOTE: Admin client bypasses RLS and is required here because:
      // 1. This function runs during static site generation (build time)
      // 2. Search facets are public data (same for all users, no user-specific content)
      // 3. Admin client provides better performance during build (no RLS overhead)
      // 4. At runtime, we use anon client with RLS for security
      // 5. The data being accessed is non-sensitive (public search facets)
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const { data, error } = await client.rpc('get_search_facets');
    if (error) {
      // logger.error() normalizes errors internally, so pass raw error
      const errorForLogging: Error | string =
        error instanceof Error ? error : (typeof error === 'string' ? error : String(error));
      requestLogger.error('getSearchFacets: RPC call failed', errorForLogging, {
        rpcName: 'get_search_facets',
      });
      throw error;
    }

    const facets = data.map((row) => normalizeFacetRow(row));
    const { tags, authors, categories } = aggregateFacetData(facets);

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
      error instanceof Error ? error : (typeof error === 'string' ? error : String(error));
    requestLogger.error('getSearchFacets: failed', errorForLogging);
    throw error;
  }
}

/**
 * Get popular searches
 * Uses 'use cache' to cache popular searches. This data is public and same for all users.
 * @param limit - Maximum number of popular searches to return (default: 100)
 * @returns Array of trending search terms
 */
export async function getPopularSearches(
  limit = 100
): Promise<Database['public']['Functions']['get_trending_searches']['Returns']> {
  'use cache';

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');

  // Configure cache - use 'hours' profile for popular searches (changes hourly)
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  cacheTag('search');
  cacheTag('popular-searches');
  // Include limit in cache tag for proper cache key generation
  cacheTag(`popular-searches-${limit}`);

  const requestLogger = logger.child({
    operation: 'getPopularSearches',
    module: 'data/search/facets',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      // NOTE: Admin client bypasses RLS and is required here because:
      // 1. This function runs during static site generation (build time)
      // 2. Popular searches are public data (same for all users, no user-specific content)
      // 3. Admin client provides better performance during build (no RLS overhead)
      // 4. At runtime, we use anon client with RLS for security
      // 5. The data being accessed is non-sensitive (public search trends)
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const { data, error } = await client.rpc('get_trending_searches', {
      limit_count: limit,
    });

    if (error) {
      const errorForLogging: Error | string =
        error instanceof Error ? error : (typeof error === 'string' ? error : String(error));
      requestLogger.error('getPopularSearches: RPC call failed', errorForLogging, {
        rpcName: 'get_trending_searches',
        limit,
      });
      throw error;
    }

    requestLogger.info('getPopularSearches: fetched successfully', {
      limit,
      resultCount: data.length,
    });

    return data;
  } catch (error) {
    const errorForLogging: Error | string =
      error instanceof Error ? error : (typeof error === 'string' ? error : String(error));
    requestLogger.error('getPopularSearches: failed', errorForLogging, {
      limit,
    });
    return [];
  }
}
