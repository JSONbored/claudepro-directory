/**
 * Company Profile API Route
 * Migrated from public-api edge function
 */

import 'server-only';

import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  generateRequestId,
  logger,
  normalizeError,
  createErrorResponse,
} from '@heyclaude/web-runtime/logging/server';
import {
  badRequestResponse,
  jsonResponse,
  getOnlyCorsHeaders,
  buildCacheHeaders,
  createSupabaseAnonClient,
} from '@heyclaude/web-runtime/server';
import { NextRequest, NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;

/**
 * Handle GET /api/company requests and return a company profile identified by the `slug` query parameter.
 *
 * Reads the `slug` query parameter from the request, invokes the `get_company_profile` Supabase RPC, and
 * returns the profile JSON with cache and metadata headers when successful. Returns a 400 response when
 * `slug` is missing, mirrors RPC errors when the RPC returns an error, and returns a generic error response
 * for unexpected exceptions.
 *
 * @param {NextRequest} request - The incoming Next.js request containing query parameters.
 * @returns {Response} 200 with the company profile JSON and cache/metadata headers on success; 400 when the
 * `slug` parameter is missing; an error response mirroring RPC or internal errors otherwise.
 *
 * @see buildCacheHeaders
 * @see createErrorResponse
 * @see badRequestResponse
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'CompanyAPI',
    route: '/api/company',
    method: 'GET',
  });

  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug')?.trim();

    if (!slug) {
      reqLogger.warn('Company slug missing');
      return badRequestResponse('Company slug is required', CORS);
    }

    reqLogger.info('Company request received', { slug });

    const supabase = createSupabaseAnonClient();
    const rpcArgs = {
      p_slug: slug,
    } satisfies DatabaseGenerated['public']['Functions']['get_company_profile']['Args'];

    const { data: profile, error } = await supabase.rpc('get_company_profile', rpcArgs);

    if (error) {
      reqLogger.error('Company profile RPC error', normalizeError(error), {
        rpcName: 'get_company_profile',
        slug,
      });
      return createErrorResponse(error, {
        route: '/api/company',
        operation: 'CompanyAPI',
        method: 'GET',
        logContext: {
          rpcName: 'get_company_profile',
          slug,
        },
      });
    }

    reqLogger.info('Company profile retrieved', { slug });

    return jsonResponse(profile, 200, CORS, {
      'X-Generated-By': 'supabase.rpc.get_company_profile',
      ...buildCacheHeaders('company_profile'),
    });
  } catch (error) {
    reqLogger.error('Company API error', normalizeError(error));
    return createErrorResponse(error, {
      route: '/api/company',
      operation: 'CompanyAPI',
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