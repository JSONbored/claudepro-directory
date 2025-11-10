/**
 * Server-Side Search - Database-First RPC Architecture
 */

import { unstable_cache } from 'next/cache';
import { logger } from '@/src/lib/logger';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import type { Database } from '@/src/types/database.types';

type SearchContentArgs = Database['public']['Functions']['search_content_optimized']['Args'];
type SearchContentReturn = Database['public']['Functions']['search_content_optimized']['Returns'];
type SearchByPopularityReturn = Database['public']['Functions']['search_by_popularity']['Returns'];

/**
 * Search result from search_content_optimized RPC
 * Returns subset of content fields optimized for search performance
 */
export type SearchResult = SearchContentReturn[number];

export type SearchFilters = Omit<SearchContentArgs, 'p_query'> & {
  sort?: 'relevance' | 'newest' | 'alphabetical' | 'popularity';
};

export async function searchContent(
  query: string,
  filters?: SearchFilters
): Promise<SearchResult[]> {
  const cacheKey = [
    'search-v2',
    query,
    filters?.p_categories?.join(','),
    filters?.p_tags?.join(','),
    filters?.p_authors?.join(','),
    filters?.sort,
    filters?.p_limit?.toString(),
    filters?.p_offset?.toString(),
  ]
    .filter(Boolean)
    .join(':');

  return unstable_cache(
    async () => {
      const supabase = createAnonClient();

      const rpcParams: SearchContentArgs = {};

      const trimmedQuery = query.trim();
      if (trimmedQuery) rpcParams.p_query = trimmedQuery;
      if (filters?.p_sort) rpcParams.p_sort = filters.p_sort;
      if (filters?.p_limit) rpcParams.p_limit = filters.p_limit;
      if (filters?.p_offset) rpcParams.p_offset = filters.p_offset;
      if (filters?.p_categories) rpcParams.p_categories = filters.p_categories;
      if (filters?.p_tags) rpcParams.p_tags = filters.p_tags;
      if (filters?.p_authors) rpcParams.p_authors = filters.p_authors;

      const { data, error } = await supabase.rpc('search_content_optimized', rpcParams);

      if (error) {
        logger.error('Search RPC failed', error, { query });
        throw new Error(`Search failed: ${error.message}`);
      }

      return data || [];
    },
    [cacheKey],
    {
      revalidate: 3600,
      tags: ['search', 'content-all'],
    }
  )();
}

export async function getSearchSuggestions(query: string, limit = 10): Promise<string[]> {
  if (!query.trim() || query.length < 2) {
    return [];
  }

  return unstable_cache(
    async () => {
      const supabase = createAnonClient();

      const { data, error } = await supabase.rpc('get_search_suggestions', {
        p_query: query.trim(),
        p_limit: limit,
      });

      if (error) {
        logger.error('Search suggestions RPC failed', error, { query });
        throw new Error(`Search suggestions failed: ${error.message}`);
      }

      return data?.map((row) => row.suggestion) || [];
    },
    [`suggestions:${query}`],
    {
      revalidate: 3600,
      tags: ['search-suggestions'],
    }
  )();
}

export async function getSearchCount(query: string, filters?: SearchFilters): Promise<number> {
  return unstable_cache(
    async () => {
      const supabase = createAnonClient();

      const rpcParams: Database['public']['Functions']['get_search_count']['Args'] = {};

      const trimmedQuery = query.trim();
      if (trimmedQuery) rpcParams.p_query = trimmedQuery;
      if (filters?.p_categories) rpcParams.p_categories = filters.p_categories;
      if (filters?.p_tags) rpcParams.p_tags = filters.p_tags;
      if (filters?.p_authors) rpcParams.p_authors = filters.p_authors;

      const { data, error } = await supabase.rpc('get_search_count', rpcParams);

      if (error) {
        logger.error('Search count RPC failed', error, { query });
        throw new Error(`Search count failed: ${error.message}`);
      }

      return data || 0;
    },
    [`search-count:${query}:${JSON.stringify(filters)}`],
    {
      revalidate: 3600,
      tags: ['search-count'],
    }
  )();
}

export async function getSearchFacets() {
  return unstable_cache(
    async () => {
      const supabase = createAnonClient();

      const { data, error } = await supabase.rpc('get_search_facets');

      if (error) {
        logger.error('Failed to fetch search facets', error);
        throw new Error(`Search facets failed: ${error.message}`);
      }

      return data || [];
    },
    ['search-facets'],
    {
      revalidate: 3600,
      tags: ['search-facets'],
    }
  )();
}

export async function searchByPopularity(
  query: string,
  filters?: SearchFilters
): Promise<SearchByPopularityReturn> {
  return unstable_cache(
    async () => {
      const supabase = createAnonClient();

      const rpcParams: Database['public']['Functions']['search_by_popularity']['Args'] = {
        p_query: query.trim() || '',
        ...(filters?.p_categories && { p_categories: filters.p_categories }),
        ...(filters?.p_tags && { p_tags: filters.p_tags }),
        ...(filters?.p_authors && { p_authors: filters.p_authors }),
        p_limit: filters?.p_limit ?? 20,
        p_offset: filters?.p_offset ?? 0,
      };

      const { data, error } = await supabase.rpc('search_by_popularity', rpcParams);

      if (error) {
        logger.error('Popularity search RPC failed', error);
        throw new Error(`Popularity search failed: ${error.message}`);
      }

      return data || [];
    },
    ['search-popularity', query, JSON.stringify(filters)],
    {
      revalidate: 3600,
      tags: ['search'],
    }
  )();
}
