/**
 * listCategories Tool Handler
 *
 * Returns all content categories in the HeyClaude directory with counts and descriptions.
 */

import type { CategoryConfigWithFeatures } from '@heyclaude/data-layer';
import { ContentService, SearchService } from '@heyclaude/data-layer';

import type { ListCategoriesInput } from '../../lib/types.js';
import type { ToolContext } from '../../types/runtime.js';
import { normalizeError } from '@heyclaude/shared-runtime';

/**
 * Retrieve directory category configurations with optional content counts and produce a textual summary and structured metadata.
 *
 * If fetching content counts fails, categories are still returned and each category's `count` defaults to `0`.
 *
 * @param input - Tool input (empty object for listCategories)
 * @param context - Tool handler context
 * @returns An object with `content`: an array containing a single text block summarizing categories, and `_meta`: an object with `categories` (array of category objects with `name`, `slug`, `description`, `count`, and `icon`) and `total` (number of categories)
 * @throws Error if the category configs fetch fails or returns no data
 */
export async function handleListCategories(
  _input: ListCategoriesInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    categories: Array<{
      name: string;
      slug: string;
      description: string;
      count: number;
      icon: string;
    }>;
    total: number;
    usageHints: string[];
    relatedTools: string[];
  };
}> {
  const { prisma, logger } = context;
  const startTime = Date.now();

  try {
    // Create services with Cloudflare Prisma client
    // Services now accept optional Prisma client (BasePrismaService updated)
    const contentService = new ContentService(prisma);
    const searchService = new SearchService(prisma);

    // Get category configs with features
    let data: CategoryConfigWithFeatures[];
    try {
      data = await contentService.getCategoryConfigs();
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to fetch categories');
      logger.error('ContentService.getCategoryConfigs failed in listCategories', normalized);
      throw normalized;
    }

    if (!data || data.length === 0) {
      throw new Error('No category data returned');
    }

    // Get content counts from search facets
    let facetsData: Array<{ category: string; content_count: number }> = [];
    try {
      const facetsResult = await searchService.getSearchFacets();
      // GetSearchFacetsReturns is an array of objects with category and content_count
      if (Array.isArray(facetsResult)) {
        facetsData = facetsResult.map((f: { category: string | null; content_count: number | null }) => ({
          category: f.category || '',
          content_count: f.content_count || 0,
        }));
      }
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to fetch search facets');
      logger.warn('SearchService.getSearchFacets failed in listCategories (non-critical)', { error: normalized });
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
      .map(
        (c: { name: string; slug: string; count: number; description: string }) =>
          `• ${c.name} (${c.slug}): ${c.count} items - ${c.description}`
      )
      .join('\n');

    // Get usage hints for categories
    const usageHints = [
      'Use searchContent to find items within a category',
      'Use getTrending to see popular content in a category',
      'Use getRecent to see newly added content',
      'Use getCategoryConfigs for detailed category configuration',
    ];

    const duration = Date.now() - startTime;
    logger.info('listCategories completed successfully', {
      tool: 'listCategories',
      duration_ms: duration,
      categoryCount: categories.length,
    });

    const structuredOutput = {
      categories,
      total: categories.length,
      usageHints,
      relatedTools: ['searchContent', 'getTrending', 'getRecent', 'getCategoryConfigs'],
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: `HeyClaude Directory Categories:\n\n${textSummary}\n\nTotal: ${categories.length} categories`,
        },
      ],
      // Structured output matching outputSchema for type-safe access
      structuredContent: structuredOutput,
      // Also include structured data for programmatic access (backward compatibility)
      _meta: structuredOutput,
    } as {
      content: Array<{ type: 'text'; text: string }>;
      structuredContent: typeof structuredOutput;
      _meta: typeof structuredOutput;
    };
  } catch (error) {
    const normalized = normalizeError(error, 'listCategories tool failed');
    logger.error('listCategories tool error', normalized, { tool: 'listCategories' });
    throw normalized;
  }
}
