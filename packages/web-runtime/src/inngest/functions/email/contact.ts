/**
 * Contact Form Email Inngest Function
 *
 * Handles contact form submissions:
 * - Sends admin notification email
 * - Sends user confirmation email
 */

import { Constants, type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { normalizeError, escapeHtml } from '@heyclaude/shared-runtime';

import { inngest } from '../../client';
import { sendEmail } from '../../../integrations/resend';
import { HELLO_FROM, CONTACT_FROM } from '../../../email/config/email-config';
import { logger, generateRequestId, createWebAppContextWithId } from '../../../logging/server';

type ContactCategory = DatabaseGenerated['public']['Enums']['contact_category'];

/**
 * Contact form submission function
 *
 * This function sends:
 * 1. Admin notification email
 * 2. User confirmation email
 */
export const sendContactEmails = inngest.createFunction(
  {
    id: 'email-contact',
    name: 'Contact Form Emails',
    retries: 3,
    // Idempotency: Use submissionId to prevent duplicate contact emails
    // Each submission will only trigger emails once
    idempotency: 'event.data.submissionId',
  },
  { event: 'email/contact' },
  async ({ event, step }) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const logContext = createWebAppContextWithId(requestId, '/inngest/email/contact', 'sendContactEmails');

    const { submissionId, name, email, category, message } = event.data;

    // Validate category
    const contactCategoryValues = Constants.public.Enums.contact_category;
    const isValidCategory = contactCategoryValues.includes(category as ContactCategory);
    
    if (!isValidCategory) {
      logger.warn('Invalid contact category', {
        ...logContext,
        category,
        validCategories: contactCategoryValues.join(', '),
      });
      throw new Error(`Invalid category: ${category}. Must be one of: ${contactCategoryValues.join(', ')}`);
    }

    const validatedCategory = category as ContactCategory;

    logger.info('Contact form submission received', {
      ...logContext,
      submissionId,
      category: validatedCategory,
    });

    // Step 1: Send admin notification email
    const adminEmailResult = await step.run('send-admin-email', async (): Promise<{
      sent: boolean;
      emailId: string | null;
    }> => {
      try {
        // Category emoji mapping
        const categoryEmoji: Record<ContactCategory, string> = {
          bug: '🐛',
          feature: '💡',
          partnership: '🤝',
          general: '💬',
          other: '📧',
        };

        // Build simple HTML for admin notification
        const adminHtml = buildAdminNotificationHtml({
          submissionId,
          name,
          email,
          category: validatedCategory,
          message,
          categoryEmoji: categoryEmoji[validatedCategory] || '📧',
          submittedAt: new Date().toISOString(),
        });

        const { data: emailData, error: emailError } = await sendEmail(
          {
            from: CONTACT_FROM,
            to: 'hi@claudepro.directory',
            subject: `New Contact: ${validatedCategory} - ${name}`,
            html: adminHtml,
            tags: [{ name: 'type', value: 'contact-admin' }],
          },
          'Resend contact admin email send timed out'
        );

        if (emailError) {
          logger.warn('Admin notification email failed', {
            ...logContext,
            errorMessage: emailError.message,
            submissionId,
          });
          return { sent: false, emailId: null };
        }

        return { sent: true, emailId: emailData?.id ?? null };
      } catch (error) {
        const normalized = normalizeError(error, 'Admin notification email failed');
        logger.warn('Admin notification email failed', {
          ...logContext,
          errorMessage: normalized.message,
        });
        return { sent: false, emailId: null };
      }
    });

    // Step 2: Send user confirmation email
    const userEmailResult = await step.run('send-user-email', async (): Promise<{
      sent: boolean;
      emailId: string | null;
    }> => {
      try {
        // Build simple HTML for user confirmation
        const userHtml = buildUserConfirmationHtml({
          name,
          category: validatedCategory,
        });

        const { data: emailData, error: emailError } = await sendEmail(
          {
            from: HELLO_FROM,
            to: email,
            subject: 'We received your message!',
            html: userHtml,
            tags: [{ name: 'type', value: 'contact-confirmation' }],
          },
          'Resend contact user email send timed out'
        );

        if (emailError) {
          logger.warn('User confirmation email failed', {
            ...logContext,
            errorMessage: emailError.message,
            submissionId,
          });
          return { sent: false, emailId: null };
        }

        return { sent: true, emailId: emailData?.id ?? null };
      } catch (error) {
        const normalized = normalizeError(error, 'User confirmation email failed');
        logger.warn('User confirmation email failed', {
          ...logContext,
          errorMessage: normalized.message,
        });
        return { sent: false, emailId: null };
      }
    });

    const durationMs = Date.now() - startTime;
    logger.info('Contact form emails completed', {
      ...logContext,
      durationMs,
      submissionId,
      adminEmailSent: adminEmailResult.sent,
      userEmailSent: userEmailResult.sent,
    });

    return {
      success: true,
      submissionId,
      adminEmailSent: adminEmailResult.sent,
      adminEmailId: adminEmailResult.emailId,
      userEmailSent: userEmailResult.sent,
      userEmailId: userEmailResult.emailId,
    };
  }
);

/**
 * Build admin notification HTML (simple inline HTML for now)
 * TODO: Migrate to React Email template
 */
function buildAdminNotificationHtml(props: {
  submissionId: string;
  name: string;
  email: string;
  category: ContactCategory;
  message: string;
  categoryEmoji: string;
  submittedAt: string;
}): string {
  const { submissionId, name, email, category, message, categoryEmoji, submittedAt } = props;
  const submittedDate = new Date(submittedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 8px;">${categoryEmoji} New Contact Submission</h1>
    <p style="color: #666; margin: 0 0 24px;">Submitted via interactive terminal on ${submittedDate}</p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    
    <p style="margin: 8px 0;"><strong>Category:</strong> ${escapeHtml(category.charAt(0).toUpperCase() + category.slice(1))}</p>
    <p style="margin: 8px 0;"><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
    <p style="margin: 8px 0;"><strong>Submission ID:</strong> ${escapeHtml(submissionId)}</p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    
    <p style="margin: 8px 0;"><strong>Message:</strong></p>
    <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin-top: 8px; border: 1px solid #e0e0e0; font-family: monospace; white-space: pre-wrap; word-break: break-word;">
      ${escapeHtml(message)}
    </div>
    
    <div style="margin-top: 24px;">
      <a href="mailto:${encodeURIComponent(email)}" style="display: inline-block; background-color: #ff6b35; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Reply to ${escapeHtml(name)}</a>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Build user confirmation HTML (simple inline HTML for now)
 * TODO: Migrate to React Email template
 */
function buildUserConfirmationHtml(props: {
  name: string;
  category: ContactCategory;
}): string {
  const { name, category } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 16px;">Thanks for reaching out, ${escapeHtml(name)}!</h1>
    
    <p style="color: #333; margin: 0 0 16px; line-height: 1.6;">
      We've received your <strong>${escapeHtml(category)}</strong> message and will get back to you as soon as possible.
    </p>
    
    <p style="color: #666; margin: 0 0 24px; line-height: 1.6;">
      Our team typically responds within 24-48 hours during business days.
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
