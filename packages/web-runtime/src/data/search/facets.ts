'use server';

import { SearchService } from '@heyclaude/data-layer';
import { type content_category } from '@heyclaude/data-layer/prisma';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../../index.ts';

/***
 * Normalizes error to Error | string for logging
 * @param {unknown} error - Error to normalize
 * @returns Error instance or string representation
 */
function normalizeErrorForLogging(error: unknown): Error | string {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

type SearchFacetsRow = Database['public']['Functions']['get_search_facets']['Returns'][number];

export interface SearchFacetSummary {
  authors: string[];
  category: content_category;
  contentCount: number;
  tags: string[];
}

export interface SearchFacetAggregate {
  authors: string[];
  categories: content_category[];
  facets: SearchFacetSummary[];
  tags: string[];
}

function normalizeFacetRow(row: SearchFacetsRow): SearchFacetSummary {
  return {
    authors: Array.isArray(row.authors)
      ? row.authors.filter((author): author is string => typeof author === 'string')
      : [],
    category: row.category,
    contentCount: row.content_count,
    tags: Array.isArray(row.all_tags)
      ? row.all_tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
  };
}

/***
 * Extracts aggregated arrays from RPC result
 * The RPC now returns pre-aggregated arrays in each row (same values)
 * We use the first row's aggregated values for efficiency
 * @param {SearchFacetsRow[]} data - Array of facet rows from RPC (each row contains aggregated arrays)
 * @returns Pre-aggregated arrays from database (already sorted and deduplicated)
 */
function extractAggregatedArrays(data: SearchFacetsRow[]): {
  authors: string[];
  categories: content_category[];
  tags: string[];
} {
  // RPC returns aggregated arrays in each row (same values)
  // Use first row's aggregated arrays (most efficient)
  const firstRow = data[0];

  if (!firstRow) {
    return {
      authors: [],
      categories: [],
      tags: [],
    };
  }

  // Extract pre-aggregated arrays from RPC (already sorted and deduplicated in database)
  return {
    authors: Array.isArray(firstRow.all_authors_aggregated)
      ? firstRow.all_authors_aggregated.filter(
          (author): author is string => typeof author === 'string'
        )
      : [],
    categories: Array.isArray(firstRow.all_categories_aggregated)
      ? firstRow.all_categories_aggregated.filter(Boolean)
      : [],
    tags: Array.isArray(firstRow.all_tags_aggregated)
      ? firstRow.all_tags_aggregated.filter((tag): tag is string => typeof tag === 'string')
      : [],
  };
}

/**
 * Get search facets
 * Uses 'use cache' to cache search facets. This data is public and same for all users.
 * @returns Aggregated search facets with authors, categories, tags, and facet summaries
 */
export async function getSearchFacets(): Promise<SearchFacetAggregate> {
  'use cache';

  // Configure cache - use 'hours' profile for search facets (changes hourly)
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  cacheTag('search');
  cacheTag('search-facets');

  // Create request-scoped child logger to avoid race conditions
  const requestLogger = logger.child({
    module: 'data/search/facets',
    operation: 'getSearchFacets',
  });

  try {
    const service = new SearchService();
    const data = await service.getSearchFacets();

    const facets = data.map((row) => normalizeFacetRow(row));

    // Use pre-aggregated arrays from database (already sorted and deduplicated)
    // This eliminates client-side Set operations and sorting
    const { authors, categories, tags } = extractAggregatedArrays(data);

    requestLogger.info(
      {
        authorCount: authors.length,
        categoryCount: categories.length,
        facetCount: facets.length,
        tagCount: tags.length,
      },
      'getSearchFacets: fetched successfully'
    );

    return {
      authors,
      categories,
      facets,
      // Arrays are already sorted and deduplicated by database
      tags,
    };
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging = normalizeErrorForLogging(error);
    requestLogger.error({ err: errorForLogging }, 'getSearchFacets: failed');
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

  // Configure cache - use 'hours' profile for popular searches (changes hourly)
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  cacheTag('search');
  cacheTag('popular-searches');
  // Include limit in cache tag for proper cache key generation
  cacheTag(`popular-searches-${limit}`);

  const requestLogger = logger.child({
    module: 'data/search/facets',
    operation: 'getPopularSearches',
  });

  try {
    const service = new SearchService();
    const data = await service.getTrendingSearches({
      limit_count: limit,
    });

    requestLogger.info(
      {
        limit,
        resultCount: data.length,
      },
      'getPopularSearches: fetched successfully'
    );

    return data;
  } catch (error) {
    const errorForLogging = normalizeErrorForLogging(error);
    requestLogger.error({ err: errorForLogging, limit }, 'getPopularSearches: failed');
    return [];
  }
}
