import 'server-only';
import { MiscService } from '@heyclaude/data-layer';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  APP_CONFIG,
  buildSecurityHeaders,
  getEnvVar,
  getNumberProperty,
  getStringProperty,
} from '@heyclaude/shared-runtime';
import { logger, normalizeError, createErrorResponse } from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  jsonResponse,
  getOnlyCorsHeaders,
  buildCacheHeaders,
  handleOptionsRequest,
} from '@heyclaude/web-runtime/server';
import { inngest } from '@heyclaude/web-runtime/inngest';
import { cacheLife } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Cached helper function to fetch sitemap URLs.
 * Uses Cache Components + `cacheLife('static')` to cache `get_site_urls` results
 * while still surfacing RPC failures (errors are not cached).
 * 
 * Cache configuration: Uses 'static' profile (1 day stale, 6hr revalidate, 30 days expire)
 * defined in next.config.mjs. The cache key is based on the function signature, ensuring
 * consistent caching across requests.
 *
 * @returns {Promise<unknown[]>} Cached array of site URL rows from the `get_site_urls` RPC
 */
async function getCachedSiteUrls() {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire (defined in next.config.mjs)

  const supabase = createSupabaseAnonClient();
  const service = new MiscService(supabase);
  return service.getSiteUrls();
}

const CORS = getOnlyCorsHeaders;
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
  const reqLogger = logger.child({
    operation: 'SitemapAPI',
    route: '/api/sitemap',
    method: 'GET',
  });
  const format = (request.nextUrl.searchParams.get('format') ?? 'xml').toLowerCase();

  reqLogger.info({ format }, 'Sitemap request received');

  try {
    if (format === 'json') {
      let data: Awaited<ReturnType<typeof getCachedSiteUrls>> | null = null;
      try {
        data = await getCachedSiteUrls();
      } catch (error) {
        const normalized = normalizeError(error, 'Operation failed');
        reqLogger.error(
          {
            err: normalized,
            operation: 'get_site_urls',
            rpcName: 'get_site_urls',
          },
          'get_site_urls RPC failed'
        );
        return createErrorResponse(normalized, {
          route: '/api/sitemap',
          operation: 'get_site_urls',
          method: 'GET',
          logContext: {
            rpcName: 'get_site_urls',
          },
        });
      }

      if (!Array.isArray(data) || data.length === 0) {
        reqLogger.warn({}, 'get_site_urls returned no rows');
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

      reqLogger.info(
        {
          count: mappedUrls.length,
        },
        'Sitemap JSON payload generated'
      );

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

    const supabase = createSupabaseAnonClient();
    const service = new MiscService(supabase);

    const rpcArgs = {
      p_base_url: SITE_URL,
    } satisfies DatabaseGenerated['public']['Functions']['generate_sitemap_xml']['Args'];

    let data;
    try {
      data = await service.generateSitemapXml(rpcArgs);
    } catch (error) {
      const normalized = normalizeError(error, 'generate_sitemap_xml RPC failed');
      reqLogger.error(
        {
          err: normalized,
          rpcArgs,
          rpcName: 'generate_sitemap_xml',
        },
        'generate_sitemap_xml RPC failed'
      );
      return createErrorResponse(normalized, {
        route: '/api/sitemap',
        operation: 'generate_sitemap_xml',
        method: 'GET',
        logContext: {
          rpcName: 'generate_sitemap_xml',
        },
      });
    }

    if (!data) {
      reqLogger.warn({}, 'generate_sitemap_xml returned null');
      return jsonResponse({ error: 'Sitemap XML generation returned null' }, 500, CORS);
    }

    reqLogger.info({}, 'Sitemap XML generated');

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
    const normalized = normalizeError(error, 'Unhandled sitemap GET error');
    reqLogger.error({ err: normalized }, 'Unhandled sitemap GET error');
    return createErrorResponse(normalized, {
      route: '/api/sitemap',
      operation: 'SitemapAPI',
      method: 'GET',
      logContext: {},
    });
  }
}

export async function POST(request: NextRequest) {
  const reqLogger = logger.child({
    operation: 'SitemapAPI',
    route: '/api/sitemap',
    method: 'POST',
  });

  reqLogger.info(
    {
      operation: 'indexnow_submission',
      securityEvent: true,
    },
    'IndexNow submission received'
  );

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
    reqLogger.warn({ securityEvent: true }, 'Invalid IndexNow trigger key');
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
  const service = new MiscService(supabase);

  try {
    // Database RPC returns string[] directly (SETOF text) - no client-side extraction needed
    // This eliminates CPU-intensive map/filter operations (5-10% CPU savings)
    let urlList: string[];
    try {
      urlList = await service.getSiteUrlsFormatted({
        p_site_url: SITE_URL,
        p_limit: 10_000,
      });
    } catch (error) {
      const normalized = normalizeError(error, 'get_site_urls_formatted RPC failed');
      reqLogger.error(
        {
          err: normalized,
          operation: 'get_site_urls_formatted',
          rpcName: 'get_site_urls_formatted',
        },
        'get_site_urls_formatted RPC failed'
      );
      return createErrorResponse(normalized, {
        route: '/api/sitemap',
        operation: 'get_site_urls_formatted',
        method: 'POST',
        logContext: {
          rpcName: 'get_site_urls_formatted',
        },
      });
    }

    if (!Array.isArray(urlList) || urlList.length === 0) {
      reqLogger.warn({}, 'No URLs returned, skipping IndexNow');
      return jsonResponse({ error: 'No URLs to submit' }, 500, CORS);
    }

    // Trigger Inngest function to handle IndexNow submission asynchronously
    // This eliminates blocking external API call from Vercel function (reduces CPU/bandwidth usage)
    try {
      await inngest.send({
        name: 'indexnow/submit',
        data: {
          urlList,
          host: new URL(SITE_URL).host,
          key: INDEXNOW_API_KEY,
          keyLocation: `${SITE_URL}/indexnow.txt`,
        },
      });

      reqLogger.info(
        {
          operation: 'indexnow_submission',
          submitted: urlList.length,
          securityEvent: true,
        },
        'IndexNow submission enqueued to Inngest'
      );

      return jsonResponse(
        {
          ok: true,
          submitted: urlList.length,
          message: 'IndexNow submission enqueued',
        },
        200,
        CORS
      );
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to enqueue IndexNow submission');
      reqLogger.error(
        {
          err: normalized,
          submitted: urlList.length,
          securityEvent: true,
        },
        'Failed to enqueue IndexNow submission to Inngest'
      );
      return jsonResponse(
        {
          ok: false,
          submitted: 0,
          error: 'Failed to enqueue IndexNow submission',
        },
        500,
        CORS
      );
    }
  } catch (error) {
    reqLogger.error({ err: normalizeError(error) }, 'IndexNow submission error');
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
