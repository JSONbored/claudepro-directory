/**
 * Feeds API Route (v1) - RSS/Atom
 *
 * Generates RSS or Atom feeds for content or changelog entries.
 * Supports category filtering and changelog-specific feeds.
 *
 * SIMPLIFIED: Uses format handler factory to eliminate conditional logic (~237 lines → ~150 lines)
 *
 * @example
 * ```ts
 * // Request - RSS feed for all content
 * GET /api/v1/feeds?type=rss
 *
 * // Request - Atom feed for skills category
 * GET /api/v1/feeds?type=atom&category=skills
 *
 * // Request - RSS feed for changelog
 * GET /api/v1/feeds?type=rss&category=changelog
 *
 * // Response (200) - application/rss+xml or application/atom+xml
 * <?xml version="1.0" encoding="UTF-8"?>
 * <rss version="2.0">...</rss>
 * ```
 */

import 'server-only';
import { type content_category } from '@prisma/client';
import {
  createFormatHandlerRoute,
  createOptionsHandler as createApiOptionsHandler,
  type FormatHandlerConfig,
  type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { feedQuerySchema } from '@heyclaude/web-runtime/api/schemas';
import {
  errorResponseSchema,
  feedResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, xmlResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';

const FEED_LIMIT = 50;

type FeedType = 'atom' | 'rss';

function toContentCategory(value: null | string): content_category | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return isValidCategory(normalized) ? (normalized as content_category) : null;
}

// Shared method args builder
function buildFeedMethodArgs(category: null | string | undefined) {
  if (category === 'changelog') return [];
  const typedCategory = category && category !== 'changelog' ? toContentCategory(category) : null;
  return [{ ...(typedCategory ? { p_category: typedCategory } : {}), p_limit: FEED_LIMIT }];
}

// Shared feed response handler
async function handleFeedResponse(
  result: unknown,
  format: FeedType,
  category: null | string | undefined,
  logger: RouteHandlerContext<{ category?: null | string; type: FeedType }>['logger'],
  changelogMethod: 'generateChangelogAtomFeed' | 'generateChangelogRssFeed',
  contentMethod: 'generateContentAtomFeed' | 'generateContentRssFeed'
): Promise<ReturnType<typeof xmlResponse>> {
  const contentType =
    format === 'rss' ? 'application/rss+xml; charset=utf-8' : 'application/atom+xml; charset=utf-8';

  // Handle changelog feeds
  if (category === 'changelog') {
    const { ContentService } = await import('@heyclaude/data-layer');
    const service = new ContentService();
    const feedData = await service[changelogMethod]({ p_limit: FEED_LIMIT });
    logger.info(
      { category: 'changelog', type: format },
      `Changelog ${format.toUpperCase()} feed generated`
    );
    return xmlResponse(feedData, contentType, 200, getOnlyCorsHeaders, {
      'X-Content-Source': `PostgreSQL changelog (${format})`,
      'X-Generated-By': `prisma.rpc.${changelogMethod}`,
      'X-Robots-Tag': 'index, follow',
    });
  }

  // Handle content feeds
  const feedData = result as string;
  const source = category
    ? `PostgreSQL content (${category})`
    : 'PostgreSQL content (all categories)';
  logger.info(
    { category: category ?? 'all', type: format },
    `Content ${format.toUpperCase()} feed generated`
  );
  return xmlResponse(feedData, contentType, 200, getOnlyCorsHeaders, {
    'X-Content-Source': source,
    'X-Generated-By': `prisma.rpc.${contentMethod}`,
    'X-Robots-Tag': 'index, follow',
  });
}

/**
 * GET /api/v1/feeds - Generate RSS or Atom feeds
 *
 * Generates RSS or Atom feeds for content or changelog entries.
 * Uses format handler factory to eliminate conditional logic.
 */
export const GET = createFormatHandlerRoute<FeedType, { category?: null | string; type: FeedType }>(
  {
    cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire
    cacheTags: (format, query, _body) => {
      const category = query.category;
      return [
        'feeds',
        `feeds-${format}`,
        category ? `feeds-${format}-${category}` : `feeds-${format}-all`,
      ];
    },
    cors: 'anon',
    defaultFormat: 'rss',
    formatParamName: 'type', // Use 'type' instead of 'format' for feed type
    formats: {
      atom: {
        methodArgs: (_format, query) => buildFeedMethodArgs(query.category),
        methodName: 'generateContentAtomFeed',
        responseHandler: async (result, _format, query, _body, ctx) =>
          handleFeedResponse(
            result,
            'atom',
            query.category,
            ctx.logger,
            'generateChangelogAtomFeed',
            'generateContentAtomFeed'
          ),
        serviceKey: 'content',
      },
      rss: {
        methodArgs: (_format, query) => buildFeedMethodArgs(query.category),
        methodName: 'generateContentRssFeed',
        responseHandler: async (result, _format, query, _body, ctx) =>
          handleFeedResponse(
            result,
            'rss',
            query.category,
            ctx.logger,
            'generateChangelogRssFeed',
            'generateContentRssFeed'
          ),
        serviceKey: 'content',
      },
    } as Record<
      FeedType,
      FormatHandlerConfig<FeedType, { category?: null | string; type: FeedType }>
    >,
    method: 'GET',
    openapi: {
      description:
        'Generates RSS or Atom feeds for content or changelog entries. Supports category filtering and changelog-specific feeds.',
      operationId: 'getFeeds',
      responses: {
        200: {
          description: 'Feed generated successfully (RSS or Atom XML)',
          schema: feedResponseSchema,
          headers: {
            'Content-Type': {
              schema: { type: 'string' },
              description: 'Content type (application/rss+xml or application/atom+xml)',
            },
            'Cache-Control': {
              schema: { type: 'string' },
              description: 'Cache control directive',
            },
            'X-Content-Source': {
              schema: { type: 'string' },
              description: 'Source of the feed content',
            },
            'X-Generated-By': {
              schema: { type: 'string' },
              description: 'Source of the response data',
            },
            'X-Robots-Tag': {
              schema: { type: 'string' },
              description: 'Robots meta tag directive',
            },
          },
          example:
            '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Claude Pro Directory</title><link>https://claudepro.directory</link><description>Community-driven directory of Claude configurations</description><item><title>Example Content</title><link>https://claudepro.directory/skills/example</link><description>Example content description</description></item></channel></rss>',
        },
        400: {
          description: 'Invalid type or category parameter',
          schema: errorResponseSchema,
          example: {
            error: 'Invalid type or category parameter',
            message: 'Invalid feed type. Valid types: rss, atom',
          },
        },
        500: {
          description: 'Internal server error',
          schema: errorResponseSchema,
          example: {
            error: 'Internal server error',
            message: 'An unexpected error occurred while generating the feed',
          },
        },
      },
      summary: 'Generate RSS or Atom feeds',
      tags: ['feeds', 'rss', 'atom'],
    },
    operation: 'FeedsAPI',
    querySchema: feedQuerySchema, // Type compatibility with exactOptionalPropertyTypes
    route: getVersionedRoute('feeds'),
  }
);

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
