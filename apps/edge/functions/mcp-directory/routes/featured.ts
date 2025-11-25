/**
 * getFeatured Tool Handler
 *
 * Get featured and highlighted content from the homepage.
 * Uses the get_homepage_optimized RPC.
 */

import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GetFeaturedInput } from '../lib/types.ts';

export async function handleGetFeatured(
  supabase: SupabaseClient<Database>,
  _input: GetFeaturedInput
) {
  // get_homepage_optimized returns empty categoryData due to RPC issues
  // Use get_content_paginated_slim as fallback for featured content
  // OPTIMIZATION: Use validated enum values instead of string array
  const validCategories = Constants.public.Enums.content_category.filter((cat) =>
    ['agents', 'rules', 'commands', 'skills', 'collections', 'mcp'].includes(cat)
  );
  const featured: Record<string, unknown[]> = {};

  // OPTIMIZATION: Fetch all categories in parallel instead of sequentially
  // This reduces latency from sum(query_times) to max(query_time) - ~83% improvement
  const categoryQueries = validCategories.map((category) =>
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
  results.forEach((result, index) => {
    const category = validCategories[index];

    if (!category) return; // Skip if category is undefined

    if (result.status === 'fulfilled') {
      const { data, error } = result.value;

      if (!error && data?.items) {
        featured[category] = data.items.slice(0, 6).map((item: unknown) => {
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
        });
      }
    }
    // If rejected, category will simply be missing from featured object
    // This maintains graceful degradation behavior
  });

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
            (item: { title: string; views: number; description: string }, idx: number) =>
              `${idx + 1}. ${item.title} - ${item.views} views\n   ${item.description}${item.description.length >= 150 ? '...' : ''}`
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
