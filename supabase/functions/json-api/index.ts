/**
 * JSON API - Complete JSON response with JSON-LD structured data
 */

import { VALID_CONTENT_CATEGORIES } from '../_shared/constants/categories.ts';
import { getOnlyCorsHeaders } from '../_shared/utils/cors.ts';
import {
  badRequestResponse,
  errorResponse,
  methodNotAllowedResponse,
} from '../_shared/utils/response.ts';
import { SITE_URL, supabaseAnon } from '../_shared/utils/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getOnlyCorsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET', getOnlyCorsHeaders);
  }

  try {
    const url = new URL(req.url);
    const pathMatch = url.pathname.match(
      /(?:\/functions\/v1\/json-api)?\/([^/]+)\/([^/]+?)(?:\.json)?$/
    );

    if (!pathMatch) {
      return badRequestResponse(
        'Invalid path format. Expected: /{category}/{slug}',
        getOnlyCorsHeaders
      );
    }

    const [, category, slug] = pathMatch;

    if (!VALID_CONTENT_CATEGORIES.includes(category)) {
      return badRequestResponse(
        `Invalid category '${category}'. Valid categories: ${VALID_CONTENT_CATEGORIES.join(', ')}`,
        getOnlyCorsHeaders
      );
    }

    const { data: jsonContent, error } = await supabaseAnon.rpc('get_api_content_full', {
      p_category: category,
      p_slug: slug,
      p_base_url: SITE_URL,
    });

    if (error) {
      console.error('RPC error (json-api):', error);
      return errorResponse(error, 'get_api_content_full', getOnlyCorsHeaders);
    }

    if (!jsonContent) {
      return new Response(JSON.stringify({ error: 'Content not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...getOnlyCorsHeaders,
        },
      });
    }

    console.log('JSON API response generated:', {
      category,
      slug,
      bytes: jsonContent.length,
    });

    return new Response(jsonContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'max-age=3600',
        'X-Robots-Tag': 'index, follow',
        'X-Content-Type-Options': 'nosniff',
        'X-Generated-By': 'Supabase Edge Function',
        'X-Content-Source': 'PostgreSQL get_api_content_full',
        ...getOnlyCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'json-api', getOnlyCorsHeaders);
  }
});
