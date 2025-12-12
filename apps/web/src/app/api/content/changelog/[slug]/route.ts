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
import { ContentService } from '@heyclaude/data-layer';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';
import { createApiRoute, createApiOptionsHandler, changelogEntryFormatSchema } from '@heyclaude/web-runtime/server';
import {
  buildCacheHeaders,
  createSupabaseAnonClient,
  getOnlyCorsHeaders,
} from '@heyclaude/web-runtime/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/content/changelog/[slug] - Get changelog entry in LLMs.txt format
 * 
 * Returns a changelog entry as an LLMs-compliant plain-text file for the given slug.
 * Validates the format query parameter (must be 'llms-entry').
 */
export const GET = createApiRoute({
  route: '/api/content/changelog/[slug]',
  operation: 'ChangelogEntryAPI',
  method: 'GET',
  cors: 'anon',
  querySchema: z.object({
    format: changelogEntryFormatSchema,
  }),
  openapi: {
    summary: 'Get changelog entry in LLMs.txt format',
    description: 'Returns a changelog entry as an LLMs-compliant plain-text file for the given slug. Validates the format query parameter (must be \'llms-entry\').',
    tags: ['content', 'changelog', 'export'],
    operationId: 'getChangelogEntry',
    responses: {
      200: {
        description: 'Changelog entry LLMs.txt content retrieved successfully',
      },
      400: {
        description: 'Invalid format parameter',
      },
      404: {
        description: 'Changelog entry not found',
      },
    },
  },
  handler: async ({ logger, query, nextContext }) => {
    // Extract path parameter from Next.js route context
    interface RouteContext {
      params: Promise<{ slug: string }>;
    }
    const context = nextContext as RouteContext;
    if (!context || !context.params) {
      logger.error({}, 'Missing route context for changelog entry handler');
      throw new Error('Missing route context');
    }

    const { slug } = await context.params;

    // Zod schema ensures proper types
    const { format } = query;

    logger.info({ format, slug }, 'Changelog entry request received');

      const supabase = createSupabaseAnonClient();
      const service = new ContentService(supabase);
      const data = await service.getChangelogEntryLlmsTxt({ p_slug: slug });

      if (!data) {
        logger.warn({ slug }, 'Changelog entry LLMs.txt not found');
        return NextResponse.json(
          { error: 'Changelog entry LLMs.txt not found' },
          {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              ...buildSecurityHeaders(),
              ...getOnlyCorsHeaders,
            },
            status: 404,
          }
        );
      }

      const formatted = data.replaceAll(String.raw`\n`, '\n');

      logger.info(
        {
          bytes: formatted.length,
          slug,
        },
        'Changelog entry LLMs.txt generated'
      );

      return new NextResponse(formatted, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Generated-By': 'supabase.rpc.generate_changelog_entry_llms_txt',
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
