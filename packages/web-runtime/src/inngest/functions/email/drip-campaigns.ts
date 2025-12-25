/**
 * Dynamic Drip Campaign Functions
 *
 * Implements intelligent email sequences that adapt based on user engagement.
 * Uses Inngest's step.waitForEvent to pause workflows until specific
 * Resend events occur (opens, clicks).
 *
 * @see https://www.inngest.com/docs/guides/resend-webhook-events
 * @see https://www.inngest.com/docs/features/inngest-functions/steps-workflows/wait-for-event
 */

import { escapeHtml } from '@heyclaude/shared-runtime';
import { env } from '@heyclaude/shared-runtime/schemas/env';

import { renderEmailTemplate } from '../../../email/base-template';
import {
  DigestPreviewEmail,
  EngagementNudgeEmail,
  JobConfirmationDripEmail,
  JobExpirationReminderEmail,
  JobPerformanceReportEmail,
  JobShareReminderEmail,
  PowerUserTipsEmail,
} from '../../../email/templates/drip-campaigns';
import { sendEmail } from '../../../integrations/resend';
import { logger } from '../../../logging/server';
import { getService } from '../../../data/service-factory';
import { createInngestFunction } from '../../utils/function-factory';

const FROM_EMAIL = env.RESEND_FROM_EMAIL || 'Claude Pro Directory <hello@claudepro.directory>';

/**
 * Safely serialize a string value for use in CEL (Common Expression Language) filters.
 * Escapes special characters to prevent injection.
 * Returns a properly quoted CEL string literal.
 */
function toCelString(value: string | undefined | null): string {
  // Guard against undefined/null - return empty string literal
  if (value === undefined || value === null || value === '') {
    return '""';
  }
  // JSON.stringify handles escaping of quotes, backslashes, and special chars
  return JSON.stringify(value);
}

/**
 * Newsletter Signup Drip Campaign
 *
 * When a user signs up for the newsletter:
 * 1. Send welcome email
 * 2. Wait for them to click (up to 3 days)
 * 3. If clicked → send power user tips
 * 4. If not clicked → send engagement nudge
 * 5. After 7 days → send weekly digest preview
 */
export const newsletterDripCampaign = createInngestFunction(
  {
    id: 'newsletter-drip-campaign',
    name: 'Newsletter Drip Campaign',
    route: '/inngest/email/drip-campaigns/newsletter',
    retries: 3,
    // Idempotency: Use email to ensure only one drip campaign per subscriber
    idempotency: 'event.data.email',
  },
  { event: 'email/welcome' },
  async ({ event, step, logContext }) => {
    const { email, triggerSource } = event.data;

    logger.info({ ...logContext, email, triggerSource }, 'Starting newsletter drip campaign');

    // Step 1: Welcome email is already sent by welcome.ts
    // We just note the campaign start time for tracking
    await step.run('record-campaign-start', async () => {
      logger.info({ ...logContext, email, triggerSource }, 'Newsletter drip campaign started');
    });

    // Step 2: Wait up to 3 days for user to click any link in emails
    const clickEvent = await step.waitForEvent('wait-for-engagement', {
      event: 'resend/email.clicked',
      timeout: '3 days',
      // Match on recipient email (safely escaped for CEL)
      if: `async.data.to[0] == ${toCelString(email)}`,
    });

    if (clickEvent) {
      // User is engaged! Send power user tips after 1 day
      logger.info(
        { ...logContext, email, clickedLink: clickEvent.data.click?.link },
        'User engaged with email, scheduling tips'
      );

      await step.sleep('delay-tips-email', '1 day');

      await step.run('send-power-user-tips', async () => {
        const html = await renderEmailTemplate(PowerUserTipsEmail, { email });
        const result = await sendEmail({
          to: email,
          from: FROM_EMAIL,
          subject: '🚀 Pro tips for getting the most out of Claude',
          html,
        });

        if (result.error) {
          logger.warn(
            { ...logContext, email, errorMessage: result.error.message },
            'Failed to send power user tips email'
          );
        }

        return result.data?.id;
      });
    } else {
      // User didn't click - send a gentle nudge
      logger.info({ ...logContext, email }, 'User not engaged, sending nudge email');

      await step.run('send-nudge-email', async () => {
        const html = await renderEmailTemplate(EngagementNudgeEmail, { email });
        const result = await sendEmail({
          to: email,
          from: FROM_EMAIL,
          subject: 'Did you know? 5 ways to supercharge your Claude experience',
          html,
        });

        if (result.error) {
          logger.warn(
            { ...logContext, email, errorMessage: result.error.message },
            'Failed to send nudge email'
          );
        }

        return result.data?.id;
      });
    }

    // Step 3: After ~8 days total, check if they're still subscribed and send digest preview
    // Timeline: 3 days (wait for engagement) + 1 day (tips/nudge delay) + 4 days = 8 days
    await step.sleep('wait-for-digest', '4 days');

    const stillSubscribed = await step.run('check-subscription', async () => {
      const newsletterService = await getService('newsletter');
      const subscription = await newsletterService.getSubscriptionStatusByEmail(email);

      // Check if status is a valid active status
      const status = subscription?.status;
      return status !== 'unsubscribed' && status !== 'bounced' && status !== 'complained';
    });

    if (stillSubscribed) {
      await step.run('send-digest-preview', async () => {
        const html = await renderEmailTemplate(DigestPreviewEmail, { email });
        const result = await sendEmail({
          to: email,
          from: FROM_EMAIL,
          subject: '📬 Your first Claude Pro Directory digest is coming!',
          html,
        });

        return result.data?.id;
      });
    }

    logger.info(
      { ...logContext, email, engaged: !!clickEvent, stillSubscribed },
      'Newsletter drip campaign completed'
    );

    return { email, engaged: !!clickEvent, completed: true };
  }
);

/**
 * Job Posting Drip Campaign
 *
 * When an employer publishes a job:
 * 1. Send confirmation email
 * 2. Wait for them to view the posting (click) - up to 2 days
 * 3. If no click → remind them to share
 * 4. At 7 days → send performance report
 * 5. At 25 days → remind about expiration (if 30-day listing)
 */
export const jobPostingDripCampaign = createInngestFunction(
  {
    id: 'job-posting-drip-campaign',
    name: 'Job Posting Drip Campaign',
    route: '/inngest/email/drip-campaigns/job-posting',
    retries: 3,
    // Idempotency: Use jobId to ensure only one drip campaign per job posting
    idempotency: 'event.data.jobId',
  },
  { event: 'job/published' },
  async ({ event, step, logContext }) => {
    const { jobId, employerEmail, employerName, jobTitle, jobSlug } = event.data;
    const safeJobTitle = escapeHtml(jobTitle);
    const safeName = escapeHtml(employerName || 'there');

    logger.info({ ...logContext, jobId, employerEmail }, 'Starting job posting drip campaign');

    // Step 1: Send confirmation email
    await step.run('send-confirmation', async () => {
      const html = await renderEmailTemplate(JobConfirmationDripEmail, {
        jobTitle: safeJobTitle,
        jobSlug,
        name: safeName,
        email: employerEmail,
      });
      const result = await sendEmail({
        to: employerEmail,
        from: FROM_EMAIL,
        subject: `✅ Your job posting "${safeJobTitle}" is now live!`,
        html,
      });

      if (result.error) {
        logger.warn(
          { ...logContext, jobId, errorMessage: result.error.message },
          'Failed to send job confirmation email'
        );
      }

      return result.data?.id;
    });

    // Step 2: Wait for them to click (view their posting)
    const viewedPosting = await step.waitForEvent('wait-for-view', {
      event: 'resend/email.clicked',
      timeout: '2 days',
      // Match on recipient email (safely escaped for CEL)
      if: `async.data.to[0] == ${toCelString(employerEmail)}`,
    });

    if (!viewedPosting) {
      // Remind them to share their posting
      await step.run('send-share-reminder', async () => {
        const html = await renderEmailTemplate(JobShareReminderEmail, {
          jobTitle: safeJobTitle,
          jobSlug,
          name: safeName,
          email: employerEmail,
        });
        const result = await sendEmail({
          to: employerEmail,
          from: FROM_EMAIL,
          subject: `📣 Boost visibility for "${safeJobTitle}" - share your posting`,
          html,
        });

        return result.data?.id;
      });
    }

    // Step 3: At 7 days, send performance report
    await step.sleep('wait-for-report', '5 days'); // 2 + 5 = 7 days

    const jobStats = await step.run('get-job-stats', async () => {
      const jobsService = await getService('jobs');
      return await jobsService.getJobStatsById(jobId);
    });

    if (jobStats && jobStats['status'] === 'active') {
      await step.run('send-performance-report', async () => {
        const viewCount = Number(jobStats['view_count'] || 0);
        const clickCount = Number(jobStats['click_count'] || 0);
        const html = await renderEmailTemplate(JobPerformanceReportEmail, {
          jobTitle: safeJobTitle,
          jobSlug,
          name: safeName,
          email: employerEmail,
          viewCount,
          clickCount,
        });
        const result = await sendEmail({
          to: employerEmail,
          from: FROM_EMAIL,
          subject: `📊 Your job posting stats: ${viewCount} views`,
          html,
        });

        return result.data?.id;
      });

      // Step 4: At 25 days, remind about expiration
      await step.sleep('wait-for-expiration-reminder', '18 days'); // 7 + 18 = 25 days

      // Check if job is still active
      const stillActive = await step.run('check-job-status', async () => {
        const jobsService = await getService('jobs');
        const data = await jobsService.getJobStatusById(jobId);

        return data?.status === 'active';
      });

      if (stillActive) {
        await step.run('send-expiration-reminder', async () => {
          const html = await renderEmailTemplate(JobExpirationReminderEmail, {
            jobTitle: safeJobTitle,
            name: safeName,
            email: employerEmail,
          });
          const result = await sendEmail({
            to: employerEmail,
            from: FROM_EMAIL,
            subject: `⏰ Your job posting expires in 5 days - renew now?`,
            html,
          });

          return result.data?.id;
        });
      }
    }

    logger.info({ ...logContext, jobId, employerEmail }, 'Job posting drip campaign completed');

    return { jobId, employerEmail, completed: true };
  }
);
