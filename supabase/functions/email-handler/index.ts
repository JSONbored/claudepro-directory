/**
 * Consolidated Email Handler - Routes all email operations via action parameter
 */

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { Resend } from 'npm:resend@4.0.0';
import { AUTH_HOOK_ENV, RESEND_ENV, validateEnvironment } from '../_shared/email-config.ts';
import { CollectionShared } from '../_shared/templates/collection-shared.tsx';
import { JobApproved } from '../_shared/templates/job-approved.tsx';
import { JobExpired } from '../_shared/templates/job-expired.tsx';
import { JobExpiring } from '../_shared/templates/job-expiring.tsx';
import { JobPaymentConfirmed } from '../_shared/templates/job-payment-confirmed.tsx';
import { JobPosted } from '../_shared/templates/job-posted.tsx';
import { JobRejected } from '../_shared/templates/job-rejected.tsx';
import { JobSubmitted } from '../_shared/templates/job-submitted.tsx';
// React Email Templates
import { NewsletterWelcome } from '../_shared/templates/newsletter-welcome.tsx';
import { OnboardingCommunity } from '../_shared/templates/onboarding-community.tsx';
import { OnboardingGettingStarted } from '../_shared/templates/onboarding-getting-started.tsx';
import { OnboardingPowerTips } from '../_shared/templates/onboarding-power-tips.tsx';
import { OnboardingStayEngaged } from '../_shared/templates/onboarding-stay-engaged.tsx';
import { WeeklyDigest } from '../_shared/templates/weekly-digest.tsx';
import { buildContactProperties, inferInitialTopics } from '../_shared/utils/resend-helpers.ts';
import {
  badRequestResponse,
  errorResponse,
  jsonResponse,
  methodNotAllowedResponse,
  publicCorsHeaders,
  successResponse,
} from '../_shared/utils/response.ts';
import { supabaseServiceRole } from '../_shared/utils/supabase-service-role.ts';

validateEnvironment(['resend', 'auth-hook']);

const resend = new Resend(RESEND_ENV.apiKey);
const hookSecret = AUTH_HOOK_ENV.secret.replace('v1,whsec_', '');

Deno.serve(async (req: Request) => {
  // Handle CORS preflight - Use public headers (no Authorization to avoid CSRF)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: publicCorsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return methodNotAllowedResponse('POST');
  }

  const action = req.headers.get('X-Email-Action');

  if (!action) {
    return badRequestResponse('Missing X-Email-Action header');
  }

  try {
    switch (action) {
      case 'subscribe':
        return await handleSubscribe(req);
      case 'welcome':
        return await handleWelcome(req);
      case 'transactional':
        return await handleTransactional(req);
      case 'digest':
        return await handleDigest();
      case 'sequence':
        return await handleSequence();
      // Job lifecycle emails
      case 'job-submitted':
        return await handleJobSubmitted(req);
      case 'job-approved':
        return await handleJobApproved(req);
      case 'job-rejected':
        return await handleJobRejected(req);
      case 'job-expiring':
        return await handleJobExpiring(req);
      case 'job-expired':
        return await handleJobExpired(req);
      case 'job-payment-confirmed':
        return await handleJobPaymentConfirmed(req);
      default:
        return badRequestResponse(`Unknown action: ${action}`);
    }
  } catch (error) {
    return errorResponse(error, `email-handler:${action}`);
  }
});

/**
 * Handle Newsletter Subscription
 * Full flow: Validate → Resend audience → Database → Welcome email → Sequence
 */
type SubscribePayload = Pick<
  Database['public']['Tables']['newsletter_subscriptions']['Insert'],
  'email' | 'source' | 'referrer' | 'copy_type' | 'copy_category' | 'copy_slug'
>;

async function handleSubscribe(req: Request): Promise<Response> {
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
      console.log(`[SUBSCRIBE] Creating Resend contact for: ${normalizedEmail}`);
      console.log(
        `[SUBSCRIBE] Context - source: ${source}, category: ${copy_category}, type: ${copy_type}`
      );

      console.log('[SUBSCRIBE] Contact properties:', contactProperties);

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
          console.log(
            `[SUBSCRIBE] Email ${normalizedEmail} already in Resend - skipping contact creation`
          );
          syncStatus = 'skipped';
          syncError = 'Email already in audience';
        } else {
          // Other Resend errors - log but don't fail the entire request
          console.error('[SUBSCRIBE] Resend contact creation failed:', resendError);
          syncStatus = 'failed';
          syncError = resendError.message || 'Unknown Resend error';
        }
      } else if (contact?.id) {
        resendContactId = contact.id;
        console.log(`[SUBSCRIBE] ✓ Contact created - ID: ${resendContactId}`);

        // Step 1.5: Assign topics based on signup context
        try {
          topicIds = inferInitialTopics(source, copy_category);
          console.log(`[SUBSCRIBE] Assigning ${topicIds.length} topics:`, topicIds);

          if (topicIds.length > 0) {
            const { error: topicError } = await resend.contacts.topics.update({
              contactId: resendContactId,
              topicIds,
            });

            if (topicError) {
              console.error('[SUBSCRIBE] Failed to assign topics:', topicError);
              // Don't fail subscription - topics can be managed later
            } else {
              console.log('[SUBSCRIBE] ✓ Topics assigned successfully');
            }
          }
        } catch (topicException) {
          console.error('[SUBSCRIBE] Topic assignment exception:', topicException);
          // Don't fail subscription - non-critical
        }
      }
    } catch (resendException) {
      // Catch any unexpected Resend errors
      console.error('[SUBSCRIBE] Unexpected Resend error:', resendException);
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

    // Step 3: Send welcome email
    const html = await renderAsync(
      React.createElement(NewsletterWelcome, { email: normalizedEmail })
    );

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Claude Pro Directory <hello@mail.claudepro.directory>',
      to: normalizedEmail,
      subject: 'Welcome to Claude Pro Directory! 🎉',
      html,
      tags: [{ name: 'type', value: 'newsletter' }],
    });

    if (emailError) {
      // Log email error but don't fail the request - subscription is saved
      console.error('Welcome email failed:', emailError);
    }

    // Step 4: Enroll in onboarding sequence
    try {
      await supabaseServiceRole.rpc('enroll_in_email_sequence', {
        p_email: normalizedEmail,
      });
    } catch (sequenceError) {
      // Log sequence error but don't fail - subscription is saved
      console.error('Sequence enrollment failed:', sequenceError);
    }

    // Return success
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
    console.error('Newsletter subscription failed:', error);
    return errorResponse(error, 'handleSubscribe');
  }
}

async function handleWelcome(req: Request): Promise<Response> {
  const triggerSource = req.headers.get('X-Trigger-Source');

  // Newsletter subscription trigger
  if (triggerSource === 'newsletter_subscription') {
    const payload = await req.json();
    const { email, subscription_id } = payload;

    const html = await renderAsync(React.createElement(NewsletterWelcome, { email }));

    const { data, error } = await resend.emails.send({
      from: 'Claude Pro Directory <hello@mail.claudepro.directory>',
      to: email,
      subject: 'Welcome to Claude Pro Directory! 🎉',
      html,
      tags: [{ name: 'type', value: 'newsletter' }],
    });

    if (error) throw new Error(error.message);

    // Enroll in onboarding sequence
    await supabaseServiceRole.rpc('enroll_in_email_sequence', {
      p_email: email,
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

  const html = await renderAsync(
    React.createElement(NewsletterWelcome, { email: verified.user.email })
  );

  const { data, error } = await resend.emails.send({
    from: 'Claude Pro Directory <hello@mail.claudepro.directory>',
    to: verified.user.email,
    subject: 'Welcome to Claude Pro Directory! 🎉',
    html,
    tags: [{ name: 'type', value: 'auth' }],
  });

  if (error) throw new Error(error.message);

  return successResponse({ sent: true, id: data?.id, user_id: verified.user.id });
}

async function handleTransactional(req: Request): Promise<Response> {
  const payload = await req.json();
  const { type, email, data: emailData } = payload;

  // Validate required fields
  if (!(type && email)) {
    return badRequestResponse('Missing required fields: type, email');
  }

  let template: React.ReactElement | null = null;
  let subject = '';

  // Route to appropriate template based on type
  switch (type) {
    case 'job-posted':
      if (!(emailData?.jobTitle && emailData?.company && emailData?.jobSlug)) {
        return badRequestResponse('Missing required job data');
      }
      template = React.createElement(JobPosted, {
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
      template = React.createElement(CollectionShared, {
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
  const html = await renderAsync(template);

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
    console.error('Failed to send transactional email:', error);
    throw new Error(error.message);
  }

  return successResponse({ sent: true, id: data?.id, type });
}

async function handleDigest(): Promise<Response> {
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
      console.log(
        `[RATE LIMITED] Last digest sent ${hoursSinceLastRun.toFixed(1)} hours ago. Next allowed at ${nextAllowedAt.toISOString()}`
      );

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

  console.log(`[DIGEST SENT] Updated last_digest_email_timestamp to ${currentTimestamp}`);

  // BetterStack heartbeat
  const heartbeatUrl = Deno.env.get('BETTERSTACK_HEARTBEAT_WEEKLY_TASKS');
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
  const { data, error } = await supabaseServiceRole.rpc('get_due_sequence_emails');

  if (error) throw error;

  const dueEmails =
    (data as Database['public']['Functions']['get_due_sequence_emails']['Returns']) || [];

  if (dueEmails.length === 0) {
    return successResponse({ sent: 0, failed: 0 });
  }

  let sentCount = 0;
  let failedCount = 0;

  const STEP_SUBJECTS: Record<number, string> = {
    2: 'Getting Started with Claude Pro Directory',
    3: 'Power User Tips for Claude',
    4: 'Join the Claude Pro Community',
    5: 'Stay Engaged with ClaudePro',
  };

  const STEP_TEMPLATES: Record<number, React.FC<{ email: string }>> = {
    2: OnboardingGettingStarted,
    3: OnboardingPowerTips,
    4: OnboardingCommunity,
    5: OnboardingStayEngaged,
  };

  for (const { id, email, step } of dueEmails) {
    try {
      const Template = STEP_TEMPLATES[step];
      const html = await renderAsync(React.createElement(Template, { email }));

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
      console.error(`Failed to send step ${step} to ${email}:`, error);
      failedCount++;
    }
  }

  // BetterStack heartbeat
  const heartbeatUrl = Deno.env.get('BETTERSTACK_HEARTBEAT_EMAIL_SEQUENCES');
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
    console.error('Failed to fetch subscribers from database:', error);
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

  const html = await renderAsync(React.createElement(WeeklyDigest, digestData));

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
      console.error('Batch send failed:', error);
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
 * Job Lifecycle Email Handlers
 */

async function handleJobSubmitted(req: Request): Promise<Response> {
  const payload = await req.json();
  const { jobTitle, company, userEmail, jobId } = payload;

  const html = await renderAsync(
    React.createElement(JobSubmitted, { jobTitle, company, userEmail, jobId })
  );

  const { data, error } = await resend.emails.send({
    from: 'Claude Pro Directory <jobs@mail.claudepro.directory>',
    to: userEmail,
    subject: `Job Submitted: ${jobTitle}`,
    html,
    tags: [{ name: 'type', value: 'job-submitted' }],
  });

  if (error) throw new Error(error.message);

  return successResponse({ sent: true, id: data?.id, jobId });
}

async function handleJobApproved(req: Request): Promise<Response> {
  const payload = await req.json();
  const { jobTitle, company, userEmail, jobId, plan, paymentAmount, paymentUrl } = payload;

  const html = await renderAsync(
    React.createElement(JobApproved, {
      jobTitle,
      company,
      userEmail,
      jobId,
      plan,
      paymentAmount,
      paymentUrl,
    })
  );

  const { data, error } = await resend.emails.send({
    from: 'Claude Pro Directory <jobs@mail.claudepro.directory>',
    to: userEmail,
    subject: `Job Approved: ${jobTitle}`,
    html,
    tags: [{ name: 'type', value: 'job-approved' }],
  });

  if (error) throw new Error(error.message);

  return successResponse({ sent: true, id: data?.id, jobId });
}

async function handleJobRejected(req: Request): Promise<Response> {
  const payload = await req.json();
  const { jobTitle, company, userEmail, jobId, rejectionReason } = payload;

  const html = await renderAsync(
    React.createElement(JobRejected, { jobTitle, company, userEmail, jobId, rejectionReason })
  );

  const { data, error } = await resend.emails.send({
    from: 'Claude Pro Directory <jobs@mail.claudepro.directory>',
    to: userEmail,
    subject: `Action Required: Update Your Job Posting - ${jobTitle}`,
    html,
    tags: [{ name: 'type', value: 'job-rejected' }],
  });

  if (error) throw new Error(error.message);

  return successResponse({ sent: true, id: data?.id, jobId });
}

async function handleJobExpiring(req: Request): Promise<Response> {
  const payload = await req.json();
  const { jobTitle, company, userEmail, jobId, expiresAt, daysRemaining, renewalUrl } = payload;

  const html = await renderAsync(
    React.createElement(JobExpiring, {
      jobTitle,
      company,
      userEmail,
      jobId,
      expiresAt,
      daysRemaining,
      renewalUrl,
    })
  );

  const { data, error } = await resend.emails.send({
    from: 'Claude Pro Directory <jobs@mail.claudepro.directory>',
    to: userEmail,
    subject: `Expiring Soon: ${jobTitle} (${daysRemaining} days remaining)`,
    html,
    tags: [{ name: 'type', value: 'job-expiring' }],
  });

  if (error) throw new Error(error.message);

  return successResponse({ sent: true, id: data?.id, jobId });
}

async function handleJobExpired(req: Request): Promise<Response> {
  const payload = await req.json();
  const { jobTitle, company, userEmail, jobId, expiredAt, viewCount, clickCount, repostUrl } =
    payload;

  const html = await renderAsync(
    React.createElement(JobExpired, {
      jobTitle,
      company,
      userEmail,
      jobId,
      expiredAt,
      viewCount,
      clickCount,
      repostUrl,
    })
  );

  const { data, error } = await resend.emails.send({
    from: 'Claude Pro Directory <jobs@mail.claudepro.directory>',
    to: userEmail,
    subject: `Job Listing Expired: ${jobTitle}`,
    html,
    tags: [{ name: 'type', value: 'job-expired' }],
  });

  if (error) throw new Error(error.message);

  return successResponse({ sent: true, id: data?.id, jobId });
}

async function handleJobPaymentConfirmed(req: Request): Promise<Response> {
  const payload = await req.json();
  const {
    jobTitle,
    company,
    userEmail,
    jobId,
    jobSlug,
    plan,
    paymentAmount,
    paymentDate,
    expiresAt,
  } = payload;

  const html = await renderAsync(
    React.createElement(JobPaymentConfirmed, {
      jobTitle,
      company,
      userEmail,
      jobId,
      jobSlug,
      plan,
      paymentAmount,
      paymentDate,
      expiresAt,
    })
  );

  const { data, error } = await resend.emails.send({
    from: 'Claude Pro Directory <jobs@mail.claudepro.directory>',
    to: userEmail,
    subject: `Your Job is Live: ${jobTitle}`,
    html,
    tags: [{ name: 'type', value: 'job-payment-confirmed' }],
  });

  if (error) throw new Error(error.message);

  return successResponse({ sent: true, id: data?.id, jobId });
}
