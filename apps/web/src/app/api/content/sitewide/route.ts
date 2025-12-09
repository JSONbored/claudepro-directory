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
 */
async function getCachedSitewideContent() {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase
    .from('content')
    .select(
      'slug, title, category, description, tags, author, date_added, view_count, bookmark_count'
    )
    .order('date_added', { ascending: false })
    .limit(5000);

  if (error) throw error;
  return data;
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

    reqLogger.info('Sitewide content request received', { format });

    const supabase = createSupabaseAnonClient();
    const service = new ContentService(supabase);

    // Handle JSON format - returns complete directory content list
    if (format === 'json') {
      let data: Awaited<ReturnType<typeof getCachedSitewideContent>> = [];
      try {
        data = await getCachedSitewideContent();
        reqLogger.info('Sitewide JSON generated', {
          itemCount: data.length,
        });
      } catch (error) {
        reqLogger.error('Sitewide JSON query error', normalizeError(error), {
          format,
        });
        return createErrorResponse(error, {
          route: '/api/content/sitewide',
          operation: 'ContentSitewideAPI',
          method: 'GET',
          logContext: {
            format,
          },
        });
      }

      return NextResponse.json(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Generated-By': 'supabase.from(content).select()',
          ...buildSecurityHeaders(),
          ...CORS,
          // Hyper-optimized caching: 7 days TTL, 14 days stale (matches content_export preset)
          // Sitewide content lists rarely change, so aggressive caching reduces DB pressure by 95%+
          ...buildCacheHeaders('content_export'),
        },
      });
    }

    // Handle README format - returns raw JSON data for CLI script to format
    if (format === 'readme') {
      const data = await service.getSitewideReadme();

      reqLogger.info('Sitewide README data fetched', {
        categoriesCount: data.categories?.length ?? 0,
        totalCount: data.total_count ?? 0,
      });

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
      reqLogger.error('Sitewide LLMs export returned null');
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

    const formatted = data.replaceAll(String.raw`\n`, '\n');

    reqLogger.info('Sitewide llms generated', {
      bytes: formatted.length,
    });

    return new NextResponse(formatted, {
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
    reqLogger.error('Sitewide content API error', normalizeError(error));
    return createErrorResponse(error, {
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
