/**
 * Feeds API Route (RSS/Atom)
 * Migrated from public-api edge function
 */

import 'server-only';
import { ContentService } from '@heyclaude/data-layer';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';
import { createErrorResponse, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  badRequestResponse,
  buildCacheHeaders,
  createSupabaseAnonClient,
  getOnlyCorsHeaders,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;
const FEED_LIMIT = 50;

type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];
type FeedType = 'atom' | 'rss';
const SUPPORTED_TYPES = new Set<FeedType>(['rss', 'atom']);

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

  const supabase = createSupabaseAnonClient();
  // Use module-level logger since this runs in cached context
  return generateFeedPayload(type, category, supabase, logger);
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
 * @param {ReturnType<typeof createSupabaseAnonClient>} supabase - Supabase anonymous client used to call database RPCs
 * @param {ReturnType<typeof logger.child>} reqLogger - Optional request-scoped logger used for RPC call logging and error context
 * @returns An object containing `xml` (the feed XML string), `contentType` (HTTP Content-Type header value), and `source` (a short label describing the feed origin)
 * @see ContentService
 * @see toContentCategory
 */
async function generateFeedPayload(
  type: FeedType,
  category: null | string,
  supabase: ReturnType<typeof createSupabaseAnonClient>,
  reqLogger?: ReturnType<typeof logger.child>
): Promise<{ contentType: string; source: string; xml: string }> {
  const service = new ContentService(supabase);

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

export async function GET(request: NextRequest) {
  const reqLogger = logger.child({
    method: 'GET',
    operation: 'FeedsAPI',
    route: '/api/feeds',
  });

  try {
    const url = new URL(request.url);
    const typeParam = (url.searchParams.get('type') ?? 'rss').toLowerCase();
    const categoryParam = url.searchParams.get('category');
    const category =
      categoryParam && categoryParam !== 'all' ? categoryParam.trim().toLowerCase() : null;

    if (!SUPPORTED_TYPES.has(typeParam as FeedType)) {
      return badRequestResponse('Invalid type. Valid types: rss, atom', CORS);
    }
    const type = typeParam as FeedType;

    if (category && category !== 'changelog' && !toContentCategory(category)) {
      return badRequestResponse(
        `Invalid category parameter. Valid categories: changelog, ${CONTENT_CATEGORY_VALUES.join(', ')}, or omit/use 'all' for site-wide feed`,
        CORS
      );
    }

    reqLogger.info(
      {
        category: category ?? 'all',
        type,
      },
      'Feeds request received'
    );

    const payload = await getCachedFeedPayload(type, category);

    reqLogger.info(
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
        'X-Generated-By': 'supabase.functions.feeds',
        'X-Robots-Tag': 'index, follow',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('feeds'),
      },
      status: 200,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Feeds API error');
    reqLogger.error({ err: normalized }, 'Feeds API error');
    return createErrorResponse(normalized, {
      method: 'GET',
      operation: 'FeedsAPI',
      route: '/api/feeds',
    });
  }
}

/**
 * Responds to CORS preflight (OPTIONS) requests with a 204 No Content and CORS headers.
 *
 * @returns A NextResponse with HTTP status 204 and only CORS headers set.
 * @see getOnlyCorsHeaders
 */
export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      ...getOnlyCorsHeaders,
    },
    status: 204,
  });
}
