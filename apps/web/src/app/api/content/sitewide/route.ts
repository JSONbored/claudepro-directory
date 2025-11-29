/**
 * Sitewide Content API Route
 * Migrated from public-api edge function
 */

import 'server-only';

import { ContentService } from '@heyclaude/data-layer';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';
import {
  generateRequestId,
  logger,
  normalizeError,
  createErrorResponse,
} from '@heyclaude/web-runtime/logging/server';
import { createSupabaseAnonClient,
  badRequestResponse,
  getOnlyCorsHeaders,
  buildCacheHeaders } from '@heyclaude/web-runtime/server';
import  { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;

/**
 * Serve sitewide content in one of several export formats based on the request query.
 *
 * Handles GET requests to /api/content/sitewide. Supported formats:
 * - "llms" and "llms-txt": returns sitewide LLMs export as plain text (default).
 * - "readme": returns raw JSON data from `generate_readme_data` RPC (for CLI script to format).
 *
 * For "readme" the response is `application/json; charset=utf-8` containing raw data from the RPC.
 * The CLI script (`generate-readme.ts`) formats this data into markdown. For LLMs exports the
 * response is `text/plain; charset=utf-8`. Responses include standard security, CORS, and content
 * cache headers. Invalid formats produce a 400 Bad Request JSON response; failures while generating
 * LLMs export produce a 500 JSON error.
 *
 * @param request - The incoming NextRequest containing query parameters (optional `format`).
 * @returns A NextResponse containing the exported content or a JSON error payload.
 *
 * @see ContentService
 * @see createSupabaseAnonClient
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
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
        `Invalid sitewide format '${format}'. Valid formats: llms, llms-txt, readme`,
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

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS,
    },
  });
}