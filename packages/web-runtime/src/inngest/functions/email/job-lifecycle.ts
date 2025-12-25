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

import { normalizeError } from '@heyclaude/shared-runtime';
import { env } from '@heyclaude/shared-runtime/schemas/env';

import { renderEmailTemplate } from '../../../email/base-template';
import { JOBS_FROM } from '../../../email/config/email-config';
import {
  JobApprovedEmail,
  JobExpiredEmail,
  JobExpiringEmail,
  JobPaymentConfirmedEmail,
  JobRejectedEmail,
  JobSubmittedEmail,
} from '../../../email/templates/job-lifecycle';
import { sendEmail } from '../../../integrations/resend';
import { logger } from '../../../logging/server';
import { createInngestFunction } from '../../utils/function-factory';

// Base URL for links - configurable via environment
const BASE_URL = env.NEXT_PUBLIC_SITE_URL || 'https://claudepro.directory';

/**
 * Safely convert payload value to string
 */
function safeString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : String(value || fallback);
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
const JOB_EMAIL_CONFIGS: Record<
  string,
  {
    buildSubject: (payload: Record<string, unknown>) => string;
    buildHtml: (payload: Record<string, unknown>) => Promise<string>;
  }
> = {
  'job-submitted': {
    buildSubject: (p) => `Job Submitted: ${p['jobTitle']}`,
    buildHtml: async (p) => {
      const props: {
        jobTitle: string;
        company?: string;
        jobId: string;
        baseUrl: string;
      } = {
        jobTitle: safeString(p['jobTitle'], 'Your Job'),
        jobId: safeString(p['jobId'], ''),
        baseUrl: BASE_URL,
      };
      if (p['company']) {
        props.company = safeString(p['company'], '');
      }
      return renderEmailTemplate(JobSubmittedEmail, props);
    },
  },
  'job-approved': {
    buildSubject: (p) => `Job Approved: ${p['jobTitle']}`,
    buildHtml: async (p) => {
      const props: {
        jobTitle: string;
        company?: string;
        paymentAmount: number;
        paymentUrl: string;
        plan: string;
      } = {
        jobTitle: safeString(p['jobTitle'], 'Your Job'),
        paymentAmount: safeNumber(p['paymentAmount'], 0),
        paymentUrl: safeString(p['paymentUrl'], `${BASE_URL}/account/jobs`),
        plan: safeString(p['plan'], 'standard'),
      };
      if (p['company']) {
        props.company = safeString(p['company'], '');
      }
      return renderEmailTemplate(JobApprovedEmail, props);
    },
  },
  'job-rejected': {
    buildSubject: (p) => `Action Required: Update Your Job Posting - ${p['jobTitle']}`,
    buildHtml: async (p) => {
      return renderEmailTemplate(JobRejectedEmail, {
        jobTitle: safeString(p['jobTitle'], 'Your Job'),
        rejectionReason: safeString(
          p['rejectionReason'],
          'Please review our guidelines and resubmit.'
        ),
        jobId: safeString(p['jobId'], ''),
        baseUrl: BASE_URL,
      });
    },
  },
  'job-payment-confirmed': {
    buildSubject: (p) => `Your Job is Live: ${p['jobTitle']}`,
    buildHtml: async (p) => {
      const props: {
        jobTitle: string;
        company?: string;
        jobSlug: string;
        paymentAmount: number;
        expiresDate: string;
        baseUrl: string;
      } = {
        jobTitle: safeString(p['jobTitle'], 'Your Job'),
        jobSlug: safeString(p['jobSlug'], ''),
        paymentAmount: safeNumber(p['paymentAmount'], 0),
        expiresDate: safeDate(p['expiresAt']),
        baseUrl: BASE_URL,
      };
      if (p['company']) {
        props.company = safeString(p['company'], '');
      }
      return renderEmailTemplate(JobPaymentConfirmedEmail, props);
    },
  },
  'job-expiring': {
    buildSubject: (p) => `Expiring Soon: ${p['jobTitle']} (${p['daysRemaining']} days remaining)`,
    buildHtml: async (p) => {
      return renderEmailTemplate(JobExpiringEmail, {
        jobTitle: safeString(p['jobTitle'], 'Your Job'),
        daysRemaining: safeNumber(p['daysRemaining'], 0),
        renewalUrl: safeString(p['renewalUrl'], `${BASE_URL}/account/jobs`),
      });
    },
  },
  'job-expired': {
    buildSubject: (p) => `Job Listing Expired: ${p['jobTitle']}`,
    buildHtml: async (p) => {
      return renderEmailTemplate(JobExpiredEmail, {
        jobTitle: safeString(p['jobTitle'], 'Your Job'),
        viewCount: safeNumber(p['viewCount'], 0),
        clickCount: safeNumber(p['clickCount'], 0),
        repostUrl: safeString(p['repostUrl'], `${BASE_URL}/account/jobs`),
      });
    },
  },
};

/**
 * Job lifecycle email function
 *
 * Sends job-related emails based on the action provided in the event.
 */
export const sendJobLifecycleEmail = createInngestFunction(
  {
    id: 'email-job-lifecycle',
    name: 'Job Lifecycle Email',
    route: '/inngest/email/job-lifecycle',
    retries: 3,
    // Idempotency: Use action + jobId to prevent duplicate lifecycle emails
    // Same action for same job will only trigger email once
    idempotency: 'event.data.action + "-" + event.data.jobId',
    // BetterStack monitoring: Send heartbeat on failure (feature-flagged)
    onFailureHeartbeat: 'BETTERSTACK_HEARTBEAT_CRITICAL_FAILURE',
  },
  { event: 'email/job-lifecycle' },
  async ({ event, step, logContext }) => {
    const { action, employerEmail, jobId, payload, jobTitle, company } = event.data;

    logger.info({ ...logContext, action, jobId }, 'Job lifecycle email request received');

    // Validate action
    const config = JOB_EMAIL_CONFIGS[action];
    if (!config) {
      logger.warn(
        { ...logContext, action, availableActions: Object.keys(JOB_EMAIL_CONFIGS).join(', ') },
        'Unknown job lifecycle action'
      );
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
    const emailResult = await step.run(
      'send-email',
      async (): Promise<{
        sent: boolean;
        emailId: string | null;
      }> => {
        // Skip if no employer email provided
        if (!employerEmail) {
          logger.info(
            { ...logContext, action, jobId },
            'No employer email provided, skipping job lifecycle email'
          );
          return { sent: false, emailId: null };
        }

        try {
          const subject = config.buildSubject(emailPayload);
          const html = await config.buildHtml(emailPayload);

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
            logger.warn(
              { ...logContext, action, jobId, errorMessage: sendError.message },
              'Job lifecycle email failed'
            );
            return { sent: false, emailId: null };
          }

          return { sent: true, emailId: sendData?.id ?? null };
        } catch (error) {
          const normalized = normalizeError(error, 'Job lifecycle email failed');
          logger.warn(
            { ...logContext, action, jobId, errorMessage: normalized.message },
            'Job lifecycle email failed'
          );
          return { sent: false, emailId: null };
        }
      }
    );

    // Additional custom logging (duration logging is handled by factory)
    logger.info(
      {
        ...logContext,
        action,
        jobId,
        sent: emailResult.sent,
        emailId: emailResult.emailId,
      },
      'Job lifecycle email completed'
    );

    return {
      success: emailResult.sent,
      sent: emailResult.sent,
      emailId: emailResult.emailId,
      jobId,
    };
  }
);
