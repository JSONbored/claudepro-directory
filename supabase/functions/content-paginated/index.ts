/**
 * Content paginated - Homepage "All" tab infinite scroll
 */

import { getWithAuthCorsHeaders } from '../_shared/utils/cors.ts';
import {
  errorResponse,
  jsonResponse,
  methodNotAllowedResponse,
} from '../_shared/utils/response.ts';
import { supabaseAnon } from '../_shared/utils/supabase.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getWithAuthCorsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET', getWithAuthCorsHeaders);
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const offset = Number.parseInt(url.searchParams.get('offset') || '0', 10);
    const limit = Number.parseInt(url.searchParams.get('limit') || '30', 10);
    const categoryParam = url.searchParams.get('category') || 'all';

    // Convert 'all' to NULL for RPC function (means "no category filter")
    const category = categoryParam === 'all' ? null : categoryParam;

    // Validation - check for NaN first
    if (Number.isNaN(offset) || offset < 0) {
      return jsonResponse(
        { error: 'Invalid parameters', message: 'offset must be a non-negative integer' },
        400,
        getWithAuthCorsHeaders
      );
    }

    if (Number.isNaN(limit) || limit < 1 || limit > 100) {
      return jsonResponse(
        { error: 'Invalid parameters', message: 'limit must be between 1 and 100' },
        400,
        getWithAuthCorsHeaders
      );
    }
    const { data, error } = await supabaseAnon.rpc('get_content_paginated_slim', {
      p_category: category,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('RPC error:', error);
      return errorResponse(error, 'get_content_paginated_slim', getWithAuthCorsHeaders);
    }

    const items = data?.items || [];

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
        'CDN-Cache-Control': 'max-age=86400',
        ...getWithAuthCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error, 'content-paginated', getWithAuthCorsHeaders);
  }
});
