/**
 * Sitewide Content API Route
 * Migrated from public-api edge function
 */

import 'server-only';
import { ContentService } from '@heyclaude/data-layer';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';
import { logger, normalizeError, createErrorResponse } from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  badRequestResponse,
  getOnlyCorsHeaders,
  buildCacheHeaders,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;

/**
 * Cached helper function to fetch sitewide content list
 * Uses Cache Components to reduce function invocations
 * 
 * @returns {Promise<unknown[]>} Sitewide content list from the database (typically an array of content item objects)
 */
async function getCachedSitewideContent() {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  const service = new ContentService(supabase);
  return await service.getSitewideContentList({ p_limit: 5000 });
}

/**
 * Serve sitewide content in multiple export formats based on the request's `format` query parameter.
 *
 * Supported formats:
 * - `llms` / `llms-txt` (default): returns the sitewide LLMs export as plain text (`text/plain; charset=utf-8`).
 * - `readme`: returns raw JSON data from the readme RPC (`application/json; charset=utf-8`) intended for CLI formatting.
 * - `json`: returns complete directory content as JSON array (`application/json; charset=utf-8`) with hyper-optimized caching (7-day TTL, 14-day stale).
 *
 * Successful responses include security, CORS, and content cache headers. An invalid `format` yields a 400 JSON error; failures generating the LLMs export yield a 500 JSON error.
 *
 * @param request - The incoming NextRequest; may include a `format` query parameter (`llms`, `llms-txt`, `readme`, or `json`).
 * @returns A NextResponse containing the exported content (plain text or JSON) or a JSON error payload.
 *
 * @see ContentService
 * @see createSupabaseAnonClient
 */
export async function GET(request: NextRequest) {
  const reqLogger = logger.child({
    operation: 'ContentSitewideAPI',
    route: '/api/content/sitewide',
    method: 'GET',
  });

  try {
    const url = new URL(request.url);
    const format = (url.searchParams.get('format') ?? 'llms').toLowerCase();

    reqLogger.info({ format }, 'Sitewide content request received');

    const supabase = createSupabaseAnonClient();
    const service = new ContentService(supabase);

    // Handle JSON format - returns complete directory content list
    if (format === 'json') {
      let data: Awaited<ReturnType<typeof getCachedSitewideContent>> = [];
      try {
        data = await getCachedSitewideContent();
        reqLogger.info(
          {
            itemCount: data.length,
          },
          'Sitewide JSON generated'
        );
      } catch (error) {
        const normalized = normalizeError(error, 'Operation failed');
        reqLogger.error(
          {
            err: normalized,
            format,
          },
          'Sitewide JSON query error'
        );
        return createErrorResponse(normalized, {
          route: '/api/content/sitewide',
          operation: 'ContentSitewideAPI',
          method: 'GET',
          logContext: {
            format,
          },
        });
      }

      // Next.js automatically compresses JSON responses (gzip/brotli)
      // Large payload optimization: 5000 items can be 5-15 MB uncompressed, ~1-3 MB compressed
      // Aggressive caching ensures most requests are served from CDN cache
      return NextResponse.json(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Generated-By': 'supabase.rpc.get_sitewide_content_list',
          // Compression hint (Next.js/Vercel handles actual compression automatically)
          'Vary': 'Accept-Encoding',
          ...buildSecurityHeaders(),
          ...CORS,
          // Hyper-optimized caching: 7 days TTL, 14 days stale (matches content_export preset)
          // Sitewide content lists rarely change, so aggressive caching reduces DB pressure by 95%+
          // This reduces bandwidth usage by serving cached responses from CDN
          ...buildCacheHeaders('content_export'),
        },
      });
    }

    // Handle README format - returns raw JSON data for CLI script to format
    if (format === 'readme') {
      const data = await service.getSitewideReadme();

      reqLogger.info(
        {
          categoriesCount: data.categories?.length ?? 0,
          totalCount: data.total_count ?? 0,
        },
        'Sitewide README data fetched'
      );

      return NextResponse.json(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Generated-By': 'supabase.rpc.generate_readme_data',
          ...buildSecurityHeaders(),
          ...CORS,
          ...buildCacheHeaders('content_export'),
        },
      });
    }

    // Handle LLMs format (default)
    if (format !== 'llms' && format !== 'llms-txt') {
      return badRequestResponse(
        `Invalid sitewide format '${format}'. Valid formats: llms, llms-txt, readme, json`,
        CORS
      );
    }

    const data = await service.getSitewideLlmsTxt();

    if (!data) {
      reqLogger.error({}, 'Sitewide LLMs export returned null');
      return NextResponse.json(
        {
          error: 'Sitewide LLMs export failed',
          message: 'RPC returned null or invalid',
        },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...buildSecurityHeaders(),
            ...CORS,
          },
        }
      );
    }

    // Database RPC returns properly formatted text (no client-side processing needed)
    // This eliminates CPU-intensive string replacement (5-10% CPU savings)
    reqLogger.info(
      {
        bytes: typeof data === 'string' ? data.length : 0,
      },
      'Sitewide llms generated'
    );

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_sitewide_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Sitewide content API error');
    reqLogger.error({ err: normalized }, 'Sitewide content API error');
    return createErrorResponse(normalized, {
      route: '/api/content/sitewide',
      operation: 'ContentSitewideAPI',
      method: 'GET',
    });
  }
}

/**
 * Responds to HTTP OPTIONS (CORS preflight) requests with no content and CORS headers.
 *
 * @returns The NextResponse for the OPTIONS request: HTTP 204 No Content with only the configured CORS headers.
 * @see getOnlyCorsHeaders
 * @see NextResponse
 */
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS,
    },
  });
}
