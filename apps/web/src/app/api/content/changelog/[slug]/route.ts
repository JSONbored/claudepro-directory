/**
 * Changelog Entry API Route
 *
 * Returns a changelog entry as an LLMs-compliant plain-text file for the given slug.
 * Validates the format query parameter (must be 'llms-entry').
 *
 * @example
 * ```ts
 * // Request
 * GET /api/content/changelog/1-2-0-2025-12-07?format=llms-entry
 *
 * // Response (200) - text/plain
 * # Changelog Entry
 * ...
 * ```
 */

import 'server-only';
import {
  createOptionsHandler as createApiOptionsHandler,
  createCachedApiRoute,
  type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { changelogEntryFormatSchema } from '@heyclaude/web-runtime/api/schemas';
import {
  changelogEntryResponseSchema,
  errorResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, textResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { notFoundResponse } from '@heyclaude/web-runtime/server/not-found-response';
import { z } from 'zod';

/**
 * Query schema for changelog entry API
 * Exported for OpenAPI generation
 */
export const changelogEntryQuerySchema = z.object({
  format: changelogEntryFormatSchema,
});

/**
 * GET /api/content/changelog/[slug] - Get changelog entry in LLMs.txt format
 *
 * Returns a changelog entry as an LLMs-compliant plain-text file for the given slug.
 * Validates the format query parameter (must be 'llms-entry').
 *
 * OPTIMIZATION: Uses createCachedApiRoute to eliminate cached helper function boilerplate.
 */
export const GET = createCachedApiRoute({
  cacheLife: { expire: 2_592_000, revalidate: 21_600, stale: 86_400 }, // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: (_query: unknown, _body: unknown, routeParams?: Record<string, string>) => {
    const slug = routeParams?.['slug'] ?? '';
    return ['changelog', 'changelog-entry', `changelog-entry-${slug}`];
  },
  cors: 'anon',
  method: 'GET',
  openapi: {
    description:
      "Returns a changelog entry as an LLMs-compliant plain-text file for the given slug. Validates the format query parameter (must be 'llms-entry').",
    operationId: 'getChangelogEntry',
    responses: {
      200: {
        description: 'Changelog entry LLMs.txt content retrieved successfully',
        schema: changelogEntryResponseSchema,
        headers: {
          'Content-Type': {
            schema: { type: 'string' },
            description: 'Content type (text/plain)',
          },
          'Cache-Control': {
            schema: { type: 'string' },
            description: 'Cache control directive',
          },
          'X-Generated-By': {
            schema: { type: 'string' },
            description: 'Source of the response data',
          },
        },
        example:
          '# Changelog Entry\n\n## [1.2.0] - 2025-12-07\n\n### Added\n- New feature X\n- New feature Y\n\n### Fixed\n- Bug fix A\n- Bug fix B',
      },
      400: {
        description: 'Invalid format parameter',
        schema: errorResponseSchema,
        example: {
          error: 'Invalid format parameter',
          message: 'Invalid format. Valid format: llms-entry',
        },
      },
      404: {
        description: 'Changelog entry not found',
        schema: errorResponseSchema,
        example: {
          error: 'Changelog entry not found',
          message: 'No changelog entry found with slug "invalid-slug"',
        },
      },
      500: {
        description: 'Internal server error',
        schema: errorResponseSchema,
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while generating changelog entry',
        },
      },
    },
    summary: 'Get changelog entry in LLMs.txt format',
    tags: ['content', 'changelog', 'export'],
  },
  operation: 'ChangelogEntryAPI',
  querySchema: changelogEntryQuerySchema,
  responseHandler: (result: unknown, _query: unknown, _body: unknown, ctx: RouteHandlerContext) => {
    const { logger } = ctx;
    const data = result as null | string;

    if (!data) {
      logger.warn({}, 'Changelog entry LLMs.txt not found');
      return notFoundResponse('Changelog entry LLMs.txt not found', 'ChangelogEntry');
    }

    const formatted = data.replaceAll(String.raw`\n`, '\n');
    logger.info({ bytes: formatted.length }, 'Changelog entry LLMs.txt generated');
    return textResponse(formatted, 200, getOnlyCorsHeaders, {
      'X-Generated-By': 'prisma.rpc.generate_changelog_entry_llms_txt',
    });
  },
  route: getVersionedRoute('content/changelog/[slug]'),
  service: {
    getRouteParams: async (nextContext: unknown) => {
      interface RouteContext {
        params: Promise<{ slug: string }>;
      }
      const context = nextContext as RouteContext;
      if (!context?.params) {
        throw new Error('Missing route context');
      }
      return await context.params;
    },
    methodArgs: (
      _query: { format: 'llms-entry' },
      _body: unknown,
      routeParams?: Record<string, string>
    ) => {
      const slug = routeParams?.['slug'];
      if (!slug) {
        throw new Error('Missing slug in route params');
      }
      return [{ p_slug: slug }];
    },
    methodName: 'getChangelogEntryLlmsTxt',
    serviceKey: 'content',
  } as Parameters<typeof createCachedApiRoute<{ format: 'llms-entry' }, unknown>>[0]['service'],
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
