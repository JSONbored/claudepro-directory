/**
 * Sitemap API Route (v1)
 *
 * Generates XML or JSON sitemaps for search engines.
 * Supports IndexNow submission for search engine indexing.
 *
 * SIMPLIFIED: Uses format handler factory to eliminate conditional logic (~384 lines → ~250 lines)
 *
 * @example
 * ```ts
 * // Request - XML sitemap
 * GET /api/v1/sitemap?format=xml
 *
 * // Request - JSON sitemap
 * GET /api/v1/sitemap?format=json
 *
 * // Response (200) - application/xml or application/json
 * <?xml version="1.0"?>
 * <urlset>...</urlset>
 * ```
 */

import 'server-only';

import { MiscService } from '@heyclaude/data-layer';
import { APP_CONFIG, getNumberProperty, getStringProperty } from '@heyclaude/shared-runtime';
import { env } from '@heyclaude/shared-runtime/schemas/env';
import {
  errorResponseSchema,
  indexNowResponseSchema,
  sitemapJsonResponseSchema,
  sitemapXmlResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import {
  createOptionsHandler as createApiOptionsHandler, createApiRoute, createFormatHandlerRoute, type FormatHandlerConfig, type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { sitemapFormatSchema } from '@heyclaude/web-runtime/api/schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { inngest } from '@heyclaude/web-runtime/inngest/client';
import { normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  getOnlyCorsHeaders,
  jsonResponse,
  xmlResponse,
} from '@heyclaude/web-runtime/server/api-helpers';
import { z } from 'zod';

/**
 * Query schema for sitemap API
 * Exported for OpenAPI generation
 */
export const sitemapQuerySchema = z.object({
  format: sitemapFormatSchema,
});

const INDEXNOW_API_KEY = env.INDEXNOW_API_KEY;
const INDEXNOW_TRIGGER_KEY = env.INDEXNOW_TRIGGER_KEY;
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

type SitemapFormat = 'json' | 'xml';

/**
 * GET /api/v1/sitemap - Get sitemap in XML or JSON format
 *
 * Generates XML or JSON sitemaps for search engines.
 * Uses format handler factory to eliminate conditional logic.
 */
export const GET = createFormatHandlerRoute<SitemapFormat, { format: SitemapFormat }>({
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: ['sitemap'],
  cors: 'anon',
  defaultFormat: 'xml',
  formats: {
    json: {
      methodArgs: () => [],
      methodName: 'getSiteUrls',
      responseHandler: (
        result: unknown,
        _format: 'json',
        _query: { format: SitemapFormat },
        _body: unknown,
        ctx: RouteHandlerContext<{ format: SitemapFormat }>
      ) => {
        const { logger } = ctx;
        const data = result as null | undefined | unknown[];
        if (!Array.isArray(data) || data.length === 0) {
          logger.warn({}, 'get_site_urls returned no rows');
          return jsonResponse({ error: 'No URLs available' }, 500, getOnlyCorsHeaders);
        }
        const mappedUrls = data
          .map((row) => {
            const path = getStringProperty(row, 'path');
            if (!path) return null;
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
            const lastmod = getStringProperty(row, 'lastmod');
            const changefreq = getStringProperty(row, 'changefreq');
            const priority = getNumberProperty(row, 'priority');
            if (lastmod) urlEntry.lastmod = lastmod;
            if (changefreq) urlEntry.changefreq = changefreq;
            if (typeof priority === 'number') urlEntry.priority = priority;
            return urlEntry;
          })
          .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
        logger.info({ count: mappedUrls.length }, 'Sitemap JSON payload generated');
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
            'X-Content-Source': 'prisma.mv_site_urls',
          }
        );
      },
      serviceKey: 'misc',
    },
    xml: {
      methodArgs: () => [{ p_base_url: SITE_URL }],
      methodName: 'generateSitemapXml',
      responseHandler: (
        result: unknown,
        _format: 'xml',
        _query: { format: SitemapFormat },
        _body: unknown,
        ctx: RouteHandlerContext<{ format: SitemapFormat }>
      ) => {
        const { logger } = ctx;
        const data = result as null | string;
        if (!data) {
          logger.warn({}, 'generate_sitemap_xml returned null');
          return jsonResponse(
            { error: 'Sitemap XML generation returned null' },
            500,
            getOnlyCorsHeaders
          );
        }
        logger.info({}, 'Sitemap XML generated');
        return xmlResponse(data, 'application/xml; charset=utf-8', 200, getOnlyCorsHeaders, {
          'X-Content-Source': 'prisma.mv_site_urls',
          'X-Generated-By': 'prisma.rpc.generate_sitemap_xml',
          'X-Robots-Tag': 'index, follow',
        });
      },
      serviceKey: 'misc',
    },
  } as Record<SitemapFormat, FormatHandlerConfig<SitemapFormat, { format: SitemapFormat }>>,
  method: 'GET',
  openapi: {
    description:
      'Generates XML or JSON sitemaps for search engines. Supports both XML (default) and JSON formats.',
    operationId: 'getSitemap',
    responses: {
      200: {
        description: 'Sitemap generated successfully',
        example:
          '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://claudepro.directory/</loc><lastmod>2025-01-11</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url></urlset>',
        headers: {
          'Cache-Control': {
            description: 'Cache control directive',
            schema: { type: 'string' },
          },
          'Content-Type': {
            description: 'Content type (application/xml for xml, application/json for json)',
            schema: { type: 'string' },
          },
          'X-Content-Source': {
            description: 'Source of the sitemap content',
            schema: { type: 'string' },
          },
          'X-Generated-By': {
            description: 'Source of the response data',
            schema: { type: 'string' },
          },
          'X-Robots-Tag': {
            description: 'Robots meta tag directive',
            schema: { type: 'string' },
          },
        },
        schema: z.union([sitemapXmlResponseSchema, sitemapJsonResponseSchema]),
      },
      400: {
        description: 'Invalid format parameter',
        example: {
          error: 'Invalid format parameter',
          message: 'Invalid format. Valid formats: xml, json',
        },
        schema: errorResponseSchema,
      },
      500: {
        description: 'Sitemap generation failed',
        example: {
          error: 'Sitemap generation failed',
          message: 'An unexpected error occurred while generating the sitemap',
        },
        schema: errorResponseSchema,
      },
    },
    summary: 'Get sitemap in XML or JSON format',
    tags: ['sitemap', 'seo'],
  },
  operation: 'SitemapAPI',
  querySchema: sitemapQuerySchema,
  route: getVersionedRoute('sitemap'),
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
  cors: 'anon',
  handler: async ({ logger, request }) => {
    logger.info(
      {
        operation: 'indexnow_submission',
        securityEvent: true,
      },
      'IndexNow submission received'
    );

    // Validate configuration
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

    // Validate authentication
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

    const service = new MiscService();

    // OPTIMIZATION: Factory already handles errors, no need for try/catch
    const urlList = await service.getSiteUrlsFormatted({
      p_limit: 10_000,
      p_site_url: SITE_URL,
    });

    if (!Array.isArray(urlList) || urlList.length === 0) {
      logger.warn({}, 'No URLs returned, skipping IndexNow');
      return jsonResponse({ error: 'No URLs to submit' }, 500, getOnlyCorsHeaders);
    }

    // Trigger Inngest function to handle IndexNow submission asynchronously
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
  method: 'POST',
  openapi: {
    description:
      'Submits site URLs to IndexNow for search engine indexing. Requires authentication via x-indexnow-trigger-key header.',
    operationId: 'submitIndexNow',
    requestBody: {
      description: 'IndexNow submission request (no body required, authentication via header)',
      required: false,
    },
    responses: {
      200: {
        description: 'IndexNow submission enqueued successfully',
        example: {
          message: 'IndexNow submission enqueued',
          ok: true,
          submitted: 1234,
        },
        headers: {
          'X-RateLimit-Remaining': {
            description: 'Remaining rate limit requests',
            schema: { type: 'string' },
          },
        },
        schema: indexNowResponseSchema,
      },
      401: {
        description: 'Unauthorized - invalid trigger key',
        example: {
          error: 'Unauthorized',
          message: 'Invalid trigger key',
        },
        headers: {
          'WWW-Authenticate': {
            description: 'Authentication challenge',
            schema: { type: 'string' },
          },
        },
        schema: errorResponseSchema,
      },
      500: {
        description: 'Internal server error',
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while submitting to IndexNow',
        },
        schema: errorResponseSchema,
      },
      503: {
        description: 'Service unavailable - IndexNow keys not configured',
        example: {
          error: 'Service unavailable',
          message: 'IndexNow trigger key not configured',
        },
        schema: errorResponseSchema,
      },
    },
    security: [{ bearerAuth: [] }],
    summary: 'Submit URLs to IndexNow',
    tags: ['sitemap', 'seo', 'indexnow'],
  },
  operation: 'SitemapAPI',
  route: getVersionedRoute('sitemap'),
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
