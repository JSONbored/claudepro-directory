/**
 * On-Demand ISR Revalidation - Realtime-Based Architecture
 * Called by edge function via Supabase Realtime (logical replication)
 *
 * Flow: Database Trigger → Table Change → Realtime (postgres_changes) → Edge Function → This API Route
 *
 * Payload format from edge function:
 * {
 *   "secret": "REVALIDATE_SECRET",
 *   "category": "agents",
 *   "slug": "code-reviewer",
 *   "tags": ["content", "homepage", "trending"]
 * }
 *
 * Runtime: Node.js (required for revalidatePath/revalidateTag)
 */
import { env } from '@heyclaude/shared-runtime/schemas/env';
import {
  generateRequestId,
  logger,
  normalizeError,
  handleApiError,
} from '@heyclaude/web-runtime/logging/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

// Zod schema for revalidate request
const RevalidateRequestSchema = z.object({
  secret: z.string(),
  category: z.string().optional(),
  slug: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  // Generate single requestId for this API request
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'RevalidateAPI',
    route: '/api/revalidate',
    module: 'apps/web/src/app/api/revalidate',
  });

  try {
    // Validate request body immediately with Zod (no intermediate unsafe variable)
    const parseResult = RevalidateRequestSchema.safeParse(await request.json());

    if (!parseResult.success) {
      // Serialize Zod errors for logging (convert to JSON-serializable format)
      const zodErrors = parseResult.error.issues.map((issue) => ({
        code: issue.code,
        path: issue.path.join('.'),
        message: issue.message,
      }));

      reqLogger.warn('Revalidate webhook invalid payload', {
        zodErrors,
      });
      return NextResponse.json(
        { error: 'Invalid request payload', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { secret, category, slug, tags } = parseResult.data;

    // Verify secret from body (PostgreSQL trigger sends in payload)
    if (!secret || secret !== env.REVALIDATE_SECRET) {
      reqLogger.warn('Revalidate webhook unauthorized', {
        hasSecret: Boolean(secret),
        // eslint-disable-next-line architectural-rules/warn-pii-field-logging -- IP address necessary for security audit trail
        ip: request.headers.get('x-forwarded-for') ?? 'unknown',
        securityEvent: true,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      // Using 'max' profile for stale-while-revalidate semantics (recommended in Next.js 16)
      for (const tag of tags) {
        revalidateTag(tag, 'max');
        invalidatedTags.push(tag);
      }
    }

    // If neither category nor tags provided, return error
    if (!category && (!tags || tags.length === 0)) {
      reqLogger.warn('Revalidate webhook invalid payload', {
        hasCategory: Boolean(category),
        hasTags: Boolean(tags),
        securityEvent: true,
      });
      return NextResponse.json(
        { error: 'Missing category or tags in webhook payload' },
        { status: 400 }
      );
    }

    // Structured logging with revalidation targets and cache tags
    reqLogger.info('Revalidated successfully', {
      operation: 'cache_revalidation',
      securityEvent: true,
      ...(category ? { category } : {}),
      ...(slug ? { slug } : {}),
      paths, // Array of revalidated paths - better for querying
      pathCount: paths.length,
      tags: invalidatedTags.length > 0 ? invalidatedTags : undefined, // Array support enables better log querying
      tagCount: invalidatedTags.length,
      revalidationTargets: {
        paths,
        tags: invalidatedTags,
      },
    });

    return NextResponse.json({
      revalidated: true,
      ...(paths.length > 0 && { paths }),
      ...(invalidatedTags.length > 0 && { tags: invalidatedTags }),
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const normalized = normalizeError(error, 'Revalidate API error');
    reqLogger.error('Revalidate API error', normalized, {
      section: 'error-handling',
    });
    return handleApiError(error, {
      route: '/api/revalidate',
      operation: 'RevalidateAPI',
      method: 'POST',
    });
  }
}
