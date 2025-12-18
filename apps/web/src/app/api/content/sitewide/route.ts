/**
 * Sitewide Content API Route (v1)
 *
 * Serves sitewide content in multiple export formats:
 * - `llms` / `llms-txt` (default): LLMs export as plain text
 * - `readme`: Raw JSON data for CLI formatting
 * - `json`: Complete directory content as JSON array
 *
 * @example
 * ```ts
 * // Request - LLMs format (default)
 * GET /api/v1/content/sitewide?format=llms
 *
 * // Response (200) - text/plain
 * # Sitewide Content
 * ...
 *
 * // Request - JSON format
 * GET /api/v1/content/sitewide?format=json
 *
 * // Response (200) - application/json
 * [{ "id": "...", "title": "...", ... }]
 * ```
 */

import 'server-only';
import {
  createApiOptionsHandler,
  createFormatHandlerRoute,
  getOnlyCorsHeaders,
  getVersionedRoute,
  jsonResponse,
  sitewideFormatSchema,
  textResponse,
  type FormatHandlerConfig,
  type RouteHandlerContext,
} from '@heyclaude/web-runtime/server';
import { z } from 'zod';

type SitewideFormat = 'json' | 'readme' | 'llms-txt' | 'llms';

// Shared LLMs handler (llms and llms-txt are identical)
function handleLlmsFormat(
  result: unknown,
  _format: 'llms-txt' | 'llms',
  _query: { format?: SitewideFormat },
  _body: unknown,
  ctx: RouteHandlerContext<{ format?: SitewideFormat }, unknown>
) {
  const { logger } = ctx;
  const data = result as string | null;
  if (!data) {
    logger.error({}, 'Sitewide LLMs export returned null');
    throw new Error('Sitewide LLMs export failed: RPC returned null or invalid');
  }
  logger.info({ bytes: data.length }, 'Sitewide llms generated');
  return textResponse(
    data,
    200,
    getOnlyCorsHeaders,
    {
      'X-Generated-By': 'prisma.rpc.generate_sitewide_llms_txt',
    }
  );
}

/**
 * GET /api/v1/content/sitewide - Get sitewide content in various formats
 *
 * Serves sitewide content in multiple export formats with optimized caching.
 * Uses format handler factory to eliminate switch/if statements.
 */
export const GET = createFormatHandlerRoute<SitewideFormat, { format?: SitewideFormat }, unknown>({
  route: getVersionedRoute('content/sitewide'),
  operation: 'ContentSitewideAPI',
  method: 'GET',
  cors: 'anon',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: ['content', 'sitewide'],
  querySchema: z.object({
    format: sitewideFormatSchema,
  }),
  defaultFormat: 'llms-txt',
  formats: {
    json: {
      serviceKey: 'content',
      methodName: 'getSitewideContentList',
      methodArgs: () => [{ p_limit: 5000 }],
      responseHandler: (result: unknown, _format: 'json', _query: { format?: SitewideFormat }, _body: unknown, ctx: RouteHandlerContext<{ format?: SitewideFormat }, unknown>) => {
        const { logger } = ctx;
        const data = result as unknown[];
        logger.info({ itemCount: data.length }, 'Sitewide JSON generated');
        return jsonResponse(
          data,
          200,
          getOnlyCorsHeaders,
          {
            Vary: 'Accept-Encoding',
            'X-Generated-By': 'prisma.rpc.get_sitewide_content_list',
          }
        );
      },
    },
    readme: {
      serviceKey: 'content',
      methodName: 'getSitewideReadme',
      methodArgs: () => [],
      responseHandler: (result: unknown, _format: 'readme', _query: { format?: SitewideFormat }, _body: unknown, ctx: RouteHandlerContext<{ format?: SitewideFormat }, unknown>) => {
        const { logger } = ctx;
        const data = result as { categories?: unknown[]; total_count?: number };
        logger.info(
          {
            categoriesCount: data.categories?.length ?? 0,
            totalCount: data.total_count ?? 0,
          },
          'Sitewide README data fetched'
        );
        return jsonResponse(
          data,
          200,
          getOnlyCorsHeaders,
          {
            'X-Generated-By': 'prisma.rpc.generate_readme_data',
          }
        );
      },
    },
    // llms and llms-txt are identical (both supported for backward compatibility)
    'llms-txt': {
      serviceKey: 'content',
      methodName: 'getSitewideLlmsTxt',
      methodArgs: () => [],
      responseHandler: handleLlmsFormat,
    },
    llms: {
      serviceKey: 'content',
      methodName: 'getSitewideLlmsTxt',
      methodArgs: () => [],
      responseHandler: handleLlmsFormat,
    },
  } as Record<SitewideFormat, FormatHandlerConfig<SitewideFormat, { format?: SitewideFormat }, unknown>>,
  openapi: {
    summary: 'Get sitewide content in various formats',
    description:
      'Serves sitewide content in multiple export formats: LLMs text format (default), README JSON data, or complete JSON array. Used for exporting the entire directory content.',
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
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
