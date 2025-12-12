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
import { createApiRoute, createApiOptionsHandler, unauthorizedResponse, getOnlyCorsHeaders } from '@heyclaude/web-runtime/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Zod schema for revalidate request body validation
 * 
 * Note: `secret` is optional in schema to allow handler to return 401 instead of 400
 * when secret is missing. Handler will validate secret and return 401 if missing/invalid.
 */
const revalidateRequestSchema = z.object({
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
  route: '/api/revalidate',
  operation: 'RevalidateAPI',
  method: 'POST',
  cors: 'anon',
  bodySchema: revalidateRequestSchema,
  openapi: {
    summary: 'Trigger on-demand ISR revalidation',
    description: 'Trigger on-demand ISR revalidation and cache tag invalidation for specified targets. Called by edge function via Supabase Realtime (logical replication).',
    tags: ['cache', 'revalidation', 'webhook'],
    operationId: 'revalidate',
    responses: {
      200: {
        description: 'Revalidation completed successfully',
      },
      401: {
        description: 'Unauthorized - invalid secret',
      },
      400: {
        description: 'Invalid request payload or missing category/tags',
      },
    },
  },
  handler: async ({ logger, request, body }) => {
    // Zod schema ensures proper types
    const { category, secret, slug, tags } = body;

    // Verify secret from body (PostgreSQL trigger sends in payload)
    // Note: If secret is missing, Zod validation will catch it and return 400
    // But if secret is provided but invalid, we return 401
    if (!secret) {
      // Secret is required by schema, so this should be caught by validation
      // But handle it here as a safety check
      logger.warn(
        {
          hasSecret: false,
          // eslint-disable-next-line architectural-rules/warn-pii-field-logging -- IP address necessary for security audit trail
          ip: request.headers.get('x-forwarded-for') ?? 'unknown',
          securityEvent: true,
        },
        'Revalidate webhook missing secret'
      );
      return unauthorizedResponse(
        'Missing secret parameter',
        undefined, // No login/signup for automation endpoints
        getOnlyCorsHeaders
      );
    }

    if (secret !== env.REVALIDATE_SECRET) {
      logger.warn(
        {
          hasSecret: true,
          // eslint-disable-next-line architectural-rules/warn-pii-field-logging -- IP address necessary for security audit trail
          ip: request.headers.get('x-forwarded-for') ?? 'unknown',
          securityEvent: true,
        },
        'Revalidate webhook unauthorized'
      );
      return unauthorizedResponse(
        'Invalid secret',
        undefined, // No login/signup for automation endpoints
        getOnlyCorsHeaders
      );
    }

    const paths: string[] = [];
    const invalidatedTags: string[] = [];

    // Path revalidation (existing logic)
    if (category) {
      // Always revalidate homepage (shows recent content)
      paths.push('/', `/${category}`);

      // Revalidate detail page if slug provided
      if (slug) {
        paths.push(`/${category}/${slug}`);
      }

      // Revalidate all paths
      for (const path of paths) {
        revalidatePath(path);
      }
    }

    // Tag invalidation (new logic)
    if (tags && tags.length > 0) {
      // Invalidate each tag (already validated as strings by Zod)
      // Using 'max' profile for stale-while-revalidate semantics (recommended)
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

    // Structured logging with revalidation targets and cache tags
    logger.info(
      {
        operation: 'cache_revalidation',
        securityEvent: true,
        ...(category ? { category } : {}),
        ...(slug ? { slug } : {}),
        pathCount: paths.length,
        paths, // Array of revalidated paths - better for querying
        revalidationTargets: {
          paths,
          tags: invalidatedTags,
        },
        tagCount: invalidatedTags.length,
        tags: invalidatedTags.length > 0 ? invalidatedTags : undefined, // Array support enables better log querying
      },
      'Cache revalidation completed'
    );

    return NextResponse.json({
      revalidated: true,
      ...(paths.length > 0 && { paths }),
      ...(invalidatedTags.length > 0 && { tags: invalidatedTags }),
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
