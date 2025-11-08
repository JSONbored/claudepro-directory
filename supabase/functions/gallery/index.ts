/**
 * Gallery - Infinite scroll pagination for trending content
 */

import { getOnlyCorsHeaders } from '../_shared/utils/cors.ts';
import {
  errorResponse,
  jsonResponse,
  methodNotAllowedResponse,
} from '../_shared/utils/response.ts';
import { supabaseAnon } from '../_shared/utils/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getOnlyCorsHeaders });
  }

  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET', getOnlyCorsHeaders);
  }

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const page = Number.parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(url.searchParams.get('limit') || '20', 10);

    if (Number.isNaN(page) || page < 1) {
      return jsonResponse(
        { error: 'Invalid page parameter', message: 'Page must be a positive integer' },
        400,
        getOnlyCorsHeaders
      );
    }

    if (Number.isNaN(limit) || limit < 1 || limit > 100) {
      return jsonResponse(
        { error: 'Invalid limit parameter', message: 'Limit must be between 1 and 100' },
        400,
        getOnlyCorsHeaders
      );
    }

    const offset = (page - 1) * limit;

    const { data, error } = await supabaseAnon.rpc('get_gallery_trending', {
      ...(category && { p_category: category }),
      p_limit: limit,
      p_offset: offset,
      p_days_back: 90,
    });

    if (error) {
      console.error('Gallery RPC error:', error);
      return errorResponse(error, 'get_gallery_trending', getOnlyCorsHeaders);
    }

    return new Response(
      JSON.stringify({
        items: data || [],
        page,
        limit,
        hasMore: (data?.length || 0) >= limit,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'CDN-Cache-Control': 'max-age=300',
          ...getOnlyCorsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Gallery edge function error:', error);
    return errorResponse(error as Error, 'gallery', getOnlyCorsHeaders);
  }
});
