/**
 * Changelog Index API Route
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
import {
  createSupabaseAnonClient,
  badRequestResponse,
  getOnlyCorsHeaders,
  buildCacheHeaders,
} from '@heyclaude/web-runtime/server';
import { NextRequest, NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
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

    reqLogger.info('Changelog index request received', { format });

    const supabase = createSupabaseAnonClient();
    const service = new ContentService(supabase);
    const data = await service.getChangelogLlmsTxt();

    if (!data) {
      reqLogger.warn('Changelog LLMs.txt not found');
      return badRequestResponse('Changelog LLMs.txt not found or invalid', CORS);
    }

    const formatted = data.replaceAll(String.raw`\n`, '\n');

    reqLogger.info('Changelog LLMs.txt generated', {
      bytes: formatted.length,
    });

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
    reqLogger.error('Changelog index API error', normalizeError(error));
    return createErrorResponse(error, {
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
