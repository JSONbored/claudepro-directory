/**
 * Resend Webhook Inngest Function
 *
 * Unified handler for all Resend email webhook events.
 * Consolidates 7 separate handlers into 1 function with step-based routing.
 *
 * Event Types:
 * - email.sent → Track sent count
 * - email.delivered → Track delivery, update subscription
 * - email.opened → Track opens, increase engagement score (+5)
 * - email.clicked → Track clicks, increase engagement score (+10)
 * - email.bounced → Blocklist, mark subscription as bounced
 * - email.complained → Blocklist, unsubscribe immediately
 * - email.delivery_delayed → Log for monitoring
 *
 * Idempotency: Uses Resend's email_id to prevent duplicate processing
 *
 * @see https://resend.com/docs/webhooks
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { normalizeError } from '@heyclaude/shared-runtime';

import { inngest, type ResendEmailEventData } from '../../client';
import { createSupabaseAdminClient } from '../../../supabase/admin';
import { logger, createWebAppContextWithId } from '../../../logging/server';
import { CONCURRENCY_LIMITS, RETRY_CONFIGS } from '../../config';

type EmailEngagementSummary = DatabaseGenerated['public']['Tables']['email_engagement_summary']['Row'];
type EmailEngagementInsert = DatabaseGenerated['public']['Tables']['email_engagement_summary']['Insert'];

/**
 * Resend event types we handle
 */
const RESEND_EVENT_TYPES = [
  'resend/email.sent',
  'resend/email.delivered',
  'resend/email.delivery_delayed',
  'resend/email.bounced',
  'resend/email.complained',
  'resend/email.opened',
  'resend/email.clicked',
] as const;

type ResendEventType = (typeof RESEND_EVENT_TYPES)[number];

/**
 * Extract event type suffix (e.g., 'resend/email.bounced' → 'bounced')
 */
function getEventAction(eventName: string): string {
  const parts = eventName.split('.');
  return parts[parts.length - 1] || 'unknown';
}

/**
 * Atomically increment an engagement counter for an email address.
 */
async function incrementEngagementCounter(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  email: string,
  counterField: 'emails_sent' | 'emails_delivered' | 'emails_opened' | 'emails_clicked',
  timestampField: 'last_sent_at' | 'last_delivered_at' | 'last_opened_at' | 'last_clicked_at',
  healthStatus?: string
): Promise<void> {
  const { data: existing } = await supabase
    .from('email_engagement_summary')
    .select('*')
    .eq('email', email)
    .single();

  const now = new Date().toISOString();
  const currentCount = (existing as EmailEngagementSummary | null)?.[counterField] ?? 0;

  const updateData: EmailEngagementInsert = {
    email,
    updated_at: now,
  };

  // Set counter field
  if (counterField === 'emails_sent') updateData.emails_sent = currentCount + 1;
  else if (counterField === 'emails_delivered') updateData.emails_delivered = currentCount + 1;
  else if (counterField === 'emails_opened') updateData.emails_opened = currentCount + 1;
  else if (counterField === 'emails_clicked') updateData.emails_clicked = currentCount + 1;

  // Set timestamp field
  if (timestampField === 'last_sent_at') updateData.last_sent_at = now;
  else if (timestampField === 'last_delivered_at') updateData.last_delivered_at = now;
  else if (timestampField === 'last_opened_at') updateData.last_opened_at = now;
  else if (timestampField === 'last_clicked_at') updateData.last_clicked_at = now;

  if (healthStatus) updateData.health_status = healthStatus;

  await supabase.from('email_engagement_summary').upsert(updateData, { onConflict: 'email' });
}

/**
 * Unified Resend Webhook Handler
 *
 * Processes all Resend email events with:
 * - Idempotency via email_id
 * - Concurrency limits to protect Resend API
 * - Step-based routing for different event types
 */
export const handleResendWebhook = inngest.createFunction(
  {
    id: 'resend-webhook-handler',
    name: 'Resend Webhook Handler',
    retries: RETRY_CONFIGS.WEBHOOK,
    // Idempotency: Use Resend's email_id to prevent duplicate processing
    idempotency: 'event.data.email_id',
    // Concurrency: Limit parallel Resend processing
    concurrency: {
      limit: CONCURRENCY_LIMITS.RESEND_API,
    },
  },
  // Listen to all Resend events
  RESEND_EVENT_TYPES.map((event) => ({ event })),
  async ({ event, step }) => {
    const startTime = Date.now();
    const eventName = event.name as ResendEventType;
    const action = getEventAction(eventName);

    const logContext = createWebAppContextWithId(
      '/inngest/resend/webhook',
      'handleResendWebhook'
    );

    const emailData = event.data as ResendEmailEventData;
    const emails = emailData.to || [];
    const emailId = emailData.email_id;

    logger.info('Processing Resend webhook', {
      ...logContext,
      eventName,
      action,
      emailId,
      emailCount: emails.length,
    });

    const supabase = createSupabaseAdminClient();

    // Route to appropriate handler based on event type
    switch (action) {
      case 'sent':
        // Track sent count
        for (const email of emails) {
          await step.run(`track-sent-${email}`, async () => {
            await incrementEngagementCounter(supabase, email, 'emails_sent', 'last_sent_at');
          });
        }
        break;

      case 'delivered':
        // Track delivery and update subscription
        for (const email of emails) {
          await step.run(`track-delivered-${email}`, async () => {
            await incrementEngagementCounter(supabase, email, 'emails_delivered', 'last_delivered_at');
          });

          await step.run(`update-subscription-delivered-${email}`, async () => {
            await supabase
              .from('newsletter_subscriptions')
              .update({
                last_email_sent_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('email', email);
          });
        }
        break;

      case 'opened':
        // Track opens, increase engagement score (+5)
        for (const email of emails) {
          await step.run(`track-opened-${email}`, async () => {
            await incrementEngagementCounter(supabase, email, 'emails_opened', 'last_opened_at', 'active');
          });

          await step.run(`update-engagement-opened-${email}`, async () => {
            const { data: subscription } = await supabase
              .from('newsletter_subscriptions')
              .select('engagement_score')
              .eq('email', email)
              .single();

            const currentScore = subscription?.engagement_score ?? 0;
            const newScore = Math.min(100, currentScore + 5);

            await supabase
              .from('newsletter_subscriptions')
              .update({
                last_active_at: new Date().toISOString(),
                engagement_score: newScore,
                updated_at: new Date().toISOString(),
              })
              .eq('email', email);
          });
        }
        break;

      case 'clicked':
        // Track clicks, increase engagement score (+10)
        for (const email of emails) {
          await step.run(`track-clicked-${email}`, async () => {
            await incrementEngagementCounter(supabase, email, 'emails_clicked', 'last_clicked_at', 'active');
          });

          await step.run(`update-engagement-clicked-${email}`, async () => {
            const { data: subscription } = await supabase
              .from('newsletter_subscriptions')
              .select('engagement_score')
              .eq('email', email)
              .single();

            const currentScore = subscription?.engagement_score ?? 0;
            const newScore = Math.min(100, currentScore + 10);

            await supabase
              .from('newsletter_subscriptions')
              .update({
                last_active_at: new Date().toISOString(),
                engagement_score: newScore,
                updated_at: new Date().toISOString(),
              })
              .eq('email', email);
          });
        }
        break;

      case 'bounced':
        // Blocklist, mark subscription as bounced
        logger.info('Processing email bounce', { ...logContext, emailId });

        for (const email of emails) {
          await step.run(`blocklist-bounce-${email}`, async () => {
            const { error } = await supabase
              .from('email_blocklist')
              .upsert(
                {
                  email,
                  reason: 'hard_bounce' as const,
                  notes: `Bounced email_id: ${emailId}`,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'email' }
              );

            if (error) {
              logger.warn('Failed to add to blocklist', { ...logContext, email, errorMessage: error.message });
            }
          });

          await step.run(`update-subscription-bounced-${email}`, async () => {
            await supabase
              .from('newsletter_subscriptions')
              .update({
                status: 'bounced',
                updated_at: new Date().toISOString(),
              })
              .eq('email', email);
          });

          await step.run(`update-engagement-bounced-${email}`, async () => {
            await supabase
              .from('email_engagement_summary')
              .upsert(
                {
                  email,
                  emails_bounced: 1,
                  last_bounce_at: new Date().toISOString(),
                  health_status: 'bounced',
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'email' }
              );
          });
        }
        break;

      case 'complained':
        // Blocklist, unsubscribe immediately - this is critical for sender reputation
        logger.warn('Processing email complaint - sender reputation impact', {
          ...logContext,
          emailId,
          emailCount: emails.length,
        });

        for (const email of emails) {
          await step.run(`blocklist-complaint-${email}`, async () => {
            const { error } = await supabase
              .from('email_blocklist')
              .upsert(
                {
                  email,
                  reason: 'spam_complaint' as const,
                  notes: `Spam complaint for email_id: ${emailId}`,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'email' }
              );

            if (error) {
              const normalized = normalizeError(error, 'Failed to add complaint to blocklist');
              logger.error('Blocklist update failed for complaint', normalized, logContext);
            }
          });

          await step.run(`unsubscribe-complaint-${email}`, async () => {
            await supabase
              .from('newsletter_subscriptions')
              .update({
                status: 'unsubscribed',
                unsubscribed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('email', email);
          });

          await step.run(`update-engagement-complaint-${email}`, async () => {
            await supabase
              .from('email_engagement_summary')
              .upsert(
                {
                  email,
                  emails_complained: 1,
                  last_complaint_at: new Date().toISOString(),
                  health_status: 'complained',
                  engagement_score: 0, // Reset engagement score
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'email' }
              );
          });
        }
        break;

      case 'delivery_delayed':
        // Log for monitoring - delays might indicate ISP issues
        logger.warn('Email delivery delayed', {
          ...logContext,
          emailId,
          emails,
          subject: emailData.subject,
        });
        // No action taken, just tracking
        break;

      default:
        logger.info('Unhandled Resend event type', { ...logContext, eventName, action });
    }

    const durationMs = Date.now() - startTime;
    logger.info('Resend webhook processed', {
      ...logContext,
      durationMs,
      action,
      emailId,
      processedCount: emails.length,
    });

    return {
      success: true,
      action,
      emailId,
      processedCount: emails.length,
      durationMs,
    };
  }
);
