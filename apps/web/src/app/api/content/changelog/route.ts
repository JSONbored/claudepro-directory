/**
 * Changelog Index API Route
 *
 * Returns the changelog in LLMs.txt format for AI/LLM consumption.
 * Used for exporting changelog data in a standardized text format.
 *
 * @example
 * ```ts
 * // Request
 * GET /api/content/changelog?format=llms-changelog
 *
 * // Response (200) - text/plain
 * # Changelog
 *
 * ## [1.0.0] - 2025-01-11
 * - Added new feature
 * - Fixed bug
 * ```
 */

import 'server-only';
import {
  changelogResponseSchema,
  errorResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import {
  createOptionsHandler as createApiOptionsHandler,
  createCachedApiRoute,
  type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { changelogFormatSchema } from '@heyclaude/web-runtime/api/schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, textResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { z } from 'zod';

/**
 * Query schema for changelog index API
 * Exported for OpenAPI generation
 */
export const changelogQuerySchema = z.object({
  format: changelogFormatSchema,
});

/**
 * GET /api/content/changelog - Get changelog in LLMs.txt format
 *
 * Returns the changelog in LLMs.txt format for AI/LLM consumption.
 * Validates format parameter (must be 'llms-changelog').
 *
 * OPTIMIZATION: Uses createCachedApiRoute to eliminate cached helper function boilerplate.
 */
export const GET = createCachedApiRoute({
  cacheLife: { expire: 2_592_000, revalidate: 21_600, stale: 86_400 }, // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: ['changelog', 'changelog-llms-txt'],
  cors: 'anon',
  method: 'GET',
  openapi: {
    description:
      'Returns the changelog in LLMs.txt format for AI/LLM consumption. Used for exporting changelog data in a standardized text format.',
    operationId: 'getChangelogIndex',
    responses: {
      200: {
        description: 'Changelog LLMs.txt content retrieved successfully',
        example:
          '# Changelog\n\n## [1.0.0] - 2025-01-11\n- Added new feature\n- Fixed bug\n\n## [0.9.0] - 2025-01-10\n- Initial release',
        headers: {
          'Cache-Control': {
            description: 'Cache control directive',
            schema: { type: 'string' },
          },
          'Content-Type': {
            description: 'Content type (text/plain)',
            schema: { type: 'string' },
          },
          'X-Generated-By': {
            description: 'Source of the response data',
            schema: { type: 'string' },
          },
        },
        schema: changelogResponseSchema,
      },
      400: {
        description: 'Invalid format parameter',
        example: {
          error: 'Invalid format parameter',
          message: 'Invalid format. Valid format: llms-changelog',
        },
        schema: errorResponseSchema,
      },
      500: {
        description: 'Internal server error',
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while generating changelog',
        },
        schema: errorResponseSchema,
      },
    },
    summary: 'Get changelog in LLMs.txt format',
    tags: ['content', 'changelog', 'export'],
  },
  operation: 'ChangelogIndexAPI',
  querySchema: changelogQuerySchema,
  responseHandler: (result: unknown, _query: unknown, _body: unknown, ctx: RouteHandlerContext) => {
    const { logger } = ctx;
    const data = result as null | string;

    if (!data) {
      logger.warn({}, 'Changelog LLMs.txt not found');
      throw new Error('Changelog LLMs.txt not found or invalid');
    }

    const formatted = data.replaceAll(String.raw`\n`, '\n');
    logger.info({ bytes: formatted.length }, 'Changelog LLMs.txt generated');
    return textResponse(formatted, 200, getOnlyCorsHeaders, {
      'X-Generated-By': 'prisma.rpc.generate_changelog_llms_txt',
    });
  },
  route: getVersionedRoute('content/changelog'),
  service: {
    methodArgs: () => [],
    methodName: 'getChangelogLlmsTxt',
    serviceKey: 'content',
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
