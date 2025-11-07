/**
 * SEO API - Unified metadata + pre-generated structured data schemas
 * Single RPC call to generate_metadata_complete(p_route, p_include)
 * Query params: route (required), include ('metadata' or 'metadata,schemas')
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { Database } from '../_shared/database.types.ts';
import {
  publicCorsHeaders,
  methodNotAllowedResponse,
  badRequestResponse,
  errorResponse,
} from '../_shared/utils/response.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_ANON_KEY');
}

// Singleton Supabase client - reused across all requests for optimal performance
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

const getCorsHeaders = {
  ...publicCorsHeaders,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders });
  }

  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET', getCorsHeaders);
  }

  try {
    const url = new URL(req.url);
    const route = url.searchParams.get('route');
    const include = url.searchParams.get('include') || 'metadata';

    // Validate route parameter
    if (!route) {
      return badRequestResponse(
        'Missing required parameter: route. Example: ?route=/agents/some-slug&include=metadata,schemas',
        getCorsHeaders
      );
    }

    // Call consolidated RPC function with include parameter
    // Type-safe: Database['public']['Functions']['generate_metadata_complete']
    const { data, error } = await supabase.rpc('generate_metadata_complete', {
      p_route: route,
      p_include: include,
    });

    if (error) {
      console.error('RPC error (seo-api):', error);
      return errorResponse(error, 'generate_metadata_complete', getCorsHeaders);
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          error: 'SEO generation failed',
          message: 'RPC returned null',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders,
          },
        }
      );
    }

    console.log('SEO generated:', {
      route,
      include,
      pattern: data._debug?.pattern || data.metadata?._debug?.pattern,
      titleLength: data.title?.length || data.metadata?.title?.length || 0,
      schemaCount: data.schemas?.length || 0,
    });

    // Return complete SEO data with aggressive caching
    const responseBody = JSON.stringify(data);
    return new Response(responseBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': responseBody.length.toString(),
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800', // 24hr cache, 7 day stale
        'CDN-Cache-Control': 'max-age=86400', // Cloudflare 24hr cache
        'X-Robots-Tag': 'index, follow',
        'X-Content-Type-Options': 'nosniff',
        'X-Generated-By': 'Supabase Edge Function',
        'X-Content-Source': 'PostgreSQL generate_metadata_complete (metadata + pre-generated JSON-LD schemas)',
        ...getCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'seo-api', getCorsHeaders);
  }
});
