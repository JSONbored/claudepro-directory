/**
 * Changelog Index API Route
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
import { NextRequest, NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;

/**
 * Cached helper function to fetch changelog LLMs.txt content.
 
 * @returns {unknown} Description of return value*/
async function getCachedChangelogLlmsTxt(): Promise<null | string> {
  'use cache';
  cacheLife({ stale: 86400, revalidate: 21600, expire: 2592000 }); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  const supabase = createSupabaseAnonClient();
  const service = new ContentService(supabase);
  return service.getChangelogLlmsTxt();
}

export async function GET(request: NextRequest) {
  const reqLogger = logger.child({
    operation: 'ChangelogIndexAPI',
    route: '/api/content/changelog',
    method: 'GET',
  });

  try {
    const url = new URL(request.url);
    const format = (url.searchParams.get('format') ?? 'llms-changelog').toLowerCase();

    if (format !== 'llms-changelog') {
      return badRequestResponse(`Invalid format '${format}' for changelog index`, CORS);
    }

    reqLogger.info({ format }, 'Changelog index request received');

    const data = await getCachedChangelogLlmsTxt();

    if (!data) {
      reqLogger.warn({}, 'Changelog LLMs.txt not found');
      return badRequestResponse('Changelog LLMs.txt not found or invalid', CORS);
    }

    const formatted = data.replaceAll(String.raw`\n`, '\n');

    reqLogger.info(
      {
        bytes: formatted.length,
      },
      'Changelog LLMs.txt generated'
    );

    return new NextResponse(formatted, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_changelog_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Operation failed');
    reqLogger.error({ err: normalizeError(error) }, 'Changelog index API error');
    return createErrorResponse(normalized, {
      route: '/api/content/changelog',
      operation: 'ChangelogIndexAPI',
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
