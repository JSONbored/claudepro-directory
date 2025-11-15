import { SITE_URL, supabaseAnon } from '../../_shared/clients/supabase.ts';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  jsonResponse,
  methodNotAllowedResponse,
} from '../../_shared/utils/http.ts';

const CORS = getOnlyCorsHeaders;
const INDEXNOW_API_URL = 'https://api.indexnow.org/IndexNow';
const INDEXNOW_API_KEY = Deno.env.get('INDEXNOW_API_KEY');
const INDEXNOW_TRIGGER_KEY = Deno.env.get('INDEXNOW_TRIGGER_KEY');

export async function handleSitemapRoute(
  segments: string[],
  url: URL,
  method: string,
  req: Request
): Promise<Response> {
  if (segments.length > 0) {
    return badRequestResponse('Sitemap path does not accept nested segments', CORS);
  }

  if (method === 'GET') {
    return handleSitemapGet(url);
  }

  if (method === 'POST') {
    return handleSitemapIndexNow(req);
  }

  return methodNotAllowedResponse('GET, POST', CORS);
}

async function handleSitemapGet(url: URL): Promise<Response> {
  const format = (url.searchParams.get('format') || 'xml').toLowerCase();

  if (format === 'json') {
    const { data: urls, error } = await supabaseAnon.rpc('get_site_urls');
    if (error) {
      return errorResponse(error, 'data-api:get_site_urls', CORS);
    }
    if (!urls || urls.length === 0) {
      return jsonResponse({ error: 'No URLs returned from database' }, 500, CORS);
    }

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
        ...CORS,
        ...buildCacheHeaders('sitemap'),
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Source': 'PostgreSQL mv_site_urls',
      }
    );
  }

  const { data, error } = await supabaseAnon.rpc('generate_sitemap_xml', {
    p_base_url: SITE_URL,
  });

  if (error) {
    return errorResponse(error, 'data-api:generate_sitemap_xml', CORS);
  }

  if (!data) {
    return jsonResponse({ error: 'Sitemap XML generation returned null' }, 500, CORS);
  }

  return new Response(data, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Robots-Tag': 'index, follow',
      'X-Generated-By': 'supabase.rpc.generate_sitemap_xml',
      'X-Content-Source': 'PostgreSQL mv_site_urls',
      ...CORS,
      ...buildCacheHeaders('sitemap'),
    },
  });
}

async function handleSitemapIndexNow(req: Request): Promise<Response> {
  const triggerKey = req.headers.get('X-IndexNow-Trigger-Key');

  if (!INDEXNOW_TRIGGER_KEY) {
    return jsonResponse(
      { error: 'Service unavailable', message: 'IndexNow trigger key not configured' },
      503,
      CORS
    );
  }

  if (triggerKey !== INDEXNOW_TRIGGER_KEY) {
    return jsonResponse({ error: 'Unauthorized', message: 'Invalid trigger key' }, 401, CORS);
  }

  if (!INDEXNOW_API_KEY) {
    return jsonResponse(
      { error: 'Service unavailable', message: 'IndexNow API key not configured' },
      503,
      CORS
    );
  }

  const { data: urls, error } = await supabaseAnon.rpc('get_site_urls');
  if (error) {
    return errorResponse(error, 'data-api:get_site_urls', CORS);
  }

  if (!urls || urls.length === 0) {
    return jsonResponse({ error: 'No URLs to submit to IndexNow' }, 500, CORS);
  }

  const urlList = urls.map((u) => `${SITE_URL}${u.path}`).slice(0, 10000);
  const payload = {
    host: new URL(SITE_URL).host,
    key: INDEXNOW_API_KEY,
    keyLocation: `${SITE_URL}/indexnow.txt`,
    urlList,
  };

  const response = await fetch(INDEXNOW_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    return jsonResponse(
      {
        error: 'IndexNow request failed',
        status: response.status,
        body: text,
      },
      502,
      CORS
    );
  }

  console.log('[data-api] indexnow submitted', {
    submitted: urlList.length,
    status: response.status,
  });

  return jsonResponse(
    {
      ok: true,
      submitted: urlList.length,
    },
    200,
    CORS
  );
}
