/**
 * Content Paginated Edge Function - Homepage "All" tab infinite scroll
 * Uses mv_content_list_slim for 87% bandwidth reduction (15KB → 2KB per item)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  errorResponse,
  jsonResponse,
  methodNotAllowedResponse,
} from '../_shared/utils/response.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_ANON_KEY');
}

// Singleton Supabase client - reused across all requests for optimal performance
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// GET-specific CORS headers for read-only public endpoint with Authorization support
const getCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight - public endpoint (read-only content)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET', getCorsHeaders);
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
        getCorsHeaders
      );
    }

    if (Number.isNaN(limit) || limit < 1 || limit > 100) {
      return jsonResponse(
        { error: 'Invalid parameters', message: 'limit must be between 1 and 100' },
        400,
        getCorsHeaders
      );
    }
    const { data, error } = await supabase.rpc('get_content_paginated_slim', {
      p_category: category,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('RPC error:', error);
      return errorResponse(error, 'get_content_paginated_slim', getCorsHeaders);
    }

    // Extract items array from JSONB response
    const items = data?.items || [];

    // Return with caching headers (6 hours = 21600 seconds, matches MV refresh)
    return new Response(JSON.stringify(items), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=10800',
        ...getCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error, 'content-paginated', getCorsHeaders);
  }
});
