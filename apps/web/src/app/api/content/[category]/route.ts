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
 * Determines whether a string is a valid `content_category` enum value.
 *
 * @param value - The string to validate as a content category
 * @returns `true` if `value` is one of the allowed `content_category` enum values, `false` otherwise.
 * @see CONTENT_CATEGORY_VALUES
 */
function isValidContentCategory(
  value: string
): value is DatabaseGenerated['public']['Enums']['content_category'] {
  return CONTENT_CATEGORY_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['content_category']
  );
}

/**
 * Serve a category-specific LLMs text export for the route /api/content/[category].
 *
 * Processes the incoming request's `format` query (defaults to "llms-category") and the route `category`,
 * validates inputs, retrieves the generated text for the category, and returns it as text/plain.
 *
 * @param request - The incoming NextRequest
 * @param params - An object containing a promise that resolves to route parameters; expects `{ category: string }`
 * @returns A NextResponse containing the plain-text LLMs export for the category with appropriate headers,
 *          or an error response (400 for invalid format/category or missing data, or an error response on failure)
 *
 * @see buildSecurityHeaders
 * @see buildCacheHeaders
 * @see badRequestResponse
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