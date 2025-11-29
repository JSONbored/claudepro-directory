/**
 * Company Profile API Route
 * Migrated from public-api edge function
 */

import 'server-only';

import  { type Database as DatabaseGenerated } from '@heyclaude/database-types';
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
