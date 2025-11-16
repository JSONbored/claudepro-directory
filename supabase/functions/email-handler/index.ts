/**
 * Consolidated Email Handler - Routes all email operations via action parameter
 */

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import type { FC } from 'npm:react@18.3.1';
import { Resend } from 'npm:resend@4.0.0';
import { supabaseServiceRole } from '../_shared/clients/supabase.ts';
import { AUTH_HOOK_ENV, RESEND_ENV, validateEnvironment } from '../_shared/config/email-config.ts';
import { edgeEnv } from '../_shared/config/env.ts';
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
import { NewsletterWelcome } from '../_shared/utils/email/templates/newsletter-welcome.tsx';
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
import {
  buildContactProperties,
  inferInitialTopics,
  syncContactSegment,
} from '../_shared/utils/integrations/resend.ts';
import { createEmailHandlerContext, withDuration } from '../_shared/utils/logging.ts';
import { createRouter, type HttpMethod, type RouterContext } from '../_shared/utils/router.ts';

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
      handler: (ctx) => handleSubscribe(ctx.request),
    },
    {
      name: 'welcome',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.action === 'welcome',
      handler: (ctx) => handleWelcome(ctx.request),
    },
    {
      name: 'transactional',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.action === 'transactional',
      handler: (ctx) => handleTransactional(ctx.request),
    },
    {
      name: 'digest',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.action === 'digest',
      handler: () => handleDigest(),
    },
    {
      name: 'sequence',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.action === 'sequence',
      handler: () => handleSequence(),
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
      handler: (ctx) => {
        if (!ctx.action) {
          return badRequestResponse('Missing action');
        }
        return handleJobLifecycleEmail(ctx.request, ctx.action);
      },
    },
    {
      name: 'contact-submission',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.action === 'contact-submission',
      handler: (ctx) => handleContactSubmission(ctx.request),
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

  // Parse and validate JSON body
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequestResponse('Valid JSON body is required');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return badRequestResponse('Valid JSON body is required');
  }

  const { email, source, referrer, copy_type, copy_category, copy_slug } =
    payload as SubscribePayload;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    return badRequestResponse('Valid email address is required');
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

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
    const contactProperties = buildContactProperties({
      source,
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
      const { data: contact, error: resendError } = await resend.contacts.create({
        audienceId: RESEND_ENV.audienceId,
        email: normalizedEmail,
        unsubscribed: false,
        properties: contactProperties,
      });

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
          topicIds = inferInitialTopics(source, copy_category);
          console.log('[email-handler] Assigning topics', {
            ...logContext,
            topic_count: topicIds.length,
            topic_ids: topicIds,
          });

          if (topicIds.length > 0) {
            const { error: topicError } = await resend.contacts.topics.update({
              contactId: resendContactId,
              topicIds,
            });

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
          await syncContactSegment(resend, resendContactId, engagementScore);
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
    const { data: subscription, error: dbError } = await supabaseServiceRole
      .from('newsletter_subscriptions')
      .insert({
        email: normalizedEmail,
        source: source || 'footer',
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
      })
      .select()
      .single();

    if (dbError) {
      // Handle specific database errors
      if (dbError.code === '23505') {
        // Email already exists (UNIQUE constraint violation)
        return badRequestResponse('This email is already subscribed to our newsletter');
      }
      if (dbError.message?.includes('Rate limit')) {
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
      throw new Error(`Database insert failed: ${dbError.message}`);
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

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Claude Pro Directory <hello@mail.claudepro.directory>',
      to: normalizedEmail,
      subject: 'Welcome to Claude Pro Directory! 🎉',
      html,
      tags: [{ name: 'type', value: 'newsletter' }],
    });

    if (emailError) {
      // Log email error but don't fail the request - subscription is saved
      console.error('[email-handler] Welcome email failed', {
        ...logContext,
        error: emailError.message || 'Unknown email error',
      });
    }

    // Step 4: Enroll in onboarding sequence
    try {
      await supabaseServiceRole.rpc('enroll_in_email_sequence', {
        p_email: normalizedEmail,
      });
    } catch (sequenceError) {
      // Log sequence error but don't fail - subscription is saved
      console.error('[email-handler] Sequence enrollment failed', {
        ...logContext,
        error: sequenceError instanceof Error ? sequenceError.message : String(sequenceError),
      });
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
    const payload = await req.json();
    const { email, subscription_id } = payload;

    const logContext = createEmailHandlerContext('welcome', {
      email: typeof email === 'string' ? email : undefined,
      subscriptionId: typeof subscription_id === 'string' ? subscription_id : undefined,
    });

    const html = await renderEmailTemplate(NewsletterWelcome, { email });

    const { data, error } = await resend.emails.send({
      from: 'Claude Pro Directory <hello@mail.claudepro.directory>',
      to: email,
      subject: 'Welcome to Claude Pro Directory! 🎉',
      html,
      tags: [{ name: 'type', value: 'newsletter' }],
    });

    if (error) {
      console.error('[email-handler] Welcome email failed', {
        ...logContext,
        error: error.message || 'Unknown error',
      });
      throw new Error(error.message);
    }

    // Enroll in onboarding sequence
    try {
      await supabaseServiceRole.rpc('enroll_in_email_sequence', {
        p_email: email,
      });
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
  const payloadText = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(hookSecret);

  let verified: { user: { id: string; email: string } };
  try {
    verified = wh.verify(payloadText, headers) as { user: { id: string; email: string } };
  } catch {
    return badRequestResponse('Invalid webhook signature');
  }

  const html = await renderNewsletterWelcomeEmail({ email: verified.user.email });

  const { data, error } = await resend.emails.send({
    from: 'Claude Pro Directory <hello@mail.claudepro.directory>',
    to: verified.user.email,
    subject: 'Welcome to Claude Pro Directory! 🎉',
    html,
    tags: [{ name: 'type', value: 'auth' }],
  });

  const logContext = createEmailHandlerContext('welcome', {
    email: verified.user.email,
  });

  if (error) {
    console.error('[email-handler] Welcome email failed', {
      ...logContext,
      user_id: verified.user.id,
      error: error.message || 'Unknown error',
    });
    throw new Error(error.message);
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
  const payload = await req.json();
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

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: email,
    subject,
    html,
  });

  if (error) {
    console.error('[email-handler] Failed to send transactional email', {
      ...logContext,
      type,
      error: error.message || 'Unknown error',
    });
    throw new Error(error.message);
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
  const { data: lastRunData } = await supabaseServiceRole
    .from('app_settings')
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

  const { data: digest, error: digestError } = await supabaseServiceRole.rpc('get_weekly_digest', {
    p_week_start: previousWeekStart,
  });

  if (digestError) throw digestError;

  const digestData = digest as
    | Database['public']['Functions']['get_weekly_digest']['Returns']
    | null;

  if (!(digestData && (digestData.newContent?.length || digestData.trendingContent?.length))) {
    return successResponse({ skipped: true, reason: 'no_content' });
  }

  const subscribers = await getAllSubscribers();

  if (subscribers.length === 0) {
    return successResponse({ skipped: true, reason: 'no_subscribers' });
  }

  const results = await sendBatchDigest(subscribers, digestData);

  // OPTION 1: Update last successful run timestamp after sending
  const currentTimestamp = new Date().toISOString();
  await supabaseServiceRole.from('app_settings').upsert({
    setting_key: 'last_digest_email_timestamp',
    setting_value: currentTimestamp,
    setting_type: 'string',
    environment: 'production',
    enabled: true,
    description: 'Timestamp of last successful weekly digest email send (used for rate limiting)',
    category: 'email',
    version: 1,
  });

  console.log('[email-handler] Digest completed', {
    ...withDuration(logContext, startTime),
    success: results.success,
    failed: results.failed,
    success_rate: results.successRate,
    last_digest_timestamp: currentTimestamp,
  });

  // BetterStack heartbeat
  const heartbeatUrl = edgeEnv.betterstack.weeklyTasks;
  if (heartbeatUrl) {
    await fetch(results.failed === 0 ? heartbeatUrl : `${heartbeatUrl}/fail`, { method: 'GET' });
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

  const { data, error } = await supabaseServiceRole.rpc('get_due_sequence_emails');

  if (error) {
    console.error('[email-handler] Failed to fetch due sequence emails', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  const dueEmails =
    (data as Database['public']['Functions']['get_due_sequence_emails']['Returns']) || [];

  if (dueEmails.length === 0) {
    console.log('[email-handler] No due sequence emails', logContext);
    return successResponse({ sent: 0, failed: 0 });
  }

  console.log('[email-handler] Processing sequence emails', {
    ...logContext,
    due_count: dueEmails.length,
  });

  let sentCount = 0;
  let failedCount = 0;

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

  for (const { id, email, step } of dueEmails) {
    try {
      const Template = STEP_TEMPLATES[step];
      const html = await renderEmailTemplate(Template, { email });

      const result = await resend.emails.send({
        from: 'Claude Pro Directory <noreply@claudepro.directory>',
        to: email,
        subject: STEP_SUBJECTS[step],
        html,
        tags: [
          { name: 'template', value: 'onboarding_sequence' },
          { name: 'step', value: step.toString() },
        ],
      });

      if (result.error) throw new Error(result.error.message);

      await supabaseServiceRole.rpc('mark_sequence_email_processed', {
        p_schedule_id: id,
        p_email: email,
        p_step: step,
        p_success: true,
      });

      await supabaseServiceRole.rpc('schedule_next_sequence_step', {
        p_email: email,
        p_current_step: step,
      });

      sentCount++;
    } catch (error) {
      console.error('[email-handler] Failed to send sequence email', {
        ...logContext,
        step,
        email,
        error: error instanceof Error ? error.message : String(error),
      });
      failedCount++;
    }
  }

  console.log('[email-handler] Sequence emails completed', {
    ...withDuration(logContext, startTime),
    sent: sentCount,
    failed: failedCount,
    total: dueEmails.length,
  });

  // BetterStack heartbeat
  const heartbeatUrl = edgeEnv.betterstack.emailSequences;
  if (heartbeatUrl) {
    await fetch(failedCount === 0 ? heartbeatUrl : `${heartbeatUrl}/fail`, { method: 'GET' });
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
  const { data, error } = await supabaseServiceRole.rpc('get_active_subscribers');

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

interface WeeklyDigestData {
  weekOf?: string;
  newContent?: Array<{ category: string; slug: string; title: string; description?: string }>;
  trendingContent?: Array<{ category: string; slug: string; title: string; description?: string }>;
}

async function sendBatchDigest(subscribers: string[], digestData: WeeklyDigestData) {
  let success = 0;
  let failed = 0;

  // Render once for all subscribers (same content)
  const html = await renderEmailTemplate(WeeklyDigest, {
    email: subscribers[0] || '', // First email for template (not used in rendering)
    weekOf: digestData.weekOf || '',
    newContent: digestData.newContent || [],
    trendingContent: digestData.trendingContent || [],
  });

  // Use Resend batch API (up to 100 recipients) instead of sequential sending
  const batchSize = 100;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);

    try {
      const result = await resend.batch.send(
        batch.map((email) => ({
          from: 'Claude Pro Directory <hello@mail.claudepro.directory>',
          to: email,
          subject: `This Week in Claude: ${digestData.weekOf}`,
          html,
          tags: [{ name: 'type', value: 'weekly_digest' }],
        }))
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
  const payload = await req.json();
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

  const { data, error } = await resend.emails.send({
    from: 'Claude Pro Directory <jobs@mail.claudepro.directory>',
    to: userEmail,
    subject,
    html,
    tags: [{ name: 'type', value: action }],
  });

  if (error) {
    console.error(`[email-handler] ${action} email failed`, {
      ...logContext,
      job_id: jobId,
      error: error.message || 'Unknown error',
    });
    throw new Error(error.message);
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

  const { data, error } = await supabaseServiceRole.rpc('get_newsletter_subscriber_count');
  if (error) {
    throw new Error(error.message);
  }

  const count = (data as number) ?? 0;
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
  const payload = await req.json();
  const { submissionId, name, email, category, message } = payload;

  const logContext = createEmailHandlerContext('contact-submission', {
    email: typeof email === 'string' ? email : undefined,
  });

  if (!(submissionId && name && email && category && message)) {
    return badRequestResponse(
      'Missing required fields: submissionId, name, email, category, message'
    );
  }

  try {
    // Send admin notification email
    const adminHtml = await renderEmailTemplate(ContactSubmissionAdmin, {
      submissionId,
      name,
      email,
      category,
      message,
      submittedAt: new Date().toISOString(),
    });

    const { error: adminError } = await resend.emails.send({
      from: 'Claude Pro Directory <contact@mail.claudepro.directory>',
      to: 'hi@claudepro.directory',
      subject: `New Contact: ${category} - ${name}`,
      html: adminHtml,
      tags: [{ name: 'type', value: 'contact-admin' }],
    });

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
      category,
    });

    const { data: userData, error: userError } = await resend.emails.send({
      from: 'Claude Pro Directory <hello@mail.claudepro.directory>',
      to: email,
      subject: 'We received your message!',
      html: userHtml,
      tags: [{ name: 'type', value: 'contact-confirmation' }],
    });

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
