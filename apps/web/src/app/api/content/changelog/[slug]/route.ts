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
 * Serve a changelog entry as an LLMs-compliant plain-text file for the given slug.
 *
 * Validates the `format` query parameter (must be `llms-entry`), retrieves the
 * prepared LLMs text for the requested changelog entry via the content service,
 * normalizes literal `\n` sequences into real newlines, and returns the result
 * as a `text/plain; charset=utf-8` response with security, CORS, and cache headers.
 *
 * Edge cases:
 * - Returns a 400 response when `format` is not `llms-entry` or when the entry
 *   is not found or invalid.
 * - On unexpected errors, returns a standardized error response including route,
 *   operation, and method context.
 *
 * @param request - The incoming Next.js request object.
 * @param params - An object containing a Promise that resolves to route params; must include `slug`.
 * @returns A NextResponse containing the plaintext LLMs-formatted changelog entry on success, or an error response (400 or standardized error) on failure.
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
