/**
 * Changelog Entry API Route
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

/**
 * Serve a changelog entry as an LLM-friendly plain-text export.
 *
 * Retrieves the changelog entry identified by `slug`, formats it for LLM consumption
 * (converting literal `\n` sequences to actual newlines), and returns it as
 * `text/plain; charset=utf-8`. If the `format` query parameter is present and not
 * `llms-entry`, or if the entry cannot be found/validated, the handler responds with
 * a 400 Bad Request. On internal errors, a structured error response is returned.
 *
 * @param request - Incoming Next.js request object
 * @param params - An object with a `params` promise that resolves to `{ slug: string }`
 *                 identifying the changelog entry to export
 * @returns A NextResponse whose body is the LLM-formatted changelog text and whose
 *          headers include content type, security, CORS, and cache directives.
 *
 * @see ContentService#getChangelogEntryLlmsTxt
 * @see createSupabaseAnonClient
 * @see buildSecurityHeaders
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'ChangelogEntryAPI',
    route: '/api/content/changelog/[slug]',
    method: 'GET',
  });

  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const format = (url.searchParams.get('format') ?? 'llms-entry').toLowerCase();

    if (format !== 'llms-entry') {
      return badRequestResponse(`Invalid format '${format}' for changelog entry`, CORS);
    }

    reqLogger.info('Changelog entry request received', { slug, format });

    const supabase = createSupabaseAnonClient();
    const service = new ContentService(supabase);
    const data = await service.getChangelogEntryLlmsTxt({ p_slug: slug });

    if (!data) {
      reqLogger.warn('Changelog entry LLMs.txt not found', { slug });
      return badRequestResponse('Changelog entry LLMs.txt not found or invalid', CORS);
    }

    const formatted = data.replaceAll(String.raw`\n`, '\n');

    reqLogger.info('Changelog entry LLMs.txt generated', {
      slug,
      bytes: formatted.length,
    });

    return new NextResponse(formatted, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_changelog_entry_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
    });
  } catch (error) {
    reqLogger.error('Changelog entry API error', normalizeError(error));
    return createErrorResponse(error, {
      route: '/api/content/changelog/[slug]',
      operation: 'ChangelogEntryAPI',
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