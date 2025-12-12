/**
 * Changelog Index API Route
 * Migrated from public-api edge function
 */

import 'server-only';
import { ContentService } from '@heyclaude/data-layer';
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

/**
 * Cached helper function to fetch changelog LLMs.txt content.
 
 * @returns {unknown} Description of return value*/
async function getCachedChangelogLlmsTxt(): Promise<null | string> {
  'use cache';
  cacheLife({ expire: 2_592_000, revalidate: 21_600, stale: 86_400 }); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  const supabase = createSupabaseAnonClient();
  const service = new ContentService(supabase);
  return service.getChangelogLlmsTxt();
}

export async function GET(request: NextRequest) {
  const reqLogger = logger.child({
    method: 'GET',
    operation: 'ChangelogIndexAPI',
    route: '/api/content/changelog',
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
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_changelog_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
      status: 200,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Operation failed');
    reqLogger.error({ err: normalizeError(error) }, 'Changelog index API error');
    return createErrorResponse(normalized, {
      method: 'GET',
      operation: 'ChangelogIndexAPI',
      route: '/api/content/changelog',
    });
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      ...CORS,
    },
    status: 204,
  });
}
