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

import { MiscService, NewsletterService } from '@heyclaude/data-layer';
import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { normalizeError } from '@heyclaude/shared-runtime';

import { inngest, type ResendEmailEventData } from '../../client';
import { createSupabaseAdminClient } from '../../../supabase/admin';
import { logger, createWebAppContextWithId } from '../../../logging/server';
import { CONCURRENCY_LIMITS, RETRY_CONFIGS } from '../../config';

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
  const service = new MiscService(supabase);
  const existing = await service.getEmailEngagementSummary(email);

  const now = new Date().toISOString();
  const currentCount = existing?.[counterField] ?? 0;

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

  await service.upsertEmailEngagementSummary(updateData);
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

    logger.info({ ...logContext,
      eventName,
      action,
      emailId,
      emailCount: emails.length, }, 'Processing Resend webhook');

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
            const newsletterService = new NewsletterService(supabase);
            await newsletterService.updateLastEmailSentAt(email);
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
            const newsletterService = new NewsletterService(supabase);
            const subscription = await newsletterService.getSubscriptionEngagementScore(email);

            const currentScore = subscription?.engagement_score ?? 0;
            const newScore = Math.min(100, currentScore + 5);

            await newsletterService.updateLastActiveAt(email);
            await newsletterService.updateEngagementScore(email, newScore);
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
            const newsletterService = new NewsletterService(supabase);
            const subscription = await newsletterService.getSubscriptionEngagementScore(email);

            const currentScore = subscription?.engagement_score ?? 0;
            const newScore = Math.min(100, currentScore + 10);

            await newsletterService.updateLastActiveAt(email);
            await newsletterService.updateEngagementScore(email, newScore);
          });
        }
        break;

      case 'bounced':
        // Blocklist, mark subscription as bounced
        logger.info({ ...logContext, emailId }, 'Processing email bounce');

        for (const email of emails) {
          await step.run(`blocklist-bounce-${email}`, async () => {
            const service = new MiscService(supabase);
            try {
              await service.upsertEmailBlocklist({
                email,
                reason: 'hard_bounce' as const,
                notes: `Bounced email_id: ${emailId}`,
                updated_at: new Date().toISOString(),
              });
            } catch (error) {
              const normalized = normalizeError(error, 'Failed to add to blocklist');
              logger.warn({ err: normalized, ...logContext, email }, 'Failed to add to blocklist');
            }
          });

          await step.run(`update-subscription-bounced-${email}`, async () => {
            const newsletterService = new NewsletterService(supabase);
            await newsletterService.updateSubscriptionStatus(email, 'bounced');
          });

          await step.run(`update-engagement-bounced-${email}`, async () => {
            const service = new MiscService(supabase);
            await service.upsertEmailEngagementSummary({
              email,
              emails_bounced: 1,
              last_bounce_at: new Date().toISOString(),
              health_status: 'bounced',
              updated_at: new Date().toISOString(),
            });
          });
        }
        break;

      case 'complained':
        // Blocklist, unsubscribe immediately - this is critical for sender reputation
        logger.warn({ ...logContext,
          emailId,
          emailCount: emails.length, }, 'Processing email complaint - sender reputation impact');

        for (const email of emails) {
          await step.run(`blocklist-complaint-${email}`, async () => {
            const service = new MiscService(supabase);
            try {
              await service.upsertEmailBlocklist({
                email,
                reason: 'spam_complaint' as const,
                notes: `Spam complaint for email_id: ${emailId}`,
                updated_at: new Date().toISOString(),
              });
            } catch (error) {
              const normalized = normalizeError(error, 'Failed to add complaint to blocklist');
              logger.error({ err: normalized, ...logContext }, 'Blocklist update failed for complaint');
            }
          });

          await step.run(`unsubscribe-complaint-${email}`, async () => {
            const newsletterService = new NewsletterService(supabase);
            await newsletterService.unsubscribeWithTimestamp(email);
          });

          await step.run(`update-engagement-complaint-${email}`, async () => {
            const service = new MiscService(supabase);
            await service.upsertEmailEngagementSummary({
              email,
              emails_complained: 1,
              last_complaint_at: new Date().toISOString(),
              health_status: 'complained',
              engagement_score: 0, // Reset engagement score
              updated_at: new Date().toISOString(),
            });
          });
        }
        break;

      case 'delivery_delayed':
        // Log for monitoring - delays might indicate ISP issues
        logger.warn({ ...logContext,
          emailId,
          emails,
          subject: emailData.subject, }, 'Email delivery delayed');
        // No action taken, just tracking
        break;

      default:
        logger.info({ ...logContext, eventName, action }, 'Unhandled Resend event type');
    }

    const durationMs = Date.now() - startTime;
    logger.info({ ...logContext,
      durationMs,
      action,
      emailId,
      processedCount: emails.length, }, 'Resend webhook processed');

    return {
      success: true,
      action,
      emailId,
      processedCount: emails.length,
      durationMs,
    };
  }
);
