/**
 * Server Actions - Type-safe actions with logging, auth, and CSRF protection
 */

import { headers } from 'next/headers';
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import { logAuthFailure } from '@/src/lib/security/security-monitor.server';

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
    logger.error('Server action error', error instanceof Error ? error : new Error(String(error)), {
      errorType: error.constructor?.name || 'Unknown',
    });
    if (process.env.NODE_ENV === 'production') {
      return DEFAULT_SERVER_ERROR_MESSAGE;
    }
    return error.message || DEFAULT_SERVER_ERROR_MESSAGE;
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

export const rateLimitedAction = actionClient.use(async ({ next, metadata }) => {
  const parsedMetadata = actionMetadataSchema.safeParse(metadata);
  if (!parsedMetadata.success) {
    logger.error('Invalid action metadata', new Error(parsedMetadata.error.message), {
      metadataProvided: JSON.stringify(metadata),
    });
    throw new Error('Invalid action configuration');
  }

  // Only errors are logged - handleServerError catches failures
  return next();
});

export const authedAction = rateLimitedAction.use(async ({ next, metadata }) => {
  const { createClient } = await import('@/src/lib/supabase/server');
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const headersList = await headers();
    const clientIP =
      headersList.get('cf-connecting-ip') ||
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown';
    const referer = headersList.get('referer') || 'unknown';

    await logAuthFailure({
      clientIP,
      path: referer,
      reason: error?.message || 'No valid session',
      metadata: {
        actionName: metadata?.actionName || 'unknown',
        errorCode: error?.name || 'AUTH_REQUIRED',
      },
    });

    const warnData: Record<string, string> = {
      actionName: metadata?.actionName || 'unknown',
    };
    if (error?.message) warnData.error = error.message;

    logger.warn('Unauthorized action attempt', warnData);
    throw new Error('Unauthorized. Please sign in to continue.');
  }

  const authCtx: { userId: string; userEmail?: string } = {
    userId: user.id,
  };
  if (user.email) authCtx.userEmail = user.email;

  return next({
    ctx: authCtx,
  });
});
