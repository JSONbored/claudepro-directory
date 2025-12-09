/**
 * Changelog Entry API Route
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
import { NextRequest, NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;

/**
 * Serve a changelog entry as an LLMs-compliant plain-text file for the given slug.
 *
 * Validates the `format` query parameter (must be `llms-entry`), retrieves the
 * prepared LLMs-formatted text for the requested changelog entry, converts any
 * literal `\n` sequences to real newlines, and returns the result with
 * appropriate security, CORS, and cache headers.
 *
 * @param request - The incoming NextRequest for this API route
 * @param params - An object with a Promise that resolves to route params; must include `slug`
 * @param params.params
 * @returns A NextResponse containing the plaintext LLMs-formatted changelog entry on success, or a 400/standardized error response on failure
 *
 * @see ContentService#getChangelogEntryLlmsTxt
 * @see createSupabaseAnonClient
 * @see buildSecurityHeaders
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const reqLogger = logger.child({
    operation: 'ChangelogEntryAPI',
    route: '/api/content/changelog/[slug]',
    method: 'GET',
  });

  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const format = url.searchParams.get('format')?.toLowerCase();

    // Default to 'llms-entry' format if not specified; validate if provided
    if (format && format !== 'llms-entry') {
      return badRequestResponse(`Invalid format '${format}' for changelog entry`, CORS);
    }

    reqLogger.info('Changelog entry request received', { slug, format });

    const supabase = createSupabaseAnonClient();
    const service = new ContentService(supabase);
    const data = await service.getChangelogEntryLlmsTxt({ p_slug: slug });

    if (!data) {
      reqLogger.warn('Changelog entry LLMs.txt not found', { slug });
      return NextResponse.json(
        { error: 'Changelog entry LLMs.txt not found' },
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...buildSecurityHeaders(),
            ...CORS,
          },
        }
      );
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

/**
 * Handle CORS preflight requests by returning a 204 No Content response with CORS headers.
 *
 * @returns A NextResponse with status 204 (No Content) and the route's CORS headers applied.
 * @see CORS
 * @see getOnlyCorsHeaders
 */
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS,
    },
  });
}
