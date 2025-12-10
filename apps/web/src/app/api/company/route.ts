/**
 * Company Profile API Route
 * Migrated from public-api edge function
 */

import 'server-only';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { logger, normalizeError, createErrorResponse } from '@heyclaude/web-runtime/logging/server';
import {
  badRequestResponse,
  jsonResponse,
  getOnlyCorsHeaders,
  buildCacheHeaders,
  createSupabaseAnonClient,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;

/**
 * Cached helper function to fetch company profile by slug.
 * The slug parameter becomes part of the cache key, so different companies have different cache entries.
 * @param slug
 
 * @returns {unknown} Description of return value*/
async function getCachedCompanyProfile(slug: string): Promise<{
  data: DatabaseGenerated['public']['Functions']['get_company_profile']['Returns'];
}> {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  const supabase = createSupabaseAnonClient();
  const rpcArgs = {
    p_slug: slug,
  } satisfies DatabaseGenerated['public']['Functions']['get_company_profile']['Args'];

  const { data, error } = await supabase.rpc('get_company_profile', rpcArgs);

  if (error) {
    // Throw error immediately to prevent caching error responses
    throw new Error(error.message || 'Company profile RPC error', {
      cause: { code: error.code, message: error.message },
    });
  }

  return { data };
}

/**
 * Handle GET /api/company requests and return the company profile identified by the `slug` query parameter.
 *
 * Reads the `slug` query parameter, calls the `get_company_profile` Supabase RPC, and responds with the profile
 * JSON including cache and metadata headers on success. Returns a 400 Bad Request when `slug` is missing, mirrors
 * RPC errors when the RPC returns an error, and returns a generic error response for unexpected exceptions.
 *
 * @param request - The incoming Next.js request containing query parameters (expects `slug`)
 * @returns The HTTP response: `200` with the company profile JSON and cache/metadata headers on success; `400` when
 * the `slug` parameter is missing; an error response mirroring RPC or internal errors otherwise.
 *
 * @see buildCacheHeaders
 * @see createErrorResponse
 * @see badRequestResponse
 */
export async function GET(request: NextRequest) {
  const reqLogger = logger.child({
    operation: 'CompanyAPI',
    route: '/api/company',
    method: 'GET',
  });

  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug')?.trim();

    if (!slug) {
      reqLogger.warn({}, 'Company slug missing');
      return badRequestResponse('Company slug is required', CORS);
    }

    reqLogger.info({ slug }, 'Company request received');

    let profile;
    try {
      const result = await getCachedCompanyProfile(slug);
      profile = result.data;
    } catch (error) {
      const normalizedError = normalizeError(error, 'Company profile RPC error');
      reqLogger.error(
        {
          err: normalizedError,
          rpcName: 'get_company_profile',
          slug,
        },
        'Company profile RPC error'
      );
      return createErrorResponse(normalizedError, {
        route: '/api/company',
        operation: 'CompanyAPI',
        method: 'GET',
        logContext: {
          rpcName: 'get_company_profile',
          slug,
        },
      });
    }

    reqLogger.info({ slug }, 'Company profile retrieved');

    return jsonResponse(profile, 200, CORS, {
      'X-Generated-By': 'supabase.rpc.get_company_profile',
      ...buildCacheHeaders('company_profile'),
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Operation failed');
    reqLogger.error({ err: normalized }, 'Company API error');
    return createErrorResponse(normalized, {
      route: '/api/company',
      operation: 'CompanyAPI',
      method: 'GET',
    });
  }
}

/**
 * Handle CORS preflight (OPTIONS) requests for the company API route.
 *
 * Responds with 204 No Content and includes only the configured CORS headers.
 *
 * @returns A NextResponse with HTTP status 204 and CORS headers applied.
 * @see {@link CORS}
 */
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS,
    },
  });
}
