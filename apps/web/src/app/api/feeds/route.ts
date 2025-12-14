/**
 * Feeds API Route (RSS/Atom)
 *
 * Generates RSS or Atom feeds for content or changelog entries.
 * Supports category filtering and changelog-specific feeds.
 *
 * @example
 * ```ts
 * // Request - RSS feed for all content
 * GET /api/feeds?type=rss
 *
 * // Request - Atom feed for skills category
 * GET /api/feeds?type=atom&category=skills
 *
 * // Request - RSS feed for changelog
 * GET /api/feeds?type=rss&category=changelog
 *
 * // Response (200) - application/rss+xml or application/atom+xml
 * <?xml version="1.0" encoding="UTF-8"?>
 * <rss version="2.0">...</rss>
 * ```
 */

import 'server-only';
import { ContentService } from '@heyclaude/data-layer';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';
import { normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  buildCacheHeaders,
  createApiOptionsHandler,
  createApiRoute,
  feedQuerySchema,
  getOnlyCorsHeaders,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { NextResponse } from 'next/server';

const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;
const FEED_LIMIT = 50;

type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];
type FeedType = 'atom' | 'rss';

/***
 * Convert a raw string to a validated ContentCategory or return null.
 *
 * Accepts a string or null and returns the matching ContentCategory when the
 * input matches one of the known CONTENT_CATEGORY_VALUES; returns `null` for
 * falsy or unrecognized inputs.
 *
 * @param {null | string} value - The raw category value to validate (may be `null`)
 * @returns `ContentCategory` if `value` is a known category, `null` otherwise
 */
function toContentCategory(value: null | string): ContentCategory | null {
  if (!value) return null;
  return CONTENT_CATEGORY_VALUES.includes(value as ContentCategory)
    ? (value as ContentCategory)
    : null;
}

/**
 * Cached helper function to generate feed payload.
 * All parameters become part of the cache key, so different feed types/categories have different cache entries.
 *
 * @param {FeedType} type - Feed format to generate: 'rss' or 'atom'
 * @param {string | null} category - Content category name, 'changelog' for changelog feeds, null for all content
 * @returns Promise resolving to an object with contentType (HTTP Content-Type header), source (feed origin label), and xml (feed XML string)
 */
async function getCachedFeedPayload(
  type: FeedType,
  category: null | string
): Promise<{ contentType: string; source: string; xml: string }> {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  // Use module-level logger since this runs in cached context
  // Import logger for cached context (dynamic import to avoid circular deps)
  const { logger: cachedLogger } = await import('@heyclaude/web-runtime/logging/server');
  const loggerInstance = cachedLogger.child({ operation: 'getCachedFeedPayload' });
  // Wrap logger to match expected type signature
  const wrappedLogger: Logger = {
    error: (context: Record<string, unknown>, message: string) =>
      loggerInstance.error(context as Parameters<typeof loggerInstance.error>[0], message),
    info: (context: Record<string, unknown>, message: string) =>
      loggerInstance.info(context as Parameters<typeof loggerInstance.info>[0], message),
    warn: (context: Record<string, unknown>, message: string) =>
      loggerInstance.warn(context as Parameters<typeof loggerInstance.warn>[0], message),
  };
  return generateFeedPayload(type, category, wrappedLogger);
}

/******
 * Generate an XML feed payload and accompanying metadata for the requested feed type and category.
 *
 * Uses ContentService RPC wrappers to produce either a changelog feed or a content feed in
 * RSS or Atom format, and returns the XML body together with the correct Content-Type and a
 * human-readable source label.
 *
 * @param {FeedType} type - Feed format to generate: 'rss' or 'atom'
 * @param {null | string} category - Content category name, `'changelog'` for changelog feeds, `null` for all content
 * @param {Logger} reqLogger - Optional request-scoped logger used for RPC call logging and error context
 * @returns An object containing `xml` (the feed XML string), `contentType` (HTTP Content-Type header value), and `source` (a short label describing the feed origin)
 * @see ContentService
 * @see toContentCategory
 */
interface Logger {
  error: (context: Record<string, unknown>, message: string) => void;
  info?: (context: Record<string, unknown>, message: string) => void;
  warn?: (context: Record<string, unknown>, message: string) => void;
}

async function generateFeedPayload(
  type: FeedType,
  category: null | string,
  reqLogger?: Logger
): Promise<{ contentType: string; source: string; xml: string }> {
  const service = new ContentService();

  if (category === 'changelog') {
    if (type === 'rss') {
      const rpcArgs = {
        p_limit: FEED_LIMIT,
      } satisfies DatabaseGenerated['public']['Functions']['generate_changelog_rss_feed']['Args'];
      try {
        const feedData = await service.generateChangelogRssFeed(rpcArgs);
        return {
          contentType: 'application/rss+xml; charset=utf-8',
          source: 'PostgreSQL changelog (rss)',
          xml: feedData,
        };
      } catch (error) {
        const normalized = normalizeError(error, 'generate_changelog_rss_feed failed');
        reqLogger?.error(
          { err: normalized, rpcName: 'generate_changelog_rss_feed' },
          'RPC call failed'
        );
        throw normalized;
      }
    }
    const rpcArgs2 = {
      p_limit: FEED_LIMIT,
    } satisfies DatabaseGenerated['public']['Functions']['generate_changelog_atom_feed']['Args'];
    try {
      const feedData = await service.generateChangelogAtomFeed(rpcArgs2);
      return {
        contentType: 'application/atom+xml; charset=utf-8',
        source: 'PostgreSQL changelog (atom)',
        xml: feedData,
      };
    } catch (error) {
      const normalized = normalizeError(error, 'generate_changelog_atom_feed failed');
      reqLogger?.error(
        { err: normalized, rpcName: 'generate_changelog_atom_feed' },
        'RPC call failed'
      );
      throw normalized;
    }
  }

  const typedCategory = category && category !== 'changelog' ? toContentCategory(category) : null;

  if (type === 'rss') {
    const rpcArgs3 = {
      ...(typedCategory ? { p_category: typedCategory } : {}),
      p_limit: FEED_LIMIT,
    } satisfies DatabaseGenerated['public']['Functions']['generate_content_rss_feed']['Args'];
    try {
      const feedData = await service.generateContentRssFeed(rpcArgs3);
      return {
        contentType: 'application/rss+xml; charset=utf-8',
        source: category
          ? `PostgreSQL content (${category})`
          : 'PostgreSQL content (all categories)',
        xml: feedData,
      };
    } catch (error) {
      const normalized = normalizeError(error, 'generate_content_rss_feed failed');
      reqLogger?.error(
        { err: normalized, rpcName: 'generate_content_rss_feed' },
        'RPC call failed'
      );
      throw normalized;
    }
  }

  const rpcArgs4 = {
    ...(typedCategory ? { p_category: typedCategory } : {}),
    p_limit: FEED_LIMIT,
  } satisfies DatabaseGenerated['public']['Functions']['generate_content_atom_feed']['Args'];
  try {
    const feedData = await service.generateContentAtomFeed(rpcArgs4);
    return {
      contentType: 'application/atom+xml; charset=utf-8',
      source: category ? `PostgreSQL content (${category})` : 'PostgreSQL content (all categories)',
      xml: feedData,
    };
  } catch (error) {
    const normalized = normalizeError(error, 'generate_content_atom_feed failed');
    reqLogger?.error({ err: normalized, rpcName: 'generate_content_atom_feed' }, 'RPC call failed');
    throw normalized;
  }
}

/**
 * GET /api/feeds - Generate RSS or Atom feeds
 *
 * Generates RSS or Atom feeds for content or changelog entries.
 * Supports category filtering and changelog-specific feeds.
 */
export const GET = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, query }) => {
    // Zod schema ensures type is 'rss' | 'atom' and category is string | null
    const { category, type } = query;

    // Additional validation: category must be valid content category or 'changelog'
    if (category && category !== 'changelog' && !toContentCategory(category)) {
      throw new Error(
        `Invalid category parameter. Valid categories: changelog, ${CONTENT_CATEGORY_VALUES.join(', ')}, or omit/use 'all' for site-wide feed`
      );
    }

    logger.info(
      {
        category: category ?? 'all',
        type,
      },
      'Feeds request received'
    );

    const payload = await getCachedFeedPayload(type as FeedType, category);

    logger.info(
      {
        category: category ?? 'all',
        contentType: payload.contentType,
        source: payload.source,
        type,
      },
      'Feed delivery'
    );

    return new NextResponse(payload.xml, {
      headers: {
        'Content-Type': payload.contentType,
        'X-Content-Source': payload.source,
        'X-Generated-By': 'prisma.functions.feeds',
        'X-Robots-Tag': 'index, follow',
        ...buildSecurityHeaders(),
        ...getOnlyCorsHeaders,
        ...buildCacheHeaders('feeds'),
      },
      status: 200,
    });
  },
  method: 'GET',
  openapi: {
    description:
      'Generates RSS or Atom feeds for content or changelog entries. Supports category filtering and changelog-specific feeds.',
    operationId: 'getFeeds',
    responses: {
      200: {
        description: 'Feed generated successfully (RSS or Atom XML)',
      },
      400: {
        description: 'Invalid type or category parameter',
      },
    },
    summary: 'Generate RSS or Atom feeds',
    tags: ['feeds', 'rss', 'atom'],
  },
  operation: 'FeedsAPI',
  querySchema: feedQuerySchema,
  route: '/api/feeds',
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
