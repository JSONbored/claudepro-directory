/**
 * listCategories Tool Handler
 *
 * Returns all content categories in the HeyClaude directory with counts and descriptions.
 * Uses the get_category_configs_with_features RPC.
 */

import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@heyclaude/shared-runtime/logging.ts';
import type { ListCategoriesInput } from '../lib/types.ts';

/**
 * Retrieve directory category configurations with optional content counts and produce a textual summary and structured metadata.
 *
 * If fetching content counts fails, categories are still returned and each category's `count` defaults to `0`.
 *
 * @returns An object with `content`: an array containing a single text block summarizing categories, and `_meta`: an object with `categories` (array of category objects with `name`, `slug`, `description`, `count`, and `icon`) and `total` (number of categories)
 * @throws Error if the `get_category_configs_with_features` RPC fails or returns no data
 */
export async function handleListCategories(
  supabase: SupabaseClient<Database>,
  _input: ListCategoriesInput
) {
  // Call the RPC to get category configs with features
  const { data, error } = await supabase.rpc('get_category_configs_with_features');

  if (error) {
    // Use dbQuery serializer for consistent database query formatting
    await logError('RPC call failed in listCategories', {
      dbQuery: {
        rpcName: 'get_category_configs_with_features',
      },
    }, error);
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  if (!data) {
    throw new Error('No category data returned');
  }

  // Get content counts from get_search_facets
  const { data: facetsData, error: facetsError } = await supabase.rpc('get_search_facets');
  
  if (facetsError) {
    // Use dbQuery serializer for consistent database query formatting
    await logError('RPC call failed in listCategories (get_search_facets)', {
      dbQuery: {
        rpcName: 'get_search_facets',
      },
    }, facetsError);
    // Continue without counts - not critical
  }
  const countsMap = new Map(
    (facetsData || []).map((f: { category: string; content_count: number }) => [
      f.category,
      f.content_count,
    ])
  );

  // Format the response for MCP
  type CategoryConfig = Database['public']['CompositeTypes']['category_config_with_features'];
  const categories = data.map((cat: CategoryConfig) => ({
    name: cat.title || cat.category || '',
    slug: cat.category || '',
    description: cat.description || '',
    count: countsMap.get(cat.category || '') || 0,
    icon: cat.icon_name || '',
  }));

  // Return both structured data and a text summary
  const textSummary = categories
    .map((c: { name: string; slug: string; count: number; description: string }) => `• ${c.name} (${c.slug}): ${c.count} items - ${c.description}`)
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