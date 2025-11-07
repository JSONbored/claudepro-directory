/**
 * Sitemap Edge Function - Database-First Architecture
 * Generates sitemap.xml dynamically from PostgreSQL via generate_sitemap_xml() RPC function.
 *
 * Performance:
 * - 3ms PostgreSQL XML generation
 * - 65KB response size (23% smaller than JSONB approach)
 * - Singleton Supabase client for optimal connection reuse
 *
 * Environment Variables:
 *   SUPABASE_URL             - Supabase project URL
 *   SUPABASE_ANON_KEY        - Anonymous key for RPC calls
 *   NEXT_PUBLIC_SITE_URL     - Base URL for sitemap (defaults to production)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { errorResponse, methodNotAllowedResponse } from '../_shared/utils/response.ts';

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
    // Single RPC call to PostgreSQL - returns complete XML string (~65KB)
    const { data: xmlString, error } = await supabase.rpc('generate_sitemap_xml', {
      p_base_url: SITE_URL,
    });

    if (error) {
      console.error('RPC error (sitemap):', error);
      return errorResponse(error, 'generate_sitemap_xml', getCorsHeaders);
    }

    if (!xmlString) {
      console.error('Empty sitemap returned from database');
      return new Response('Internal server error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          ...getCorsHeaders,
        },
      });
    }

    console.log('sitemap.xml generated:', {
      contentLength: xmlString.length,
      urlCount: (xmlString.match(/<url>/g) || []).length,
    });

    return new Response(xmlString, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Length': xmlString.length.toString(),
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        'X-Robots-Tag': 'index, follow',
        'X-Generated-By': 'Supabase Edge Function',
        'X-Content-Source': 'PostgreSQL mv_site_urls',
        ...getCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'sitemap', getCorsHeaders);
  }
});
