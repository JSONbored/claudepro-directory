/**
 * getFeatured Tool Handler
 *
 * Get featured and highlighted content from the homepage.
 * Uses the get_content_paginated_slim RPC for each category in parallel.
 */

import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@heyclaude/shared-runtime';
import type { GetFeaturedInput } from '../lib/types.ts';

/**
 * Retrieve and assemble featured homepage content grouped by category.
 *
 * Fetches featured items for a fixed set of categories, aggregates successful RPC responses
 * into a per-category `featured` structure, and builds a single text summary listing up to
 * three items per category. If no featured content is available, returns a default text message.
 *
 * @returns An object containing:
 *  - `content`: an array with a single text item (`{ type: 'text', text: string }`) holding the generated summary or a fallback message.
 *  - `_meta`: metadata with `featured` (per-category arrays of items), `categories` (array of category keys present in `featured`), and `totalItems` (total number of items across all categories).
 */
export async function handleGetFeatured(
  supabase: SupabaseClient<Database>,
  _input: GetFeaturedInput
) {
  // get_homepage_optimized returns empty categoryData due to RPC issues
  // Use get_content_paginated_slim as fallback for featured content
  // Use explicit enum string values to avoid fragility from enum ordering changes
  const allowedCategoryValues: Database['public']['Enums']['content_category'][] = [
    'agents',
    'rules',
    'commands',
    'skills',
    'collections',
    'mcp',
  ];
  const validCategories = Constants.public.Enums.content_category.filter(
    (cat: Database['public']['Enums']['content_category']) => allowedCategoryValues.includes(cat)
  );
  const featured: Record<string, unknown[]> = {};

  // OPTIMIZATION: Fetch all categories in parallel instead of sequentially
  // This reduces latency from sum(query_times) to max(query_time) - ~83% improvement
  const categoryQueries = validCategories.map((category: Database['public']['Enums']['content_category']) =>
    supabase.rpc('get_content_paginated_slim', {
      p_category: category,
      p_limit: 6,
      p_offset: 0,
      p_order_by: 'popularity_score',
      p_order_direction: 'desc',
    })
  );

  // Execute all queries in parallel with error handling
  const results = await Promise.allSettled(categoryQueries);

  // Process results - handle both fulfilled and rejected promises
  for (const [index, result] of results.entries()) {
    const category = validCategories[index];

    if (!category) continue; // Skip if category is undefined

    if (result.status === 'fulfilled') {
      const { data, error } = result.value;

      if (error) {
        // Use dbQuery serializer for consistent database query formatting
        await logError('RPC call failed in getFeatured', {
          dbQuery: {
            rpcName: 'get_content_paginated_slim',
            args: {
              p_category: category,
              p_limit: 6,
              p_offset: 0,
              p_order_by: 'popularity_score',
              p_order_direction: 'desc',
            },
          },
          category,
        }, error);
        // Continue gracefully - category will be missing from featured object
        continue;
      }

      if (data) {
        // Type the RPC return value
        type PaginatedSlimResult = Database['public']['CompositeTypes']['content_paginated_slim_result'];
        const typedData = data as PaginatedSlimResult;
        
        // Validate response structure
        if (!typedData || typeof typedData !== 'object') {
          continue; // Skip malformed responses
        }
        
        if (typedData.items) {
          // p_limit: 6 already restricts results, so slice is unnecessary
          type FeaturedItem = {
            slug: string;
            title: string;
            category: string;
            description: string;
            tags: unknown[];
            views: number;
          };
          featured[category] = typedData.items.map((item: unknown): FeaturedItem | null => {
            if (typeof item !== 'object' || item === null) return null;
            const itemObj = item as Record<string, unknown>;
            return {
              slug: typeof itemObj['slug'] === 'string' ? itemObj['slug'] : '',
              title:
                (typeof itemObj['title'] === 'string'
                  ? itemObj['title']
                  : typeof itemObj['display_title'] === 'string'
                    ? itemObj['display_title']
                    : '') || '',
              category: typeof itemObj['category'] === 'string' ? itemObj['category'] : '',
              description:
                typeof itemObj['description'] === 'string'
                  ? itemObj['description'].substring(0, 150)
                  : '',
              tags: Array.isArray(itemObj['tags']) ? itemObj['tags'] : [],
              views: typeof itemObj['view_count'] === 'number' ? itemObj['view_count'] : 0,
            };
          })
          .filter((item: FeaturedItem | null): item is FeaturedItem => item !== null);
        }
      }
    } else if (result.status === 'rejected') {
      // Promise was rejected - log with dbQuery serializer
      await logError('RPC promise rejected in getFeatured', {
        dbQuery: {
          rpcName: 'get_content_paginated_slim',
          args: {
            p_category: category,
            p_limit: 6,
            p_offset: 0,
            p_order_by: 'popularity_score',
            p_order_direction: 'desc',
          },
        },
        category,
      }, result.reason);
      // Continue gracefully - category will be missing from featured object
    }
  }

  if (Object.keys(featured).length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No featured content available.',
        },
      ],
      _meta: {
        featured: {},
      },
    };
  }

  // Format text summary by category
  const textParts: string[] = [];
  for (const [category, items] of Object.entries(featured)) {
    if (items.length > 0) {
      textParts.push(`\n## ${category.charAt(0).toUpperCase() + category.slice(1)}:`);
      const typedItems = items as Array<{ title: string; views: number; description: string }>;
      textParts.push(
        typedItems
          .slice(0, 3)
          .map(
            (item: { title: string; views: number; description: string }, _idx: number) =>
              `${_idx + 1}. ${item.title} - ${item.views} views\n   ${item.description}${item.description.length >= 150 ? '...' : ''}`
          )
          .join('\n\n')
      );
    }
  }

  const textSummary = `HeyClaude Directory - Featured Content:\n\n${textParts.join('\n')}`;

  return {
    content: [
      {
        type: 'text' as const,
        text: textSummary,
      },
    ],
    _meta: {
      featured,
      categories: Object.keys(featured),
      totalItems: Object.values(featured).flat().length,
    },
  };
}