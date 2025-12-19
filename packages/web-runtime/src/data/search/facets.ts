import 'server-only';

import { type content_category } from '@heyclaude/data-layer/prisma';
import { type GetSearchFacetsReturns } from '@heyclaude/database-types/postgres-types';
import { type GetTrendingSearchesReturns } from '@heyclaude/data-layer';

import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';

import { createDataFunction } from '../cached-data-factory.ts';

// Use generated type from Prisma generator
type SearchFacetsRow = GetSearchFacetsReturns[number];

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
  // Validate category and ensure it's a valid content_category
  const category = row.category && isValidCategory(row.category) ? row.category : 'agents'; // Default fallback

  // Ensure content_count is a number (handle null)
  const contentCount = row.content_count ?? 0;

  return {
    authors: Array.isArray(row.authors)
      ? row.authors.filter((author): author is string => typeof author === 'string')
      : [],
    category,
    contentCount,
    tags: Array.isArray(row.all_tags)
      ? row.all_tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
  };
}

/***
**
 * Extracts aggregated arrays from RPC result
 * The RPC now returns pre-aggregated arrays in each row (same values)
 * We use the first row's aggregated values for efficiency
 * @param {SearchFacetsRow[]} data
 * @returns {{
  authors: string[];
  categories: content_category[];
  tags: string[];
}} Return value description
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
      ? (firstRow.all_categories_aggregated.filter(
          (cat) => cat != null && isValidCategory(cat)
        ) as content_category[])
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
export const getSearchFacets = createDataFunction<void, SearchFacetAggregate>({
  logContext: (_, result) => {
    const aggregate = result as SearchFacetAggregate | undefined;
    return {
      authorCount: aggregate?.authors.length ?? 0,
      categoryCount: aggregate?.categories.length ?? 0,
      facetCount: aggregate?.facets.length ?? 0,
      tagCount: aggregate?.tags.length ?? 0,
    };
  },
  methodName: 'getSearchFacets',
  module: 'data/search/facets',
  operation: 'getSearchFacets',
  serviceKey: 'search',
  throwOnError: true,
  transformResult: (result) => {
    const data = result as GetSearchFacetsReturns;
    const facets = data.map((row) => normalizeFacetRow(row));
    const { authors, categories, tags } = extractAggregatedArrays(data);
    return {
      authors,
      categories,
      facets,
      tags,
    };
  },
});

/**
 * Get popular searches
 * Uses 'use cache' to cache popular searches. This data is public and same for all users.
 * @param limit - Maximum number of popular searches to return (default: 100)
 * @returns Array of trending search terms
 */
export const getPopularSearches = createDataFunction<number, GetTrendingSearchesReturns>({
  logContext: (limit) => ({ limit }),
  methodName: 'getTrendingSearches',
  module: 'data/search/facets',
  onError: () => [], // Return empty array on error
  operation: 'getPopularSearches',
  serviceKey: 'search',
  transformArgs: (limit) => ({ limit_count: limit }),
});
