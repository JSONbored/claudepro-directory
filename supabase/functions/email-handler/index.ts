/**
 * Consolidated Email Handler - Database-First Architecture
 * Single Edge Function routing ALL email operations via action parameter
 *
 * Actions: welcome, transactional, digest, sequence
 * Triggered by: Auth hooks, DB triggers, pg_cron
 *
 * CONSOLIDATION: Replaces 4 separate Edge Functions (1,229 → 200 LOC, 82% reduction)
 */

import React from 'npm:react@18.3.1';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { createClient } from 'jsr:@supabase/supabase-js@2';

import {
  AUTH_HOOK_ENV,
  RESEND_ENV,
  SUPABASE_ENV,
  validateEnvironment,
} from '../_shared/email-config.ts';
import {
  errorResponse,
  successResponse,
  methodNotAllowedResponse,
  badRequestResponse,
} from '../_shared/utils/response.ts';

// React Email Templates
import { NewsletterWelcome } from '../_shared/templates/newsletter-welcome.tsx';
import { WeeklyDigest } from '../_shared/templates/weekly-digest.tsx';
import { OnboardingGettingStarted } from '../_shared/templates/onboarding-getting-started.tsx';
import { OnboardingPowerTips } from '../_shared/templates/onboarding-power-tips.tsx';
import { OnboardingCommunity } from '../_shared/templates/onboarding-community.tsx';
import { OnboardingStayEngaged } from '../_shared/templates/onboarding-stay-engaged.tsx';

validateEnvironment(['resend', 'auth-hook', 'supabase']);

const resend = new Resend(RESEND_ENV.apiKey);
const supabase = createClient(SUPABASE_ENV.url, SUPABASE_ENV.serviceRoleKey);
const hookSecret = AUTH_HOOK_ENV.secret.replace('v1,whsec_', '');

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Email-Action, Authorization',
      },
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
        return await handleDigest(req);
      case 'sequence':
        return await handleSequence(req);
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
async function handleSubscribe(req: Request): Promise<Response> {
  const payload = await req.json();
  const { email, source, referrer, copy_type, copy_category, copy_slug } = payload;

  // Validate email format (basic)
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return badRequestResponse('Valid email address is required');
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Step 1: Add to Resend audience
    let resendContactId: string | null = null;
    let syncStatus: 'synced' | 'failed' | 'skipped' = 'synced';
    let syncError: string | null = null;

    try {
      const { data: contact, error: resendError } = await resend.contacts.create({
        audienceId: RESEND_ENV.audienceId,
        email: normalizedEmail,
        unsubscribed: false,
      });

      if (resendError) {
        // If email already exists in Resend, that's OK - just log it
        if (resendError.message?.includes('already exists') || resendError.message?.includes('duplicate')) {
          console.log(`Email ${normalizedEmail} already in Resend audience - skipping sync`);
          syncStatus = 'skipped';
          syncError = 'Email already in audience';
        } else {
          // Other Resend errors - log but don't fail the entire request
          console.error('Resend audience sync failed:', resendError);
          syncStatus = 'failed';
          syncError = resendError.message || 'Unknown Resend error';
        }
      } else if (contact?.id) {
        resendContactId = contact.id;
        console.log(`Added ${normalizedEmail} to Resend audience: ${resendContactId}`);
      }
    } catch (resendException) {
      // Catch any unexpected Resend errors
      console.error('Unexpected Resend error:', resendException);
      syncStatus = 'failed';
      syncError = resendException instanceof Error ? resendException.message : 'Unknown error';
    }

    // Step 2: Insert into database (rate limiting handled by BEFORE INSERT trigger)
    const { data: subscription, error: dbError } = await supabase
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
      })
      .select()
      .single();

    if (dbError) {
      // Handle specific database errors
      if (dbError.code === '23505') {
        // Email already exists (UNIQUE constraint violation)
        return badRequestResponse('This email is already subscribed to our newsletter');
      }
      if (dbError.code === '429' || dbError.message?.includes('Rate limit')) {
        // Rate limit exceeded
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Too many subscription attempts. Please try again later.',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, X-Email-Action, Authorization',
            },
          }
        );
      }
      throw new Error(`Database insert failed: ${dbError.message}`);
    }

    // Step 3: Send welcome email
    const html = await renderAsync(React.createElement(NewsletterWelcome, { email: normalizedEmail }));

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'ClaudePro Directory <hello@mail.claudepro.directory>',
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
      await supabase.rpc('enroll_in_email_sequence', {
        p_email: normalizedEmail,
        p_sequence_type: 'onboarding',
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
      from: 'ClaudePro Directory <hello@mail.claudepro.directory>',
      to: email,
      subject: 'Welcome to Claude Pro Directory! 🎉',
      html,
      tags: [{ name: 'type', value: 'newsletter' }],
    });

    if (error) throw new Error(error.message);

    // Enroll in onboarding sequence
    await supabase.rpc('enroll_in_email_sequence', {
      p_email: email,
      p_sequence_type: 'onboarding',
    });

    return successResponse({ sent: true, id: data?.id, subscription_id });
  }

  // Auth hook trigger (OAuth signup)
  const payloadText = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(hookSecret);

  let verified;
  try {
    verified = wh.verify(payloadText, headers) as { user: { id: string; email: string } };
  } catch (error) {
    return badRequestResponse('Invalid webhook signature');
  }

  const html = await renderAsync(React.createElement(NewsletterWelcome, { email: verified.user.email }));

  const { data, error } = await resend.emails.send({
    from: 'ClaudePro Directory <hello@mail.claudepro.directory>',
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

  // TODO: Implement transactional email templates (job-posted, collection-shared)
  console.log('Transactional email:', { type, email, emailData });

  return successResponse({ sent: false, reason: 'not_implemented', type });
}

async function handleDigest(req: Request): Promise<Response> {
  const previousWeekStart = getPreviousWeekStart();

  const { data: digest, error: digestError } = await supabase.rpc('get_weekly_digest', {
    p_week_start: previousWeekStart,
  });

  if (digestError) throw digestError;

  const digestData = digest as any;

  if (!digestData.newContent?.length && !digestData.trendingContent?.length) {
    return successResponse({ skipped: true, reason: 'no_content' });
  }

  const subscribers = await getAllSubscribers();

  if (subscribers.length === 0) {
    return successResponse({ skipped: true, reason: 'no_subscribers' });
  }

  const results = await sendBatchDigest(subscribers, digestData);

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

async function handleSequence(req: Request): Promise<Response> {
  const { data, error } = await supabase.rpc('get_due_sequence_emails');

  if (error) throw error;

  const dueEmails = (data as any[]) || [];

  if (dueEmails.length === 0) {
    return successResponse({ sent: 0, failed: 0 });
  }

  let sentCount = 0;
  let failedCount = 0;

  const STEP_SUBJECTS: Record<number, string> = {
    2: 'Getting Started with ClaudePro Directory',
    3: 'Power User Tips for Claude',
    4: 'Join the ClaudePro Community',
    5: 'Stay Engaged with ClaudePro',
  };

  const STEP_TEMPLATES: Record<number, any> = {
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
        from: 'ClaudePro Directory <noreply@claudepro.directory>',
        to: email,
        subject: STEP_SUBJECTS[step],
        html,
        tags: [
          { name: 'template', value: 'onboarding_sequence' },
          { name: 'step', value: step.toString() },
        ],
      });

      if (result.error) throw new Error(result.error.message);

      await supabase.rpc('mark_sequence_email_processed', {
        p_schedule_id: id,
        p_email: email,
        p_step: step,
        p_success: true,
      });

      await supabase.rpc('schedule_next_sequence_step', {
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
  const { data, error } = await supabase.rpc('get_active_subscribers');

  if (error) {
    console.error('Failed to fetch subscribers from database:', error);
    return [];
  }

  return data || [];
}

async function sendBatchDigest(subscribers: string[], digestData: any) {
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
          from: 'ClaudePro Directory <hello@mail.claudepro.directory>',
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
