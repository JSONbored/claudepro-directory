/**
 * Sitemap API Route
 * 
 * Generates XML or JSON sitemaps for search engines.
 * Supports IndexNow submission for search engine indexing.
 * 
 * @example
 * ```ts
 * // Request - XML sitemap
 * GET /api/sitemap?format=xml
 * 
 * // Request - JSON sitemap
 * GET /api/sitemap?format=json
 * 
 * // Response (200) - application/xml or application/json
 * <?xml version="1.0"?>
 * <urlset>...</urlset>
 * ```
 */

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
import { inngest } from '@heyclaude/web-runtime/inngest';
import { createApiRoute, createApiOptionsHandler, sitemapFormatSchema } from '@heyclaude/web-runtime/server';
import { normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  buildCacheHeaders,
  createSupabaseAnonClient,
  getOnlyCorsHeaders,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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

/**
 * GET /api/sitemap - Get sitemap in XML or JSON format
 * 
 * Generates XML or JSON sitemaps for search engines.
 * Supports both XML (default) and JSON formats.
 */
export const GET = createApiRoute({
  route: '/api/sitemap',
  operation: 'SitemapAPI',
  method: 'GET',
  cors: 'anon',
  querySchema: z.object({
    format: sitemapFormatSchema,
  }),
  openapi: {
    summary: 'Get sitemap in XML or JSON format',
    description: 'Generates XML or JSON sitemaps for search engines. Supports both XML (default) and JSON formats.',
    tags: ['sitemap', 'seo'],
    operationId: 'getSitemap',
    responses: {
      200: {
        description: 'Sitemap generated successfully',
      },
      500: {
        description: 'Sitemap generation failed',
      },
    },
  },
  handler: async ({ logger, query }) => {
    // Zod schema ensures proper types
    const { format } = query;

    logger.info({ format }, 'Sitemap request received');

    if (format === 'json') {
      let data: Awaited<ReturnType<typeof getCachedSiteUrls>> | null = null;
      try {
        data = await getCachedSiteUrls();
      } catch (error) {
        const normalized = normalizeError(error, 'Operation failed');
        logger.error(
          {
            err: normalized,
            operation: 'get_site_urls',
            rpcName: 'get_site_urls',
          },
          'get_site_urls RPC failed'
        );
        throw normalized; // Factory will handle error response
      }

      if (!Array.isArray(data) || data.length === 0) {
        logger.warn({}, 'get_site_urls returned no rows');
        return jsonResponse(
          {
            error: 'No URLs available',
          },
          500,
          getOnlyCorsHeaders,
          {
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
          loc: `${SITE_URL}${path}`,
          path,
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

      logger.info(
        {
          count: mappedUrls.length,
        },
        'Sitemap JSON payload generated'
      );

      return jsonResponse(
        {
          meta: {
            generated: new Date().toISOString(),
            total: mappedUrls.length,
          },
          urls: mappedUrls,
        },
        200,
        getOnlyCorsHeaders,
        {
          ...buildCacheHeaders('sitemap'),
          'X-Content-Source': 'supabase.mv_site_urls',
        }
      );
    }

    // XML format (default)
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
      logger.error(
        {
          err: normalized,
          rpcArgs,
          rpcName: 'generate_sitemap_xml',
        },
        'generate_sitemap_xml RPC failed'
      );
      throw normalized; // Factory will handle error response
    }

    if (!data) {
      logger.warn({}, 'generate_sitemap_xml returned null');
      return jsonResponse({ error: 'Sitemap XML generation returned null' }, 500, getOnlyCorsHeaders);
    }

    logger.info({}, 'Sitemap XML generated');

    return new NextResponse(data, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'X-Content-Source': 'supabase.mv_site_urls',
        'X-Generated-By': 'supabase.rpc.generate_sitemap_xml',
        'X-Robots-Tag': 'index, follow',
        ...buildSecurityHeaders(),
        ...getOnlyCorsHeaders,
        ...buildCacheHeaders('sitemap'),
      },
      status: 200,
    });
  },
});

/**
 * POST /api/sitemap - Submit URLs to IndexNow
 * 
 * Submits site URLs to IndexNow for search engine indexing.
 * Requires authentication via x-indexnow-trigger-key header.
 * 
 * @example
 * ```ts
 * // Request
 * POST /api/sitemap
 * Headers: x-indexnow-trigger-key: <trigger-key>
 * 
 * // Response (200)
 * {
 *   "message": "IndexNow submission enqueued",
 *   "ok": true,
 *   "submitted": 1234
 * }
 * ```
 */
export const POST = createApiRoute({
  route: '/api/sitemap',
  operation: 'SitemapAPI',
  method: 'POST',
  cors: 'anon',
  openapi: {
    summary: 'Submit URLs to IndexNow',
    description: 'Submits site URLs to IndexNow for search engine indexing. Requires authentication via x-indexnow-trigger-key header.',
    tags: ['sitemap', 'seo', 'indexnow'],
    operationId: 'submitIndexNow',
    responses: {
      200: {
        description: 'IndexNow submission enqueued successfully',
      },
      401: {
        description: 'Unauthorized - invalid trigger key',
      },
      503: {
        description: 'Service unavailable - IndexNow keys not configured',
      },
    },
  },
  handler: async ({ logger, request }) => {
    logger.info(
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
        getOnlyCorsHeaders
      );
    }

    const triggerKey = request.headers.get('x-indexnow-trigger-key');
    if (!timingSafeEqual(triggerKey, INDEXNOW_TRIGGER_KEY)) {
      logger.warn({ securityEvent: true }, 'Invalid IndexNow trigger key');
      return jsonResponse(
        {
          error: 'Unauthorized',
          message: 'Invalid trigger key',
        },
        401,
        getOnlyCorsHeaders
      );
    }

    if (!INDEXNOW_API_KEY) {
      return jsonResponse(
        {
          error: 'Service unavailable',
          message: 'IndexNow API key not configured',
        },
        503,
        getOnlyCorsHeaders
      );
    }

    const supabase = createSupabaseAnonClient();
    const service = new MiscService(supabase);

    // Database RPC returns string[] directly (SETOF text) - no client-side extraction needed
    // This eliminates CPU-intensive map/filter operations (5-10% CPU savings)
    let urlList: string[];
    try {
      urlList = await service.getSiteUrlsFormatted({
        p_limit: 10_000,
        p_site_url: SITE_URL,
      });
    } catch (error) {
      const normalized = normalizeError(error, 'get_site_urls_formatted RPC failed');
      logger.error(
        {
          err: normalized,
          operation: 'get_site_urls_formatted',
          rpcName: 'get_site_urls_formatted',
        },
        'get_site_urls_formatted RPC failed'
      );
      throw normalized; // Factory will handle error response
    }

    if (!Array.isArray(urlList) || urlList.length === 0) {
      logger.warn({}, 'No URLs returned, skipping IndexNow');
      return jsonResponse({ error: 'No URLs to submit' }, 500, getOnlyCorsHeaders);
    }

    // Trigger Inngest function to handle IndexNow submission asynchronously
    // This eliminates blocking external API call from Vercel function (reduces CPU/bandwidth usage)
    try {
      await inngest.send({
        data: {
          host: new URL(SITE_URL).host,
          key: INDEXNOW_API_KEY,
          keyLocation: `${SITE_URL}/indexnow.txt`,
          urlList,
        },
        name: 'indexnow/submit',
      });

      logger.info(
        {
          operation: 'indexnow_submission',
          securityEvent: true,
          submitted: urlList.length,
        },
        'IndexNow submission enqueued to Inngest'
      );

      return jsonResponse(
        {
          message: 'IndexNow submission enqueued',
          ok: true,
          submitted: urlList.length,
        },
        200,
        getOnlyCorsHeaders
      );
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to enqueue IndexNow submission');
      logger.error(
        {
          err: normalized,
          securityEvent: true,
          submitted: urlList.length,
        },
        'Failed to enqueue IndexNow submission to Inngest'
      );
      return jsonResponse(
        {
          error: 'Failed to enqueue IndexNow submission',
          ok: false,
          submitted: 0,
        },
        500,
        getOnlyCorsHeaders
      );
    }
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
