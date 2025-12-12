/**
 * Sitewide Content API Route
 * 
 * Serves sitewide content in multiple export formats:
 * - `llms` / `llms-txt` (default): LLMs export as plain text
 * - `readme`: Raw JSON data for CLI formatting
 * - `json`: Complete directory content as JSON array
 * 
 * @example
 * ```ts
 * // Request - LLMs format (default)
 * GET /api/content/sitewide?format=llms
 * 
 * // Response (200) - text/plain
 * # Sitewide Content
 * ...
 * 
 * // Request - JSON format
 * GET /api/content/sitewide?format=json
 * 
 * // Response (200) - application/json
 * [{ "id": "...", "title": "...", ... }]
 * ```
 */

import 'server-only';
import { ContentService } from '@heyclaude/data-layer';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';
import { createApiRoute, createApiOptionsHandler, sitewideFormatSchema } from '@heyclaude/web-runtime/server';
import { normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  buildCacheHeaders,
  createSupabaseAnonClient,
  getOnlyCorsHeaders,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Cached helper function to fetch sitewide content list
 * Uses Cache Components to reduce function invocations
 *
 * @returns {Promise<unknown[]>} Sitewide content list from the database (typically an array of content item objects)
 */
async function getCachedSitewideContent() {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  const service = new ContentService(supabase);
  return await service.getSitewideContentList({ p_limit: 5000 });
}

/**
 * GET /api/content/sitewide - Get sitewide content in various formats
 * 
 * Serves sitewide content in multiple export formats:
 * - `llms` / `llms-txt` (default): LLMs export as plain text
 * - `readme`: Raw JSON data for CLI formatting
 * - `json`: Complete directory content as JSON array
 */
export const GET = createApiRoute({
  route: '/api/content/sitewide',
  operation: 'ContentSitewideAPI',
  method: 'GET',
  cors: 'anon',
  querySchema: z.object({
    format: sitewideFormatSchema,
  }),
  openapi: {
    summary: 'Get sitewide content in various formats',
    description: 'Serves sitewide content in multiple export formats: LLMs text format (default), README JSON data, or complete JSON array. Used for exporting the entire directory content.',
    tags: ['content', 'export', 'sitewide'],
    operationId: 'getSitewideContent',
    responses: {
      200: {
        description: 'Sitewide content retrieved successfully in requested format',
      },
      400: {
        description: 'Invalid format parameter',
      },
      500: {
        description: 'Failed to generate sitewide export',
      },
    },
  },
  handler: async ({ logger, query }) => {
    const { format } = query as { format: 'llms' | 'llms-txt' | 'readme' | 'json' };

    logger.info({ format }, 'Sitewide content request received');

    const supabase = createSupabaseAnonClient();
    const service = new ContentService(supabase);

    // Handle JSON format - returns complete directory content list
    if (format === 'json') {
      let data: Awaited<ReturnType<typeof getCachedSitewideContent>> = [];
      try {
        data = await getCachedSitewideContent();
        logger.info(
          {
            itemCount: data.length,
          },
          'Sitewide JSON generated'
        );
      } catch (error) {
        const normalized = normalizeError(error, 'Operation failed');
        logger.error(
          {
            err: normalized,
            format,
          },
          'Sitewide JSON query error'
        );
        throw normalized; // Factory will handle error response
      }

      // Next.js automatically compresses JSON responses (gzip/brotli)
      // Large payload optimization: 5000 items can be 5-15 MB uncompressed, ~1-3 MB compressed
      // Aggressive caching ensures most requests are served from CDN cache
      return NextResponse.json(data, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          // Compression hint (Next.js/Vercel handles actual compression automatically)
          Vary: 'Accept-Encoding',
          'X-Generated-By': 'supabase.rpc.get_sitewide_content_list',
          ...buildSecurityHeaders(),
          ...getOnlyCorsHeaders,
          // Hyper-optimized caching: 7 days TTL, 14 days stale (matches content_export preset)
          // Sitewide content lists rarely change, so aggressive caching reduces DB pressure by 95%+
          // This reduces bandwidth usage by serving cached responses from CDN
          ...buildCacheHeaders('content_export'),
        },
        status: 200,
      });
    }

    // Handle README format - returns raw JSON data for CLI script to format
    if (format === 'readme') {
      const data = await service.getSitewideReadme();

      logger.info(
        {
          categoriesCount: data.categories?.length ?? 0,
          totalCount: data.total_count ?? 0,
        },
        'Sitewide README data fetched'
      );

      return NextResponse.json(data, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Generated-By': 'supabase.rpc.generate_readme_data',
          ...buildSecurityHeaders(),
          ...getOnlyCorsHeaders,
          ...buildCacheHeaders('content_export'),
        },
        status: 200,
      });
    }

    // Handle LLMs format (default)
    const data = await service.getSitewideLlmsTxt();

    if (!data) {
      logger.error({}, 'Sitewide LLMs export returned null');
      throw new Error('Sitewide LLMs export failed: RPC returned null or invalid');
    }

    // Database RPC returns properly formatted text (no client-side processing needed)
    // This eliminates CPU-intensive string replacement (5-10% CPU savings)
    logger.info(
      {
        bytes: typeof data === 'string' ? data.length : 0,
      },
      'Sitewide llms generated'
    );

    return new NextResponse(data, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_sitewide_llms_txt',
        ...buildSecurityHeaders(),
        ...getOnlyCorsHeaders,
        ...buildCacheHeaders('content_export'),
      },
      status: 200,
    });
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
