/**
 * Server Actions - Type-safe actions with logging, auth, and CSRF protection
 */

import { headers } from 'next/headers';
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { z } from 'zod';
import { getAuthenticatedUserFromClient } from '@/src/lib/auth/get-authenticated-user';
import { logger, toLogContextValue } from '@/src/lib/logger';
import { logActionFailure, normalizeError } from '@/src/lib/utils/error.utils';

const actionMetadataSchema = z.object({
  actionName: z.string().min(1),
  category: z.enum(['analytics', 'form', 'content', 'user', 'admin', 'reputation']).optional(),
});

export type ActionMetadata = z.infer<typeof actionMetadataSchema>;

export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return actionMetadataSchema;
  },
  handleServerError(error) {
    const normalized = normalizeError(error);
    logger.error('Server action error', normalized, {
      errorType: normalized.constructor?.name || 'Unknown',
    });
    if (process.env.NODE_ENV === 'production') {
      return DEFAULT_SERVER_ERROR_MESSAGE;
    }
    return normalized.message || DEFAULT_SERVER_ERROR_MESSAGE;
  },
}).use(async ({ next }) => {
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

const loggedAction = actionClient.use(async ({ next, metadata }) => {
  try {
    return await next();
  } catch (error) {
    const actionName = metadata?.actionName ?? 'unknown';
    logActionFailure(actionName, error, {
      category: metadata?.category ?? 'uncategorized',
    });
    throw error;
  }
});

export const rateLimitedAction = loggedAction.use(async ({ next, metadata }) => {
  const parsedMetadata = actionMetadataSchema.safeParse(metadata);
  if (!parsedMetadata.success) {
    const normalized = normalizeError(parsedMetadata.error, 'Invalid action metadata');
    logger.error('Invalid action metadata', normalized, {
      metadataProvided: toLogContextValue(metadata),
    });
    throw new Error('Invalid action configuration');
  }

  // Only errors are logged - handleServerError catches failures
  return next();
});

export const authedAction = rateLimitedAction.use(async ({ next, metadata }) => {
  const { createClient } = await import('@/src/lib/supabase/server');
  const supabase = await createClient();

  const authResult = await getAuthenticatedUserFromClient(supabase, {
    context: metadata?.actionName || 'authedAction',
  });

  if (!authResult.user) {
    const headersList = await headers();
    const clientIP =
      headersList.get('cf-connecting-ip') ||
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown';
    const referer = headersList.get('referer') || 'unknown';

    logger.warn('Auth failure - Unauthorized action attempt', {
      clientIP,
      path: referer,
      actionName: metadata?.actionName || 'unknown',
      reason: authResult.error?.message || 'No valid session',
      errorCode: authResult.error?.name || 'AUTH_REQUIRED',
    });

    throw new Error('Unauthorized. Please sign in to continue.');
  }

  // Get session token for edge function calls
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const authToken = session?.access_token;

  const authCtx: { userId: string; userEmail?: string; authToken?: string } = {
    userId: authResult.user.id,
  };
  if (authResult.user.email) authCtx.userEmail = authResult.user.email;
  if (authToken) authCtx.authToken = authToken;

  return next({
    ctx: authCtx,
  });
});

/**
 * Optional Auth Action - Public action with optional user context
 * Provides ctx.user, ctx.userId, ctx.userEmail, ctx.authToken if user is authenticated
 * Does not throw if no user (unlike authedAction)
 */
export const optionalAuthAction = rateLimitedAction.use(async ({ next, metadata }) => {
  const { createClient } = await import('@/src/lib/supabase/server');
  const supabase = await createClient();

  const authResult = await getAuthenticatedUserFromClient(supabase, {
    context: metadata?.actionName || 'optionalAuthAction',
  });

  // Get session token for edge function calls (if available)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const authToken = session?.access_token;

  const authCtx: {
    user: import('@supabase/supabase-js').User | null;
    userId?: string;
    userEmail?: string;
    authToken?: string;
  } = {
    user: authResult.user ?? null,
  };

  if (authResult.user) {
    authCtx.userId = authResult.user.id;
    if (authResult.user.email) authCtx.userEmail = authResult.user.email;
    if (authToken) authCtx.authToken = authToken;
  }

  return next({
    ctx: authCtx,
  });
});
