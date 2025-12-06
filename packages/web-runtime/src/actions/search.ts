'use server';

/**
 * Search Actions - Database-First Architecture
 * Server actions for search-related functionality
 */

import { z } from 'zod';
import { rateLimitedAction } from './safe-action.ts';

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
    const { getPopularSearches } = await import('../data/search/facets.ts');
    return getPopularSearches(parsedInput.limit);
  });
