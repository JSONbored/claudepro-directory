/// <reference path="../_shared/deno-globals.d.ts" />

/**
 * Consolidated Email Handler - Routes all email operations via action parameter
 */

import { Resend } from 'npm:resend@4.0.0';
import { supabaseServiceRole } from '../_shared/clients/supabase.ts';
import { AUTH_HOOK_ENV, RESEND_ENV, validateEnvironment } from '../_shared/config/email-config.ts';
import { edgeEnv } from '../_shared/config/env.ts';
import type { Database, Database as DatabaseGenerated } from '../_shared/database.types.ts';
import {
  callRpc,
  type GetDueSequenceEmailsReturn,
  type GetWeeklyDigestReturn,
  insertTable,
  isNewsletterSource,
  upsertTable,
} from '../_shared/database-overrides.ts';
// Static imports to ensure circuit-breaker and timeout utilities are included in the bundle
// These are lazily imported in callRpc, but we need static imports for Supabase bundling
import '../_shared/utils/circuit-breaker.ts';
import '../_shared/utils/timeout.ts';
import { batchProcess } from '../_shared/utils/batch-processor.ts';
import { invalidateCacheByKey } from '../_shared/utils/cache.ts';
import { handleDatabaseError } from '../_shared/utils/database-errors.ts';
import { renderEmailTemplate } from '../_shared/utils/email/base-template.tsx';
import { JOB_EMAIL_CONFIGS } from '../_shared/utils/email/config/job-emails.ts';
import { TRANSACTIONAL_EMAIL_CONFIGS } from '../_shared/utils/email/config/transactional-emails.ts';
import {
  checkDigestRateLimit,
  getAllSubscribers,
  getPreviousWeekStart,
  sendBatchDigest,
} from '../_shared/utils/email/digest-helpers.ts';
import { processSequenceEmail } from '../_shared/utils/email/sequence-helpers.ts';
import { ContactSubmissionAdmin } from '../_shared/utils/email/templates/contact-submission-admin.tsx';
import { ContactSubmissionUser } from '../_shared/utils/email/templates/contact-submission-user.tsx';
import { CONTACT_FROM, HELLO_FROM, JOBS_FROM } from '../_shared/utils/email/templates/manifest.ts';
import { NewsletterWelcome } from '../_shared/utils/email/templates/newsletter-welcome.tsx';
import { renderSignupOAuthEmail } from '../_shared/utils/email/templates/signup-oauth.tsx';
import {
  badRequestResponse,
  errorResponse,
  jsonResponse,
  publicCorsHeaders,
  successResponse,
} from '../_shared/utils/http.ts';
import { MAX_BODY_SIZE } from '../_shared/utils/input-validation.ts';
import { sendBetterStackHeartbeat } from '../_shared/utils/integrations/betterstack.ts';
import {
  buildContactProperties,
  enrollInOnboardingSequence,
  sendEmail,
  syncContactToResend,
} from '../_shared/utils/integrations/resend.ts';
import {
  createEmailHandlerContext,
  logError,
  logInfo,
  logWarn,
  withDuration,
} from '../_shared/utils/logging.ts';
import { parseJsonBody } from '../_shared/utils/parse-json-body.ts';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '../_shared/utils/rate-limit.ts';
import { withRateLimit } from '../_shared/utils/rate-limit-middleware.ts';
import { createRouter, type HttpMethod, type RouterContext } from '../_shared/utils/router.ts';
import { validateEmail } from '../_shared/utils/validate-email.ts';
import { verifyAuthHookWebhook } from '../_shared/utils/webhook/auth-hook.ts';

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
 * Similar to respondWithAnalytics in data-api and transform-api
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
      logData['error'] = error instanceof Error ? error.message : String(error);
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
      const status =
        error instanceof Response
          ? error.status
          : typeof error === 'object' && error !== null && 'status' in error
            ? Number((error as { status?: number }).status) || 500
            : 500;
      logEvent(status, 'error', error);
      throw error;
    });
}

/**
 * Create email route definitions with consistent rate limiting and analytics
 */
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
    const originalMethod = request.method.toUpperCase() as HttpMethod;
    const normalizedMethod = (originalMethod === 'HEAD' ? 'GET' : originalMethod) as HttpMethod;

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
        const action = ctx.action; // TypeScript now knows this is string
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
 * Full flow: Validate → Resend audience → Database → Welcome email → Sequence
 */
type SubscribePayload = Pick<
  Database['public']['Tables']['newsletter_subscriptions']['Insert'],
  'email' | 'source' | 'referrer' | 'copy_type' | 'copy_category' | 'copy_slug'
>;

async function handleSubscribe(req: Request): Promise<Response> {
  const startTime = Date.now();

  // Parse and validate JSON body with size validation
  const parseResult = await parseJsonBody<SubscribePayload>(req, {
    maxSize: MAX_BODY_SIZE.default,
    cors: publicCorsHeaders,
  });

  if (!parseResult.success) {
    return parseResult.response;
  }

  const { email, source, referrer, copy_type, copy_category, copy_slug } = parseResult.data;

  // Validate email format using shared utility
  const emailValidation = validateEmail(email);
  if (!(emailValidation.valid && emailValidation.normalized)) {
    return badRequestResponse(emailValidation.error ?? 'Valid email address is required');
  }

  // Validate source is a valid newsletter_source enum value (if provided)
  if (source !== null && source !== undefined) {
    if (typeof source !== 'string' || !isNewsletterSource(source)) {
      return badRequestResponse(
        'Invalid source value. Must be one of: footer, homepage, modal, content_page, inline, post_copy, resend_import, oauth_signup'
      );
    }
  }

  // Use normalized email from validation
  const normalizedEmail = emailValidation.normalized;

  // Create logContext at function start
  const logContext = createEmailHandlerContext('subscribe', {
    email: normalizedEmail,
  });

  try {
    // Step 1: Add to Resend audience with properties and topics
    const validatedSource: Database['public']['Enums']['newsletter_source'] | null =
      source && typeof source === 'string' && isNewsletterSource(source)
        ? (source as Database['public']['Enums']['newsletter_source'])
        : null;

    const contactProperties = buildContactProperties({
      source: validatedSource,
      ...(copy_type !== undefined ? { copyType: copy_type } : {}),
      ...(copy_category !== undefined ? { copyCategory: copy_category } : {}),
      ...(referrer !== undefined ? { referrer } : {}),
    });

    const { resendContactId, syncStatus, syncError, topicIds } = await syncContactToResend(
      resend,
      normalizedEmail,
      contactProperties,
      validatedSource,
      copy_category,
      logContext
    );

    // Step 2: Insert into database (rate limiting handled by BEFORE INSERT trigger)
    // Use validated source (defaults to 'footer' if not provided or invalid)
    const finalSource: Database['public']['Enums']['newsletter_source'] =
      validatedSource ?? ('footer' as Database['public']['Enums']['newsletter_source']);

    const insertData: DatabaseGenerated['public']['Tables']['newsletter_subscriptions']['Insert'] =
      {
        email: normalizedEmail,
        source: finalSource,
        referrer: referrer || null,
        copy_type: copy_type || null,
        copy_category: copy_category || null,
        copy_slug: copy_slug || null,
        resend_contact_id: resendContactId,
        sync_status: syncStatus,
        sync_error: syncError,
        last_sync_at: new Date().toISOString(),
        // Store engagement data in database
        engagement_score: contactProperties['engagement_score'] as number,
        primary_interest: contactProperties['primary_interest'] as string,
        total_copies: contactProperties['total_copies'] as number,
        last_active_at: new Date().toISOString(),
        resend_topics: topicIds,
      };
    // Use type-safe helper to ensure proper type inference
    const validatedInsertData =
      insertData satisfies DatabaseGenerated['public']['Tables']['newsletter_subscriptions']['Insert'];
    const result = insertTable('newsletter_subscriptions', validatedInsertData);
    const { data: subscription, error: dbError } = await result
      .select('*')
      .single<DatabaseGenerated['public']['Tables']['newsletter_subscriptions']['Row']>();

    if (dbError) {
      const errorResponse = handleDatabaseError(dbError, logContext, 'handleSubscribe');
      if (errorResponse) {
        return errorResponse;
      }
      // If handleDatabaseError returns null, re-throw
      throw dbError;
    }

    // Step 2.5: Invalidate cache after successful subscription insert
    await invalidateCacheByKey('cache.invalidate.newsletter_subscribe', ['newsletter'], {
      logContext,
    }).catch((error) => {
      logWarn('Cache invalidation failed', {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    // Step 3: Send welcome email and enroll in sequence
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

    // Ensure subscription is not null before accessing properties
    if (!subscription) {
      logError('Subscription insert succeeded but no data returned', logContext);
      return errorResponse(
        new Error('Subscription insert succeeded but no data returned'),
        'handleSubscribe'
      );
    }

    // Return success with final log
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
    logError('Newsletter subscription failed', withDuration(logContext, startTime), error);
    return errorResponse(error, 'handleSubscribe');
  }
}

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

  const digestArgs = {
    p_week_start: previousWeekStart,
  } satisfies DatabaseGenerated['public']['Functions']['get_weekly_digest']['Args'];
  const { data: digest, error: digestError } = await callRpc('get_weekly_digest', digestArgs);

  if (digestError) {
    logError('Failed to fetch weekly digest', logContext, digestError);
    return errorResponse(digestError, 'handleDigest');
  }

  if (!digest || typeof digest !== 'object') {
    return successResponse({ skipped: true, reason: 'invalid_data' });
  }
  const digestData = digest as GetWeeklyDigestReturn;

  const hasNewContent = Array.isArray(digestData.newContent) && digestData.newContent.length > 0;
  const hasTrendingContent =
    Array.isArray(digestData.trendingContent) && digestData.trendingContent.length > 0;

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
  const upsertData = {
    setting_key: 'last_digest_email_timestamp',
    setting_value: currentTimestamp,
    setting_type: 'string' as DatabaseGenerated['public']['Enums']['setting_type'],
    environment: 'production' as DatabaseGenerated['public']['Enums']['environment'],
    enabled: true,
    description: 'Timestamp of last successful weekly digest email send (used for rate limiting)',
    category: 'email',
    version: 1,
  } satisfies DatabaseGenerated['public']['Tables']['app_settings']['Insert'];
  await upsertTable('app_settings', upsertData);

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

  const { data, error } = await callRpc(
    'get_due_sequence_emails',
    {} as DatabaseGenerated['public']['Functions']['get_due_sequence_emails']['Args']
  );

  if (error) {
    logError('Failed to fetch due sequence emails', logContext, error);
    return errorResponse(error, 'handleSequence');
  }

  if (!Array.isArray(data) || data.length === 0) {
    logInfo('No due sequence emails', logContext);
    return successResponse({ sent: 0, failed: 0 });
  }

  const dueEmails = data as GetDueSequenceEmailsReturn;

  logInfo('Processing sequence emails', {
    ...logContext,
    due_count: dueEmails.length,
  });

  // Use batch processor for concurrent email sending with error handling
  const results = await batchProcess(
    dueEmails,
    async (item) => {
      await processSequenceEmail(resend, item, logContext);
    },
    {
      concurrency: 5, // Process 5 emails concurrently
      retries: 0, // Don't retry failed emails (they'll be picked up next run)
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
  const { userEmail, jobId } = payload as { userEmail: string; jobId: string };

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

  // Direct query to newsletter_subscriptions table instead of non-existent RPC
  const { count, error } = await supabaseServiceRole
    .from('newsletter_subscriptions')
    .select('*', { count: 'exact', head: true });

  if (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // This is called from handleGetNewsletterCount which has try-catch
    throw new Error(`Failed to get newsletter count: ${errorMessage}`);
  }

  const subscriberCount = count ?? 0;
  newsletterCountCache = {
    value: subscriberCount,
    expiresAt: now + NEWSLETTER_COUNT_TTL_SECONDS * 1000,
  };
  return subscriberCount;
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
 * Sends notification to admin and confirmation to user
 * Database insert is handled by contact-form.actions.ts before this is called
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

  // Validate category is a valid contact_category enum value
  const validCategories: DatabaseGenerated['public']['Enums']['contact_category'][] = [
    'bug',
    'feature',
    'partnership',
    'general',
    'other',
  ];
  if (
    typeof category !== 'string' ||
    !validCategories.includes(category as DatabaseGenerated['public']['Enums']['contact_category'])
  ) {
    return badRequestResponse(
      'Invalid category value. Must be one of: bug, feature, partnership, general, other'
    );
  }

  const validatedCategory = category as DatabaseGenerated['public']['Enums']['contact_category'];

  try {
    // Send admin notification email
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
      // Don't fail - continue to user confirmation
    }

    // Send user confirmation email
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
