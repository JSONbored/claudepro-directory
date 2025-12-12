/**
 * Job Lifecycle Email Inngest Function
 *
 * Handles job-related lifecycle emails:
 * - job-submitted: Confirmation when a job is submitted
 * - job-approved: Notification when approved (payment required)
 * - job-rejected: Notification when revisions are needed
 * - job-payment-confirmed: Confirmation when payment is received
 * - job-expiring: Reminder when job is about to expire
 * - job-expired: Notification when job has expired
 */

import { escapeHtml, getEnvVar, normalizeError } from '@heyclaude/shared-runtime';

import { inngest } from '../../client';
import { sendEmail } from '../../../integrations/resend';
import { JOBS_FROM } from '../../../email/config/email-config';
import { logger, createWebAppContextWithId } from '../../../logging/server';
import { sendCriticalFailureHeartbeat } from '../../utils/monitoring';

// Base URL for links - configurable via environment
const BASE_URL = getEnvVar('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';

/**
 * Safely convert payload value to escaped string
 */
function safeString(value: unknown, fallback: string): string {
  const str = typeof value === 'string' ? value : String(value || fallback);
  return escapeHtml(str);
}

/**
 * Safely convert payload value to number with bounds
 */
function safeNumber(value: unknown, fallback: number, min = 0): number {
  const num = typeof value === 'number' ? value : Number(value);
  return isNaN(num) ? fallback : Math.max(min, num);
}

/**
 * Safely parse date string
 */
function safeDate(value: unknown): string {
  const str = String(value || '');
  if (!str || isNaN(Date.parse(str))) {
    return 'TBD';
  }
  return new Date(str).toLocaleDateString('en-US', { dateStyle: 'medium' });
}

// Job lifecycle action configurations
const JOB_EMAIL_CONFIGS: Record<string, {
  buildSubject: (payload: Record<string, unknown>) => string;
  buildHtml: (payload: Record<string, unknown>) => string;
}> = {
  'job-submitted': {
    buildSubject: (p) => `Job Submitted: ${p['jobTitle']}`,
    buildHtml: buildJobSubmittedHtml,
  },
  'job-approved': {
    buildSubject: (p) => `Job Approved: ${p['jobTitle']}`,
    buildHtml: buildJobApprovedHtml,
  },
  'job-rejected': {
    buildSubject: (p) => `Action Required: Update Your Job Posting - ${p['jobTitle']}`,
    buildHtml: buildJobRejectedHtml,
  },
  'job-payment-confirmed': {
    buildSubject: (p) => `Your Job is Live: ${p['jobTitle']}`,
    buildHtml: buildJobPaymentConfirmedHtml,
  },
  'job-expiring': {
    buildSubject: (p) => `Expiring Soon: ${p['jobTitle']} (${p['daysRemaining']} days remaining)`,
    buildHtml: buildJobExpiringHtml,
  },
  'job-expired': {
    buildSubject: (p) => `Job Listing Expired: ${p['jobTitle']}`,
    buildHtml: buildJobExpiredHtml,
  },
};

/**
 * Job lifecycle email function
 *
 * Sends job-related emails based on the action provided in the event.
 */
export const sendJobLifecycleEmail = inngest.createFunction(
  {
    id: 'email-job-lifecycle',
    name: 'Job Lifecycle Email',
    retries: 3,
    // Idempotency: Use action + jobId to prevent duplicate lifecycle emails
    // Same action for same job will only trigger email once
    idempotency: 'event.data.action + "-" + event.data.jobId',
    // BetterStack monitoring: Send heartbeat on failure (feature-flagged)
    onFailure: async ({ event, error }) => {
      const eventData = event?.data as { action?: string } | undefined;
      const context: { functionName?: string; eventType?: string; error?: string } = {
        functionName: 'sendJobLifecycleEmail',
      };
      if (eventData?.action) {
        context.eventType = eventData.action;
      }
      if (error) {
        context.error = error instanceof Error ? error.message : String(error);
      }
      sendCriticalFailureHeartbeat('BETTERSTACK_HEARTBEAT_CRITICAL_FAILURE', context);
      
      // Log for observability
      logger.error(
        { 
          functionName: 'sendJobLifecycleEmail',
          errorMessage: error ? (error instanceof Error ? error.message : String(error)) : 'unknown',
        },
        'Job lifecycle email function failed after all retries'
      );
    },
  },
  { event: 'email/job-lifecycle' },
  async ({ event, step }) => {
    const startTime = Date.now();
    const logContext = createWebAppContextWithId('/inngest/email/job-lifecycle', 'sendJobLifecycleEmail');

    const { action, employerEmail, jobId, payload, jobTitle, company } = event.data;

    logger.info({ ...logContext,
      action,
      jobId, }, 'Job lifecycle email request received');

    // Validate action
    const config = JOB_EMAIL_CONFIGS[action];
    if (!config) {
      logger.warn({ ...logContext,
        action,
        availableActions: Object.keys(JOB_EMAIL_CONFIGS).join(', '), }, 'Unknown job lifecycle action');
      throw new Error(`Unknown job lifecycle action: ${action}`);
    }

    // Build payload with available data
    const emailPayload: Record<string, unknown> = {
      ...payload,
      jobId,
      jobTitle,
      company,
    };

    // Step 1: Send the email
    const emailResult = await step.run('send-email', async (): Promise<{
      sent: boolean;
      emailId: string | null;
    }> => {
      // Skip if no employer email provided
      if (!employerEmail) {
        logger.info({ ...logContext,
          action,
          jobId, }, 'No employer email provided, skipping job lifecycle email');
        return { sent: false, emailId: null };
      }

      try {
        const subject = config.buildSubject(emailPayload);
        const html = config.buildHtml(emailPayload);

        const { data: sendData, error: sendError } = await sendEmail(
          {
            from: JOBS_FROM,
            to: employerEmail,
            subject,
            html,
            tags: [{ name: 'type', value: action }],
          },
          `Resend job lifecycle email (${action}) send timed out`
        );

        if (sendError) {
          logger.warn({ ...logContext,
            action,
            jobId,
            errorMessage: sendError.message, }, 'Job lifecycle email failed');
          return { sent: false, emailId: null };
        }

        return { sent: true, emailId: sendData?.id ?? null };
      } catch (error) {
        const normalized = normalizeError(error, 'Job lifecycle email failed');
        logger.warn({ ...logContext,
          action,
          jobId,
          errorMessage: normalized.message, }, 'Job lifecycle email failed');
        return { sent: false, emailId: null };
      }
    });

    const durationMs = Date.now() - startTime;
    logger.info({ ...logContext,
      durationMs,
      action,
      jobId,
      sent: emailResult.sent,
      emailId: emailResult.emailId, }, 'Job lifecycle email completed');

    return {
      success: emailResult.sent,
      sent: emailResult.sent,
      emailId: emailResult.emailId,
      jobId,
    };
  }
);

// HTML builders for each job lifecycle action

function buildJobSubmittedHtml(p: Record<string, unknown>): string {
  const jobTitle = safeString(p['jobTitle'], 'Your Job');
  const company = safeString(p['company'], '');
  const jobId = safeString(p['jobId'], '');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 16px;">📝 Job Submitted for Review</h1>
    
    <p style="color: #333; line-height: 1.6;">
      We've received your job posting <strong>"${jobTitle}"</strong>${company ? ` at ${company}` : ''}.
    </p>
    
    <p style="color: #666; line-height: 1.6;">
      Our team will review your listing within 24-48 hours. You'll receive an email once it's approved.
    </p>
    
    <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; color: #666; font-size: 14px;">
        <strong>Job ID:</strong> ${jobId}
      </p>
    </div>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6;">
      Need to make changes? You can edit your submission from your <a href="${BASE_URL}/account/jobs" style="color: #ff6b35;">account dashboard</a>.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    
    <p style="color: #666; font-size: 14px; margin: 0;">
      — The Claude Pro Directory Team
    </p>
  </div>
</body>
</html>
  `.trim();
}

function buildJobApprovedHtml(p: Record<string, unknown>): string {
  const jobTitle = safeString(p['jobTitle'], 'Your Job');
  const company = safeString(p['company'], '');
  const paymentAmount = safeNumber(p['paymentAmount'], 0);
  const paymentUrl = safeString(p['paymentUrl'], `${BASE_URL}/account/jobs`);
  const plan = safeString(p['plan'], 'standard');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 16px;">✅ Job Approved!</h1>
    
    <p style="color: #333; line-height: 1.6;">
      Great news! Your job posting <strong>"${jobTitle}"</strong>${company ? ` at ${company}` : ''} has been approved.
    </p>
    
    <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; color: #333;"><strong>Plan:</strong> ${plan.charAt(0).toUpperCase() + plan.slice(1)}</p>
      ${paymentAmount > 0 ? `<p style="margin: 0; color: #333;"><strong>Amount:</strong> $${paymentAmount}</p>` : ''}
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      Complete your payment to make your listing live and reach thousands of Claude developers.
    </p>
    
    <div style="margin: 24px 0;">
      <a href="${paymentUrl}" style="display: inline-block; background-color: #ff6b35; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Complete Payment
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    
    <p style="color: #666; font-size: 14px; margin: 0;">
      — The Claude Pro Directory Team
    </p>
  </div>
</body>
</html>
  `.trim();
}

function buildJobRejectedHtml(p: Record<string, unknown>): string {
  const jobTitle = safeString(p['jobTitle'], 'Your Job');
  const rejectionReason = safeString(p['rejectionReason'], 'Please review our guidelines and resubmit.');
  const jobId = safeString(p['jobId'], '');
  const editUrl = `${BASE_URL}/account/jobs/${encodeURIComponent(jobId)}/edit`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 16px;">📝 Revisions Needed</h1>
    
    <p style="color: #333; line-height: 1.6;">
      Your job posting <strong>"${jobTitle}"</strong> needs some updates before it can go live.
    </p>
    
    <div style="background: #fff3cd; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0; color: #333;">
        <strong>Feedback:</strong> ${rejectionReason}
      </p>
    </div>
    
    <div style="margin: 24px 0;">
      <a href="${editUrl}" style="display: inline-block; background-color: #ff6b35; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Edit Your Listing
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6;">
      Once you've made the changes, resubmit and we'll review it again quickly.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    
    <p style="color: #666; font-size: 14px; margin: 0;">
      — The Claude Pro Directory Team
    </p>
  </div>
</body>
</html>
  `.trim();
}

function buildJobPaymentConfirmedHtml(p: Record<string, unknown>): string {
  const jobTitle = safeString(p['jobTitle'], 'Your Job');
  const company = safeString(p['company'], '');
  const jobSlug = safeString(p['jobSlug'], '');
  const paymentAmount = safeNumber(p['paymentAmount'], 0);
  const expiresDate = safeDate(p['expiresAt']);
  const jobUrl = `${BASE_URL}/jobs/${encodeURIComponent(jobSlug)}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 16px;">🎉 Your Job is Live!</h1>
    
    <p style="color: #333; line-height: 1.6;">
      Payment confirmed! Your job posting <strong>"${jobTitle}"</strong>${company ? ` at ${company}` : ''} is now live.
    </p>
    
    <div style="background: #d4edda; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #28a745;">
      ${paymentAmount > 0 ? `<p style="margin: 0 0 8px; color: #333;"><strong>Payment:</strong> $${paymentAmount}</p>` : ''}
      ${expiresDate !== 'TBD' ? `<p style="margin: 0; color: #333;"><strong>Expires:</strong> ${expiresDate}</p>` : ''}
    </div>
    
    <div style="margin: 24px 0;">
      <a href="${jobUrl}" style="display: inline-block; background-color: #ff6b35; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        View Your Listing
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6;">
      Track your listing's performance in your <a href="${BASE_URL}/account/jobs" style="color: #ff6b35;">account dashboard</a>.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    
    <p style="color: #666; font-size: 14px; margin: 0;">
      — The Claude Pro Directory Team
    </p>
  </div>
</body>
</html>
  `.trim();
}

function buildJobExpiringHtml(p: Record<string, unknown>): string {
  const jobTitle = safeString(p['jobTitle'], 'Your Job');
  const daysRemaining = safeNumber(p['daysRemaining'], 0);
  const renewalUrl = safeString(p['renewalUrl'], `${BASE_URL}/account/jobs`);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 16px;">⏰ Your Listing is Expiring Soon</h1>
    
    <p style="color: #333; line-height: 1.6;">
      Your job posting <strong>"${jobTitle}"</strong> will expire in <strong>${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong>.
    </p>
    
    <p style="color: #666; line-height: 1.6;">
      Renew now to keep your listing active and continue reaching qualified candidates.
    </p>
    
    <div style="margin: 24px 0;">
      <a href="${renewalUrl}" style="display: inline-block; background-color: #ff6b35; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Renew Listing
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    
    <p style="color: #666; font-size: 14px; margin: 0;">
      — The Claude Pro Directory Team
    </p>
  </div>
</body>
</html>
  `.trim();
}

function buildJobExpiredHtml(p: Record<string, unknown>): string {
  const jobTitle = safeString(p['jobTitle'], 'Your Job');
  const viewCount = safeNumber(p['viewCount'], 0);
  const clickCount = safeNumber(p['clickCount'], 0);
  const repostUrl = safeString(p['repostUrl'], `${BASE_URL}/account/jobs`);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 16px;">📊 Your Listing Has Expired</h1>
    
    <p style="color: #333; line-height: 1.6;">
      Your job posting <strong>"${jobTitle}"</strong> has reached its expiration date.
    </p>
    
    <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <h3 style="margin: 0 0 12px; font-size: 16px;">Performance Summary</h3>
      <p style="margin: 0 0 8px; color: #333;"><strong>Views:</strong> ${viewCount.toLocaleString()}</p>
      <p style="margin: 0; color: #333;"><strong>Clicks:</strong> ${clickCount.toLocaleString()}</p>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      Still hiring? Repost your listing to reach more candidates.
    </p>
    
    <div style="margin: 24px 0;">
      <a href="${repostUrl}" style="display: inline-block; background-color: #ff6b35; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Repost Listing
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    
    <p style="color: #666; font-size: 14px; margin: 0;">
      — The Claude Pro Directory Team
    </p>
  </div>
</body>
</html>
  `.trim();
}
