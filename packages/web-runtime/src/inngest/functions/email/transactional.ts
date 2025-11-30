/**
 * Transactional Email Inngest Function
 *
 * Handles generic transactional emails based on type.
 * Supports various email types defined in TRANSACTIONAL_EMAIL_CONFIGS.
 */

import { normalizeError, escapeHtml } from '@heyclaude/shared-runtime';

import { inngest } from '../../client';
import { sendEmail } from '../../../integrations/resend';
import { HELLO_FROM, JOBS_FROM, COMMUNITY_FROM } from '../../../email/config/email-config';
import { logger, generateRequestId, createWebAppContextWithId } from '../../../logging/server';

// Email type configurations
const TRANSACTIONAL_EMAIL_CONFIGS: Record<string, {
  from: string;
  buildSubject: (data: Record<string, unknown>) => string;
  buildHtml: (data: Record<string, unknown>, email: string) => string;
}> = {
  'job-posted': {
    from: JOBS_FROM,
    buildSubject: (data) => `Your job posting "${data['jobTitle']}" is now live!`,
    buildHtml: (data, email) => buildJobPostedHtml(data, email),
  },
  'collection-shared': {
    from: COMMUNITY_FROM,
    buildSubject: (data) => `${data['senderName']} shared a collection with you`,
    buildHtml: (data, email) => buildCollectionSharedHtml(data, email),
  },
  'password-reset': {
    from: HELLO_FROM,
    buildSubject: () => 'Reset Your Password - Claude Pro Directory',
    buildHtml: (data, email) => buildPasswordResetHtml(data, email),
  },
  'email-change': {
    from: HELLO_FROM,
    buildSubject: () => 'Confirm Email Change - Claude Pro Directory',
    buildHtml: (data, email) => buildEmailChangeHtml(data, email),
  },
};

/**
 * Transactional email function
 *
 * Sends transactional emails based on the type provided in the event.
 */
export const sendTransactionalEmail = inngest.createFunction(
  {
    id: 'email-transactional',
    name: 'Transactional Email',
    retries: 3,
  },
  { event: 'email/transactional' },
  async ({ event, step }) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const logContext = createWebAppContextWithId(requestId, '/inngest/email/transactional', 'sendTransactionalEmail');

    const { type, email, emailData } = event.data;

    logger.info('Transactional email request received', {
      ...logContext,
      type,
      email, // Auto-hashed by pino redaction
    });

    // Validate email type
    const config = TRANSACTIONAL_EMAIL_CONFIGS[type];
    if (!config) {
      logger.warn('Unknown transactional email type', {
        ...logContext,
        type,
        availableTypes: Object.keys(TRANSACTIONAL_EMAIL_CONFIGS).join(', '),
      });
      throw new Error(`Unknown transactional email type: ${type}`);
    }

    // Step 1: Send the email
    const emailResult = await step.run('send-email', async (): Promise<{
      sent: boolean;
      emailId: string | null;
    }> => {
      try {
        const subject = config.buildSubject(emailData);
        const html = config.buildHtml(emailData, email);

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
          logger.warn('Transactional email failed', {
            ...logContext,
            type,
            errorMessage: sendError.message,
          });
          return { sent: false, emailId: null };
        }

        return { sent: true, emailId: sendData?.id ?? null };
      } catch (error) {
        const normalized = normalizeError(error, 'Transactional email failed');
        logger.warn('Transactional email failed', {
          ...logContext,
          type,
          errorMessage: normalized.message,
        });
        return { sent: false, emailId: null };
      }
    });

    const durationMs = Date.now() - startTime;
    logger.info('Transactional email completed', {
      ...logContext,
      durationMs,
      type,
      sent: emailResult.sent,
      emailId: emailResult.emailId,
    });

    return {
      success: emailResult.sent,
      sent: emailResult.sent,
      emailId: emailResult.emailId,
      type,
    };
  }
);

// HTML builders for each email type

function buildJobPostedHtml(data: Record<string, unknown>, _email: string): string {
  const jobTitle = escapeHtml(String(data['jobTitle'] || 'Your Job'));
  const company = escapeHtml(String(data['company'] || ''));
  const jobSlug = encodeURIComponent(String(data['jobSlug'] || ''));
  const jobUrl = `https://claudepro.directory/jobs/${jobSlug}`;

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
      Great news! Your job posting <strong>"${jobTitle}"</strong>${company ? ` at ${company}` : ''} is now live on Claude Pro Directory.
    </p>
    
    <div style="margin: 24px 0;">
      <a href="${jobUrl}" style="display: inline-block; background-color: #ff6b35; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        View Your Listing
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6;">
      Your listing will be visible to thousands of Claude developers and AI enthusiasts.
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

function buildCollectionSharedHtml(data: Record<string, unknown>, _email: string): string {
  const collectionName = escapeHtml(String(data['collectionName'] || 'A Collection'));
  const senderName = escapeHtml(String(data['senderName'] || 'Someone'));
  const collectionSlug = encodeURIComponent(String(data['collectionSlug'] || ''));
  const senderSlug = encodeURIComponent(String(data['senderSlug'] || ''));
  const itemCount = Number(data['itemCount'] || 0);
  const collectionUrl = `https://claudepro.directory/u/${senderSlug}/collections/${collectionSlug}`;
  const collectionDescription = escapeHtml(String(data['collectionDescription'] || ''));

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 16px;">📚 ${senderName} shared a collection with you</h1>
    
    <p style="color: #333; line-height: 1.6;">
      <strong>${collectionName}</strong> - ${itemCount} items
    </p>
    
    ${collectionDescription ? `<p style="color: #666; line-height: 1.6;">${collectionDescription}</p>` : ''}
    
    <div style="margin: 24px 0;">
      <a href="${collectionUrl}" style="display: inline-block; background-color: #ff6b35; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        View Collection
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

function buildPasswordResetHtml(data: Record<string, unknown>, _email: string): string {
  const resetUrl = String(data['resetUrl'] || 'https://claudepro.directory/reset-password');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 16px;">🔐 Reset Your Password</h1>
    
    <p style="color: #333; line-height: 1.6;">
      We received a request to reset your password. Click the button below to create a new password.
    </p>
    
    <div style="margin: 24px 0;">
      <a href="${resetUrl}" style="display: inline-block; background-color: #ff6b35; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6;">
      If you didn't request this, you can safely ignore this email. The link will expire in 24 hours.
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

function buildEmailChangeHtml(data: Record<string, unknown>, _email: string): string {
  const confirmUrl = String(data['confirmUrl'] || 'https://claudepro.directory/confirm-email');
  const newEmail = escapeHtml(String(data['newEmail'] || ''));

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 16px;">📧 Confirm Email Change</h1>
    
    <p style="color: #333; line-height: 1.6;">
      We received a request to change your email address${newEmail ? ` to <strong>${newEmail}</strong>` : ''}.
    </p>
    
    <div style="margin: 24px 0;">
      <a href="${confirmUrl}" style="display: inline-block; background-color: #ff6b35; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Confirm Email Change
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6;">
      If you didn't request this change, please contact support immediately.
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
