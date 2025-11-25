/**
 * listCategories Tool Handler
 *
 * Returns all content categories in the HeyClaude directory with counts and descriptions.
 * Uses the get_category_configs_with_features RPC.
 */

import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ListCategoriesInput } from '../lib/types.ts';

export async function handleListCategories(
  supabase: SupabaseClient<Database>,
  _input: ListCategoriesInput
) {
  // Call the RPC to get category configs with features
  const { data, error } = await supabase.rpc('get_category_configs_with_features');

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  if (!data) {
    throw new Error('No category data returned');
  }

  // Get content counts from get_search_facets
  const { data: facetsData } = await supabase.rpc('get_search_facets');
  const countsMap = new Map(
    (facetsData || []).map((f: { category: string; content_count: number }) => [
      f.category,
      f.content_count,
    ])
  );

  // Format the response for MCP
  const categories = data.map((cat) => ({
    name: cat.title || cat.category || '',
    slug: cat.category || '',
    description: cat.description || '',
    count: countsMap.get(cat.category || '') || 0,
    icon: cat.icon_name || '',
  }));

  // Return both structured data and a text summary
  const textSummary = categories
    .map((c) => `• ${c.name} (${c.slug}): ${c.count} items - ${c.description}`)
    .join('\n');

  return {
    content: [
      {
        type: 'text' as const,
        text: `HeyClaude Directory Categories:\n\n${textSummary}\n\nTotal: ${categories.length} categories`,
      },
    ],
    // Also include structured data for programmatic access
    _meta: {
      categories,
      total: categories.length,
    },
  };
}
