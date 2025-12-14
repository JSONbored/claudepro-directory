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
import { ContentService } from '@heyclaude/data-layer';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';
import {
  buildCacheHeaders,
  changelogFormatSchema,
  createApiOptionsHandler,
  createApiRoute,
  getOnlyCorsHeaders,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Cached helper function to fetch changelog LLMs.txt content.
 
 * @returns {unknown} Description of return value*/
async function getCachedChangelogLlmsTxt(): Promise<null | string> {
  'use cache';
  cacheLife({ expire: 2_592_000, revalidate: 21_600, stale: 86_400 }); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  const service = new ContentService();
  return service.getChangelogLlmsTxt();
}

/**
 * GET /api/content/changelog - Get changelog in LLMs.txt format
 *
 * Returns the changelog in LLMs.txt format for AI/LLM consumption.
 * Validates format parameter (must be 'llms-changelog').
 */
export const GET = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, query }) => {
    const { format } = query as { format: 'llms-changelog' };

    logger.info({ format }, 'Changelog index request received');

    const data = await getCachedChangelogLlmsTxt();

    if (!data) {
      logger.warn({}, 'Changelog LLMs.txt not found');
      throw new Error('Changelog LLMs.txt not found or invalid');
    }

    const formatted = data.replaceAll(String.raw`\n`, '\n');

    logger.info(
      {
        bytes: formatted.length,
      },
      'Changelog LLMs.txt generated'
    );

    return new NextResponse(formatted, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'prisma.rpc.generate_changelog_llms_txt',
        ...buildSecurityHeaders(),
        ...getOnlyCorsHeaders,
        ...buildCacheHeaders('content_export'),
      },
      status: 200,
    });
  },
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
  route: '/api/content/changelog',
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
