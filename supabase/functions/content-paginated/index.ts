/**
 * Content Paginated Edge Function - Homepage Infinite Scroll Optimization
 *
 * Bandwidth optimization: Lazy-loads content for "All" tab instead of preloading 262 items
 * Reduces homepage payload from 937KB to 42KB (96% reduction)
 *
 * Usage: Called by HomePageClient for infinite scroll pagination
 * Free tier: 500K invocations/month (estimated usage: 15K/month = 3%)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  errorResponse,
  jsonResponse,
  methodNotAllowedResponse,
  publicCorsHeaders,
} from '../_shared/utils/response.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight - public endpoint (read-only content)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: publicCorsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET', publicCorsHeaders);
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const offset = Number.parseInt(url.searchParams.get('offset') || '0', 10);
    const limit = Number.parseInt(url.searchParams.get('limit') || '30', 10);
    const category = url.searchParams.get('category') || 'all';

    // Validation
    if (offset < 0 || limit < 1 || limit > 100) {
      return jsonResponse(
        { error: 'Invalid parameters', message: 'offset >= 0, 1 <= limit <= 100' },
        400,
        publicCorsHeaders
      );
    }

    // Call RPC function (using anon key for public read-only access)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.rpc('get_content_paginated', {
      p_offset: offset,
      p_limit: limit,
      p_category: category,
    });

    if (error) {
      console.error('RPC error:', error);
      return errorResponse(error, 'get_content_paginated', publicCorsHeaders);
    }

    // Return with caching headers (15 minutes = 900 seconds)
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        ...publicCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error, 'content-paginated', publicCorsHeaders);
  }
});
