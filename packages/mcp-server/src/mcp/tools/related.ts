/**
 * getRelatedContent Tool Handler
 *
 * Retrieves related content for a given slug and category.
 */

import type {
  RelatedContentItem,
  GetRelatedContentReturns,
} from '@heyclaude/database-types/postgres-types';
import { ContentService } from '@heyclaude/data-layer';

import type { GetRelatedContentInput } from '../../lib/types.js';
import { normalizeError } from '@heyclaude/shared-runtime';
import type { ToolContext } from '../../types/runtime.js';

/**
 * Retrieves related content for a given slug and category and returns a textual summary and metadata.
 *
 * @param input - Query parameters: `slug` of the source item, `category` to match, and optional `limit` for number of results
 * @param context - Tool handler context
 * @returns A payload containing a single text content block summarizing the related items and an `_meta` object with `items`, `source`, and `count`
 * @throws Error when the service call to fetch related content fails
 */
export async function handleGetRelatedContent(
  input: GetRelatedContentInput,
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
      relevanceScore: number;
    }>;
    source: { slug: string; category: string };
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
  const { slug, category, limit } = input;
  const startTime = Date.now();

  try {
    const contentService = new ContentService(prisma);

    // Call get_related_content with correct parameter order
    // Signature: p_category, p_slug, p_tags, p_limit, p_exclude_slugs
    const rpcArgs = {
      p_category: category,
      p_slug: slug,
      p_tags: [],
      p_limit: limit,
      p_exclude_slugs: [],
    };

    let data: GetRelatedContentReturns;
    try {
      data = await contentService.getRelatedContent(rpcArgs);
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to fetch related content');
      logger.error('ContentService.getRelatedContent failed', normalized, {
        tool: 'getRelatedContent',
        args: rpcArgs,
      });
      throw normalized;
    }

    if (!data || data.length === 0) {
      logger.info('getRelatedContent completed with no results', {
        tool: 'getRelatedContent',
        duration_ms: Date.now() - startTime,
        slug,
        category,
        resultCount: 0,
      });
      return {
        content: [
          {
            type: 'text' as const,
            text: `No related content found for ${slug}.`,
          },
        ],
        _meta: {
          items: [],
          source: { slug, category },
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

    const items = data.map((item: RelatedContentItem) => ({
      slug: item.slug || '',
      title: item.title || '',
      category: item.category || '',
      description: item.description?.substring(0, 150) || '',
      tags: item.tags || [],
      relevanceScore: item.score || 0,
    }));

    const textSummary = items
      .map(
        (
          item: {
            title: string;
            category: string;
            description: string;
            relevanceScore: number;
          },
          idx: number
        ) =>
          `${idx + 1}. ${item.title} (${item.category}) - Relevance: ${item.relevanceScore}\n   ${item.description}${item.description.length >= 150 ? '...' : ''}`
      )
      .join('\n\n');

    logger.info('getRelatedContent completed successfully', {
      tool: 'getRelatedContent',
      duration_ms: Date.now() - startTime,
      slug,
      category,
      resultCount: items.length,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Related Content:\n\n${textSummary}`,
        },
      ],
      _meta: {
        items,
        source: { slug, category },
        count: items.length,
        limit,
        pagination: {
          total: items.length,
          limit,
          hasMore: false, // Related doesn't support pagination
        },
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getRelatedContent tool failed');
    logger.error('getRelatedContent tool error', normalized, {
      tool: 'getRelatedContent',
      slug,
      category,
    });
    throw normalized;
  }
}
