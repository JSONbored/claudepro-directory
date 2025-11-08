/**
 * JSON API Edge Function - Database-First Architecture
 * Returns complete JSON response with JSON-LD structured data via PostgreSQL.
 *
 * Supported Routes:
 * - /{category}/{slug} → JSON API response
 * - /{category}/{slug}.json → JSON API response (optional .json extension)
 *
 * Performance:
 * - <5ms PostgreSQL JSON generation with TEXT return (no JSONB parsing)
 * - ~5-10KB response size per content item
 * - Singleton Supabase client for optimal connection reuse
 * - Aggressive caching (3600s max-age, 86400s stale-while-revalidate)
 *
 * Replaces: src/app/api/json/[category]/[slug]/route.ts (109 lines)
 *
 * Environment Variables:
 *   SUPABASE_URL          - Supabase project URL
 *   SUPABASE_ANON_KEY     - Anonymous key for RPC calls
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  errorResponse,
  methodNotAllowedResponse,
  badRequestResponse,
} from '../_shared/utils/response.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SITE_URL = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_ANON_KEY');
}

// Singleton Supabase client - reused across all requests for optimal performance
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const getCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Valid content categories matching database category_configs
const VALID_CATEGORIES = [
  'agents',
  'commands',
  'hooks',
  'mcp',
  'rules',
  'skills',
  'statuslines',
  'collections',
  'guides',
];

Deno.serve(async (req) => {
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
    // Parse path: handles both direct (/category/slug) and Supabase Functions routing (/functions/v1/json-api/category/slug)
    const url = new URL(req.url);
    // Match pattern: optional /functions/v1/json-api/ prefix, then /category/slug or /category/slug.json
    const pathMatch = url.pathname.match(/(?:\/functions\/v1\/json-api)?\/([^/]+)\/([^/]+?)(?:\.json)?$/);

    if (!pathMatch) {
      return badRequestResponse('Invalid path format. Expected: /{category}/{slug}', getCorsHeaders);
    }

    const [, category, slug] = pathMatch;

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return badRequestResponse(
        `Invalid category '${category}'. Valid categories: ${VALID_CATEGORIES.join(', ')}`,
        getCorsHeaders
      );
    }

    // Call enhanced RPC function (returns pre-stringified TEXT for protocol optimization)
    const { data: jsonContent, error } = await supabase.rpc('get_api_content_full', {
      p_category: category,
      p_slug: slug,
      p_base_url: SITE_URL,
    });

    if (error) {
      console.error('RPC error (json-api):', error);
      return errorResponse(error, 'get_api_content_full', getCorsHeaders);
    }

    if (!jsonContent) {
      return new Response(JSON.stringify({ error: 'Content not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders,
        },
      });
    }

    console.log('JSON API response generated:', {
      category,
      slug,
      bytes: jsonContent.length,
    });

    // jsonContent is already pre-stringified TEXT from PostgreSQL (protocol optimization)
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
        ...getCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'json-api', getCorsHeaders);
  }
});
