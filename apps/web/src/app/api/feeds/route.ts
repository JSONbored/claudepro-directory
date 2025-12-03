/**
 * Feeds API Route (RSS/Atom)
 * Migrated from public-api edge function
 */

import 'server-only';

import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';
import {
  generateRequestId,
  logger,
  normalizeError,
  createErrorResponse,
} from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  badRequestResponse,
  getOnlyCorsHeaders,
  buildCacheHeaders,
} from '@heyclaude/web-runtime/server';
import { NextRequest, NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;
const FEED_LIMIT = 50;

type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];
type FeedType = 'atom' | 'rss';
const SUPPORTED_TYPES = new Set<FeedType>(['rss', 'atom']);

function toContentCategory(value: null | string): ContentCategory | null {
  if (!value) return null;
  return CONTENT_CATEGORY_VALUES.includes(value as ContentCategory)
    ? (value as ContentCategory)
    : null;
}

async function executeRpcWithLogging<T>(
  rpcName: string,
  rpcCall: () => PromiseLike<{ data: null | T; error: unknown }>,
  reqLogger: ReturnType<typeof logger.child>
): Promise<T> {
  const { data, error } = await rpcCall();
  if ((error !== null && error !== undefined) || data == null) {
    if (error !== null && error !== undefined) {
      reqLogger.error('RPC call failed in generateFeedPayload', normalizeError(error), {
        rpcName,
      });
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`${rpcName} failed or returned null`);
  }
  return data;
}

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
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
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

    reqLogger.info('Feeds request received', {
      type,
      category: category ?? 'all',
    });

    const supabase = createSupabaseAnonClient();
    const payload = await generateFeedPayload(type, category, supabase, reqLogger);

    reqLogger.info('Feed delivery', {
      type,
      category: category ?? 'all',
      contentType: payload.contentType,
      source: payload.source,
    });

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
    reqLogger.error('Feeds API error', normalizeError(error));
    return createErrorResponse(error, {
      route: '/api/feeds',
      operation: 'FeedsAPI',
      method: 'GET',
    });
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getOnlyCorsHeaders,
    },
  });
}
