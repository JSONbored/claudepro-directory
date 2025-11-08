/**
 * SEO API - Unified metadata + pre-generated structured data schemas
 */

import { getOnlyCorsHeaders } from '../_shared/utils/cors.ts';
import {
  badRequestResponse,
  errorResponse,
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
    const route = url.searchParams.get('route');
    const include = url.searchParams.get('include') || 'metadata';

    if (!route) {
      return badRequestResponse(
        'Missing required parameter: route. Example: ?route=/agents/some-slug&include=metadata,schemas',
        getOnlyCorsHeaders
      );
    }

    const { data, error } = await supabaseAnon.rpc('generate_metadata_complete', {
      p_route: route,
      p_include: include,
    });

    if (error) {
      console.error('RPC error (seo-api):', error);
      return errorResponse(error, 'generate_metadata_complete', getOnlyCorsHeaders);
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
            ...getOnlyCorsHeaders,
          },
        }
      );
    }

    const responseBody = JSON.stringify(data);
    console.log('SEO generated:', {
      route,
      include,
      pattern: data._debug?.pattern || data.metadata?._debug?.pattern,
      titleLength: data.title?.length || data.metadata?.title?.length || 0,
      schemaCount: data.schemas?.length || 0,
      bytes: responseBody.length,
    });

    return new Response(responseBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        'CDN-Cache-Control': 'max-age=86400',
        'X-Robots-Tag': 'index, follow',
        'X-Content-Type-Options': 'nosniff',
        'X-Generated-By': 'Supabase Edge Function',
        'X-Content-Source':
          'PostgreSQL generate_metadata_complete (metadata + pre-generated JSON-LD schemas)',
        ...getOnlyCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'seo-api', getOnlyCorsHeaders);
  }
});
