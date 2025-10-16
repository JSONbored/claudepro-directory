/**
 * next-safe-action - Type-safe Server Actions with Middleware
 *
 * Production-grade server action client with:
 * - Automatic validation with Zod schemas
 * - Centralized logging middleware
 * - Rate limiting middleware (Redis-based)
 * - Authentication middleware (Supabase integration)
 * - Consistent error handling
 * - Full TypeScript type inference
 * - Performance monitoring
 * - Multi-layer CSRF Protection
 *
 * 🔒 CSRF Protection (Defense-in-Depth):
 * Layer 1: CSP form-action directive (middleware.ts)
 *   - Restricts form submissions to same-origin via Nosecone CSP header
 *   - Browser-level enforcement prevents malicious form submissions
 *
 * Layer 2: Next.js Server Actions built-in protection
 *   - POST-only requests with Next.js action header requirement
 *   - Origin header validation matches request origin to host domain
 *   - Same-site cookie enforcement
 *
 * Layer 3: Explicit allowedOrigins validation (next.config.mjs)
 *   - experimental.serverActions.allowedOrigins restricts valid origins
 *   - Configured for claudepro.directory + Vercel preview deployments
 *   - Prevents CSRF even if proxies/load balancers modify headers
 *
 * Layer 4: Request body size limits (next.config.mjs)
 *   - bodySizeLimit: '1mb' prevents DoS via large payloads
 *   - Complements CSRF protection with resource abuse prevention
 *
 * Additional Security:
 * - Rate limiting: Redis-based atomic operations (100 req/60s per IP)
 * - Input validation: Zod schema enforcement on all inputs
 * - Error sanitization: Production-safe error messages (no stack traces)
 * - Session validation: Supabase auth integration for authenticated actions
 *
 * Architecture Benefits:
 * - Reduces boilerplate by ~70% per action
 * - Centralizes cross-cutting concerns (logging, rate limiting, auth)
 * - Provides optimistic updates via useOptimisticAction hook
 * - Better DX with automatic type inference
 * - Eliminates manual try-catch blocks
 *
 * @see https://next-safe-action.dev
 * @see https://docs.arcjet.com/nosecone/reference (CSP configuration)
 */

import { headers } from 'next/headers';
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { z } from 'zod';
import { redisClient } from '@/src/lib/cache.server';
import { SERVER_ACTION_RATE_LIMITS } from '@/src/lib/config/rate-limits.config';
import { logger } from '@/src/lib/logger';

/**
 * Action metadata schema for tracking and observability
 */
const actionMetadataSchema = z.object({
  actionName: z.string().min(1).meta({
    description: 'Unique name for the action (e.g., trackView, trackCopy)',
  }),
  category: z
    .enum(['analytics', 'form', 'content', 'user', 'admin'])
    .optional()
    .meta({ description: 'Action category for grouping' }),
  rateLimit: z
    .object({
      maxRequests: z
        .number()
        .int()
        .positive()
        .default(100)
        .meta({ description: 'Max requests per window' }),
      windowSeconds: z
        .number()
        .int()
        .positive()
        .default(60)
        .meta({ description: 'Time window in seconds' }),
    })
    .optional()
    .meta({ description: 'Override default rate limiting' }),
});

export type ActionMetadata = z.infer<typeof actionMetadataSchema>;

/**
 * Extract client IP from request headers
 * Priority: Cloudflare > X-Forwarded-For > X-Real-IP > Unknown
 */
async function getClientIP(): Promise<string> {
  const headersList = await headers();

  return (
    headersList.get('cf-connecting-ip') ||
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Rate limiting using Redis sorted sets (same implementation as existing actions)
 * Atomic operation using Redis pipeline for thread safety
 */
async function checkRateLimit(
  actionName: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const clientIP = await getClientIP();

    if (clientIP === 'unknown') {
      logger.warn('Rate limit check with unknown IP', { action: actionName });
      return true; // Allow requests without identifiable IP
    }

    const key = `server_action_rate_limit:${actionName}:${clientIP}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const requestCount = await redisClient.executeOperation(
      async (redis) => {
        // Use Redis pipeline for atomic operations
        const pipeline = redis.pipeline();
        pipeline.zremrangebyscore(key, 0, windowStart); // Remove old entries
        pipeline.zadd(key, {
          score: now,
          member: `${now}-${crypto.randomUUID()}`,
        }); // Add current request
        pipeline.zcard(key); // Count requests in window
        pipeline.expire(key, windowSeconds); // Set TTL

        const results = await pipeline.exec();
        if (!results || results.length < 3) {
          throw new Error('Redis pipeline failed');
        }

        return (results[2] as number) || 0;
      },
      () => 0, // Fallback: allow request on Redis failure
      'server_action_rate_limit'
    );

    const allowed = requestCount <= maxRequests;

    if (!allowed) {
      logger.warn('Server action rate limit exceeded', {
        action: actionName,
        clientIP,
        requestCount,
        limit: maxRequests,
      });
    }

    return allowed;
  } catch (error) {
    logger.error(
      'Rate limit check failed',
      error instanceof Error ? error : new Error(String(error)),
      { action: actionName }
    );
    return true; // Fail open: allow request on error
  }
}

/**
 * Base action client with logging and error handling
 */
export const actionClient = createSafeActionClient({
  // Define metadata schema for all actions
  defineMetadataSchema() {
    return actionMetadataSchema;
  },

  // Handle server errors with structured logging
  handleServerError(error) {
    // Log all server errors for observability
    logger.error('Server action error', error instanceof Error ? error : new Error(String(error)), {
      errorType: error.constructor?.name || 'Unknown',
    });

    // Return sanitized error message to client
    // In production, avoid leaking sensitive error details
    if (process.env.NODE_ENV === 'production') {
      return DEFAULT_SERVER_ERROR_MESSAGE; // "Something went wrong"
    }

    // In development, return detailed error for debugging
    return error.message || DEFAULT_SERVER_ERROR_MESSAGE;
  },
}).use(async ({ next }) => {
  // Extract request context for logging
  const startTime = performance.now();
  const clientIP = await getClientIP();
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || 'unknown';

  return next({
    ctx: {
      clientIP,
      userAgent,
      startTime,
    },
  });
});

/**
 * Rate-limited action client
 *
 * Extends base client with rate limiting middleware.
 * Default: 100 requests per 60 seconds per IP.
 * Override via metadata.rateLimit.
 */
export const rateLimitedAction = actionClient.use(async ({ next, metadata, ctx }) => {
  // Validate and parse metadata
  const parsedMetadata = actionMetadataSchema.safeParse(metadata);
  if (!parsedMetadata.success) {
    logger.error('Invalid action metadata', new Error(parsedMetadata.error.message), {
      metadataProvided: JSON.stringify(metadata),
    });
    throw new Error('Invalid action configuration');
  }

  const { actionName, category, rateLimit } = parsedMetadata.data;

  // Apply rate limiting with centralized defaults
  const defaultConfig =
    SERVER_ACTION_RATE_LIMITS[category as keyof typeof SERVER_ACTION_RATE_LIMITS] ??
    SERVER_ACTION_RATE_LIMITS.default;
  const allowed = await checkRateLimit(
    actionName,
    rateLimit?.maxRequests ?? defaultConfig.maxRequests,
    rateLimit?.windowSeconds ?? defaultConfig.windowSeconds
  );

  if (!allowed) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Log action execution start
  logger.info(`Action started: ${actionName}`, {
    actionName,
    category: category || 'uncategorized',
    clientIP: ctx.clientIP,
    userAgent: ctx.userAgent,
  });

  // Execute the action
  const result = await next();

  // Log action completion with timing
  const duration = performance.now() - ctx.startTime;
  logger.info(`Action completed: ${actionName}`, {
    actionName,
    category: category || 'uncategorized',
    duration: Number(duration.toFixed(2)),
    success: result.data !== undefined,
  });

  return result;
});

/**
 * Authenticated action client
 * SHA-3153: Implemented with Supabase auth integration
 *
 * Extends rateLimitedAction with authentication middleware.
 * Automatically validates user session and attaches userId to context.
 *
 * Usage:
 * ```ts
 * export const updateProfile = authedAction
 *   .metadata({
 *     actionName: 'updateProfile',
 *     category: 'user',
 *   })
 *   .schema(updateProfileSchema)
 *   .action(async ({ parsedInput: { name, email }, ctx }) => {
 *     const { userId } = ctx; // userId automatically available
 *     await db.user.update({ where: { id: userId }, data: { name, email } });
 *     return { success: true };
 *   });
 * ```
 */
export const authedAction = rateLimitedAction.use(async ({ next, metadata }) => {
  // Import Supabase client dynamically to avoid circular dependencies
  const { createClient } = await import('@/src/lib/supabase/server');
  const supabase = await createClient();

  // Get authenticated user from Supabase session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const warnData: Record<string, string> = {
      actionName: metadata?.actionName || 'unknown',
    };
    if (error?.message) warnData.error = error.message;

    logger.warn('Unauthorized action attempt', warnData);
    throw new Error('Unauthorized. Please sign in to continue.');
  }

  // Log authenticated action
  const logData: Record<string, string> = {
    actionName: metadata?.actionName || 'unknown',
    userId: user.id,
  };
  if (user.email) logData.userEmail = user.email;

  logger.info(`Authenticated action: ${metadata?.actionName}`, logData);

  // Attach userId to context for use in action handler
  const authCtx: { userId: string; userEmail?: string } = {
    userId: user.id,
  };
  if (user.email) authCtx.userEmail = user.email;

  return next({
    ctx: authCtx,
  });
});

/**
 * Example action patterns (for documentation)
 *
 * Basic action (no rate limiting):
 * ```ts
 * export const getStats = actionClient(
 *   z.object({ category: z.string() }),
 *   async ({ category }) => {
 *     const stats = await fetchStats(category);
 *     return { success: true, data: stats };
 *   }
 * );
 * ```
 *
 * Rate-limited action:
 * ```ts
 * export const trackView = rateLimitedAction(
 *   trackingParamsSchema,
 *   async ({ category, slug }) => {
 *     const viewCount = await statsRedis.incrementView(category, slug);
 *     return { success: true, viewCount };
 *   },
 *   { metadata: { actionName: 'trackView', category: 'analytics' } }
 * );
 * ```
 *
 * Custom rate limit:
 * ```ts
 * export const submitForm = rateLimitedAction(
 *   formSchema,
 *   async (data) => {
 *     await processForm(data);
 *     return { success: true };
 *   },
 *   {
 *     metadata: {
 *       actionName: 'submitForm',
 *       category: 'form',
 *       rateLimit: { maxRequests: 5, windowSeconds: 300 }, // 5 per 5 minutes
 *     },
 *   }
 * );
 * ```
 *
 * Authenticated action:
 * ```ts
 * export const deleteAccount = authedAction
 *   .metadata({
 *     actionName: 'deleteAccount',
 *     category: 'user',
 *   })
 *   .schema(z.object({ confirm: z.literal(true) }))
 *   .action(async ({ parsedInput: { confirm }, ctx }) => {
 *     const { userId } = ctx; // Auto-populated from Supabase session
 *     await db.user.delete({ where: { id: userId } });
 *     return { success: true };
 *   });
 * ```
 */
