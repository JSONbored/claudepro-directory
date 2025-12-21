/**
 * getContentByTag Tool Handler
 *
 * Get content filtered by specific tags with AND/OR logic support.
 */

import type {
  ContentPaginatedItem,
  GetContentPaginatedReturns,
} from '@heyclaude/database-types/postgres-types';
import { ContentService } from '@heyclaude/data-layer';

import type { GetContentByTagInput } from '../../lib/types.js';
import { normalizeError } from '@heyclaude/shared-runtime';
import type { ToolContext } from '../../types/runtime.js';

/**
 * Fetches content matching the provided tags (with optional AND/OR logic and category) and returns a human-readable summary plus structured metadata.
 *
 * @param input - Query options:
 *   - `tags`: Array of tag strings to match
 *   - `logic`: `'AND'` to require all tags or any other value to use OR semantics
 *   - `category`: Optional category to filter results
 *   - `limit`: Maximum number of items to retrieve
 * @param context - Tool handler context
 * @returns An object containing:
 *   - `content`: An array with a single text block summarizing the found items and their matching tags
 *   - `_meta`: Structured metadata including `items`, `tags`, `logic`, `category`, and `count`
 */
export async function handleGetContentByTag(
  input: GetContentByTagInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    items: Array<{
      slug: string;
      title: string;
      category: string;
      description: string;
      tags: string[];
      matchingTags: string[];
      author: string;
      dateAdded: string;
    }>;
    tags: string[];
    logic: string;
    category: string;
    count: number;
    limit: number;
    pagination: {
      total: number;
      limit: number;
      hasMore: boolean;
    };
  };
}> {
  const { prisma, logger } = context;
  const { tags, logic, category, limit } = input;
  const startTime = Date.now();

  try {
    const contentService = new ContentService(prisma);

    // Use get_content_paginated with proper parameters
    const rpcArgs = {
      ...(category ? { p_category: category } : {}),
      p_tags: tags, // Pass tags array
      p_order_by: 'created_at',
      p_order_direction: 'desc',
      p_limit: limit,
      p_offset: 0,
    };

    let data: GetContentPaginatedReturns;
    try {
      data = await contentService.getContentPaginated(rpcArgs);
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to fetch content by tags');
      logger.error('ContentService.getContentPaginated failed', normalized, {
        tool: 'getContentByTag',
        args: rpcArgs,
      });
      throw normalized;
    }

    // Extract items from paginated result
    const items = data?.items || [];

    if (items.length === 0) {
      const categoryDesc = category ? ` in ${category}` : '';
      logger.info('getContentByTag completed with no results', {
        tool: 'getContentByTag',
        duration_ms: Date.now() - startTime,
        tags,
        logic,
        category,
        resultCount: 0,
      });
      return {
        content: [
          {
            type: 'text' as const,
            text: `No content found with tags: ${tags.join(', ')}${categoryDesc}`,
          },
        ],
        _meta: {
          items: [],
          tags,
          logic,
          category: category || 'all',
          count: 0,
          limit,
          pagination: {
            total: 0,
            limit,
            hasMore: false,
          },
        },
      };
    }

    // Filter by logic (AND vs OR)
    // Note: RPC uses OR logic for tags, so AND filtering is done client-side.
    // For large datasets, consider RPC-level AND support.
    let filteredItems = items;

    if (logic === 'AND') {
      // For AND logic, only include items that have ALL tags
      filteredItems = items.filter((item: ContentPaginatedItem) => {
        const itemTags = item.tags || [];
        return tags.every((tag) => itemTags.includes(tag));
      });

      if (filteredItems.length === 0) {
        const categoryDesc = category ? ` in ${category}` : '';
        logger.info('getContentByTag completed with no results (AND logic)', {
          tool: 'getContentByTag',
          duration_ms: Date.now() - startTime,
          tags,
          logic,
          category,
          resultCount: 0,
        });
        return {
          content: [
            {
              type: 'text' as const,
              text: `No content found with ALL tags: ${tags.join(', ')}${categoryDesc}`,
            },
          ],
          _meta: {
            items: [],
            tags,
            logic,
            category: category || 'all',
            count: 0,
            limit,
            pagination: {
              total: 0,
              limit,
              hasMore: false,
            },
          },
        };
      }
    }

    // Format results
    const formattedItems = filteredItems.map((item: ContentPaginatedItem) => {
      const itemTags = item.tags || [];
      const matchingTags = itemTags.filter((tag: string) => tags.includes(tag));

      return {
        slug: item.slug || '',
        title: item.title || item.display_title || '',
        category: item.category || '',
        description: item.description?.substring(0, 150) || '',
        tags: itemTags,
        matchingTags,
        author: item.author || 'Unknown',
        dateAdded: item.date_added || '',
      };
    });

    // Create text summary
    const logicDesc = logic === 'AND' ? 'ALL' : 'ANY';
    const categoryDesc = category ? ` in ${category}` : '';
    const textSummary = formattedItems
      .map(
        (
          item: {
            title: string;
            category: string;
            description: string;
            matchingTags: string[];
          },
          idx: number
        ) =>
          `${idx + 1}. ${item.title} (${item.category})\n   ${item.description}${item.description.length >= 150 ? '...' : ''}\n   Matching tags: ${item.matchingTags.join(', ')}`
      )
      .join('\n\n');

    logger.info('getContentByTag completed successfully', {
      tool: 'getContentByTag',
      duration_ms: Date.now() - startTime,
      tags,
      logic,
      category,
      resultCount: formattedItems.length,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Content with ${logicDesc} of tags: ${tags.join(', ')}${categoryDesc}\n\nFound ${formattedItems.length} items:\n\n${textSummary}`,
        },
      ],
      _meta: {
        items: formattedItems,
        tags,
        logic,
        category: category || 'all',
        count: formattedItems.length,
        limit,
        pagination: {
          total: formattedItems.length,
          limit,
          hasMore: false, // Tags doesn't support pagination (uses limit only)
        },
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getContentByTag tool failed');
    logger.error('getContentByTag tool error', normalized, {
      tool: 'getContentByTag',
      tags,
      logic,
      category,
    });
    throw normalized;
  }
}
