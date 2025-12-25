/**
 * Email Sequence Inngest Function
 *
 * Processes and sends due sequence emails (onboarding drips).
 * Runs on a cron schedule (every 6 hours).
 */

import { normalizeError } from '@heyclaude/shared-runtime';

import { renderEmailTemplate } from '../../../email/base-template';
import { ONBOARDING_FROM } from '../../../email/config/email-config';
import { SequenceEmail } from '../../../email/templates/sequence';
import { sendEmail } from '../../../integrations/resend';
import { logger, createWebAppContextWithId } from '../../../logging/server';
import { getService } from '../../../data/service-factory';
import { createInngestFunction } from '../../utils/function-factory';

// Type for sequence email - simplified based on RPC return
// Note: DueSequenceEmailItem from service has all nullable fields, but we filter to non-null
interface SequenceEmailItem {
  id: string;
  email: string;
  step: number;
  template_slug?: string | null;
  email_subject?: string | null;
}

// Type from service (all fields nullable)
type DueSequenceEmailItem = {
  id: string | null;
  sequence_id: string | null;
  email: string | null;
  due_at: string | null;
  processed: boolean | null;
  step: number | null;
};

/**
 * Email sequence function
 *
 * Cron schedule: Every 6 hours
 * - Fetches all due sequence emails
 * - Sends each email and marks as sent
 * - Uses singleton pattern to prevent duplicate runs
 */
export const processEmailSequence = createInngestFunction(
  {
    id: 'email-sequence-processor',
    name: 'Email Sequence Processor',
    route: '/inngest/email/sequence',
    retries: 1, // Limited retries for cron jobs
    // Singleton pattern: Only one sequence processor can run at a time
    singleton: {
      key: 'email-sequence',
    },
  },
  { cron: '0 */6 * * *' }, // Every 6 hours
  async ({ step, logContext }) => {
    // Step 1: Fetch due sequence emails
    const dueEmails = await step.run('fetch-due-emails', async (): Promise<SequenceEmailItem[]> => {
      const service = await getService('misc'); // Consolidated: EmailService methods moved to MiscService

      try {
        const data = await service.getDueSequenceEmails();

        // Map RPC result to our expected type, filtering out nulls
        if (!Array.isArray(data)) return [];

        return (data as DueSequenceEmailItem[])
          .filter(
            (item): item is DueSequenceEmailItem & { id: string; email: string; step: number } =>
              item.id !== null && item.email !== null && item.step !== null
          )
          .map((item) => ({
            id: item.id!,
            email: item.email!,
            step: item.step!,
          }));
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to fetch due sequence emails');
        logger.warn({ ...logContext, err: normalized }, 'Failed to fetch due sequence emails');
        return [];
      }
    });

    if (dueEmails.length === 0) {
      logger.info(logContext, 'No due sequence emails');
      // BetterStack monitoring: No heartbeat needed when no emails to send
      return { sent: 0, failed: 0 };
    }

    logger.info({ ...logContext, dueCount: dueEmails.length }, 'Processing sequence emails');

    // Step 2: Process emails in sequence
    let sentCount = 0;
    let failedCount = 0;

    // Process emails with a step per batch to enable resumability
    const batchSize = 5;
    for (let i = 0; i < dueEmails.length; i += batchSize) {
      const batch = dueEmails.slice(i, i + batchSize);

      const batchResults = await step.run(
        `send-batch-${i}`,
        async (): Promise<{
          sent: number;
          failed: number;
        }> => {
          let batchSent = 0;
          let batchFailed = 0;

          for (const emailItem of batch) {
            try {
              const wasSent = await processSequenceEmail(emailItem, logContext);
              if (wasSent) {
                batchSent++;
              }
            } catch (error) {
              const normalized = normalizeError(error, 'Failed to send sequence email');
              logger.warn(
                {
                  ...logContext,
                  email: emailItem.email, // Auto-hashed by pino redaction
                  sequenceId: emailItem.id,
                  step: emailItem.step,
                  errorMessage: normalized.message,
                },
                'Failed to send sequence email'
              );
              batchFailed++;
            }
          }

          return { sent: batchSent, failed: batchFailed };
        }
      );

      sentCount += batchResults.sent;
      failedCount += batchResults.failed;
    }

    // Additional custom logging (duration logging is handled by factory)
    logger.info(
      { ...logContext, sent: sentCount, failed: failedCount, total: dueEmails.length },
      'Email sequence processing completed'
    );

    return {
      sent: sentCount,
      failed: failedCount,
    };
  }
);

/**
 * Process a single sequence email
 * @returns true if email was sent successfully, false if skipped or failed
 */
async function processSequenceEmail(
  emailItem: SequenceEmailItem,
  logContext: ReturnType<typeof createWebAppContextWithId>
): Promise<boolean> {
  const { email, step, id: sequenceEmailId } = emailItem;

  const service = await getService('misc'); // Consolidated: EmailService methods moved to MiscService

  // IDEMPOTENCY: First, atomically claim this email by updating the step
  // This prevents duplicate sends if the function retries after sending but before updating
  // We use a conditional update that only succeeds if current_step matches expected value
  const claimResult = await service.claimEmailSequenceStep(sequenceEmailId, step);

  if (!claimResult) {
    // Already claimed or not found - skip silently (expected for duplicates)
    logger.info(
      { ...logContext, sequenceId: sequenceEmailId, step, reason: 'already_processed' },
      'Sequence email already claimed or not found, skipping'
    );
    return false; // Don't throw - this is expected for duplicates, but don't count as sent
  }

  // Build email content based on step using React Email template
  const html = await renderEmailTemplate(SequenceEmail, { step, email });

  // Send the email - if this fails, the step is already incremented
  // The user will get the next email in sequence instead of a duplicate
  const { error: sendError } = await sendEmail(
    {
      from: ONBOARDING_FROM,
      to: email,
      subject: getDefaultSubject(step),
      html,
      tags: [
        { name: 'type', value: 'sequence' },
        { name: 'step', value: String(step) },
        { name: 'sequence_id', value: sequenceEmailId },
      ],
    },
    'Resend sequence email send timed out'
  );

  if (sendError) {
    // Email failed to send, but step was already incremented
    // Log for monitoring - manual intervention may be needed
    logger.error(
      {
        err: normalizeError(sendError, 'Send failed'),
        ...logContext,
        email, // Auto-hashed
        sequenceId: sequenceEmailId,
        step,
      },
      'Sequence email send failed after step claim'
    );
    // Don't throw - step is already claimed, throwing would cause retry which skips anyway
    // Return false to indicate it wasn't successfully sent
    return false;
  }

  // Update last_sent_at to track successful delivery
  await service.updateEmailSequenceLastSent(sequenceEmailId);

  logger.info(
    {
      ...logContext,
      email, // Auto-hashed by pino redaction
      sequenceId: sequenceEmailId,
      step,
    },
    'Sequence email sent'
  );
  return true; // Successfully sent
}

/**
 * Get default subject based on step number
 */
function getDefaultSubject(step: number): string {
  const subjects: Record<number, string> = {
    1: 'Welcome to Claude Pro Directory! 🎉',
    2: 'Getting Started with Claude Pro Directory',
    3: 'Power User Tips for Claude',
    4: 'Join the Claude Pro Community',
    5: 'Stay Engaged with ClaudePro',
  };
  return subjects[step] || `Claude Pro Directory - Email ${step}`;
}
