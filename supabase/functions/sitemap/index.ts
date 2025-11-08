/**
 * Sitemap - Dynamic sitemap.xml from PostgreSQL
 */

import { getOnlyCorsHeaders } from '../_shared/utils/cors.ts';
import { errorResponse, methodNotAllowedResponse } from '../_shared/utils/response.ts';
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
    const { data: xmlString, error } = await supabaseAnon.rpc('generate_sitemap_xml', {
      p_base_url: SITE_URL,
    });

    if (error) {
      console.error('RPC error (sitemap):', error);
      return errorResponse(error, 'generate_sitemap_xml', getOnlyCorsHeaders);
    }

    if (!xmlString) {
      console.error('Empty sitemap returned from database');
      return new Response('Internal server error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          ...getOnlyCorsHeaders,
        },
      });
    }

    console.log('sitemap.xml generated:', {
      bytes: xmlString.length,
      urlCount: (xmlString.match(/<url>/g) || []).length,
    });

    return new Response(xmlString, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        'CDN-Cache-Control': 'max-age=86400',
        'X-Robots-Tag': 'index, follow',
        'X-Generated-By': 'Supabase Edge Function',
        'X-Content-Source': 'PostgreSQL mv_site_urls',
        ...getOnlyCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'sitemap', getOnlyCorsHeaders);
  }
});
