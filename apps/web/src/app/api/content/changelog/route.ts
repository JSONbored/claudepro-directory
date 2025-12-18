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
  createOptionsHandler as createApiOptionsHandler,
  createCachedApiRoute,
  type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, textResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { changelogFormatSchema } from '@heyclaude/web-runtime/api/schemas';
import { z } from 'zod';

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
      },
      400: {
        description: 'Invalid format parameter',
      },
    },
    summary: 'Get changelog in LLMs.txt format',
    tags: ['content', 'changelog', 'export'],
  },
  operation: 'ChangelogIndexAPI',
  querySchema: z.object({
    format: changelogFormatSchema,
  }),
  responseHandler: (result: unknown, _query: unknown, _body: unknown, ctx: RouteHandlerContext<unknown, unknown>) => {
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
