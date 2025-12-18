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
import { type content_category } from '@heyclaude/data-layer/prisma';
import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';
import {
  createOptionsHandler as createApiOptionsHandler,
  createFormatHandlerRoute,
  type FormatHandlerConfig,
  type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, xmlResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { feedQuerySchema } from '@heyclaude/web-runtime/api/schemas';

const FEED_LIMIT = 50;

type FeedType = 'atom' | 'rss';

function toContentCategory(value: null | string): content_category | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return isValidCategory(normalized) ? normalized : null;
}

// Shared method args builder
function buildFeedMethodArgs(category: string | null | undefined) {
  if (category === 'changelog') return [];
  const typedCategory = category && category !== 'changelog' ? toContentCategory(category) : null;
  return [{ ...(typedCategory ? { p_category: typedCategory } : {}), p_limit: FEED_LIMIT }];
}

// Shared feed response handler
async function handleFeedResponse(
  result: unknown,
  format: FeedType,
  category: string | null | undefined,
  logger: RouteHandlerContext<{ type: FeedType; category?: string | null }, unknown>['logger'],
  changelogMethod: 'generateChangelogRssFeed' | 'generateChangelogAtomFeed',
  contentMethod: 'generateContentRssFeed' | 'generateContentAtomFeed'
): Promise<ReturnType<typeof xmlResponse>> {
  const contentType = format === 'rss' ? 'application/rss+xml; charset=utf-8' : 'application/atom+xml; charset=utf-8';
  
  // Handle changelog feeds
  if (category === 'changelog') {
    const { ContentService } = await import('@heyclaude/data-layer');
    const service = new ContentService();
    const feedData = await service[changelogMethod]({ p_limit: FEED_LIMIT });
    logger.info({ category: 'changelog', type: format }, `Changelog ${format.toUpperCase()} feed generated`);
    return xmlResponse(
      feedData,
      contentType,
      200,
      getOnlyCorsHeaders,
      {
        'X-Content-Source': `PostgreSQL changelog (${format})`,
        'X-Generated-By': `prisma.rpc.${changelogMethod}`,
        'X-Robots-Tag': 'index, follow',
      }
    );
  }
  
  // Handle content feeds
  const feedData = result as string;
  const source = category ? `PostgreSQL content (${category})` : 'PostgreSQL content (all categories)';
  logger.info({ category: category ?? 'all', type: format }, `Content ${format.toUpperCase()} feed generated`);
  return xmlResponse(
    feedData,
    contentType,
    200,
    getOnlyCorsHeaders,
    {
      'X-Content-Source': source,
      'X-Generated-By': `prisma.rpc.${contentMethod}`,
      'X-Robots-Tag': 'index, follow',
    }
  );
}

/**
 * GET /api/v1/feeds - Generate RSS or Atom feeds
 *
 * Generates RSS or Atom feeds for content or changelog entries.
 * Uses format handler factory to eliminate conditional logic.
 */
export const GET = createFormatHandlerRoute<FeedType, { type: FeedType; category?: string | null }, unknown>({
  route: getVersionedRoute('feeds'),
  operation: 'FeedsAPI',
  method: 'GET',
  cors: 'anon',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: (format, query, _body) => {
    const category = query.category;
    return ['feeds', `feeds-${format}`, category ? `feeds-${format}-${category}` : `feeds-${format}-all`];
  },
  querySchema: feedQuerySchema as any, // Type compatibility with exactOptionalPropertyTypes
  defaultFormat: 'rss',
  formatParamName: 'type', // Use 'type' instead of 'format' for feed type
  formats: {
    rss: {
      serviceKey: 'content',
      methodName: 'generateContentRssFeed',
      methodArgs: (_format, query) => buildFeedMethodArgs(query.category),
      responseHandler: async (result, _format, query, _body, ctx) =>
        handleFeedResponse(
          result,
          'rss',
          query.category,
          ctx.logger,
          'generateChangelogRssFeed',
          'generateContentRssFeed'
        ),
    },
    atom: {
      serviceKey: 'content',
      methodName: 'generateContentAtomFeed',
      methodArgs: (_format, query) => buildFeedMethodArgs(query.category),
      responseHandler: async (result, _format, query, _body, ctx) =>
        handleFeedResponse(
          result,
          'atom',
          query.category,
          ctx.logger,
          'generateChangelogAtomFeed',
          'generateContentAtomFeed'
        ),
    },
  } as Record<FeedType, FormatHandlerConfig<FeedType, { type: FeedType; category?: string | null }, unknown>>,
  openapi: {
    summary: 'Generate RSS or Atom feeds',
    description:
      'Generates RSS or Atom feeds for content or changelog entries. Supports category filtering and changelog-specific feeds.',
    tags: ['feeds', 'rss', 'atom'],
    operationId: 'getFeeds',
    responses: {
      200: {
        description: 'Feed generated successfully (RSS or Atom XML)',
      },
      400: {
        description: 'Invalid type or category parameter',
      },
    },
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
