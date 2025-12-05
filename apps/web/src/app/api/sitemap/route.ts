import 'server-only';

import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  APP_CONFIG,
  buildSecurityHeaders,
  getEnvVar,
  getNumberProperty,
  getStringProperty,
  TIMEOUT_PRESETS,
} from '@heyclaude/shared-runtime';
import {
  generateRequestId,
  logger,
  normalizeError,
  createErrorResponse,
} from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  jsonResponse,
  getOnlyCorsHeaders,
  buildCacheHeaders,
  handleOptionsRequest,
  fetchWithRetryAndTimeout,
} from '@heyclaude/web-runtime/server';
import { NextRequest, NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;
const INDEXNOW_API_URL = 'https://api.indexnow.org/IndexNow';
const INDEXNOW_API_KEY = getEnvVar('INDEXNOW_API_KEY');
const INDEXNOW_TRIGGER_KEY = getEnvVar('INDEXNOW_TRIGGER_KEY');
const SITE_URL = APP_CONFIG.url;

function timingSafeEqual(a?: null | string, b?: null | string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  const maxLength = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;

  for (let i = 0; i < maxLength; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }

  return diff === 0;
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'SitemapAPI',
    route: '/api/sitemap',
    method: 'GET',
  });
  const format = (request.nextUrl.searchParams.get('format') ?? 'xml').toLowerCase();
  const supabase = createSupabaseAnonClient();

  reqLogger.info('Sitemap request received', { format });

  try {
    if (format === 'json') {
      const { data, error } = await supabase.rpc('get_site_urls');

      if (error) {
        reqLogger.error('get_site_urls RPC failed', normalizeError(error), {
          operation: 'get_site_urls',
        });
        return createErrorResponse(error, {
          route: '/api/sitemap',
          operation: 'get_site_urls',
          method: 'GET',
          logContext: {
            requestId,
          },
        });
      }

      if (!Array.isArray(data) || data.length === 0) {
        reqLogger.warn('get_site_urls returned no rows');
        return jsonResponse(
          {
            error: 'No URLs available',
          },
          500,
          {
            ...CORS,
            ...buildCacheHeaders('sitemap'),
          }
        );
      }

      const mappedUrls: Array<{
        changefreq?: string;
        lastmod?: string;
        loc: string;
        path: string;
        priority?: number;
      }> = [];

      for (const row of data) {
        const path = getStringProperty(row, 'path');
        if (!path) continue;
        const lastmod = getStringProperty(row, 'lastmod');
        const changefreq = getStringProperty(row, 'changefreq');
        const priority = getNumberProperty(row, 'priority');

        const urlEntry: {
          changefreq?: string;
          lastmod?: string;
          loc: string;
          path: string;
          priority?: number;
        } = {
          path,
          loc: `${SITE_URL}${path}`,
        };

        if (lastmod) {
          urlEntry.lastmod = lastmod;
        }
        if (changefreq) {
          urlEntry.changefreq = changefreq;
        }
        if (typeof priority === 'number') {
          urlEntry.priority = priority;
        }

        mappedUrls.push(urlEntry);
      }

      reqLogger.info('Sitemap JSON payload generated', {
        count: mappedUrls.length,
      });

      return jsonResponse(
        {
          urls: mappedUrls,
          meta: {
            total: mappedUrls.length,
            generated: new Date().toISOString(),
          },
        },
        200,
        {
          ...CORS,
          ...buildCacheHeaders('sitemap'),
        },
        {
          'X-Content-Source': 'supabase.mv_site_urls',
        }
      );
    }

    const rpcArgs = {
      p_base_url: SITE_URL,
    } satisfies DatabaseGenerated['public']['Functions']['generate_sitemap_xml']['Args'];
    const { data, error } = await supabase.rpc('generate_sitemap_xml', rpcArgs);

    if (error) {
      reqLogger.error('generate_sitemap_xml RPC failed', normalizeError(error), {
        rpcArgs,
      });
      return createErrorResponse(error, {
        route: '/api/sitemap',
        operation: 'generate_sitemap_xml',
        method: 'GET',
        logContext: {
          requestId,
        },
      });
    }

    if (!data) {
      reqLogger.warn('generate_sitemap_xml returned null');
      return jsonResponse({ error: 'Sitemap XML generation returned null' }, 500, CORS);
    }

    reqLogger.info('Sitemap XML generated');

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'X-Robots-Tag': 'index, follow',
        'X-Generated-By': 'supabase.rpc.generate_sitemap_xml',
        'X-Content-Source': 'supabase.mv_site_urls',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('sitemap'),
      },
    });
  } catch (error) {
    reqLogger.error('Unhandled sitemap GET error', normalizeError(error));
    return createErrorResponse(error, {
      route: '/api/sitemap',
      operation: 'SitemapAPI',
      method: 'GET',
      logContext: {
        requestId,
      },
    });
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'SitemapAPI',
    route: '/api/sitemap',
    method: 'POST',
  });

  reqLogger.info('IndexNow submission received', {
    operation: 'indexnow_submission',
    securityEvent: true,
  });

  if (!INDEXNOW_TRIGGER_KEY) {
    return jsonResponse(
      {
        error: 'Service unavailable',
        message: 'IndexNow trigger key not configured',
      },
      503,
      CORS
    );
  }

  const triggerKey = request.headers.get('x-indexnow-trigger-key');
  if (!timingSafeEqual(triggerKey, INDEXNOW_TRIGGER_KEY)) {
    reqLogger.warn('Invalid IndexNow trigger key', { securityEvent: true });
    return jsonResponse(
      {
        error: 'Unauthorized',
        message: 'Invalid trigger key',
      },
      401,
      CORS
    );
  }

  if (!INDEXNOW_API_KEY) {
    return jsonResponse(
      {
        error: 'Service unavailable',
        message: 'IndexNow API key not configured',
      },
      503,
      CORS
    );
  }

  const supabase = createSupabaseAnonClient();
  try {
    const { data, error } = await supabase.rpc('get_site_urls');
    if (error) {
      reqLogger.error('get_site_urls RPC failed', normalizeError(error), {
        operation: 'get_site_urls',
      });
      return createErrorResponse(error, {
        route: '/api/sitemap',
        operation: 'get_site_urls',
        method: 'POST',
        logContext: {
          requestId,
        },
      });
    }

    if (!Array.isArray(data) || data.length === 0) {
      reqLogger.warn('No URLs returned, skipping IndexNow');
      return jsonResponse({ error: 'No URLs to submit' }, 500, CORS);
    }

    const urlList = data
      .map((row) => {
        const path = getStringProperty(row, 'path');
        return path ? `${SITE_URL}${path}` : null;
      })
      .filter(Boolean)
      .slice(0, 10_000);

    if (urlList.length === 0) {
      return jsonResponse({ error: 'No URLs to submit' }, 500, CORS);
    }

    const payload = {
      host: new URL(SITE_URL).host,
      key: INDEXNOW_API_KEY,
      keyLocation: `${SITE_URL}/indexnow.txt`,
      urlList,
    } satisfies Record<string, unknown>;

    const { response } = await fetchWithRetryAndTimeout(
      {
        url: INDEXNOW_API_URL,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        retry: {
          attempts: 2,
          baseDelayMs: 1000,
          retryOn: [500, 502, 503, 504],
          noRetryOn: [400, 401, 403, 404],
        },
      },
      TIMEOUT_PRESETS.external
    );

    if (!response.ok) {
      const text = await response.text();
      reqLogger.warn('IndexNow request failed', {
        status: response.status,
        body: text,
        securityEvent: true,
      });
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

    reqLogger.info('IndexNow submission successful', {
      operation: 'indexnow_submission',
      submitted: urlList.length,
      securityEvent: true,
    });

    return jsonResponse(
      {
        ok: true,
        submitted: urlList.length,
      },
      200,
      CORS
    );
  } catch (error) {
    reqLogger.error('IndexNow submission error', normalizeError(error));
    return jsonResponse(
      {
        ok: false,
        submitted: 0,
        error: 'IndexNow submission failed',
      },
      500,
      CORS
    );
  }
}

export function OPTIONS() {
  return handleOptionsRequest(CORS);
}
