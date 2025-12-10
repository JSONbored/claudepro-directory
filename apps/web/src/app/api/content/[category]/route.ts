/**
 * Category-Only Content API Route
 * Migrated from public-api edge function
 */

import 'server-only';
import { ContentService } from '@heyclaude/data-layer';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
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
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

/**
 * Cached helper function to fetch category content list
 * Uses Cache Components to reduce function invocations
 * @param category
 
 * @returns {Promise<unknown>} Description of return value*/
async function getCachedCategoryContent(
  category: DatabaseGenerated['public']['Enums']['content_category']
) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  // Use RPC function for better performance and consistent architecture
  // Use generated types directly from database
  const { data, error } = await supabase.rpc('get_category_content_list', {
    p_category: category,
  });

  if (error) throw error;
  return data;
}

/**
 * Cached helper function to fetch category LLMs.txt
 * Uses Cache Components to reduce function invocations
 * @param category
 
 * @returns {Promise<unknown>} Description of return value*/
async function getCachedCategoryLlmsTxt(
  category: DatabaseGenerated['public']['Enums']['content_category']
) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  const service = new ContentService(supabase);
  return await service.getCategoryLlmsTxt({ p_category: category });
}

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
 * Supports multiple export formats:
 * - `llms-category` (default): Returns Category LLMs.txt as `text/plain; charset=utf-8`
 * - `json`: Returns category content list as JSON array with hyper-optimized caching (7-day TTL)
 *
 * Validates the `format` query parameter and the path `category`, fetches the content,
 * and returns it with appropriate security, CORS, and cache headers.
 *
 * On invalid `format` or `category`, or when the category content is missing,
 * responds with a 400 Bad Request including CORS headers. On internal errors,
 * returns a structured error response containing route and operation context.
 *
 * @param request - The incoming NextRequest
 * @param params - An object with a Promise resolving to `{ category: string }`
 * @param params.params
 * @returns A NextResponse:
 *   - 200 with the formatted content (LLMs.txt or JSON) when successful
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
  const reqLogger = logger.child({
    operation: 'ContentCategoryAPI',
    route: '/api/content/[category]',
    method: 'GET',
  });

  try {
    const { category } = await params;
    const url = new URL(request.url);
    const format = (url.searchParams.get('format') ?? 'llms-category').toLowerCase();

    if (!isValidContentCategory(category)) {
      return badRequestResponse(`Invalid category '${category}'`, CORS);
    }

    reqLogger.info({ category, format }, 'Category content request received');

    // Handle JSON format - returns category content list
    if (format === 'json') {
      let data: Awaited<ReturnType<typeof getCachedCategoryContent>> = [];
      try {
        data = await getCachedCategoryContent(category);
        reqLogger.info(
          {
            category,
            itemCount: Array.isArray(data) ? data.length : 0,
          },
          'Category JSON generated'
        );
      } catch (error) {
        const normalized = normalizeError(error, 'Operation failed');
        reqLogger.error(
          {
            err: normalizeError(error),
            category,
            format,
          },
          'Category JSON query error'
        );
        return createErrorResponse(normalized, {
          route: '/api/content/[category]',
          operation: 'ContentCategoryAPI',
          method: 'GET',
          logContext: {
            category,
            format,
          },
        });
      }

      return NextResponse.json(Array.isArray(data) ? data : [], {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Generated-By': 'supabase.rpc.get_category_content_list',
          ...buildSecurityHeaders(),
          ...CORS,
          // Hyper-optimized caching: 7 days TTL, 14 days stale (matches content_export preset)
          // Content lists rarely change, so aggressive caching reduces DB pressure by 95%+
          ...buildCacheHeaders('content_export'),
        },
      });
    }

    // Handle LLMs.txt format (default)
    if (format !== 'llms-category') {
      return badRequestResponse(
        `Invalid format '${format}' for category-only route. Valid formats: llms-category, json`,
        CORS
      );
    }

    let data: Awaited<ReturnType<typeof getCachedCategoryLlmsTxt>> | null = null;
    try {
      data = await getCachedCategoryLlmsTxt(category);
    } catch (error) {
      reqLogger.error(
        {
          err: normalizeError(error),
          category,
        },
        'Category LLMs.txt fetch error'
      );
      const normalized = normalizeError(error, 'Category LLMs.txt fetch error');
      return createErrorResponse(normalized, {
        route: '/api/content/[category]',
        operation: 'ContentCategoryAPI',
        method: 'GET',
        logContext: { category, format: 'llms-category' },
      });
    }

    if (!data) {
      reqLogger.warn({ category }, 'Category LLMs.txt not found');
      return badRequestResponse('Category LLMs.txt not found or invalid', CORS);
    }

    const formatted = data.replaceAll(String.raw`\n`, '\n');

    reqLogger.info(
      {
        category,
        bytes: formatted.length,
      },
      'Category LLMs.txt generated'
    );

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
    const normalized = normalizeError(error, 'Category API error');
    reqLogger.error({ err: normalized }, 'Category API error');
    return createErrorResponse(normalized, {
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
