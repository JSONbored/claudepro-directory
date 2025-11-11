/**
 * Unified Sitemap + IndexNow Edge Function
 * Handles sitemap XML generation and IndexNow API submissions
 */

import type { Database } from '../_shared/database.types.ts';
import { getOnlyCorsHeaders } from '../_shared/utils/cors.ts';
import {
  errorResponse,
  jsonResponse,
  methodNotAllowedResponse,
  unauthorizedResponse,
} from '../_shared/utils/response.ts';
import { SITE_URL, supabaseAnon } from '../_shared/utils/supabase.ts';

// IndexNow configuration
const INDEXNOW_API_KEY = Deno.env.get('INDEXNOW_API_KEY');
const INDEXNOW_API_URL = 'https://api.indexnow.org/IndexNow';
const INDEXNOW_TRIGGER_KEY = Deno.env.get('INDEXNOW_TRIGGER_KEY');

type SiteUrl = Database['public']['Functions']['get_site_urls']['Returns'][number];

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const format = url.searchParams.get('format') || 'xml';

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getOnlyCorsHeaders,
    });
  }

  // GET handler - Sitemap XML or JSON
  if (req.method === 'GET') {
    try {
      if (format === 'json') {
        return await handleJsonFormat();
      }
      return await handleXmlFormat();
    } catch (error) {
      console.error('Edge function error (GET):', error);
      return errorResponse(error as Error, 'sitemap', getOnlyCorsHeaders);
    }
  }

  // POST handler - IndexNow submission
  if (req.method === 'POST') {
    try {
      return await handleIndexNowSubmission(req);
    } catch (error) {
      console.error('Edge function error (POST):', error);
      return errorResponse(error as Error, 'sitemap-indexnow', getOnlyCorsHeaders);
    }
  }

  return methodNotAllowedResponse('GET, POST', getOnlyCorsHeaders);
});

/**
 * Handle XML sitemap generation (existing functionality)
 */
async function handleXmlFormat(): Promise<Response> {
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
}

/**
 * Handle JSON format for structured URL data
 */
async function handleJsonFormat(): Promise<Response> {
  const { data: urls, error } = await supabaseAnon.rpc('get_site_urls');

  if (error) {
    console.error('RPC error (get_site_urls):', error);
    return errorResponse(error, 'get_site_urls', getOnlyCorsHeaders);
  }

  if (!urls || urls.length === 0) {
    console.error('No URLs returned from database');
    return new Response('Internal server error', {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getOnlyCorsHeaders,
      },
    });
  }

  console.log('sitemap.json generated:', {
    urlCount: urls.length,
  });

  return jsonResponse(
    {
      urls: urls.map((u) => ({
        path: u.path,
        loc: `${SITE_URL}${u.path}`,
        lastmod: u.lastmod,
        changefreq: u.changefreq,
        priority: u.priority,
      })),
      meta: {
        total: urls.length,
        generated: new Date().toISOString(),
      },
    },
    200,
    {
      ...getOnlyCorsHeaders,
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      'CDN-Cache-Control': 'max-age=86400',
      'X-Content-Source': 'PostgreSQL mv_site_urls',
    }
  );
}

/**
 * Handle IndexNow API submission
 */
async function handleIndexNowSubmission(req: Request): Promise<Response> {
  // Authentication check
  const authKey = req.headers.get('X-IndexNow-Trigger-Key');

  if (!INDEXNOW_TRIGGER_KEY) {
    console.error('INDEXNOW_TRIGGER_KEY not configured');
    return jsonResponse(
      {
        error: 'Service Unavailable',
        message: 'IndexNow trigger key not configured',
      },
      503,
      getOnlyCorsHeaders
    );
  }

  if (authKey !== INDEXNOW_TRIGGER_KEY) {
    console.error('Invalid IndexNow trigger key');
    return unauthorizedResponse('Invalid trigger key', getOnlyCorsHeaders);
  }

  // Validate required environment variables
  if (!INDEXNOW_API_KEY) {
    console.error('INDEXNOW_API_KEY not configured');
    return jsonResponse(
      {
        error: 'Service Unavailable',
        message: 'IndexNow API key not configured',
      },
      503,
      getOnlyCorsHeaders
    );
  }

  // Get URLs from database
  const { data: urls, error } = await supabaseAnon.rpc('get_site_urls');

  if (error) {
    console.error('RPC error (get_site_urls):', error);
    return errorResponse(error, 'get_site_urls', getOnlyCorsHeaders);
  }

  if (!urls || urls.length === 0) {
    console.error('No URLs to submit to IndexNow');
    return jsonResponse(
      {
        error: 'No URLs',
        message: 'No URLs found in sitemap',
      },
      500,
      getOnlyCorsHeaders
    );
  }

  // Transform to full URLs
  const fullUrls = urls.map((u: SiteUrl) => `${SITE_URL}${u.path}`);

  // Batch URLs (IndexNow max: 10,000 per request)
  const MAX_BATCH_SIZE = 10000;
  const batches: string[][] = [];

  for (let i = 0; i < fullUrls.length; i += MAX_BATCH_SIZE) {
    batches.push(fullUrls.slice(i, i + MAX_BATCH_SIZE));
  }

  console.log(`Submitting ${fullUrls.length} URLs in ${batches.length} batch(es) to IndexNow`);

  // Submit each batch to IndexNow API
  const results: Array<{
    batch: number;
    status: number;
    success: boolean;
    urlCount: number;
    error?: string;
  }> = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    if (!batch) continue;

    const payload = {
      host: new URL(SITE_URL).hostname,
      key: INDEXNOW_API_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_API_KEY}.txt`,
      urlList: batch,
    };

    try {
      const response = await fetch(INDEXNOW_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      const result = {
        batch: i + 1,
        status: response.status,
        success: response.ok,
        urlCount: batch.length,
      };

      if (response.ok) {
        console.log(`IndexNow batch ${i + 1}/${batches.length} submitted successfully`);
        results.push(result);
      } else {
        const errorText = await response.text();
        console.error(
          `IndexNow batch ${i + 1}/${batches.length} failed (HTTP ${response.status}):`,
          errorText
        );
        results.push({
          ...result,
          error: errorText || `HTTP ${response.status}`,
        });
      }
    } catch (error) {
      console.error(`IndexNow batch ${i + 1}/${batches.length} failed with error:`, error);
      results.push({
        batch: i + 1,
        status: 0,
        success: false,
        urlCount: batch.length,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Rate limiting: 1 second between batches
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const allSuccessful = results.every((r) => r.success);
  const totalSubmitted = results.filter((r) => r.success).reduce((sum, r) => sum + r.urlCount, 0);

  console.log('IndexNow submission complete:', {
    totalUrls: fullUrls.length,
    submitted: totalSubmitted,
    failed: fullUrls.length - totalSubmitted,
    batches: batches.length,
    allSuccessful,
  });

  return jsonResponse(
    {
      success: allSuccessful,
      submitted: totalSubmitted,
      failed: fullUrls.length - totalSubmitted,
      total: fullUrls.length,
      batches: results,
      timestamp: new Date().toISOString(),
    },
    allSuccessful ? 200 : 207,
    getOnlyCorsHeaders
  );
}
