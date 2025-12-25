/**
 * Transactional Email Inngest Function
 *
 * Handles generic transactional emails based on type.
 * Supports various email types defined in TRANSACTIONAL_EMAIL_CONFIGS.
 */

import { normalizeError } from '@heyclaude/shared-runtime';

import { renderEmailTemplate } from '../../../email/base-template';
import { HELLO_FROM, JOBS_FROM } from '../../../email/config/email-config';
import {
  EmailChangeEmail,
  JobPostedEmail,
  PasswordResetEmail,
} from '../../../email/templates/transactional';
import { MFAFactorAddedEmail, MFAFactorRemovedEmail } from '../../../email/templates/mfa';
import { sendEmail } from '../../../integrations/resend';
import { logger } from '../../../logging/server';
import { createInngestFunction } from '../../utils/function-factory';
import { RETRY_CONFIGS } from '../../config';

// Email type configurations
const TRANSACTIONAL_EMAIL_CONFIGS: Record<
  string,
  {
    from: string;
    buildSubject: (data: Record<string, unknown>) => string;
    buildHtml: (data: Record<string, unknown>) => Promise<string>;
  }
> = {
  'job-posted': {
    from: JOBS_FROM,
    buildSubject: (data) => `Your job posting "${data['jobTitle']}" is now live!`,
    buildHtml: async (data) => {
      const props: {
        jobTitle: string;
        company?: string;
        jobSlug: string;
      } = {
        jobTitle: String(data['jobTitle'] || 'Your Job'),
        jobSlug: String(data['jobSlug'] || ''),
      };
      if (data['company']) {
        props.company = String(data['company']);
      }
      return renderEmailTemplate(JobPostedEmail, props);
    },
  },
  'password-reset': {
    from: HELLO_FROM,
    buildSubject: () => 'Reset Your Password - Claude Pro Directory',
    buildHtml: async (data) => {
      return renderEmailTemplate(PasswordResetEmail, {
        resetUrl: String(data['resetUrl'] || 'https://claudepro.directory/reset-password'),
      });
    },
  },
  'email-change': {
    from: HELLO_FROM,
    buildSubject: () => 'Confirm Email Change - Claude Pro Directory',
    buildHtml: async (data) => {
      return renderEmailTemplate(EmailChangeEmail, {
        confirmUrl: String(data['confirmUrl'] || 'https://claudepro.directory/confirm-email'),
        newEmail: String(data['newEmail'] || ''),
      });
    },
  },
  'mfa-factor-added': {
    from: HELLO_FROM,
    buildSubject: () => 'New Two-Factor Authentication Method Added',
    buildHtml: async (data) => {
      return renderEmailTemplate(MFAFactorAddedEmail, {
        factorType: (data['factorType'] as 'totp' | 'phone') || 'totp',
        factorName: String(data['factorName'] || 'Authenticator App'),
        addedAt: String(data['addedAt'] || new Date().toISOString()),
        userEmail: String(data['userEmail'] || ''),
      });
    },
  },
  'mfa-factor-removed': {
    from: HELLO_FROM,
    buildSubject: () => 'Two-Factor Authentication Method Removed',
    buildHtml: async (data) => {
      return renderEmailTemplate(MFAFactorRemovedEmail, {
        factorType: (data['factorType'] as 'totp' | 'phone') || 'totp',
        factorName: String(data['factorName'] || 'Authenticator App'),
        removedAt: String(data['removedAt'] || new Date().toISOString()),
        userEmail: String(data['userEmail'] || ''),
        remainingFactorsCount: Number(data['remainingFactorsCount'] || 0),
      });
    },
  },
};

/**
 * Transactional email function
 *
 * Sends transactional emails based on the type provided in the event.
 */
export const sendTransactionalEmail = createInngestFunction(
  {
    id: 'email-transactional',
    name: 'Transactional Email',
    route: '/inngest/email/transactional',
    retries: RETRY_CONFIGS.EMAIL,
    // Idempotency: Use type + email + timestamp to prevent duplicates
    // Note: CEL doesn't support || for null coalescing
    idempotency: 'event.data.type + "-" + event.data.email + "-" + string(event.ts)',
    onFailureHeartbeat: 'BETTERSTACK_HEARTBEAT_CRITICAL_FAILURE',
  },
  { event: 'email/transactional' },
  async ({ event, step, logContext }) => {
    const { type, email, emailData } = event.data;

    logger.info(
      { ...logContext, type, email }, // Auto-hashed by pino redaction
      'Transactional email request received'
    );

    // Validate email type
    const config = TRANSACTIONAL_EMAIL_CONFIGS[type];
    if (!config) {
      logger.warn(
        {
          ...logContext,
          type,
          availableTypes: Object.keys(TRANSACTIONAL_EMAIL_CONFIGS).join(', '),
        },
        'Unknown transactional email type'
      );
      throw new Error(`Unknown transactional email type: ${type}`);
    }

    // Step 1: Send the email
    const emailResult = await step.run(
      'send-email',
      async (): Promise<{
        sent: boolean;
        emailId: string | null;
      }> => {
        try {
          const subject = config.buildSubject(emailData);
          const html = await config.buildHtml(emailData);

          const { data: sendData, error: sendError } = await sendEmail(
            {
              from: config.from,
              to: email,
              subject,
              html,
              tags: [{ name: 'type', value: type }],
            },
            `Resend transactional email (${type}) send timed out`
          );

          if (sendError) {
            logger.warn(
              { ...logContext, type, errorMessage: sendError.message },
              'Transactional email failed'
            );
            return { sent: false, emailId: null };
          }

          return { sent: true, emailId: sendData?.id ?? null };
        } catch (error) {
          const normalized = normalizeError(error, 'Transactional email failed');
          logger.warn(
            { ...logContext, type, errorMessage: normalized.message },
            'Transactional email failed'
          );
          return { sent: false, emailId: null };
        }
      }
    );

    // Additional custom logging (duration logging is handled by factory)
    logger.info(
      { ...logContext, type, sent: emailResult.sent, emailId: emailResult.emailId },
      'Transactional email completed'
    );

    return {
      success: emailResult.sent,
      sent: emailResult.sent,
      emailId: emailResult.emailId,
      type,
    };
  }
);
