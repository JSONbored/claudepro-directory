import { isProduction } from '@heyclaude/shared-runtime/schemas/env';
import { headers } from 'next/headers';
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { z } from 'zod';
import { logger, toLogContextValue } from '../logger.ts';
import { logActionFailure, normalizeError } from '../errors.ts';

const actionMetadataSchema = z.object({
  actionName: z.string().min(1),
  category: z.enum(['analytics', 'form', 'content', 'user', 'admin', 'reputation', 'mfa']).optional(),
});

export type ActionMetadata = z.infer<typeof actionMetadataSchema>;

export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return actionMetadataSchema;
  },
  handleServerError(error) {
    const normalized = normalizeError(error);
    logger.error({ err: normalized, errorType: normalized.constructor?.name || 'Unknown', }, 'Server action error');
    if (isProduction) {
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
    const normalized = logActionFailure(actionName, error, {
      category: metadata?.category ?? 'uncategorized',
    });
    throw normalized;
  }
});

export const rateLimitedAction = loggedAction.use(async ({ next, metadata }) => {
  const parsedMetadata = actionMetadataSchema.safeParse(metadata);
  if (!parsedMetadata.success) {
    const normalized = normalizeError(parsedMetadata.error, 'Invalid action metadata');
    logger.error({ err: normalized, metadataProvided: toLogContextValue(metadata), }, 'Invalid action metadata');
    throw new Error('Invalid action configuration');
  }

  return next();
});

export const authedAction = rateLimitedAction.use(async ({ next, metadata }) => {
  // Lazy import server-only dependencies to keep this file client-safe for definition
  const { createSupabaseServerClient } = await import('../supabase/server.ts');
  const { getAuthenticatedUserFromClient } = await import('../auth/get-authenticated-user.ts');

  const supabase = await createSupabaseServerClient();

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

    logger.warn({ securityEvent: true, // Structured tag for security event filtering
      clientIP,
      path: referer,
      actionName: metadata?.actionName || 'unknown',
      reason: authResult.error?.message || 'No valid session',
      errorCode: authResult.error?.name || 'AUTH_REQUIRED', }, 'Auth failure - Unauthorized action attempt');

    throw new Error('Unauthorized. Please sign in to continue.');
  }

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

export const optionalAuthAction = rateLimitedAction.use(async ({ next, metadata }) => {
  // Lazy import server-only dependencies
  const { createSupabaseServerClient } = await import('../supabase/server.ts');
  const { getAuthenticatedUserFromClient } = await import('../auth/get-authenticated-user.ts');

  const supabase = await createSupabaseServerClient();

  const authResult = await getAuthenticatedUserFromClient(supabase, {
    context: metadata?.actionName || 'optionalAuthAction',
  });

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
