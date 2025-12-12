/**
 * Changelog Entry API Route
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
 * @param context - An object with a Promise that resolves to route params; must include `slug`
 * @param context.params - Promise resolving to route parameters containing `slug: string`
 * @returns A NextResponse containing the plaintext LLMs-formatted changelog entry on success, or a 400/standardized error response on failure
 *
 * @see ContentService#getChangelogEntryLlmsTxt
 * @see createSupabaseAnonClient
 * @see buildSecurityHeaders
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const reqLogger = logger.child({
    method: 'GET',
    operation: 'ChangelogEntryAPI',
    route: '/api/content/changelog/[slug]',
  });

  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const format = url.searchParams.get('format')?.toLowerCase();

    // Default to 'llms-entry' format if not specified; validate if provided
    if (format && format !== 'llms-entry') {
      return badRequestResponse(`Invalid format '${format}' for changelog entry`, CORS);
    }

    reqLogger.info({ format, slug }, 'Changelog entry request received');

    const supabase = createSupabaseAnonClient();
    const service = new ContentService(supabase);
    const data = await service.getChangelogEntryLlmsTxt({ p_slug: slug });

    if (!data) {
      reqLogger.warn({ slug }, 'Changelog entry LLMs.txt not found');
      return NextResponse.json(
        { error: 'Changelog entry LLMs.txt not found' },
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...buildSecurityHeaders(),
            ...CORS,
          },
          status: 404,
        }
      );
    }

    const formatted = data.replaceAll(String.raw`\n`, '\n');

    reqLogger.info(
      {
        bytes: formatted.length,
        slug,
      },
      'Changelog entry LLMs.txt generated'
    );

    return new NextResponse(formatted, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_changelog_entry_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
      status: 200,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Operation failed');
    reqLogger.error({ err: normalizeError(error) }, 'Changelog entry API error');
    return createErrorResponse(normalized, {
      method: 'GET',
      operation: 'ChangelogEntryAPI',
      route: '/api/content/changelog/[slug]',
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
    headers: {
      ...CORS,
    },
    status: 204,
  });
}
