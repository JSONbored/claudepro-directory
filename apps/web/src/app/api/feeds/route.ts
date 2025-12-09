/**
 * Feeds API Route (RSS/Atom)
 * Migrated from public-api edge function
 */

import 'server-only';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';
import { logger, normalizeError, createErrorResponse } from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  badRequestResponse,
  getOnlyCorsHeaders,
  buildCacheHeaders,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;
const FEED_LIMIT = 50;

type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];
type FeedType = 'atom' | 'rss';
const SUPPORTED_TYPES = new Set<FeedType>(['rss', 'atom']);

/**
 * Convert a raw string to a validated ContentCategory or return null.
 *
 * Accepts a string or null and returns the matching ContentCategory when the
 * input matches one of the known CONTENT_CATEGORY_VALUES; returns `null` for
 * falsy or unrecognized inputs.
 *
 * @param value - The raw category value to validate (may be `null`)
 * @returns `ContentCategory` if `value` is a known category, `null` otherwise
 */
function toContentCategory(value: null | string): ContentCategory | null {
  if (!value) return null;
  return CONTENT_CATEGORY_VALUES.includes(value as ContentCategory)
    ? (value as ContentCategory)
    : null;
}

/**
 * Execute a Supabase RPC call with request-scoped logging and unified error handling.
 *
 * Logs the RPC failure when an error is present, rethrows the original Error if the RPC returned an Error,
 * and otherwise throws a new Error when the RPC returned an error-like value or null data.
 *
 * @param rpcName - Human-readable RPC identifier used in logs and error messages
 * @param rpcCall - Function that executes the RPC and resolves to an object with `data` (T or null) and `error` (any)
 * @param reqLogger - Request-scoped logger (result of `logger.child(...)`) used to record RPC failures
 * @returns The RPC `data` when the call succeeds
 */
async function executeRpcWithLogging<T>(
  rpcName: string,
  rpcCall: () => PromiseLike<{ data: null | T; error: unknown }>,
  reqLogger: ReturnType<typeof logger.child>
): Promise<T> {
  const { data, error } = await rpcCall();
  if ((error !== null && error !== undefined) || data == null) {
    if (error !== null && error !== undefined) {
      const normalized = normalizeError(error, `${rpcName} failed`);
      reqLogger.error({ err: normalized, rpcName }, 'RPC call failed');
      throw normalized;
    } else {
      reqLogger.error({ err: undefined, rpcName }, 'RPC returned null data without error');
      throw new Error(`${rpcName} failed or returned null`);
    }
  }
  return data;
}

/**
 * Cached helper function to generate feed payload.
 * All parameters become part of the cache key, so different feed types/categories have different cache entries.
 * @param type
 * @param category
 
 * @returns {unknown} Description of return value*/
async function getCachedFeedPayload(
  type: FeedType,
  category: null | string
): Promise<{ contentType: string; source: string; xml: string }> {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  const supabase = createSupabaseAnonClient();
  // Create a minimal logger for the cached helper
  const reqLogger = logger.child({
    operation: 'getCachedFeedPayload',
    route: '/api/feeds',
    module: 'apps/web/src/app/api/feeds',
  });

  return generateFeedPayload(type, category, supabase, reqLogger);
}

/**
 * Generate an XML feed payload and accompanying metadata for the requested feed type and category.
 *
 * Selects the appropriate Supabase RPCs to produce either a changelog feed or a content feed in
 * RSS or Atom format, and returns the XML body together with the correct Content-Type and a
 * human-readable source label.
 *
 * @param type - Feed format to generate: 'rss' or 'atom'
 * @param category - Content category name, `'changelog'` for changelog feeds, `null` for all content
 * @param supabase - Supabase anonymous client used to call database RPCs
 * @param reqLogger - Request-scoped logger used for RPC call logging and error context
 * @returns An object containing `xml` (the feed XML string), `contentType` (HTTP Content-Type header value), and `source` (a short label describing the feed origin)
 * @see executeRpcWithLogging
 * @see toContentCategory
 */
async function generateFeedPayload(
  type: FeedType,
  category: null | string,
  supabase: ReturnType<typeof createSupabaseAnonClient>,
  reqLogger: ReturnType<typeof logger.child>
): Promise<{ contentType: string; source: string; xml: string }> {
  if (category === 'changelog') {
    if (type === 'rss') {
      const rpcArgs = {
        p_limit: FEED_LIMIT,
      } satisfies DatabaseGenerated['public']['Functions']['generate_changelog_rss_feed']['Args'];
      const feedData = await executeRpcWithLogging<string>(
        'generate_changelog_rss_feed',
        () => supabase.rpc('generate_changelog_rss_feed', rpcArgs),
        reqLogger
      );
      return {
        xml: feedData,
        contentType: 'application/rss+xml; charset=utf-8',
        source: 'PostgreSQL changelog (rss)',
      };
    }
    const rpcArgs2 = {
      p_limit: FEED_LIMIT,
    } satisfies DatabaseGenerated['public']['Functions']['generate_changelog_atom_feed']['Args'];
    const feedData = await executeRpcWithLogging<string>(
      'generate_changelog_atom_feed',
      () => supabase.rpc('generate_changelog_atom_feed', rpcArgs2),
      reqLogger
    );
    return {
      xml: feedData,
      contentType: 'application/atom+xml; charset=utf-8',
      source: 'PostgreSQL changelog (atom)',
    };
  }

  const typedCategory = category && category !== 'changelog' ? toContentCategory(category) : null;

  if (type === 'rss') {
    const rpcArgs3 = {
      ...(typedCategory ? { p_category: typedCategory } : {}),
      p_limit: FEED_LIMIT,
    } satisfies DatabaseGenerated['public']['Functions']['generate_content_rss_feed']['Args'];
    const feedData = await executeRpcWithLogging<string>(
      'generate_content_rss_feed',
      () => supabase.rpc('generate_content_rss_feed', rpcArgs3),
      reqLogger
    );
    return {
      xml: feedData,
      contentType: 'application/rss+xml; charset=utf-8',
      source: category ? `PostgreSQL content (${category})` : 'PostgreSQL content (all categories)',
    };
  }

  const rpcArgs4 = {
    ...(typedCategory ? { p_category: typedCategory } : {}),
    p_limit: FEED_LIMIT,
  } satisfies DatabaseGenerated['public']['Functions']['generate_content_atom_feed']['Args'];
  const feedData = await executeRpcWithLogging<string>(
    'generate_content_atom_feed',
    () => supabase.rpc('generate_content_atom_feed', rpcArgs4),
    reqLogger
  );
  return {
    xml: feedData,
    contentType: 'application/atom+xml; charset=utf-8',
    source: category ? `PostgreSQL content (${category})` : 'PostgreSQL content (all categories)',
  };
}

export async function GET(request: NextRequest) {
  const reqLogger = logger.child({
    operation: 'FeedsAPI',
    route: '/api/feeds',
    method: 'GET',
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
        type,
        category: category ?? 'all',
      },
      'Feeds request received'
    );

    const payload = await getCachedFeedPayload(type, category);

    reqLogger.info(
      {
        type,
        category: category ?? 'all',
        contentType: payload.contentType,
        source: payload.source,
      },
      'Feed delivery'
    );

    return new NextResponse(payload.xml, {
      status: 200,
      headers: {
        'Content-Type': payload.contentType,
        'X-Content-Source': payload.source,
        'X-Robots-Tag': 'index, follow',
        'X-Generated-By': 'supabase.functions.feeds',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('feeds'),
      },
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Feeds API error');
    reqLogger.error({ err: normalized }, 'Feeds API error');
    return createErrorResponse(normalized, {
      route: '/api/feeds',
      operation: 'FeedsAPI',
      method: 'GET',
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
    status: 204,
    headers: {
      ...getOnlyCorsHeaders,
    },
  });
}
