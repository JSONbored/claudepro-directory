/**
 * Server-Side Search - Database-First RPC Architecture
 */

import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { logger } from '@/src/lib/logger';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import type { Database } from '@/src/types/database.types';

type SearchContentArgs = Database['public']['Functions']['search_content_optimized']['Args'];
type SearchContentReturn = Database['public']['Functions']['search_content_optimized']['Returns'];

/**
 * Search result from search_content_optimized RPC
 * Returns subset of content fields optimized for search performance
 */
export type SearchResult = SearchContentReturn[number];

export type SearchFilters = Omit<SearchContentArgs, 'p_query'> & {
  sort?: 'relevance' | 'newest' | 'alphabetical' | 'popularity';
};

export const searchContent = cache(
  async (query: string, filters?: SearchFilters): Promise<SearchResult[]> => {
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
);
