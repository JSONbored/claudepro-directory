/**
 * Category Content API Route
 *
 * Returns category content in multiple formats (LLMs.txt or JSON).
 * Supports filtering by content category with optimized caching.
 *
 * @example
 * ```ts
 * // Request
 * GET /api/content/agents?format=json
 *
 * // Response (200) - application/json
 * [
 *   { "id": "...", "title": "...", ... },
 *   ...
 * ]
 * ```
 */

import 'server-only';
import { ContentService } from '@heyclaude/data-layer';
import { type content_category } from '@heyclaude/data-layer/prisma';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';
import {
  buildCacheHeaders,
  categoryContentFormatSchema,
  createApiOptionsHandler,
  createApiRoute,
  getOnlyCorsHeaders,
  jsonResponse,
  notFoundResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Prisma enum values for validation
const CONTENT_CATEGORY_VALUES: readonly content_category[] = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
  'jobs',
  'changelog',
] as const;

/***
 * Cached helper function to fetch category content list.
 * Uses Cache Components to reduce function invocations.
 * The category parameter becomes part of the cache key, so different categories have different cache entries.
 * @param {content_category} category
 */
async function getCachedCategoryContent(category: content_category) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire (defined in next.config.mjs)

  const service = new ContentService();
  return await service.getCategoryContentList({ p_category: category });
}

/**
 * Cached helper function to fetch category LLMs.txt
 * Uses Cache Components to reduce function invocations
 *
 * @param {DatabaseGenerated['public']['Enums']['content_category']} category - Content category enum value
 * @returns {Promise<string | null>} Category LLMs.txt content from the database
 */
async function getCachedCategoryLlmsTxt(
  category: DatabaseGenerated['public']['Enums']['content_category']
) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const service = new ContentService();
  return await service.getCategoryLlmsTxt({ p_category: category });
}

/**
 * GET /api/content/[category] - Get category content
 *
 * Returns category content in multiple formats (LLMs.txt or JSON).
 * Supports filtering by content category with optimized caching.
 */
export const GET = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, nextContext, query }) => {
    // Extract path parameter from Next.js route context
    interface RouteContext {
      params: Promise<{ category: string }>;
    }
    const context = nextContext as RouteContext;
    if (!context?.params) {
      logger.error({}, 'Missing route context for category content handler');
      throw new Error('Missing route context');
    }

    const { category } = await context.params;

    // Validate category from path parameter
    if (!CONTENT_CATEGORY_VALUES.includes(category as content_category)) {
      throw new Error(
        `Invalid category '${category}'. Valid categories: ${CONTENT_CATEGORY_VALUES.join(', ')}`
      );
    }

    // Zod schema ensures proper types
    const { format } = query;

    logger.info({ category, format }, 'Category content request received');

    switch (format) {
      case 'json': {
        const data = await getCachedCategoryContent(
          category as DatabaseGenerated['public']['Enums']['content_category']
        );

        if (!data || (Array.isArray(data) && data.length === 0)) {
          logger.warn({ category }, 'Category content not found');
          return notFoundResponse('Category content not found', 'CategoryContent');
        }

        logger.info(
          { category, itemCount: Array.isArray(data) ? data.length : 1 },
          'Category content retrieved'
        );

        return jsonResponse(data, 200, getOnlyCorsHeaders, {
          'X-Generated-By': 'prisma.rpc.get_category_content_list',
          ...buildSecurityHeaders(),
          ...buildCacheHeaders('content_export', {
            stale: 60 * 60 * 24 * 30, // 30 days stale-while-revalidate
            ttl: 60 * 60 * 24 * 7, // 7 days
          }),
        });
      }
      case 'llms-category': {
        const data = await getCachedCategoryLlmsTxt(
          category as DatabaseGenerated['public']['Enums']['content_category']
        );

        if (!data) {
          logger.warn({ category }, 'Category LLMs.txt not found');
          return notFoundResponse('Category LLMs.txt not found', 'CategoryContent');
        }

        const formatted = data.replaceAll(String.raw`\n`, '\n');

        logger.info({ bytes: formatted.length, category }, 'Category LLMs.txt generated');

        return new NextResponse(formatted, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Generated-By': 'prisma.rpc.generate_category_llms_txt',
            ...buildSecurityHeaders(),
            ...getOnlyCorsHeaders,
            ...buildCacheHeaders('content_export'),
          },
          status: 200,
        });
      }
      default: {
        throw new Error(`Invalid format '${format}'. Valid formats: llms-category, json`);
      }
    }
  },
  method: 'GET',
  openapi: {
    description:
      'Returns category content in multiple formats (LLMs.txt or JSON). Supports filtering by content category with optimized caching.',
    operationId: 'getCategoryContent',
    responses: {
      200: {
        description: 'Category content retrieved successfully',
      },
      400: {
        description: 'Invalid category or format parameter',
      },
      404: {
        description: 'Category content not found',
      },
    },
    summary: 'Get category content',
    tags: ['content', 'categories', 'export'],
  },
  operation: 'ContentCategoryAPI',
  querySchema: z.object({
    format: categoryContentFormatSchema,
  }),
  route: '/api/content/[category]',
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
