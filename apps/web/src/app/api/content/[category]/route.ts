/**
 * Category-Only Content API Route
 * Migrated from public-api edge function
 */

import 'server-only';

import { ContentService } from '@heyclaude/data-layer';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
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
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

/**
 * Checks whether a string is a valid content category value.
 *
 * @param value - The string to validate as a content category
 * @returns `true` if `value` is one of the allowed `content_category` enum values, `false` otherwise
 * @see CONTENT_CATEGORY_VALUES
 * @see DatabaseGenerated['public']['Enums']['content_category']
 */
function isValidContentCategory(
  value: string
): value is DatabaseGenerated['public']['Enums']['content_category'] {
  return CONTENT_CATEGORY_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['content_category']
  );
}

/**
 * Handle GET requests for category-only content at /api/content/[category].
 *
 * Validates the `format` query parameter (must be "llms-category") and the path
 * `category`, fetches the corresponding Category LLMs.txt content, normalizes
 * literal `\n` sequences into real newlines, and returns the content as
 * `text/plain; charset=utf-8` with security, CORS, and cache headers.
 *
 * On invalid `format` or `category`, or when the category content is missing,
 * responds with a 400 Bad Request including CORS headers. On internal errors,
 * returns a structured error response containing route and operation context.
 *
 * @param request - The incoming NextRequest
 * @param params - An object with a Promise resolving to `{ category: string }`
 * @returns A NextResponse:
 *   - 200 with the formatted Category LLMs.txt as `text/plain; charset=utf-8` when successful
 *   - 400 with CORS headers for invalid input or missing content
 *   - An error response for unexpected failures
 *
 * @see ContentService
 * @see isValidContentCategory
 * @see createErrorResponse
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'ContentCategoryAPI',
    route: '/api/content/[category]',
    method: 'GET',
  });

  try {
    const { category } = await params;
    const url = new URL(request.url);
    const format = (url.searchParams.get('format') ?? 'llms-category').toLowerCase();

    if (format !== 'llms-category') {
      return badRequestResponse(`Invalid format '${format}' for category-only route`, CORS);
    }

    if (!isValidContentCategory(category)) {
      return badRequestResponse(`Invalid category '${category}'`, CORS);
    }

    reqLogger.info('Category LLMs.txt request received', { category, format });

    const supabase = createSupabaseAnonClient();
    const service = new ContentService(supabase);
    const data = await service.getCategoryLlmsTxt({ p_category: category });

    if (!data) {
      reqLogger.warn('Category LLMs.txt not found', { category });
      return badRequestResponse('Category LLMs.txt not found or invalid', CORS);
    }

    const formatted = data.replaceAll(String.raw`\n`, '\n');

    reqLogger.info('Category LLMs.txt generated', {
      category,
      bytes: formatted.length,
    });

    return new NextResponse(formatted, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_category_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
    });
  } catch (error) {
    reqLogger.error('Category API error', normalizeError(error));
    return createErrorResponse(error, {
      route: '/api/content/[category]',
      operation: 'ContentCategoryAPI',
      method: 'GET',
    });
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getOnlyCorsHeaders,
    },
  });
}
