/**
 * On-Demand ISR Revalidation - Realtime-Based Architecture
 *
 * Called by edge function via Supabase Realtime (logical replication).
 * Flow: Database Trigger → Table Change → Realtime (postgres_changes) → Edge Function → This API Route
 *
 * @example
 * ```ts
 * // Request
 * POST /api/revalidate
 * Content-Type: application/json
 *
 * {
 *   "secret": "REVALIDATE_SECRET",
 *   "category": "agents",
 *   "slug": "code-reviewer",
 *   "tags": ["content", "homepage", "trending"]
 * }
 *
 * // Response (200)
 * {
 *   "revalidated": true,
 *   "paths": ["/", "/agents", "/agents/code-reviewer"],
 *   "tags": ["content", "homepage", "trending"],
 *   "timestamp": "2025-01-11T12:00:00Z"
 * }
 * ```
 *
 * Runtime: Node.js (required for revalidatePath/revalidateTag)
 */
import 'server-only';
import { env } from '@heyclaude/shared-runtime/schemas/env';
import {
  createApiRoute,
  createOptionsHandler as createApiOptionsHandler,
} from '@heyclaude/web-runtime/api/route-factory';
import {
  errorResponseSchema,
  revalidationResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import {
  getOnlyCorsHeaders,
  jsonResponse,
  unauthorizedResponse,
} from '@heyclaude/web-runtime/server/api-helpers';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

/**
 * Zod schema for revalidate request body validation
 * Exported for OpenAPI generation
 *
 * Note: `secret` is optional in schema to allow handler to return 401 instead of 400
 * when secret is missing. Handler will validate secret and return 401 if missing/invalid.
 */
export const revalidateRequestSchema = z.object({
  category: z.string().optional().describe('Content category to revalidate'),
  secret: z.string().optional().describe('Revalidation secret token'),
  slug: z.string().optional().describe('Content slug to revalidate'),
  tags: z.array(z.string()).optional().describe('Cache tags to invalidate'),
});

/**
 * POST /api/revalidate - Trigger on-demand ISR revalidation
 *
 * Validates the JSON payload, verifies the secret, revalidates Next.js paths derived from
 * `category`/`slug`, invalidates the provided cache `tags`, logs the outcome, and returns a
 * JSON summary of the revalidation actions.
 */
export const POST = createApiRoute({
  bodySchema: revalidateRequestSchema,
  cors: 'anon',
  handler: async ({ body, logger, request }) => {
    // Zod schema ensures proper types
    const { category, secret, slug, tags } = body;

    // Validate secret (required for security)
    if (!secret || secret !== env.REVALIDATE_SECRET) {
      logger.warn(
        {
          hasSecret: Boolean(secret),
          // eslint-disable-next-line architectural-rules/warn-pii-field-logging -- IP address necessary for security audit trail
          ip: request.headers.get('x-forwarded-for') ?? 'unknown',
          securityEvent: true,
        },
        'Revalidate webhook unauthorized'
      );
      return unauthorizedResponse(
        secret ? 'Invalid secret' : 'Missing secret parameter',
        undefined,
        getOnlyCorsHeaders
      );
    }

    const paths: string[] = [];
    const invalidatedTags: string[] = [];

    // Path revalidation
    if (category) {
      paths.push('/', `/${category}`);
      if (slug) paths.push(`/${category}/${slug}`);
      for (const path of paths) revalidatePath(path);
    }

    // Tag invalidation
    if (tags?.length) {
      for (const tag of tags) {
        revalidateTag(tag, 'max');
        invalidatedTags.push(tag);
      }
    }

    // If neither category nor tags provided, return error
    if (!category && (!tags || tags.length === 0)) {
      logger.warn(
        {
          hasCategory: Boolean(category),
          hasTags: Boolean(tags),
          securityEvent: true,
        },
        'Revalidate webhook invalid payload'
      );
      throw new Error('Missing category or tags in webhook payload');
    }

    logger.info(
      {
        operation: 'cache_revalidation',
        securityEvent: true,
        ...(category && { category }),
        ...(slug && { slug }),
        pathCount: paths.length,
        paths,
        tagCount: invalidatedTags.length,
        tags: invalidatedTags.length > 0 ? invalidatedTags : undefined,
      },
      'Cache revalidation completed'
    );

    return jsonResponse(
      {
        revalidated: true,
        ...(paths.length > 0 && { paths }),
        ...(invalidatedTags.length > 0 && { tags: invalidatedTags }),
        timestamp: new Date().toISOString(),
      },
      200,
      getOnlyCorsHeaders
    );
  },
  method: 'POST',
  openapi: {
    description:
      'Trigger on-demand ISR revalidation and cache tag invalidation for specified targets. Called by edge function via Supabase Realtime (logical replication).',
    operationId: 'revalidate',
    security: [{ bearerAuth: [] }],
    requestBody: {
      description:
        'Revalidation request with secret token, optional category/slug for path revalidation, and optional tags for cache invalidation',
      required: true,
    },
    responses: {
      200: {
        description: 'Revalidation completed successfully',
        schema: revalidationResponseSchema,
        headers: {
          'X-RateLimit-Remaining': {
            schema: { type: 'string' },
            description: 'Remaining rate limit requests',
          },
        },
        example: {
          revalidated: true,
          paths: ['/', '/agents', '/agents/code-reviewer'],
          tags: ['content', 'homepage', 'trending'],
          timestamp: '2025-01-11T12:00:00Z',
        },
      },
      400: {
        description: 'Invalid request payload or missing category/tags',
        schema: errorResponseSchema,
        example: {
          error: 'Invalid request payload',
          message: 'Missing category or tags in webhook payload',
        },
      },
      401: {
        description: 'Unauthorized - invalid secret',
        schema: errorResponseSchema,
        headers: {
          'WWW-Authenticate': {
            schema: { type: 'string' },
            description: 'Authentication challenge',
          },
        },
        example: {
          error: 'Unauthorized',
          message: 'Missing secret parameter',
        },
      },
      500: {
        description: 'Internal server error',
        schema: errorResponseSchema,
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred during revalidation',
        },
      },
    },
    summary: 'Trigger on-demand ISR revalidation',
    tags: ['cache', 'revalidation', 'webhook'],
  },
  operation: 'RevalidateAPI',
  route: getVersionedRoute('revalidate'),
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
