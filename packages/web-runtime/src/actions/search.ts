'use server';

/**
 * Search Actions - Database-First Architecture
 * Server actions for search-related functionality
 */

import { z } from 'zod';
import { rateLimitedAction } from './safe-action.ts';
import { fetchCached } from '../cache/fetch-cached.ts';
import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get Popular Searches
 * 
 * OPTIMIZATION: Returns top 100 popular search queries from trending_searches
 * These can be cached with longer TTL since they change slowly
 * 
 * Uses get_trending_searches RPC which queries the trending_searches materialized view
 * Returns: Array of { query: string, count: number, label: string }
 */
export const getPopularSearches = rateLimitedAction
  .inputSchema(
    z.object({
      limit: z.number().int().min(1).max(100).optional().default(100),
    })
  )
  .metadata({ actionName: 'search.getPopularSearches', category: 'analytics' })
  .action(async ({ parsedInput }) => {
    return fetchCached(
      async (client: SupabaseClient<Database>) => {
        const { data, error } = await client.rpc('get_trending_searches', {
          limit_count: parsedInput.limit,
        });
        if (error) throw error;
        return data as Database['public']['Functions']['get_trending_searches']['Returns'];
      },
      {
        tags: ['search', 'popular-searches'],
        ttlKey: 'cache.search_facets.ttl_seconds', // Reuse existing TTL config
        fallback: [],
        logMeta: { limit: parsedInput.limit },
      },
      'popular-searches',
      parsedInput.limit
    );
  });
