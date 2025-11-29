/**
 * Consolidated Email Handler - Routes all email operations via action parameter
 */

import { Resend } from 'npm:resend@6.5.2';
import { NewsletterService } from '@heyclaude/data-layer';
import { Constants, type Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  AUTH_HOOK_ENV,
  badRequestResponse,
  buildContactProperties,
  CONTACT_FROM,
  ContactSubmissionAdmin,
  ContactSubmissionUser,
  checkDigestRateLimit,
  edgeEnv,
  enrollInOnboardingSequence,
  errorResponse,
  getAllSubscribers,
  getPreviousWeekStart,
  HELLO_FROM,
  handleDatabaseError,
  initRequestLogging,
  invalidateCacheByKey,
  JOB_EMAIL_CONFIGS,
  JOBS_FROM,
  jsonResponse,
  NewsletterWelcome,
  parseJsonBody,
  processSequenceEmail,
  publicCorsHeaders,
  RESEND_ENV,
  renderEmailTemplate,
  renderSignupOAuthEmail,
  resolveNewsletterInterest,
  sendBatchDigest,
  sendBetterStackHeartbeat,
  sendEmail,
  successResponse,
  supabaseServiceRole,
  syncContactToResend,
  traceRequestComplete,
  traceStep,
  TRANSACTIONAL_EMAIL_CONFIGS,
  validateEnvironment,
  verifyAuthHookWebhook,
} from '@heyclaude/edge-runtime';
import {
  batchProcess,
  createEmailHandlerContext,
  normalizeError,
  logError,
  logInfo,
  logger,
  logWarn,
  MAX_BODY_SIZE,
  normalizeError,
  validateEmail,
} from '@heyclaude/shared-runtime';

validateEnvironment(['resend', 'auth-hook']);

const resend = new Resend(RESEND_ENV.apiKey);
const hookSecret = AUTH_HOOK_ENV.secret.replace('v1,whsec_', '');
const NEWSLETTER_COUNT_TTL_SECONDS = edgeEnv.newsletter.countTtlSeconds;
let newsletterCountCache: { value: number; expiresAt: number } | null = null;

/**
 * Handle a newsletter subscription request: create or update the subscriber, sync contact data with the email provider, invalidate related caches, and attempt to send a welcome email.
 *
 * @returns A Response containing subscription result and metadata: `subscription_id`, `email`, `resend_contact_id`, `sync_status`, `email_sent`, and `email_id` on success; an error response on failure.
 */
export async function handleSubscribe(req: Request): Promise<Response> {

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
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Newsletter subscription request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'subscribe',
    email: normalizedEmail,
  });

  try {
    const primaryInterest = resolveNewsletterInterest(validatedCopyCategory);

    if (
      validatedCopyCategory &&
      primaryInterest === 'general' &&
      validatedCopyCategory !== 'general'
    ) {
      logWarn('Newsletter interest fallback to general', {
        ...logContext,
        copy_category: validatedCopyCategory,
      });
    }

    const contactProperties = buildContactProperties({
      source: validatedSource,
      ...(validatedCopyType !== null ? { copyType: validatedCopyType } : {}),
      ...(referrer !== undefined ? { referrer } : {}),
      primaryInterest,
    });

    const { resendContactId, syncStatus, syncError, topicIds } = await syncContactToResend(
      resend,
      normalizedEmail,
      contactProperties,
      validatedSource,
      validatedCopyCategory,
      logContext
    );

    const newsletterSourceValues = Constants.public.Enums.newsletter_source;

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

    const matchesContentCategory = (
      value: string | null | undefined
    ): value is DatabaseGenerated['public']['Enums']['content_category'] => {
      if (!value) return false;
      return contentCategoryValues.includes(
        value as DatabaseGenerated['public']['Enums']['content_category']
      );
    };

    const defaultCacheCategory = (contentCategoryValues[0] ??
      'agents') as DatabaseGenerated['public']['Enums']['content_category'];

    let cacheCategory: DatabaseGenerated['public']['Enums']['content_category'];

    if (isValidContentCategory(validatedCopyCategory)) {
      cacheCategory = validatedCopyCategory;
    } else if (matchesContentCategory(primaryInterest)) {
      cacheCategory = primaryInterest as DatabaseGenerated['public']['Enums']['content_category'];
      logInfo('Cache invalidation category derived from primary interest', {
        ...logContext,
        primary_interest: primaryInterest,
      });
    } else {
      cacheCategory = defaultCacheCategory;
      logWarn('Cache invalidation category fallback used', {
        ...logContext,
        provided_copy_category: validatedCopyCategory,
        chosen_category: cacheCategory,
      });
    }

    const cacheSlug =
      typeof copy_slug === 'string' && copy_slug.trim().length > 0 ? copy_slug : undefined;

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
      p_primary_interest: primaryInterest,
      p_total_copies: getNumberProperty(contactProperties, 'total_copies'),
      p_last_active_at: new Date().toISOString(),
      ...(topicIds ? { p_resend_topics: topicIds } : {}),
    };

    // Initialize service with Service Role client for writes
    const service = new NewsletterService(supabaseServiceRole);

    // Call service instead of direct RPC
    const rpcResult = await service.subscribeNewsletter(rpcArgs).catch(async (error) => {
      // Handle database errors similar to original helper
      const handled = await handleDatabaseError(error, logContext, 'handleSubscribe');
      if (handled) throw handled; // re-throw response as error to be caught by outer catch
      throw error;
    });

    if (!(rpcResult && rpcResult.success)) {
      const errorMessage = rpcResult?.error ?? 'Subscription failed';
      await logError('RPC subscription failed', logContext, new Error(errorMessage));
      return await errorResponse(new Error(errorMessage), 'handleSubscribe');
    }

    const subscriptionId = rpcResult.subscription_id;
    if (!subscriptionId) {
      await logError('RPC returned success but no subscription_id', logContext);
      return await errorResponse(
        new Error('Subscription succeeded but no subscription ID returned'),
        'handleSubscribe'
      );
    }

    // Use service to fetch subscription details
    const subscription = await service.getSubscriptionById(subscriptionId);

    if (!subscription) {
      await logError('Failed to fetch subscription after RPC call', logContext);
      return await errorResponse(
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
      category: cacheCategory,
      slug: cacheSlug,
    }).catch((error) => {
      logWarn('Cache invalidation failed', {
        ...logContext,
        error: normalizeError(error, "Operation failed").message,
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
      await logError('Welcome email failed', logContext, emailError);
    } else {
      await enrollInOnboardingSequence(normalizedEmail, logContext);
    }

    logInfo('Subscription completed', {
      ...logContext,
      success: true,
      subscription_id: subscription.id,
      resend_contact_id: resendContactId,
      sync_status: syncStatus,
      email_sent: !emailError,
      email_id: emailData?.id || null,
    });
    traceRequestComplete(logContext);

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
    await logError('Newsletter subscription failed', logContext, error);
    return await errorResponse(error, 'handleSubscribe', publicCorsHeaders, logContext);
  }
}

/**
 * Handle incoming triggers to send welcome emails for newsletter subscriptions or OAuth signups.
 *
 * @param req - Incoming Request for the welcome email handler
 * @returns A Response with the operation result: `sent: true` and `id` plus `subscription_id` (newsletter) or `user_id` (auth signup) on success; `{ skipped: true, reason }` when an auth hook action is not a signup; an error Response on failure; may return a verification Response if webhook verification dictates.
 */
export async function handleWelcome(req: Request): Promise<Response> {
  const triggerSource = req.headers.get('X-Trigger-Source');
  
  const logContext = createEmailHandlerContext('welcome', {
    triggerSource: triggerSource || 'unknown',
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Welcome email request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'welcome',
    triggerSource: triggerSource || 'unknown',
  });

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

    // Update bindings with subscription details
    logger.setBindings({
      email: typeof email === 'string' ? email : undefined,
      subscriptionId: typeof subscription_id === 'string' ? subscription_id : undefined,
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
      await logError('Welcome email failed', logContext, error);
      return await errorResponse(new Error(error.message || 'Welcome email failed'), 'handleWelcome', publicCorsHeaders, logContext);
    }

    await enrollInOnboardingSequence(email, logContext);

    logInfo('Welcome email sent', {
      ...logContext,
      subscription_id,
      email_id: data?.id,
    });
    traceRequestComplete(logContext);

    return successResponse({ sent: true, id: data?.id, subscription_id });
  }

  // Auth hook trigger (OAuth signup)
  const verificationResult = await verifyAuthHookWebhook(req, hookSecret);
  if (verificationResult instanceof Response) {
    return verificationResult;
  }
  const { user, email_data } = verificationResult;

  // Update bindings with user details
  logger.setBindings({
    email: user.email,
    userId: user.id,
  });

  // Only handle signup action type
  if (email_data.email_action_type !== 'signup') {
    logInfo('Auth hook skipped (not signup)', {
      ...logContext,
      user: { id: user.id, email: user.email }, // Use user serializer for consistent formatting
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
    await logError('Signup email failed', { ...logContext, user: { id: user.id, email: user.email } }, error); // Use user serializer
    return await errorResponse(new Error(error.message || 'Signup email failed'), 'handleWelcome', publicCorsHeaders, logContext);
  }

  await enrollInOnboardingSequence(user.email, logContext);

  logInfo('Signup email sent', {
    ...logContext,
    user: { id: user.id, email: user.email }, // Use user serializer for consistent formatting
    email_id: data?.id,
    email_action_type: email_data.email_action_type,
  });
  traceRequestComplete(logContext);

  return successResponse({ sent: true, id: data?.id, user_id: user.id });
}

/**
 * Handle incoming transactional email requests and send the configured email.
 *
 * @returns A Response containing the send result; on success the JSON body is `{ sent: true, id: string | undefined, type: string }`, otherwise an error response describing the failure.
 */
export async function handleTransactional(req: Request): Promise<Response> {

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
    type,
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Transactional email request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'transactional',
    type,
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
    await logError('Failed to send transactional email', { ...logContext, type }, error);
    return await errorResponse(
      new Error(error.message || 'Transactional email failed'),
      'handleTransactional',
      publicCorsHeaders,
      logContext
    );
  }

  logInfo('Transactional email sent', {
    ...logContext,
    type,
    email_id: data?.id,
  });
  traceRequestComplete(logContext);

  return successResponse({ sent: true, id: data?.id, type });
}

/**
 * Generate and send the weekly digest to all subscribers and record the run timestamp.
 *
 * Fetches digest content for the previous week, skips processing if rate-limited or if the digest
 * contains no content or has no subscribers, sends digest emails in batch, and attempts to upsert
 * the last successful run timestamp. If the timestamp upsert ultimately fails, the function still
 * reports the email send results.
 *
 * @returns If skipped: an object with `{ skipped: true, reason: string, ... }` where `reason` is one of
 * `rate_limited`, `invalid_data`, `no_content`, or `no_subscribers`. If processed: an object with
 * `{ sent: number, failed: number, rate: number }` containing counts of successful and failed sends
 * and the success rate.
 */
export async function handleDigest(): Promise<Response> {
  const logContext = createEmailHandlerContext('digest');
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Digest email request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'digest',
  });

  // Check rate limiting
  traceStep('Checking digest rate limit', logContext);
  const rateLimitCheck = await checkDigestRateLimit();
  if (rateLimitCheck.rateLimited) {
    logInfo('Digest rate limited', {
      ...logContext,
      hours_since_last_run: rateLimitCheck.hoursSinceLastRun?.toFixed(1),
      next_allowed_at: rateLimitCheck.nextAllowedAt,
    });
    traceRequestComplete(logContext);
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
    // Use dbQuery serializer for consistent database query formatting
    await logError('Failed to fetch weekly digest', {
      ...logContext,
      dbQuery: {
        rpcName: 'get_weekly_digest',
        args: digestArgs, // Will be redacted by Pino's redact config
      },
    }, digestError);
    return await errorResponse(digestError, 'handleDigest', publicCorsHeaders, logContext);
  }

  if (!digest) {
    traceRequestComplete(logContext);
    return successResponse({ skipped: true, reason: 'invalid_data' });
  }
  // Use generated type directly from @heyclaude/database-types
  const digestData: DatabaseGenerated['public']['Functions']['get_weekly_digest']['Returns'] =
    digest;

  const hasNewContent = Array.isArray(digestData.new_content) && digestData.new_content.length > 0;
  const hasTrendingContent =
    Array.isArray(digestData.trending_content) && digestData.trending_content.length > 0;

  if (!(hasNewContent || hasTrendingContent)) {
    traceRequestComplete(logContext);
    return successResponse({ skipped: true, reason: 'no_content' });
  }

  traceStep('Fetching subscribers', logContext);
  const subscribers = await getAllSubscribers();

  if (subscribers.length === 0) {
    traceRequestComplete(logContext);
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

  // Upsert with retry logic and comprehensive error handling
  const MAX_RETRIES = 3;
  let retryAttempt = 0;

  while (retryAttempt <= MAX_RETRIES) {
    try {
      const { error } = await supabaseServiceRole.from('app_settings').upsert(upsertData);

      if (error) {
        throw error;
      }

      // Success - break out of retry loop
      break;
    } catch (error) {
      retryAttempt++;

      // Type guard for Supabase PostgrestError
      const isPostgrestError = (
        err: unknown
      ): err is { code: string; message: string; details?: string; hint?: string } => {
        return typeof err === 'object' && err !== null && 'code' in err && 'message' in err;
      };

      // Log error with full context for observability
      await logError(
        'Failed to upsert last_digest_email_timestamp',
        {
          ...logContext,
          operation: 'upsert_digest_timestamp',
          attempt: retryAttempt,
          max_retries: MAX_RETRIES,
          upsert_data: upsertData,
          error_details:
            error instanceof Error
              ? {
                  message: error.message,
                  name: error.name,
                }
              : String(error),
          supabase_error: isPostgrestError(error)
            ? {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
              }
            : undefined,
        },
        normalizeError(error, 'Weekly digest error')
      );

      // If we've exhausted retries, log the failure but don't throw
      // The digest emails were already sent successfully, so we return success
      // The timestamp update is for scheduling/rate limiting and is non-critical
      if (retryAttempt > MAX_RETRIES) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to update last_digest_email_timestamp after retries';
        await logError(
          'Exhausted retries for upsert_digest_timestamp - digest sent but timestamp not updated',
          {
            ...logContext,
            operation: 'upsert_digest_timestamp',
            total_attempts: retryAttempt,
            final_error: errorMessage,
            upsert_data: upsertData,
            warning: 'Digest emails were sent successfully, but timestamp update failed. This may affect rate limiting for next run.',
          },
          normalizeError(error, errorMessage)
        );
        // Don't throw - digest was sent successfully, timestamp update is non-critical
        // Log the warning and continue to return success response
        break;
      }

      // Exponential backoff: 100ms, 200ms, 400ms
      const delayMs = 100 * 2 ** (retryAttempt - 1);
      logWarn(
        `Retrying upsert_digest_timestamp (attempt ${retryAttempt}/${MAX_RETRIES}) after ${delayMs}ms`,
        {
          ...logContext,
          operation: 'upsert_digest_timestamp',
          attempt: retryAttempt,
          delay_ms: delayMs,
        }
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  logInfo('Digest completed', {
    ...logContext,
    success: results.success,
    failed: results.failed,
    success_rate: results.successRate,
    last_digest_timestamp: currentTimestamp,
    timestamp_update_attempts: retryAttempt,
  });
  traceRequestComplete(logContext);

  await sendBetterStackHeartbeat(edgeEnv.betterstack.weeklyTasks, results.failed, logContext);

  return successResponse({
    sent: results.success,
    failed: results.failed,
    rate: results.successRate,
  });
}

/**
 * Process and send due sequence emails in batched concurrent tasks.
 *
 * Fetches all sequence emails that are due, sends each via the sequence processor,
 * records per-item failures, emits an observability heartbeat, and returns a summary.
 *
 * @returns A Response containing `sent` and `failed` counts for processed sequence emails
 */
export async function handleSequence(): Promise<Response> {
  const logContext = createEmailHandlerContext('sequence');
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Sequence email request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'sequence',
  });

  traceStep('Fetching due sequence emails', logContext);
  const { data, error } = await supabaseServiceRole.rpc('get_due_sequence_emails', undefined);

  if (error) {
    // Use dbQuery serializer for consistent database query formatting
    await logError('Failed to fetch due sequence emails', {
      ...logContext,
      dbQuery: {
        rpcName: 'get_due_sequence_emails',
      },
    }, error);
    return await errorResponse(error, 'handleSequence', publicCorsHeaders, logContext);
  }

  if (!Array.isArray(data) || data.length === 0) {
    logInfo('No due sequence emails', logContext);
    traceRequestComplete(logContext);
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
      onError: async (item, error, attempt) => {
        await logError(
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
    ...logContext,
    sent: sentCount,
    failed: failedCount,
    total: dueEmails.length,
  });
  traceRequestComplete(logContext);

  await sendBetterStackHeartbeat(edgeEnv.betterstack.emailSequences, failedCount, logContext);

  return successResponse({ sent: sentCount, failed: failedCount });
}

/**
 * Send the configured job-lifecycle email (for example onboarding or status updates) to a user for a specific job.
 *
 * @param action - Key identifying which entry in `JOB_EMAIL_CONFIGS` to use for template, props, and subject
 * @returns A Response whose successful JSON body is `{ sent: true, id?: string, jobId: string }`; otherwise an appropriate HTTP error response
 */
export async function handleJobLifecycleEmail(req: Request, action: string): Promise<Response> {

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
    jobId,
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep(`Job lifecycle email request received (action: ${action})`, logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : action,
    action,
    jobId,
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
    await logError(
      `${action} email failed`,
      {
        ...logContext,
        job_id: jobId,
      },
      error
    );
    return await errorResponse(
      new Error(error.message || `${action} email failed`),
      'handleJobLifecycleEmail',
      publicCorsHeaders,
      logContext
    );
  }

  logInfo(`${action} email sent`, {
    ...logContext,
    job_id: jobId,
    email_id: data?.id,
  });
  traceRequestComplete(logContext);

  return successResponse({ sent: true, id: data?.id, jobId });
}

/**
 * Retrieves the newsletter subscriber count, using an in-memory cache and refreshing from NewsletterService when the cached value has expired.
 *
 * @returns The current newsletter subscriber count.
 */
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

/**
 * Provides the current newsletter subscriber count along with cache-related and CORS headers.
 *
 * @returns A JSON response body `{ count: number }` with Cache-Control and CORS headers set
 */
export async function handleGetNewsletterCount(): Promise<Response> {
  const logContext = createEmailHandlerContext('get-newsletter-count');
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Newsletter count request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'get-newsletter-count',
  });
  
  try {
    traceStep('Fetching newsletter count', logContext);
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
    traceRequestComplete(logContext);
    return jsonResponse({ count }, 200, headers);
  } catch (error) {
    await logError('Newsletter count failed', logContext, error);
    return await errorResponse(error, 'handleGetNewsletterCount', publicCorsHeaders, logContext);
  }
}

/**
 * Handle a contact form submission by validating input and category, notifying admins, sending a confirmation to the user, and returning the outcomes.
 *
 * @returns A Response containing JSON with the send outcome: `sent` (true if the handler completed its send attempts), `submission_id`, `admin_email_sent` (`true` if the admin notification was sent, `false` otherwise), `user_email_sent` (`true` if the user confirmation was sent, `false` otherwise), and `user_email_id` (the Resend message id for the user email, or `null` when unavailable).
 */
export async function handleContactSubmission(req: Request): Promise<Response> {

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
    submissionId,
    category,
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Contact submission request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'contact-submission',
    submissionId,
    category,
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
      await logError(
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
      await logError(
        'User confirmation email failed',
        {
          ...logContext,
          submission_id: submissionId,
        },
        userError
      );
    }

    logInfo('Contact submission emails completed', {
      ...logContext,
      submission_id: submissionId,
      admin_email_sent: !adminError,
      user_email_sent: !userError,
      user_email_id: userData?.id || null,
    });
    traceRequestComplete(logContext);

    return successResponse({
      sent: true,
      submission_id: submissionId,
      admin_email_sent: !adminError,
      user_email_sent: !userError,
      user_email_id: userData?.id || null,
    });
  } catch (error) {
    await logError('Contact submission email failed', logContext, error);
    return await errorResponse(error, 'handleContactSubmission', publicCorsHeaders, logContext);
  }
}