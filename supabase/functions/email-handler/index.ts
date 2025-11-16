/**
 * Consolidated Email Handler - Routes all email operations via action parameter
 */

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import type { FC } from 'npm:react@18.3.1';
import { Resend } from 'npm:resend@4.0.0';
import { supabaseServiceRole } from '../_shared/clients/supabase.ts';
import { AUTH_HOOK_ENV, RESEND_ENV, validateEnvironment } from '../_shared/config/email-config.ts';
import { edgeEnv } from '../_shared/config/env.ts';
import type { Database as DatabaseGenerated } from '../_shared/database.types.ts';
import type { Database, NewsletterSource } from '../_shared/database-overrides.ts';
import {
  type ContactCategory,
  callRpc,
  ENVIRONMENT_VALUES,
  type GetDueSequenceEmailsReturn,
  type GetWeeklyDigestReturn,
  insertTable,
  isContactCategory,
  isNewsletterSource,
  SETTING_TYPE_VALUES,
  type Tables,
  upsertTable,
} from '../_shared/database-overrides.ts';
import { batchProcess } from '../_shared/utils/batch-processor.ts';
import { invalidateCacheByKey } from '../_shared/utils/cache.ts';
import { renderEmailTemplate } from '../_shared/utils/email/base-template.tsx';
import { CollectionShared } from '../_shared/utils/email/templates/collection-shared.tsx';
import { ContactSubmissionAdmin } from '../_shared/utils/email/templates/contact-submission-admin.tsx';
import { ContactSubmissionUser } from '../_shared/utils/email/templates/contact-submission-user.tsx';
import { JobApproved } from '../_shared/utils/email/templates/job-approved.tsx';
import { JobExpired } from '../_shared/utils/email/templates/job-expired.tsx';
import { JobExpiring } from '../_shared/utils/email/templates/job-expiring.tsx';
import { JobPaymentConfirmed } from '../_shared/utils/email/templates/job-payment-confirmed.tsx';
import { JobPosted } from '../_shared/utils/email/templates/job-posted.tsx';
import { JobRejected } from '../_shared/utils/email/templates/job-rejected.tsx';
import { JobSubmitted } from '../_shared/utils/email/templates/job-submitted.tsx';
import {
  NewsletterWelcome,
  renderNewsletterWelcomeEmail,
} from '../_shared/utils/email/templates/newsletter-welcome.tsx';
import { OnboardingCommunity } from '../_shared/utils/email/templates/onboarding-community.tsx';
import { OnboardingGettingStarted } from '../_shared/utils/email/templates/onboarding-getting-started.tsx';
import { OnboardingPowerTips } from '../_shared/utils/email/templates/onboarding-power-tips.tsx';
import { OnboardingStayEngaged } from '../_shared/utils/email/templates/onboarding-stay-engaged.tsx';
import { WeeklyDigest } from '../_shared/utils/email/templates/weekly-digest.tsx';
import {
  badRequestResponse,
  errorResponse,
  jsonResponse,
  publicCorsHeaders,
  successResponse,
} from '../_shared/utils/http.ts';
import { MAX_BODY_SIZE, validateBodySize } from '../_shared/utils/input-validation.ts';
import {
  buildContactProperties,
  inferInitialTopics,
  syncContactSegment,
} from '../_shared/utils/integrations/resend.ts';
import { createEmailHandlerContext, withDuration } from '../_shared/utils/logging.ts';
import { parseJsonBody } from '../_shared/utils/parse-json-body.ts';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '../_shared/utils/rate-limit.ts';
import {
  applyRateLimitHeaders,
  createRateLimitErrorResponse,
} from '../_shared/utils/rate-limit-middleware.ts';
import { createRouter, type HttpMethod, type RouterContext } from '../_shared/utils/router.ts';
import { TIMEOUT_PRESETS, withTimeout } from '../_shared/utils/timeout.ts';
import { validateEmail } from '../_shared/utils/validate-email.ts';

validateEnvironment(['resend', 'auth-hook']);

const resend = new Resend(RESEND_ENV.apiKey);
const hookSecret = AUTH_HOOK_ENV.secret.replace('v1,whsec_', '');
const NEWSLETTER_COUNT_TTL_SECONDS = edgeEnv.newsletter.countTtlSeconds;
let newsletterCountCache: { value: number; expiresAt: number } | null = null;

interface EmailHandlerContext extends RouterContext {
  action: string | null;
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
    {
      name: 'subscribe',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.action === 'subscribe',
      handler: async (ctx) => {
        const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.email);
        if (!rateLimit.allowed) {
          return createRateLimitErrorResponse(rateLimit, {
            preset: 'email',
            cors: publicCorsHeaders,
          });
        }
        const response = await handleSubscribe(ctx.request);
        applyRateLimitHeaders(response, rateLimit, 'email');
        return response;
      },
    },
    {
      name: 'welcome',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.action === 'welcome',
      handler: async (ctx) => {
        const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.email);
        if (!rateLimit.allowed) {
          return createRateLimitErrorResponse(rateLimit, {
            preset: 'email',
            cors: publicCorsHeaders,
          });
        }
        const response = await handleWelcome(ctx.request);
        applyRateLimitHeaders(response, rateLimit, 'email');
        return response;
      },
    },
    {
      name: 'transactional',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.action === 'transactional',
      handler: async (ctx) => {
        const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.email);
        if (!rateLimit.allowed) {
          return createRateLimitErrorResponse(rateLimit, {
            preset: 'email',
            cors: publicCorsHeaders,
          });
        }
        const response = await handleTransactional(ctx.request);
        applyRateLimitHeaders(response, rateLimit, 'email');
        return response;
      },
    },
    {
      name: 'digest',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.action === 'digest',
      handler: async () => await handleDigest(),
    },
    {
      name: 'sequence',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.action === 'sequence',
      handler: async () => await handleSequence(),
    },
    {
      name: 'get-count',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.action === 'get-count',
      handler: () => handleGetNewsletterCount(),
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
        const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.email);
        if (!rateLimit.allowed) {
          return createRateLimitErrorResponse(rateLimit, {
            preset: 'email',
            cors: publicCorsHeaders,
          });
        }
        const response = await handleJobLifecycleEmail(ctx.request, ctx.action);
        applyRateLimitHeaders(response, rateLimit, 'email');
        return response;
      },
    },
    {
      name: 'contact-submission',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.action === 'contact-submission',
      handler: async (ctx) => {
        const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.email);
        if (!rateLimit.allowed) {
          return createRateLimitErrorResponse(rateLimit, {
            preset: 'email',
            cors: publicCorsHeaders,
          });
        }
        const response = await handleContactSubmission(ctx.request);
        applyRateLimitHeaders(response, rateLimit, 'email');
        return response;
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
    let resendContactId: string | null = null;
    let syncStatus: 'synced' | 'failed' | 'skipped' = 'synced';
    let syncError: string | null = null;
    let topicIds: string[] = [];

    // Build contact properties from signup context (used for both Resend and database)
    // Source is already validated above, convert to NewsletterSource | null
    const validatedSource: NewsletterSource | null =
      source && typeof source === 'string' && isNewsletterSource(source)
        ? (source as NewsletterSource)
        : null;

    const contactProperties = buildContactProperties({
      source: validatedSource,
      copyType: copy_type,
      copyCategory: copy_category,
      referrer,
    });

    try {
      console.log('[email-handler] Creating Resend contact', {
        ...logContext,
        source,
        copy_category,
        copy_type,
        contact_properties: contactProperties,
      });

      // Create contact with properties
      // Resend API types may not include all fields - use type assertion
      type ResendContactsCreateApi = {
        create: (args: {
          audienceId: string;
          email: string;
          unsubscribed?: boolean;
          properties?: Record<string, unknown>;
        }) => Promise<{ data: { id: string } | null; error: { message?: string } | null }>;
      };
      const contactsApi = resend.contacts as unknown as ResendContactsCreateApi;
      const { data: contact, error: resendError } = await withTimeout(
        contactsApi.create({
          audienceId: RESEND_ENV.audienceId,
          email: normalizedEmail,
          unsubscribed: false,
          properties: contactProperties,
        }),
        TIMEOUT_PRESETS.external,
        'Resend contact creation timed out'
      );

      if (resendError) {
        // If email already exists in Resend, that's OK - just log it
        if (
          resendError.message?.includes('already exists') ||
          resendError.message?.includes('duplicate')
        ) {
          console.log('[email-handler] Email already in Resend, skipping contact creation', {
            ...logContext,
            sync_status: 'skipped',
          });
          syncStatus = 'skipped';
          syncError = 'Email already in audience';
        } else {
          // Other Resend errors - log but don't fail the entire request
          console.error('[email-handler] Resend contact creation failed', {
            ...logContext,
            error: resendError.message || 'Unknown Resend error',
            sync_status: 'failed',
          });
          syncStatus = 'failed';
          syncError = resendError.message || 'Unknown Resend error';
        }
      } else if (contact?.id) {
        resendContactId = contact.id;
        console.log('[email-handler] Contact created', {
          ...logContext,
          resend_contact_id: resendContactId,
        });

        // Step 1.5: Assign topics based on signup context
        try {
          topicIds = inferInitialTopics(validatedSource, copy_category);
          console.log('[email-handler] Assigning topics', {
            ...logContext,
            topic_count: topicIds.length,
            topic_ids: topicIds,
          });

          if (topicIds.length > 0) {
            // Resend API types may not include topics - use type assertion
            type ResendContactsTopicsApi = {
              topics: {
                update: (args: {
                  contactId: string;
                  topicIds: string[];
                }) => Promise<{ data: unknown; error: { message?: string } | null }>;
              };
            };
            const contactsWithTopics = resend.contacts as unknown as ResendContactsTopicsApi;
            const { error: topicError } = await withTimeout(
              contactsWithTopics.topics.update({
                contactId: resendContactId,
                topicIds,
              }),
              TIMEOUT_PRESETS.external,
              'Resend topic assignment timed out'
            );

            if (topicError) {
              console.error('[email-handler] Failed to assign topics', {
                ...logContext,
                error: topicError.message || 'Unknown topic error',
              });
              // Don't fail subscription - topics can be managed later
            } else {
              console.log('[email-handler] Topics assigned successfully', logContext);
            }
          }
        } catch (topicException) {
          console.error('[email-handler] Topic assignment exception', {
            ...logContext,
            error:
              topicException instanceof Error ? topicException.message : String(topicException),
          });
          // Don't fail subscription - non-critical
        }

        // Step 1.6: Assign to engagement segment
        try {
          const engagementScore = contactProperties.engagement_score as number;
          await withTimeout(
            syncContactSegment(resend, resendContactId, engagementScore),
            TIMEOUT_PRESETS.external,
            'Resend segment assignment timed out'
          );
          console.log('[email-handler] Segment assigned successfully', logContext);
        } catch (segmentException) {
          console.error('[email-handler] Segment assignment exception', {
            ...logContext,
            error:
              segmentException instanceof Error
                ? segmentException.message
                : String(segmentException),
          });
          // Don't fail subscription - non-critical
        }
      }
    } catch (resendException) {
      // Catch any unexpected Resend errors
      console.error('[email-handler] Unexpected Resend error', {
        ...logContext,
        error: resendException instanceof Error ? resendException.message : String(resendException),
      });
      syncStatus = 'failed';
      syncError = resendException instanceof Error ? resendException.message : 'Unknown error';
    }

    // Step 2: Insert into database (rate limiting handled by BEFORE INSERT trigger)
    // Use validated source (defaults to 'footer' if not provided or invalid)
    const finalSource: NewsletterSource = validatedSource ?? ('footer' as NewsletterSource);

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
        engagement_score: contactProperties.engagement_score as number,
        primary_interest: contactProperties.primary_interest as string,
        total_copies: contactProperties.total_copies as number,
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
      // Handle specific database errors
      // Type guard for Supabase PostgrestError which has 'code' and 'message' properties
      const isPostgrestError = typeof dbError === 'object' && dbError !== null && 'code' in dbError;
      if (isPostgrestError && dbError.code === '23505') {
        // Email already exists (UNIQUE constraint violation)
        return badRequestResponse('This email is already subscribed to our newsletter');
      }
      const errorMessage =
        isPostgrestError && 'message' in dbError && typeof dbError.message === 'string'
          ? dbError.message
          : String(dbError);
      if (errorMessage.includes('Rate limit')) {
        // Rate limit exceeded (triggered by database trigger)
        return jsonResponse(
          {
            error: 'Rate limit exceeded',
            message: 'Too many subscription attempts. Please try again later.',
          },
          429,
          publicCorsHeaders
        );
      }
      throw new Error(`Database insert failed: ${errorMessage}`);
    }

    // Step 2.5: Invalidate cache after successful subscription insert
    await invalidateCacheByKey('cache.invalidate.newsletter_subscribe', ['newsletter'], {
      logContext,
    }).catch((error) => {
      console.warn('[email-handler] Cache invalidation failed', {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    // Step 3: Send welcome email
    const html = await renderEmailTemplate(NewsletterWelcome, { email: normalizedEmail });

    const { data: emailData, error: emailError } = (await withTimeout(
      resend.emails.send({
        from: 'Claude Pro Directory <hello@mail.claudepro.directory>',
        to: normalizedEmail,
        subject: 'Welcome to Claude Pro Directory! 🎉',
        html,
        tags: [{ name: 'type', value: 'newsletter' }],
      }),
      TIMEOUT_PRESETS.external,
      'Resend email send timed out'
    )) as { data: { id: string } | null; error: { message: string } | null };

    if (emailError) {
      // Log email error but don't fail the request - subscription is saved
      console.error('[email-handler] Welcome email failed', {
        ...logContext,
        error: emailError.message || 'Unknown email error',
      });
    }

    // Step 4: Enroll in onboarding sequence
    try {
      const enrollArgs = {
        p_email: normalizedEmail,
      } satisfies DatabaseGenerated['public']['Functions']['enroll_in_email_sequence']['Args'];
      await callRpc('enroll_in_email_sequence', enrollArgs);
    } catch (sequenceError) {
      // Log sequence error but don't fail - subscription is saved
      console.error('[email-handler] Sequence enrollment failed', {
        ...logContext,
        error: sequenceError instanceof Error ? sequenceError.message : String(sequenceError),
      });
    }

    // Ensure subscription is not null before accessing properties
    if (!subscription) {
      throw new Error('Subscription insert succeeded but no data returned');
    }

    // Return success with final log
    console.log('[email-handler] Subscription completed', {
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
    console.error('[email-handler] Newsletter subscription failed', {
      ...withDuration(logContext, startTime),
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error, 'handleSubscribe');
  }
}

async function handleWelcome(req: Request): Promise<Response> {
  const startTime = Date.now();
  const triggerSource = req.headers.get('X-Trigger-Source');

  // Newsletter subscription trigger
  if (triggerSource === 'newsletter_subscription') {
    const parseResult = await parseJsonBody<{ email: string; subscription_id: string }>(req, {
      maxSize: MAX_BODY_SIZE.default,
      cors: publicCorsHeaders,
    });

    if (!parseResult.success) {
      return parseResult.response;
    }

    const payload = parseResult.data;
    const { email, subscription_id } = payload;

    const logContext = createEmailHandlerContext('welcome', {
      email: typeof email === 'string' ? email : undefined,
      subscriptionId: typeof subscription_id === 'string' ? subscription_id : undefined,
    });

    const html = await renderEmailTemplate(NewsletterWelcome, { email });

    const { data, error } = await withTimeout(
      resend.emails.send({
        from: 'Claude Pro Directory <hello@mail.claudepro.directory>',
        to: email,
        subject: 'Welcome to Claude Pro Directory! 🎉',
        html,
        tags: [{ name: 'type', value: 'newsletter' }],
      }),
      TIMEOUT_PRESETS.external,
      'Resend welcome email send timed out'
    );

    if (error) {
      console.error('[email-handler] Welcome email failed', {
        ...logContext,
        error: error.message || 'Unknown error',
      });
      return errorResponse(new Error(error.message || 'Welcome email failed'), 'handleWelcome');
    }

    // Enroll in onboarding sequence
    try {
      const enrollArgs = {
        p_email: email,
      } satisfies DatabaseGenerated['public']['Functions']['enroll_in_email_sequence']['Args'];
      await callRpc('enroll_in_email_sequence', enrollArgs);
    } catch (sequenceError) {
      console.error('[email-handler] Sequence enrollment failed', {
        ...logContext,
        error: sequenceError instanceof Error ? sequenceError.message : String(sequenceError),
      });
      // Don't fail - email was sent
    }

    console.log('[email-handler] Welcome email sent', {
      ...withDuration(logContext, startTime),
      subscription_id,
      email_id: data?.id,
    });

    return successResponse({ sent: true, id: data?.id, subscription_id });
  }

  // Auth hook trigger (OAuth signup)
  // Validate body size for webhook payload
  const contentLength = req.headers.get('content-length');
  const bodySizeValidation = validateBodySize(contentLength, MAX_BODY_SIZE.webhook);
  if (!bodySizeValidation.valid) {
    return badRequestResponse(
      bodySizeValidation.error ?? 'Request body too large',
      publicCorsHeaders
    );
  }

  const payloadText = await req.text();

  // Double-check size after reading
  if (payloadText.length > MAX_BODY_SIZE.webhook) {
    return badRequestResponse(
      `Request body too large (max ${MAX_BODY_SIZE.webhook} bytes)`,
      publicCorsHeaders
    );
  }

  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(hookSecret);

  let verified: { user: { id: string; email: string } };
  try {
    verified = wh.verify(payloadText, headers) as { user: { id: string; email: string } };
  } catch {
    return badRequestResponse('Invalid webhook signature');
  }

  const html = await renderNewsletterWelcomeEmail({ email: verified.user.email });

  const { data, error } = await withTimeout(
    resend.emails.send({
      from: 'Claude Pro Directory <hello@mail.claudepro.directory>',
      to: verified.user.email,
      subject: 'Welcome to Claude Pro Directory! 🎉',
      html,
      tags: [{ name: 'type', value: 'auth' }],
    }),
    TIMEOUT_PRESETS.external,
    'Resend auth welcome email send timed out'
  );

  const logContext = createEmailHandlerContext('welcome', {
    email: verified.user.email,
  });

  if (error) {
    console.error('[email-handler] Welcome email failed', {
      ...logContext,
      user_id: verified.user.id,
      error: error.message || 'Unknown error',
    });
    return errorResponse(new Error(error.message || 'Welcome email failed'), 'handleWelcome');
  }

  console.log('[email-handler] Welcome email sent', {
    ...logContext,
    user_id: verified.user.id,
    email_id: data?.id,
  });

  return successResponse({ sent: true, id: data?.id, user_id: verified.user.id });
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
    email: typeof email === 'string' ? email : undefined,
  });

  // Validate required fields
  if (!(type && email)) {
    return badRequestResponse('Missing required fields: type, email');
  }

  let html: string | null = null;
  let subject = '';

  // Route to appropriate template based on type
  switch (type) {
    case 'job-posted':
      if (!(emailData?.jobTitle && emailData?.company && emailData?.jobSlug)) {
        return badRequestResponse('Missing required job data');
      }
      html = await renderEmailTemplate(JobPosted, {
        jobTitle: emailData.jobTitle,
        company: emailData.company,
        userEmail: email,
        jobSlug: emailData.jobSlug,
      });
      subject = `Your job posting "${emailData.jobTitle}" is now live!`;
      break;

    case 'collection-shared':
      if (
        !(
          emailData?.collectionName &&
          emailData?.senderName &&
          emailData?.collectionSlug &&
          emailData?.senderSlug &&
          emailData?.itemCount
        )
      ) {
        return badRequestResponse('Missing required collection data');
      }
      html = await renderEmailTemplate(CollectionShared, {
        collectionName: emailData.collectionName,
        collectionDescription: emailData.collectionDescription || undefined,
        senderName: emailData.senderName,
        recipientEmail: email,
        collectionSlug: emailData.collectionSlug,
        senderSlug: emailData.senderSlug,
        itemCount: emailData.itemCount,
      });
      subject = `${emailData.senderName} shared a collection with you`;
      break;

    default:
      return badRequestResponse(`Unknown transactional email type: ${type}`);
  }

  // Render and send email
  if (!html) {
    return badRequestResponse('Unsupported transactional template');
  }

  // Determine from address based on type
  const fromEmail =
    type === 'job-posted'
      ? 'Claude Pro Directory <jobs@mail.claudepro.directory>'
      : 'Claude Pro Directory <community@mail.claudepro.directory>';

  const { data, error } = await withTimeout(
    resend.emails.send({
      from: fromEmail,
      to: email,
      subject,
      html,
    }),
    TIMEOUT_PRESETS.external,
    'Resend transactional email send timed out'
  );

  if (error) {
    console.error('[email-handler] Failed to send transactional email', {
      ...logContext,
      type,
      error: error.message || 'Unknown error',
    });
    return errorResponse(
      new Error(error.message || 'Transactional email failed'),
      'handleTransactional'
    );
  }

  console.log('[email-handler] Transactional email sent', {
    ...withDuration(logContext, startTime),
    type,
    email_id: data?.id,
  });

  return successResponse({ sent: true, id: data?.id, type });
}

async function handleDigest(): Promise<Response> {
  const startTime = Date.now();
  const logContext = createEmailHandlerContext('digest');

  // OPTION 1: Rate limiting protection - check last successful run timestamp
  // Type assertion needed for app_settings table access
  type AppSettingsRow = Pick<Tables<'app_settings'>, 'setting_value' | 'updated_at'>;
  const { data: lastRunData } = await (
    supabaseServiceRole.from('app_settings') as unknown as {
      select: (columns: string) => {
        eq: (
          column: string,
          value: string
        ) => {
          single: () => Promise<{ data: AppSettingsRow | null; error: unknown }>;
        };
      };
    }
  )
    .select('setting_value, updated_at')
    .eq('setting_key', 'last_digest_email_timestamp')
    .single();

  if (lastRunData?.setting_value) {
    const lastRunTimestamp = new Date(lastRunData.setting_value as string);
    const hoursSinceLastRun = (Date.now() - lastRunTimestamp.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastRun < 24) {
      const nextAllowedAt = new Date(lastRunTimestamp.getTime() + 24 * 60 * 60 * 1000);
      console.log('[email-handler] Digest rate limited', {
        ...logContext,
        hours_since_last_run: hoursSinceLastRun.toFixed(1),
        next_allowed_at: nextAllowedAt.toISOString(),
      });

      return successResponse({
        skipped: true,
        reason: 'rate_limited',
        hoursSinceLastRun: Math.round(hoursSinceLastRun * 10) / 10,
        nextAllowedAt: nextAllowedAt.toISOString(),
      });
    }
  }

  const previousWeekStart = getPreviousWeekStart();

  const digestArgs = {
    p_week_start: previousWeekStart,
  } satisfies DatabaseGenerated['public']['Functions']['get_weekly_digest']['Args'];
  const { data: digest, error: digestError } = await callRpc('get_weekly_digest', digestArgs);

  if (digestError) throw digestError;

  // Type the RPC return properly
  if (!digest || typeof digest !== 'object' || digest === null) {
    return successResponse({ skipped: true, reason: 'invalid_data' });
  }
  const digestData = digest as GetWeeklyDigestReturn;

  // Runtime check for required properties with proper type narrowing
  const hasNewContent =
    digestData !== null &&
    typeof digestData === 'object' &&
    'newContent' in digestData &&
    Array.isArray(digestData.newContent) &&
    digestData.newContent.length > 0;
  const hasTrendingContent =
    digestData !== null &&
    typeof digestData === 'object' &&
    'trendingContent' in digestData &&
    Array.isArray(digestData.trendingContent) &&
    digestData.trendingContent.length > 0;

  if (!(hasNewContent || hasTrendingContent)) {
    return successResponse({ skipped: true, reason: 'no_content' });
  }

  const subscribers = await getAllSubscribers();

  if (subscribers.length === 0) {
    return successResponse({ skipped: true, reason: 'no_subscribers' });
  }

  const results = await sendBatchDigest(subscribers, digestData);

  // OPTION 1: Update last successful run timestamp after sending
  const currentTimestamp = new Date().toISOString();
  const upsertData = {
    setting_key: 'last_digest_email_timestamp',
    setting_value: currentTimestamp,
    setting_type: SETTING_TYPE_VALUES[1], // 'string'
    environment: ENVIRONMENT_VALUES[2], // 'production'
    enabled: true,
    description: 'Timestamp of last successful weekly digest email send (used for rate limiting)',
    category: 'email',
    version: 1,
  } satisfies DatabaseGenerated['public']['Tables']['app_settings']['Insert'];
  await upsertTable('app_settings', upsertData);

  console.log('[email-handler] Digest completed', {
    ...withDuration(logContext, startTime),
    success: results.success,
    failed: results.failed,
    success_rate: results.successRate,
    last_digest_timestamp: currentTimestamp,
  });

  // BetterStack heartbeat with timeout
  const heartbeatUrl = edgeEnv.betterstack.weeklyTasks;
  if (heartbeatUrl) {
    await withTimeout(
      fetch(results.failed === 0 ? heartbeatUrl : `${heartbeatUrl}/fail`, { method: 'GET' }),
      TIMEOUT_PRESETS.external,
      'BetterStack heartbeat timed out'
    ).catch((error) => {
      console.warn('[email-handler] BetterStack heartbeat failed', {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

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
    console.error('[email-handler] Failed to fetch due sequence emails', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  // Type the RPC return properly
  if (!(data && Array.isArray(data))) {
    return successResponse({ sent: 0, failed: 0 });
  }
  const dueEmailsRaw = data as GetDueSequenceEmailsReturn;

  // Runtime check to ensure dueEmails is an array
  if (!Array.isArray(dueEmailsRaw) || dueEmailsRaw.length === 0) {
    console.log('[email-handler] No due sequence emails', logContext);
    return successResponse({ sent: 0, failed: 0 });
  }

  // Type guard to ensure array items match expected structure
  const dueEmails = dueEmailsRaw.filter((item): item is GetDueSequenceEmailsReturn[number] => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.email === 'string' &&
      typeof item.step === 'number'
    );
  });

  console.log('[email-handler] Processing sequence emails', {
    ...logContext,
    due_count: dueEmails.length,
  });

  const STEP_SUBJECTS: Record<number, string> = {
    2: 'Getting Started with Claude Pro Directory',
    3: 'Power User Tips for Claude',
    4: 'Join the Claude Pro Community',
    5: 'Stay Engaged with ClaudePro',
  };

  const STEP_TEMPLATES: Record<number, FC<{ email: string }>> = {
    2: OnboardingGettingStarted,
    3: OnboardingPowerTips,
    4: OnboardingCommunity,
    5: OnboardingStayEngaged,
  };

  // Use batch processor for concurrent email sending with error handling
  const results = await batchProcess(
    dueEmails,
    async ({ id, email, step }) => {
      const Template = STEP_TEMPLATES[step];
      if (!Template) {
        throw new Error(`Unknown step: ${step}`);
      }

      const html = await renderEmailTemplate(Template, { email });

      const result = await withTimeout(
        resend.emails.send({
          from: 'Claude Pro Directory <noreply@claudepro.directory>',
          to: email,
          subject: STEP_SUBJECTS[step],
          html,
          tags: [
            { name: 'template', value: 'onboarding_sequence' },
            { name: 'step', value: step.toString() },
          ],
        }),
        TIMEOUT_PRESETS.external,
        'Resend sequence email send timed out'
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      const markProcessedArgs = {
        p_schedule_id: id,
        p_email: email,
        p_step: step,
        p_success: true,
      } satisfies DatabaseGenerated['public']['Functions']['mark_sequence_email_processed']['Args'];
      await callRpc('mark_sequence_email_processed', markProcessedArgs);

      const scheduleNextArgs = {
        p_email: email,
        p_current_step: step,
      } satisfies DatabaseGenerated['public']['Functions']['schedule_next_sequence_step']['Args'];
      await callRpc('schedule_next_sequence_step', scheduleNextArgs);
    },
    {
      concurrency: 5, // Process 5 emails concurrently
      retries: 0, // Don't retry failed emails (they'll be picked up next run)
      onError: (item, error, attempt) => {
        console.error('[email-handler] Failed to send sequence email', {
          ...logContext,
          step: item.step,
          email: item.email,
          attempt,
          error: error instanceof Error ? error.message : String(error),
        });
      },
    }
  );

  const sentCount = results.successCount;
  const failedCount = results.failedCount;

  console.log('[email-handler] Sequence emails completed', {
    ...withDuration(logContext, startTime),
    sent: sentCount,
    failed: failedCount,
    total: dueEmails.length,
  });

  // BetterStack heartbeat with timeout
  const heartbeatUrl = edgeEnv.betterstack.emailSequences;
  if (heartbeatUrl) {
    await withTimeout(
      fetch(failedCount === 0 ? heartbeatUrl : `${heartbeatUrl}/fail`, { method: 'GET' }),
      TIMEOUT_PRESETS.external,
      'BetterStack heartbeat timed out'
    ).catch((error) => {
      console.warn('[email-handler] BetterStack heartbeat failed', {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  return successResponse({ sent: sentCount, failed: failedCount });
}

// Helper functions
function getPreviousWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - dayOfWeek - 6);
  lastMonday.setHours(0, 0, 0, 0);
  return lastMonday.toISOString().split('T')[0];
}

async function getAllSubscribers(): Promise<string[]> {
  const { data, error } = await callRpc(
    'get_active_subscribers',
    {} as DatabaseGenerated['public']['Functions']['get_active_subscribers']['Args']
  );

  if (error) {
    console.error('[email-handler] Failed to fetch subscribers', {
      function: 'email-handler',
      action: 'get-all-subscribers',
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }

  return data || [];
}

async function sendBatchDigest(subscribers: string[], digestData: GetWeeklyDigestReturn) {
  let success = 0;
  let failed = 0;

  // Render once for all subscribers (same content)
  const html = await renderEmailTemplate(WeeklyDigest, {
    email: subscribers[0] || '', // First email for template (not used in rendering)
    weekOf: digestData.weekOf,
    newContent: digestData.newContent,
    trendingContent: digestData.trendingContent,
  });

  // Use Resend batch API (up to 100 recipients) instead of sequential sending
  const batchSize = 100;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);

    try {
      const result = await withTimeout(
        resend.batch.send(
          batch.map((email) => ({
            from: 'Claude Pro Directory <hello@mail.claudepro.directory>',
            to: email,
            subject: `This Week in Claude: ${digestData.weekOf}`,
            html,
            tags: [{ name: 'type', value: 'weekly_digest' }],
          }))
        ),
        TIMEOUT_PRESETS.external * 2, // Longer timeout for batch operations
        'Resend batch digest send timed out'
      );

      if (result.error) {
        failed += batch.length;
      } else {
        success += batch.length;
      }
    } catch (error) {
      console.error('[email-handler] Batch send failed', {
        function: 'email-handler',
        action: 'send-batch-digest',
        batch_size: batch.length,
        error: error instanceof Error ? error.message : String(error),
      });
      failed += batch.length;
    }
  }

  return {
    success,
    failed,
    successRate: `${((success / (success + failed)) * 100).toFixed(1)}%`,
  };
}

/**
 * Job Lifecycle Email Handler (Consolidated)
 * Handles all job-related email notifications with a unified config-based approach
 */
interface JobEmailConfig<TProps = Record<string, unknown>> {
  template: FC<TProps>;
  buildSubject: (data: Record<string, unknown>) => string;
  buildProps: (data: Record<string, unknown>) => TProps;
}

const JOB_EMAIL_CONFIGS: Record<string, JobEmailConfig> = {
  'job-submitted': {
    template: JobSubmitted,
    buildSubject: (data) => `Job Submitted: ${data.jobTitle as string}`,
    buildProps: (data) => ({
      jobTitle: data.jobTitle,
      company: data.company,
      userEmail: data.userEmail,
      jobId: data.jobId,
    }),
  },
  'job-approved': {
    template: JobApproved,
    buildSubject: (data) => `Job Approved: ${data.jobTitle as string}`,
    buildProps: (data) => ({
      jobTitle: data.jobTitle,
      company: data.company,
      userEmail: data.userEmail,
      jobId: data.jobId,
      plan: data.plan,
      paymentAmount: data.paymentAmount,
      paymentUrl: data.paymentUrl,
    }),
  },
  'job-rejected': {
    template: JobRejected,
    buildSubject: (data) => `Action Required: Update Your Job Posting - ${data.jobTitle as string}`,
    buildProps: (data) => ({
      jobTitle: data.jobTitle,
      company: data.company,
      userEmail: data.userEmail,
      jobId: data.jobId,
      rejectionReason: data.rejectionReason,
    }),
  },
  'job-expiring': {
    template: JobExpiring,
    buildSubject: (data) =>
      `Expiring Soon: ${data.jobTitle as string} (${data.daysRemaining as number} days remaining)`,
    buildProps: (data) => ({
      jobTitle: data.jobTitle,
      company: data.company,
      userEmail: data.userEmail,
      jobId: data.jobId,
      expiresAt: data.expiresAt,
      daysRemaining: data.daysRemaining,
      renewalUrl: data.renewalUrl,
    }),
  },
  'job-expired': {
    template: JobExpired,
    buildSubject: (data) => `Job Listing Expired: ${data.jobTitle as string}`,
    buildProps: (data) => ({
      jobTitle: data.jobTitle,
      company: data.company,
      userEmail: data.userEmail,
      jobId: data.jobId,
      expiredAt: data.expiredAt,
      viewCount: data.viewCount,
      clickCount: data.clickCount,
      repostUrl: data.repostUrl,
    }),
  },
  'job-payment-confirmed': {
    template: JobPaymentConfirmed,
    buildSubject: (data) => `Your Job is Live: ${data.jobTitle as string}`,
    buildProps: (data) => ({
      jobTitle: data.jobTitle,
      company: data.company,
      userEmail: data.userEmail,
      jobId: data.jobId,
      jobSlug: data.jobSlug,
      plan: data.plan,
      paymentAmount: data.paymentAmount,
      paymentDate: data.paymentDate,
      expiresAt: data.expiresAt,
    }),
  },
};

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

  const { data, error } = await withTimeout(
    resend.emails.send({
      from: 'Claude Pro Directory <jobs@mail.claudepro.directory>',
      to: userEmail,
      subject,
      html,
      tags: [{ name: 'type', value: action }],
    }),
    TIMEOUT_PRESETS.external,
    'Resend job lifecycle email send timed out'
  );

  if (error) {
    console.error(`[email-handler] ${action} email failed`, {
      ...logContext,
      job_id: jobId,
      error: error.message || 'Unknown error',
    });
    return errorResponse(
      new Error(error.message || `${action} email failed`),
      'handleJobLifecycleEmail'
    );
  }

  console.log(`[email-handler] ${action} email sent`, {
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

    console.log('[email-handler] Newsletter count retrieved', {
      ...logContext,
      count,
    });
    return jsonResponse({ count }, 200, headers);
  } catch (error) {
    console.error('[email-handler] Newsletter count failed', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
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
    email: typeof email === 'string' ? email : undefined,
  });

  if (!(submissionId && name && email && category && message)) {
    return badRequestResponse(
      'Missing required fields: submissionId, name, email, category, message'
    );
  }

  // Validate category is a valid contact_category enum value
  if (typeof category !== 'string' || !isContactCategory(category)) {
    return badRequestResponse(
      'Invalid category value. Must be one of: bug, feature, partnership, general, other'
    );
  }

  const validatedCategory: ContactCategory = category as ContactCategory;

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

    const { error: adminError } = await withTimeout(
      resend.emails.send({
        from: 'Claude Pro Directory <contact@mail.claudepro.directory>',
        to: 'hi@claudepro.directory',
        subject: `New Contact: ${validatedCategory} - ${name}`,
        html: adminHtml,
        tags: [{ name: 'type', value: 'contact-admin' }],
      }),
      TIMEOUT_PRESETS.external,
      'Resend contact admin email send timed out'
    );

    if (adminError) {
      console.error('[email-handler] Admin notification email failed', {
        ...logContext,
        submission_id: submissionId,
        error: adminError.message || 'Unknown error',
      });
      // Don't fail - continue to user confirmation
    }

    // Send user confirmation email
    const userHtml = await renderEmailTemplate(ContactSubmissionUser, {
      name,
      category: validatedCategory,
    });

    const { data: userData, error: userError } = await withTimeout(
      resend.emails.send({
        from: 'Claude Pro Directory <hello@mail.claudepro.directory>',
        to: email,
        subject: 'We received your message!',
        html: userHtml,
        tags: [{ name: 'type', value: 'contact-confirmation' }],
      }),
      TIMEOUT_PRESETS.external,
      'Resend contact user email send timed out'
    );

    if (userError) {
      console.error('[email-handler] User confirmation email failed', {
        ...logContext,
        submission_id: submissionId,
        error: userError.message || 'Unknown error',
      });
    }

    console.log('[email-handler] Contact submission emails completed', {
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
    console.error('[email-handler] Contact submission email failed', {
      ...withDuration(logContext, startTime),
      submission_id: submissionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error, 'handleContactSubmission');
  }
}
