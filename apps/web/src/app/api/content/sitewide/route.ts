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
  errorResponseSchema,
  sitewideContentResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import {
  createFormatHandlerRoute, createOptionsHandler as createApiOptionsHandler, type FormatHandlerConfig, type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { sitewideFormatSchema } from '@heyclaude/web-runtime/api/schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import {
  getOnlyCorsHeaders,
  jsonResponse,
  textResponse,
} from '@heyclaude/web-runtime/server/api-helpers';
import { z } from 'zod';

/**
 * Query schema for sitewide content API
 * Exported for OpenAPI generation
 */
export const sitewideContentQuerySchema = z.object({
  format: sitewideFormatSchema,
});

type SitewideFormat = 'json' | 'llms' | 'llms-txt' | 'readme';

// Shared LLMs handler (llms and llms-txt are identical)
function handleLlmsFormat(
  result: unknown,
  _format: 'llms' | 'llms-txt',
  _query: { format?: SitewideFormat },
  _body: unknown,
  ctx: RouteHandlerContext<{ format?: SitewideFormat }>
) {
  const { logger } = ctx;
  const data = result as null | string;
  if (!data) {
    logger.error({}, 'Sitewide LLMs export returned null');
    throw new Error('Sitewide LLMs export failed: RPC returned null or invalid');
  }
  logger.info({ bytes: data.length }, 'Sitewide llms generated');
  return textResponse(data, 200, getOnlyCorsHeaders, {
    'X-Generated-By': 'prisma.rpc.generate_sitewide_llms_txt',
  });
}

/**
 * GET /api/v1/content/sitewide - Get sitewide content in various formats
 *
 * Serves sitewide content in multiple export formats with optimized caching.
 * Uses format handler factory to eliminate switch/if statements.
 */
export const GET = createFormatHandlerRoute<SitewideFormat, { format?: SitewideFormat }>({
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: ['content', 'sitewide'],
  cors: 'anon',
  defaultFormat: 'llms-txt',
  formats: {
    json: {
      methodArgs: () => [{ p_limit: 5000 }],
      methodName: 'getSitewideContentList',
      responseHandler: (
        result: unknown,
        _format: 'json',
        _query: { format?: SitewideFormat },
        _body: unknown,
        ctx: RouteHandlerContext<{ format?: SitewideFormat }>
      ) => {
        const { logger } = ctx;
        const data = result as unknown[];
        logger.info({ itemCount: data.length }, 'Sitewide JSON generated');
        return jsonResponse(data, 200, getOnlyCorsHeaders, {
          Vary: 'Accept-Encoding',
          'X-Generated-By': 'prisma.rpc.get_sitewide_content_list',
        });
      },
      serviceKey: 'content',
    },
    llms: {
      methodArgs: () => [],
      methodName: 'getSitewideLlmsTxt',
      responseHandler: handleLlmsFormat,
      serviceKey: 'content',
    },
    // llms and llms-txt are identical (both supported for backward compatibility)
    'llms-txt': {
      methodArgs: () => [],
      methodName: 'getSitewideLlmsTxt',
      responseHandler: handleLlmsFormat,
      serviceKey: 'content',
    },
    readme: {
      methodArgs: () => [],
      methodName: 'getSitewideReadme',
      responseHandler: (
        result: unknown,
        _format: 'readme',
        _query: { format?: SitewideFormat },
        _body: unknown,
        ctx: RouteHandlerContext<{ format?: SitewideFormat }>
      ) => {
        const { logger } = ctx;
        const data = result as { categories?: unknown[]; total_count?: number };
        logger.info(
          {
            categoriesCount: data.categories?.length ?? 0,
            totalCount: data.total_count ?? 0,
          },
          'Sitewide README data fetched'
        );
        return jsonResponse(data, 200, getOnlyCorsHeaders, {
          'X-Generated-By': 'prisma.rpc.generate_readme_data',
        });
      },
      serviceKey: 'content',
    },
  } as Record<SitewideFormat, FormatHandlerConfig<SitewideFormat, { format?: SitewideFormat }>>,
  method: 'GET',
  openapi: {
    description:
      'Serves sitewide content in multiple export formats: LLMs text format (default), README JSON data, or complete JSON array. Used for exporting the entire directory content.',
    operationId: 'getSitewideContent',
    responses: {
      200: {
        description: 'Sitewide content retrieved successfully in requested format',
        example:
          '# Sitewide Content\n\n## Skills\n- Example Skill 1\n- Example Skill 2\n\n## Agents\n- Example Agent 1',
        headers: {
          'Cache-Control': {
            description: 'Cache control directive',
            schema: { type: 'string' },
          },
          'Content-Type': {
            description:
              'Content type (text/plain for llms formats, application/json for json/readme)',
            schema: { type: 'string' },
          },
          'X-Generated-By': {
            description: 'Source of the response data',
            schema: { type: 'string' },
          },
        },
        schema: sitewideContentResponseSchema,
      },
      400: {
        description: 'Invalid format parameter',
        example: {
          error: 'Invalid format parameter',
          message: 'Invalid format. Valid formats: llms, llms-txt, readme, json',
        },
        schema: errorResponseSchema,
      },
      500: {
        description: 'Failed to generate sitewide export',
        example: {
          error: 'Failed to generate sitewide export',
          message: 'An unexpected error occurred while generating sitewide content',
        },
        schema: errorResponseSchema,
      },
    },
    summary: 'Get sitewide content in various formats',
    tags: ['content', 'export', 'sitewide'],
  },
  operation: 'ContentSitewideAPI',
  querySchema: sitewideContentQuerySchema,
  route: getVersionedRoute('content/sitewide'),
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
