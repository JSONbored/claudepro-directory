/**
 * listCategories Tool Handler
 *
 * Returns all content categories in the HeyClaude directory with counts and descriptions.
 * Uses the get_category_configs_with_features RPC.
 */

import type { CategoryConfigWithFeatures } from '@heyclaude/database-types/postgres-types';
import { ContentService } from '@heyclaude/data-layer/services/content.ts';
import { SearchService } from '@heyclaude/data-layer/services/search.ts';
import { getCategoryUsageHints } from '../lib/usage-hints.ts';
import { logError } from '@heyclaude/shared-runtime/logging.ts';
import type { ListCategoriesInput } from '../lib/types.ts';

/**
 * Retrieve directory category configurations with optional content counts and produce a textual summary and structured metadata.
 *
 * If fetching content counts fails, categories are still returned and each category's `count` defaults to `0`.
 *
 * @returns An object with `content`: an array containing a single text block summarizing categories, and `_meta`: an object with `categories` (array of category objects with `name`, `slug`, `description`, `count`, and `icon`) and `total` (number of categories)
 * @throws Error if the category configs fetch fails or returns no data
 */
export async function handleListCategories(
  _input: ListCategoriesInput
) {
  const contentService = new ContentService();
  const searchService = new SearchService();

  // Get category configs with features
  let data: CategoryConfigWithFeatures[];
  try {
    data = await contentService.getCategoryConfigs();
  } catch (error) {
    await logError('ContentService.getCategoryConfigs failed in listCategories', {}, error);
    throw new Error(`Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No category data returned');
  }

  // Get content counts from search facets
  let facetsData: Array<{ category: string; content_count: number }> = [];
  try {
    const facetsResult = await searchService.getSearchFacets();
    facetsData = Array.isArray(facetsResult) ? facetsResult : [];
  } catch (error) {
    await logError('SearchService.getSearchFacets failed in listCategories', {}, error);
    // Continue without counts - not critical
  }
  const countsMap = new Map(
    (facetsData || []).map((f: { category: string; content_count: number }) => [
      f.category,
      f.content_count,
    ])
  );

  // Format the response for MCP
  const categories = data.map((cat: CategoryConfigWithFeatures) => ({
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

  // Get usage hints for categories
  const usageHints = getCategoryUsageHints();

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
      usageHints,
      relatedTools: ['searchContent', 'getTrending', 'getRecent', 'getCategoryConfigs'],
    },
  };
}