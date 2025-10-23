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
import { logger } from '@/src/lib/logger';
import { logAuthFailure } from '@/src/lib/security/security-monitor.server';

/**
 * Action metadata schema for tracking and observability
 * REMOVED: rateLimit field - using Arcjet tokenBucket in middleware instead
 */
const actionMetadataSchema = z.object({
  actionName: z.string().min(1).meta({
    description: 'Unique name for the action (e.g., trackView, trackCopy)',
  }),
  category: z
    .enum(['analytics', 'form', 'content', 'user', 'admin', 'reputation'])
    .optional()
    .meta({ description: 'Action category for grouping' }),
});

export type ActionMetadata = z.infer<typeof actionMetadataSchema>;

// REMOVED: Redis-based rate limiting for Server Actions (~50K commands/month)
// Relying on Arcjet tokenBucket in middleware for all rate limiting
// Arcjet provides: 60 req/min burst capacity with token bucket algorithm
// Savings: ~50K Redis commands/month

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
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || 'unknown';

  return next({
    ctx: {
      userAgent,
      startTime,
    },
  });
});

/**
 * Logged action client
 *
 * Extends base client with logging middleware.
 * REMOVED: Rate limiting (now handled by Arcjet in middleware)
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

  const { actionName, category } = parsedMetadata.data;

  // Log action execution start
  logger.info(`Action started: ${actionName}`, {
    actionName,
    category: category || 'uncategorized',
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

  logger.info('authedAction getUser result', {
    hasUser: !!user,
    userId: user?.id ?? 'none',
    hasError: !!error,
    errorMessage: error?.message ?? 'none',
    actionName: metadata?.actionName ?? 'unknown',
  });

  if (error || !user) {
    // Extract client IP and path for security monitoring
    const headersList = await headers();
    const clientIP =
      headersList.get('cf-connecting-ip') ||
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown';
    const referer = headersList.get('referer') || 'unknown';

    // Log to security monitoring system
    await logAuthFailure({
      clientIP,
      path: referer,
      reason: error?.message || 'No valid session',
      metadata: {
        actionName: metadata?.actionName || 'unknown',
        errorCode: error?.name || 'AUTH_REQUIRED',
      },
    });

    // Also log via standard logger for backward compatibility
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
 * Logged action (with metadata):
 * ```ts
 * export const trackView = rateLimitedAction
 *   .metadata({
 *     actionName: 'trackView',
 *     category: 'analytics',
 *   })
 *   .schema(trackingParamsSchema)
 *   .action(async ({ parsedInput: { category, slug } }) => {
 *     const viewCount = await statsRedis.incrementView(category, slug);
 *     return { success: true, viewCount };
 *   });
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
