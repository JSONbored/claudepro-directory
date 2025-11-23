/// <reference path="@heyclaude/edge-runtime/deno-globals.d.ts" />

/**
 * Consolidated Email Handler - Routes all email operations via action parameter
 */

import { Resend } from 'npm:resend@4.0.0';
import { NewsletterService } from '@heyclaude/data-layer';
import { Constants, type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { supabaseServiceRole } from '@heyclaude/edge-runtime/clients/supabase.ts';
import {
  AUTH_HOOK_ENV,
  RESEND_ENV,
  validateEnvironment,
} from '@heyclaude/edge-runtime/config/email-config.ts';
import { edgeEnv } from '@heyclaude/edge-runtime/config/env.ts';
import { invalidateCacheByKey } from '@heyclaude/edge-runtime/utils/cache.ts';
import { handleDatabaseError } from '@heyclaude/edge-runtime/utils/database-errors.ts';
import { renderEmailTemplate } from '@heyclaude/edge-runtime/utils/email/base-template.tsx';
import { JOB_EMAIL_CONFIGS } from '@heyclaude/edge-runtime/utils/email/config/job-emails.ts';
import { TRANSACTIONAL_EMAIL_CONFIGS } from '@heyclaude/edge-runtime/utils/email/config/transactional-emails.ts';
import {
  checkDigestRateLimit,
  getAllSubscribers,
  getPreviousWeekStart,
  sendBatchDigest,
} from '@heyclaude/edge-runtime/utils/email/digest-helpers.ts';
import { processSequenceEmail } from '@heyclaude/edge-runtime/utils/email/sequence-helpers.ts';
import { ContactSubmissionAdmin } from '@heyclaude/edge-runtime/utils/email/templates/contact-submission-admin.tsx';
import { ContactSubmissionUser } from '@heyclaude/edge-runtime/utils/email/templates/contact-submission-user.tsx';
import {
  CONTACT_FROM,
  HELLO_FROM,
  JOBS_FROM,
} from '@heyclaude/edge-runtime/utils/email/templates/manifest.ts';
import { NewsletterWelcome } from '@heyclaude/edge-runtime/utils/email/templates/newsletter-welcome.tsx';
import { renderSignupOAuthEmail } from '@heyclaude/edge-runtime/utils/email/templates/signup-oauth.tsx';
import {
  badRequestResponse,
  errorResponse,
  jsonResponse,
  publicCorsHeaders,
  successResponse,
} from '@heyclaude/edge-runtime/utils/http.ts';
import { sendBetterStackHeartbeat } from '@heyclaude/edge-runtime/utils/integrations/betterstack.ts';
import {
  buildContactProperties,
  enrollInOnboardingSequence,
  sendEmail,
  syncContactToResend,
} from '@heyclaude/edge-runtime/utils/integrations/resend.ts';
import { parseJsonBody } from '@heyclaude/edge-runtime/utils/parse-json-body.ts';
import { withRateLimit } from '@heyclaude/edge-runtime/utils/rate-limit-middleware.ts';
import {
  createRouter,
  type HttpMethod,
  type RouterContext,
} from '@heyclaude/edge-runtime/utils/router.ts';
import { verifyAuthHookWebhook } from '@heyclaude/edge-runtime/utils/webhook/auth-hook.ts';
import {
  batchProcess,
  checkRateLimit,
  createEmailHandlerContext,
  errorToString,
  logError,
  logInfo,
  logWarn,
  MAX_BODY_SIZE,
  RATE_LIMIT_PRESETS,
  validateEmail,
  withDuration,
} from '@heyclaude/shared-runtime';

validateEnvironment(['resend', 'auth-hook']);

const resend = new Resend(RESEND_ENV.apiKey);
const hookSecret = AUTH_HOOK_ENV.secret.replace('v1,whsec_', '');
const NEWSLETTER_COUNT_TTL_SECONDS = edgeEnv.newsletter.countTtlSeconds;
let newsletterCountCache: { value: number; expiresAt: number } | null = null;

interface EmailHandlerContext extends RouterContext {
  action: string | null;
}

/**
 * Wrapper function for email handler routes that provides consistent logging
 */
function respondWithEmailAnalytics(
  action: string,
  handler: () => Promise<Response>,
  options?: { email?: string; subscriptionId?: string }
): Promise<Response> {
  const startedAt = performance.now();
  const logContext = createEmailHandlerContext(action, {
    ...(options?.email !== undefined ? { email: options.email } : {}),
    ...(options?.subscriptionId !== undefined ? { subscriptionId: options.subscriptionId } : {}),
  });

  const logEvent = (status: number, outcome: 'success' | 'error', error?: unknown) => {
    const durationMs = Math.round(performance.now() - startedAt);
    const logData: Record<string, unknown> = {
      action,
      status,
      duration_ms: durationMs,
    };

    if (error) {
      logData['error'] = errorToString(error);
    }

    if (outcome === 'success') {
      logInfo('Action completed', { ...logContext, ...logData });
    } else {
      logError('Action failed', { ...logContext, ...logData }, error);
    }
  };

  return handler()
    .then((response) => {
      logEvent(response.status, 'success');
      return response;
    })
    .catch((error) => {
      let status = 500;
      if (error instanceof Response) {
        status = error.status;
      } else if (typeof error === 'object' && error !== null && 'status' in error) {
        const err = error as { status: unknown };
        if (typeof err.status === 'number') status = err.status;
      }
      logEvent(status, 'error', error);
      throw error;
    });
}

function createEmailRoutes(
  routes: Array<{
    action: string;
    handler: (req: Request) => Promise<Response>;
    requiresRateLimit?: boolean;
  }>
) {
  return routes.map(({ action, handler, requiresRateLimit = true }) => ({
    name: action,
    methods: ['POST', 'OPTIONS'] as const,
    match: (ctx: EmailHandlerContext) => ctx.action === action,
    handler: async (ctx: EmailHandlerContext) => {
      if (requiresRateLimit) {
        const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.email);
        return withRateLimit(
          ctx,
          rateLimit,
          async () => {
            return respondWithEmailAnalytics(action, async () => {
              return await handler(ctx.request);
            });
          },
          { preset: 'email', cors: publicCorsHeaders }
        );
      }
      return respondWithEmailAnalytics(action, async () => {
        return await handler(ctx.request);
      });
    },
  }));
}

const router = createRouter<EmailHandlerContext>({
  buildContext: (request) => {
    const methodUpper = request.method.toUpperCase();
    const validMethods: readonly HttpMethod[] = [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
      'HEAD',
    ] as const;
    const isValidMethod = (m: string): m is HttpMethod => {
      for (const validMethod of validMethods) {
        if (m === validMethod) {
          return true;
        }
      }
      return false;
    };
    const originalMethod: HttpMethod = isValidMethod(methodUpper) ? methodUpper : 'GET';
    const normalizedMethod: HttpMethod = originalMethod === 'HEAD' ? 'GET' : originalMethod;

    return {
      request,
      url: new URL(request.url),
      method: normalizedMethod,
      originalMethod,
      action: request.headers.get('X-Email-Action'),
    };
  },
  defaultCors: publicCorsHeaders,
  onNoMatch: (ctx) => {
    if (!ctx.action) {
      return badRequestResponse('Missing X-Email-Action header');
    }
    return badRequestResponse(`Unknown action: ${ctx.action}`);
  },
  routes: [
    ...createEmailRoutes([
      {
        action: 'subscribe',
        handler: handleSubscribe,
        requiresRateLimit: true,
      },
      { action: 'welcome', handler: handleWelcome, requiresRateLimit: true },
      {
        action: 'transactional',
        handler: handleTransactional,
        requiresRateLimit: true,
      },
      {
        action: 'contact-submission',
        handler: handleContactSubmission,
        requiresRateLimit: true,
      },
    ]),
    {
      name: 'digest',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.action === 'digest',
      handler: async () => respondWithEmailAnalytics('digest', () => handleDigest()),
    },
    {
      name: 'sequence',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.action === 'sequence',
      handler: async () => respondWithEmailAnalytics('sequence', () => handleSequence()),
    },
    {
      name: 'get-count',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.action === 'get-count',
      handler: () => respondWithEmailAnalytics('get-count', () => handleGetNewsletterCount()),
    },
    {
      name: 'job-lifecycle',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) =>
        ctx.action !== null &&
        [
          'job-submitted',
          'job-approved',
          'job-rejected',
          'job-expiring',
          'job-expired',
          'job-payment-confirmed',
        ].includes(ctx.action),
      handler: async (ctx) => {
        if (!ctx.action) {
          return badRequestResponse('Missing action');
        }
        const action = ctx.action;
        const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.email);
        return withRateLimit(
          ctx,
          rateLimit,
          async () => {
            return respondWithEmailAnalytics(action, async () => {
              return await handleJobLifecycleEmail(ctx.request, action);
            });
          },
          { preset: 'email', cors: publicCorsHeaders }
        );
      },
    },
  ],
});

Deno.serve((request) => router(request));

/**
 * Handle Newsletter Subscription
 */
async function handleSubscribe(req: Request): Promise<Response> {
  const startTime = Date.now();

  const parseResult = await parseJsonBody<{
    email: string;
    source?: string | null;
    referrer?: string | null;
    copy_type?: string | null;
    copy_category?: string | null;
    copy_slug?: string | null;
  }>(req, {
    maxSize: MAX_BODY_SIZE.default,
    cors: publicCorsHeaders,
  });

  if (!parseResult.success) {
    return parseResult.response;
  }

  const { email, source, referrer, copy_type, copy_category, copy_slug } = parseResult.data;

  const emailValidation = validateEmail(email);
  if (!(emailValidation.valid && emailValidation.normalized)) {
    return badRequestResponse(emailValidation.error ?? 'Valid email address is required');
  }

  const validatedSource = source && typeof source === 'string' ? source : null;
  const validatedCopyType = copy_type && typeof copy_type === 'string' ? copy_type : null;
  const validatedCopyCategory =
    copy_category && typeof copy_category === 'string' ? copy_category : null;

  const normalizedEmail = emailValidation.normalized;

  const logContext = createEmailHandlerContext('subscribe', {
    email: normalizedEmail,
  });

  try {
    const contactProperties = buildContactProperties({
      source: validatedSource,
      ...(copy_type !== undefined ? { copyType: copy_type } : {}),
      ...(validatedCopyCategory !== null ? { copyCategory: validatedCopyCategory } : {}),
      ...(referrer !== undefined ? { referrer } : {}),
    });

    const { resendContactId, syncStatus, syncError, topicIds } = await syncContactToResend(
      resend,
      normalizedEmail,
      contactProperties,
      validatedSource,
      validatedCopyCategory,
      logContext
    );

    const newsletterSourceValues: readonly DatabaseGenerated['public']['Enums']['newsletter_source'][] =
      [
        'footer',
        'homepage',
        'modal',
        'content_page',
        'inline',
        'post_copy',
        'resend_import',
        'oauth_signup',
      ] as const satisfies readonly DatabaseGenerated['public']['Enums']['newsletter_source'][];

    const isValidNewsletterSource = (
      value: string | null | undefined
    ): value is DatabaseGenerated['public']['Enums']['newsletter_source'] => {
      if (!value) return false;
      for (const validValue of newsletterSourceValues) {
        if (value === validValue) {
          return true;
        }
      }
      return false;
    };

    const contentCategoryValues = Constants.public.Enums.content_category;

    const newsletterInterestValues = [
      'general',
      ...contentCategoryValues,
    ] as const satisfies readonly DatabaseGenerated['public']['Enums']['newsletter_interest'][];

    const isValidNewsletterInterest = (
      value: string | null | undefined
    ): value is DatabaseGenerated['public']['Enums']['newsletter_interest'] => {
      if (!value) return false;
      for (const validValue of newsletterInterestValues) {
        if (value === validValue) {
          return true;
        }
      }
      return false;
    };

    const finalSource: DatabaseGenerated['public']['Enums']['newsletter_source'] =
      isValidNewsletterSource(validatedSource) ? validatedSource : 'footer';

    const copyTypeValues = Constants.public.Enums.copy_type;

    const isValidCopyType = (
      value: string | null | undefined
    ): value is DatabaseGenerated['public']['Enums']['copy_type'] => {
      if (!value) return false;
      for (const validValue of copyTypeValues) {
        if (value === validValue) {
          return true;
        }
      }
      return false;
    };

    const isValidContentCategory = (
      value: string | null | undefined
    ): value is DatabaseGenerated['public']['Enums']['content_category'] => {
      if (!value) return false;
      for (const validValue of contentCategoryValues) {
        if (value === validValue) {
          return true;
        }
      }
      return false;
    };

    const getNumberProperty = (obj: Record<string, string | number>, key: string): number => {
      const value = obj[key];
      if (typeof value === 'number') {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const getStringProperty = (
      obj: Record<string, string | number>,
      key: string
    ): string | undefined => {
      const value = obj[key];
      if (typeof value === 'string') {
        return value;
      }
      return undefined;
    };

    const rpcArgs: DatabaseGenerated['public']['Functions']['subscribe_newsletter']['Args'] = {
      p_email: normalizedEmail,
      p_source: finalSource,
      ...(referrer ? { p_referrer: referrer } : {}),
      ...(validatedCopyType && isValidCopyType(validatedCopyType)
        ? { p_copy_type: validatedCopyType }
        : {}),
      ...(validatedCopyCategory && isValidContentCategory(validatedCopyCategory)
        ? { p_copy_category: validatedCopyCategory }
        : {}),
      ...(copy_slug ? { p_copy_slug: copy_slug } : {}),
      ...(resendContactId ? { p_resend_contact_id: resendContactId } : {}),
      p_sync_status: syncStatus,
      ...(syncError ? { p_sync_error: syncError } : {}),
      p_engagement_score: getNumberProperty(contactProperties, 'engagement_score'),
      ...(() => {
        const primaryInterest = getStringProperty(contactProperties, 'primary_interest');
        return primaryInterest && isValidNewsletterInterest(primaryInterest)
          ? { p_primary_interest: primaryInterest }
          : {};
      })(),
      p_total_copies: getNumberProperty(contactProperties, 'total_copies'),
      p_last_active_at: new Date().toISOString(),
      ...(topicIds ? { p_resend_topics: topicIds } : {}),
    };

    // Initialize service with Service Role client for writes
    const service = new NewsletterService(supabaseServiceRole);

    // Call service instead of direct RPC
    const rpcResult = await service.subscribeNewsletter(rpcArgs).catch((error) => {
      // Handle database errors similar to original helper
      const handled = handleDatabaseError(error, logContext, 'handleSubscribe');
      if (handled) throw handled; // re-throw response as error to be caught by outer catch
      throw error;
    });

    if (!(rpcResult && rpcResult.success)) {
      const errorMessage = rpcResult?.error ?? 'Subscription failed';
      logError('RPC subscription failed', logContext, new Error(errorMessage));
      return errorResponse(new Error(errorMessage), 'handleSubscribe');
    }

    const subscriptionId = rpcResult.subscription_id;
    if (!subscriptionId) {
      logError('RPC returned success but no subscription_id', logContext);
      return errorResponse(
        new Error('Subscription succeeded but no subscription ID returned'),
        'handleSubscribe'
      );
    }

    // Use service to fetch subscription details
    const subscription = await service.getSubscriptionById(subscriptionId);

    if (!subscription) {
      logError('Failed to fetch subscription after RPC call', logContext);
      return errorResponse(
        new Error('Subscription succeeded but failed to fetch subscription data'),
        'handleSubscribe'
      );
    }

    if (rpcResult.was_resubscribed) {
      logInfo('User resubscribed', {
        ...logContext,
        subscription_id: rpcResult.subscription_id,
      });
    }

    await invalidateCacheByKey('cache.invalidate.newsletter_subscribe', ['newsletter'], {
      logContext,
    }).catch((error) => {
      logWarn('Cache invalidation failed', {
        ...logContext,
        error: errorToString(error),
      });
    });

    const html = await renderEmailTemplate(NewsletterWelcome, {
      email: normalizedEmail,
    });
    const { data: emailData, error: emailError } = await sendEmail(
      resend,
      {
        from: HELLO_FROM,
        to: normalizedEmail,
        subject: 'Welcome to Claude Pro Directory! 🎉',
        html,
        tags: [{ name: 'type', value: 'newsletter' }],
      },
      logContext,
      'Resend welcome email send timed out'
    );

    if (emailError) {
      logError('Welcome email failed', logContext, emailError);
    } else {
      await enrollInOnboardingSequence(normalizedEmail, logContext);
    }

    logInfo('Subscription completed', {
      ...withDuration(logContext, startTime),
      success: true,
      subscription_id: subscription.id,
      resend_contact_id: resendContactId,
      sync_status: syncStatus,
      email_sent: !emailError,
      email_id: emailData?.id || null,
    });

    return successResponse({
      success: true,
      subscription_id: subscription.id,
      email: normalizedEmail,
      resend_contact_id: resendContactId,
      sync_status: syncStatus,
      email_sent: !emailError,
      email_id: emailData?.id || null,
    });
  } catch (error) {
    if (error instanceof Response) return error; // Return handled responses directly
    logError('Newsletter subscription failed', withDuration(logContext, startTime), error);
    return errorResponse(error, 'handleSubscribe');
  }
}

// ... Rest of file remains same (handleWelcome, handleTransactional, etc)
// They handle email logic, not heavy data fetching, so they can remain in edge handler or be moved to service later if needed.
// For now, subscribe is the heavy data/RPC one.

async function handleWelcome(req: Request): Promise<Response> {
  const startTime = Date.now();
  const triggerSource = req.headers.get('X-Trigger-Source');

  // Newsletter subscription trigger
  if (triggerSource === 'newsletter_subscription') {
    const parseResult = await parseJsonBody<{
      email: string;
      subscription_id: string;
    }>(req, {
      maxSize: MAX_BODY_SIZE.default,
      cors: publicCorsHeaders,
    });

    if (!parseResult.success) {
      return parseResult.response;
    }

    const payload = parseResult.data;
    const { email, subscription_id } = payload;

    const logContext = createEmailHandlerContext('welcome', {
      ...(typeof email === 'string' ? { email } : {}),
      ...(typeof subscription_id === 'string' ? { subscriptionId: subscription_id } : {}),
    });

    const html = await renderEmailTemplate(NewsletterWelcome, { email });

    const { data, error } = await sendEmail(
      resend,
      {
        from: HELLO_FROM,
        to: email,
        subject: 'Welcome to Claude Pro Directory! 🎉',
        html,
        tags: [{ name: 'type', value: 'newsletter' }],
      },
      logContext,
      'Resend welcome email send timed out'
    );

    if (error) {
      logError('Welcome email failed', logContext, error);
      return errorResponse(new Error(error.message || 'Welcome email failed'), 'handleWelcome');
    }

    await enrollInOnboardingSequence(email, logContext);

    logInfo('Welcome email sent', {
      ...withDuration(logContext, startTime),
      subscription_id,
      email_id: data?.id,
    });

    return successResponse({ sent: true, id: data?.id, subscription_id });
  }

  // Auth hook trigger (OAuth signup)
  const verificationResult = await verifyAuthHookWebhook(req, hookSecret);
  if (verificationResult instanceof Response) {
    return verificationResult;
  }
  const { user, email_data } = verificationResult;

  const logContext = createEmailHandlerContext('welcome', {
    email: user.email,
  });

  // Only handle signup action type
  if (email_data.email_action_type !== 'signup') {
    logInfo('Auth hook skipped (not signup)', {
      ...logContext,
      user_id: user.id,
      email_action_type: email_data.email_action_type,
    });
    return successResponse({
      skipped: true,
      reason: 'not_signup',
      action_type: email_data.email_action_type,
    });
  }

  const html = await renderSignupOAuthEmail({ email: user.email });

  const { data, error } = await sendEmail(
    resend,
    {
      from: HELLO_FROM,
      to: user.email,
      subject: 'Welcome to Claude Pro Directory! 🎉',
      html,
      tags: [{ name: 'type', value: 'auth-signup' }],
    },
    logContext,
    'Resend auth signup email send timed out'
  );

  if (error) {
    logError('Signup email failed', { ...logContext, user_id: user.id }, error);
    return errorResponse(new Error(error.message || 'Signup email failed'), 'handleWelcome');
  }

  await enrollInOnboardingSequence(user.email, logContext);

  logInfo('Signup email sent', {
    ...logContext,
    user_id: user.id,
    email_id: data?.id,
    email_action_type: email_data.email_action_type,
  });

  return successResponse({ sent: true, id: data?.id, user_id: user.id });
}

async function handleTransactional(req: Request): Promise<Response> {
  const startTime = Date.now();

  const parseResult = await parseJsonBody<{
    type: string;
    email: string;
    data: Record<string, unknown>;
  }>(req, {
    maxSize: MAX_BODY_SIZE.default,
    cors: publicCorsHeaders,
  });

  if (!parseResult.success) {
    return parseResult.response;
  }

  const payload = parseResult.data;
  const { type, email, data: emailData } = payload;

  const logContext = createEmailHandlerContext('transactional', {
    ...(typeof email === 'string' ? { email } : {}),
  });

  if (!(type && email)) {
    return badRequestResponse('Missing required fields: type, email');
  }

  const config = TRANSACTIONAL_EMAIL_CONFIGS[type];
  if (!config) {
    return badRequestResponse(`Unknown transactional email type: ${type}`);
  }

  const validation = config.validateData(emailData);
  if (!validation.valid) {
    return badRequestResponse(validation.error ?? 'Invalid email data');
  }

  const props = config.buildProps(emailData, email);
  const html = await renderEmailTemplate(config.template, props);
  const subject = config.buildSubject(emailData);

  const { data, error } = await sendEmail(
    resend,
    {
      from: config.from,
      to: email,
      subject,
      html,
    },
    logContext,
    'Resend transactional email send timed out'
  );

  if (error) {
    logError('Failed to send transactional email', { ...logContext, type }, error);
    return errorResponse(
      new Error(error.message || 'Transactional email failed'),
      'handleTransactional'
    );
  }

  logInfo('Transactional email sent', {
    ...withDuration(logContext, startTime),
    type,
    email_id: data?.id,
  });

  return successResponse({ sent: true, id: data?.id, type });
}

async function handleDigest(): Promise<Response> {
  const startTime = Date.now();
  const logContext = createEmailHandlerContext('digest');

  // Check rate limiting
  const rateLimitCheck = await checkDigestRateLimit();
  if (rateLimitCheck.rateLimited) {
    logInfo('Digest rate limited', {
      ...logContext,
      hours_since_last_run: rateLimitCheck.hoursSinceLastRun?.toFixed(1),
      next_allowed_at: rateLimitCheck.nextAllowedAt,
    });
    return successResponse({
      skipped: true,
      reason: 'rate_limited',
      hoursSinceLastRun: Math.round((rateLimitCheck.hoursSinceLastRun ?? 0) * 10) / 10,
      nextAllowedAt: rateLimitCheck.nextAllowedAt,
    });
  }

  const previousWeekStart = getPreviousWeekStart();

  const digestArgs: DatabaseGenerated['public']['Functions']['get_weekly_digest']['Args'] = {
    p_week_start: previousWeekStart,
  };
  const { data: digest, error: digestError } = await supabaseServiceRole.rpc(
    'get_weekly_digest',
    digestArgs
  );

  if (digestError) {
    logError('Failed to fetch weekly digest', logContext, digestError);
    return errorResponse(digestError, 'handleDigest');
  }

  if (!digest) {
    return successResponse({ skipped: true, reason: 'invalid_data' });
  }
  // Use generated type directly from @heyclaude/database-types
  const digestData: DatabaseGenerated['public']['Functions']['get_weekly_digest']['Returns'] =
    digest;

  const hasNewContent = Array.isArray(digestData.new_content) && digestData.new_content.length > 0;
  const hasTrendingContent =
    Array.isArray(digestData.trending_content) && digestData.trending_content.length > 0;

  if (!(hasNewContent || hasTrendingContent)) {
    return successResponse({ skipped: true, reason: 'no_content' });
  }

  const subscribers = await getAllSubscribers();

  if (subscribers.length === 0) {
    return successResponse({ skipped: true, reason: 'no_subscribers' });
  }

  const results = await sendBatchDigest(resend, subscribers, digestData, logContext);

  // OPTION 1: Update last successful run timestamp after sending
  const currentTimestamp = new Date().toISOString();
  const upsertData: DatabaseGenerated['public']['Tables']['app_settings']['Insert'] = {
    setting_key: 'last_digest_email_timestamp',
    setting_value: currentTimestamp,
    setting_type: 'string',
    environment: 'production',
    enabled: true,
    description: 'Timestamp of last successful weekly digest email send (used for rate limiting)',
    category: 'config',
    version: 1,
  };
  await supabaseServiceRole.from('app_settings').upsert(upsertData);

  logInfo('Digest completed', {
    ...withDuration(logContext, startTime),
    success: results.success,
    failed: results.failed,
    success_rate: results.successRate,
    last_digest_timestamp: currentTimestamp,
  });

  await sendBetterStackHeartbeat(edgeEnv.betterstack.weeklyTasks, results.failed, logContext);

  return successResponse({
    sent: results.success,
    failed: results.failed,
    rate: results.successRate,
  });
}

async function handleSequence(): Promise<Response> {
  const startTime = Date.now();
  const logContext = createEmailHandlerContext('sequence');

  const { data, error } = await supabaseServiceRole.rpc('get_due_sequence_emails', undefined);

  if (error) {
    logError('Failed to fetch due sequence emails', logContext, error);
    return errorResponse(error, 'handleSequence');
  }

  if (!Array.isArray(data) || data.length === 0) {
    logInfo('No due sequence emails', logContext);
    return successResponse({ sent: 0, failed: 0 });
  }

  const dueEmails: DatabaseGenerated['public']['Functions']['get_due_sequence_emails']['Returns'] =
    data;

  logInfo('Processing sequence emails', {
    ...logContext,
    due_count: dueEmails.length,
  });

  const results = await batchProcess(
    dueEmails,
    async (item) => {
      await processSequenceEmail(resend, item, logContext);
    },
    {
      concurrency: 5,
      retries: 0,
      onError: (item, error, attempt) => {
        logError(
          'Failed to send sequence email',
          {
            ...logContext,
            step: item.step,
            email: item.email,
            attempt,
          },
          error
        );
      },
    }
  );

  const sentCount = results.successCount;
  const failedCount = results.failedCount;

  logInfo('Sequence emails completed', {
    ...withDuration(logContext, startTime),
    sent: sentCount,
    failed: failedCount,
    total: dueEmails.length,
  });

  await sendBetterStackHeartbeat(edgeEnv.betterstack.emailSequences, failedCount, logContext);

  return successResponse({ sent: sentCount, failed: failedCount });
}

async function handleJobLifecycleEmail(req: Request, action: string): Promise<Response> {
  const startTime = Date.now();

  const parseResult = await parseJsonBody<
    { userEmail: string; jobId: string } & Record<string, unknown>
  >(req, {
    maxSize: MAX_BODY_SIZE.default,
    cors: publicCorsHeaders,
  });

  if (!parseResult.success) {
    return parseResult.response;
  }

  const payload = parseResult.data;
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('userEmail' in payload) ||
    !('jobId' in payload) ||
    typeof payload.userEmail !== 'string' ||
    typeof payload.jobId !== 'string'
  ) {
    return badRequestResponse('Missing required fields: userEmail, jobId');
  }
  const { userEmail, jobId } = payload;

  const config = JOB_EMAIL_CONFIGS[action];
  if (!config) {
    return badRequestResponse(`Unknown job lifecycle action: ${action}`);
  }

  const logContext = createEmailHandlerContext(action, {
    email: userEmail,
  });

  const props = config.buildProps(payload);
  const html = await renderEmailTemplate(config.template, props);
  const subject = config.buildSubject(payload);

  const { data, error } = await sendEmail(
    resend,
    {
      from: JOBS_FROM,
      to: userEmail,
      subject,
      html,
      tags: [{ name: 'type', value: action }],
    },
    logContext,
    'Resend job lifecycle email send timed out'
  );

  if (error) {
    logError(
      `${action} email failed`,
      {
        ...logContext,
        job_id: jobId,
      },
      error
    );
    return errorResponse(
      new Error(error.message || `${action} email failed`),
      'handleJobLifecycleEmail'
    );
  }

  logInfo(`${action} email sent`, {
    ...withDuration(logContext, startTime),
    job_id: jobId,
    email_id: data?.id,
  });

  return successResponse({ sent: true, id: data?.id, jobId });
}

async function getCachedNewsletterCount(): Promise<number> {
  const now = Date.now();
  if (newsletterCountCache && newsletterCountCache.expiresAt > now) {
    return newsletterCountCache.value;
  }

  const service = new NewsletterService(supabaseServiceRole);
  const count = await service.getNewsletterSubscriberCount();

  newsletterCountCache = {
    value: count,
    expiresAt: now + NEWSLETTER_COUNT_TTL_SECONDS * 1000,
  };
  return count;
}

async function handleGetNewsletterCount(): Promise<Response> {
  const logContext = createEmailHandlerContext('get-newsletter-count');
  try {
    const count = await getCachedNewsletterCount();
    const cacheControl = `public, max-age=${NEWSLETTER_COUNT_TTL_SECONDS}, stale-while-revalidate=${NEWSLETTER_COUNT_TTL_SECONDS}`;
    const headers = {
      ...publicCorsHeaders,
      'Cache-Control': cacheControl,
      'CDN-Cache-Control': cacheControl,
      'Vercel-CDN-Cache-Control': `public, s-maxage=${NEWSLETTER_COUNT_TTL_SECONDS}, stale-while-revalidate=${NEWSLETTER_COUNT_TTL_SECONDS}`,
    };

    logInfo('Newsletter count retrieved', {
      ...logContext,
      count,
    });
    return jsonResponse({ count }, 200, headers);
  } catch (error) {
    logError('Newsletter count failed', logContext, error);
    return errorResponse(error, 'handleGetNewsletterCount');
  }
}

/**
 * Contact Form Submission Handler
 */
async function handleContactSubmission(req: Request): Promise<Response> {
  const startTime = Date.now();

  const parseResult = await parseJsonBody<{
    submissionId: string;
    name: string;
    email: string;
    category: string;
    message: string;
  }>(req, {
    maxSize: MAX_BODY_SIZE.default,
    cors: publicCorsHeaders,
  });

  if (!parseResult.success) {
    return parseResult.response;
  }

  const payload = parseResult.data;
  const { submissionId, name, email, category, message } = payload;

  const logContext = createEmailHandlerContext('contact-submission', {
    ...(typeof email === 'string' ? { email } : {}),
  });

  if (!(submissionId && name && email && category && message)) {
    return badRequestResponse(
      'Missing required fields: submissionId, name, email, category, message'
    );
  }

  const contactCategoryValues = Constants.public.Enums.contact_category;

  const isValidContactCategory = (
    value: string | null | undefined
  ): value is DatabaseGenerated['public']['Enums']['contact_category'] => {
    if (!value) return false;
    for (const validValue of contactCategoryValues) {
      if (value === validValue) {
        return true;
      }
    }
    return false;
  };

  if (!isValidContactCategory(category)) {
    return badRequestResponse(
      `Invalid category. Must be one of: ${contactCategoryValues.join(', ')}`
    );
  }

  const validatedCategory: DatabaseGenerated['public']['Enums']['contact_category'] = category;

  try {
    const adminHtml = await renderEmailTemplate(ContactSubmissionAdmin, {
      submissionId,
      name,
      email,
      category: validatedCategory,
      message,
      submittedAt: new Date().toISOString(),
    });

    const { error: adminError } = await sendEmail(
      resend,
      {
        from: CONTACT_FROM,
        to: 'hi@claudepro.directory',
        subject: `New Contact: ${validatedCategory} - ${name}`,
        html: adminHtml,
        tags: [{ name: 'type', value: 'contact-admin' }],
      },
      logContext,
      'Resend contact admin email send timed out'
    );

    if (adminError) {
      logError(
        'Admin notification email failed',
        {
          ...logContext,
          submission_id: submissionId,
        },
        adminError
      );
    }

    const userHtml = await renderEmailTemplate(ContactSubmissionUser, {
      name,
      category: validatedCategory,
    });

    const { data: userData, error: userError } = await sendEmail(
      resend,
      {
        from: HELLO_FROM,
        to: email,
        subject: 'We received your message!',
        html: userHtml,
        tags: [{ name: 'type', value: 'contact-confirmation' }],
      },
      logContext,
      'Resend contact user email send timed out'
    );

    if (userError) {
      logError(
        'User confirmation email failed',
        {
          ...logContext,
          submission_id: submissionId,
        },
        userError
      );
    }

    logInfo('Contact submission emails completed', {
      ...withDuration(logContext, startTime),
      submission_id: submissionId,
      admin_email_sent: !adminError,
      user_email_sent: !userError,
      user_email_id: userData?.id || null,
    });

    return successResponse({
      sent: true,
      submission_id: submissionId,
      admin_email_sent: !adminError,
      user_email_sent: !userError,
      user_email_id: userData?.id || null,
    });
  } catch (error) {
    logError('Contact submission email failed', withDuration(logContext, startTime), error);
    return errorResponse(error, 'handleContactSubmission');
  }
}
