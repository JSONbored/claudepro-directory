/**
 * Contact Form Email Inngest Function
 *
 * Handles contact form submissions:
 * - Sends admin notification email
 * - Sends user confirmation email
 */

import { contact_category as ContactCategoryEnum } from '@prisma/client';
import type { contact_category } from '@prisma/client';
import { normalizeError } from '@heyclaude/shared-runtime';

import { renderEmailTemplate } from '../../../email/base-template';
import { HELLO_FROM, CONTACT_FROM } from '../../../email/config/email-config';
import {
  ContactAdminNotificationEmail,
  ContactUserConfirmationEmail,
} from '../../../email/templates/contact';
import { sendEmail } from '../../../integrations/resend';
import { logger } from '../../../logging/server';
import { createInngestFunction, type InngestHandlerContext } from '../../utils/function-factory';

/**
 * Contact form submission function
 *
 * This function sends:
 * 1. Admin notification email
 * 2. User confirmation email
 */
export const sendContactEmails = createInngestFunction(
  {
    id: 'email-contact',
    name: 'Contact Form Emails',
    route: '/inngest/email/contact',
    retries: 3,
    // Idempotency: Use submissionId to prevent duplicate contact emails
    // Each submission will only trigger emails once
    idempotency: 'event.data.submissionId',
  },
  { event: 'email/contact' },
  async ({ event, step, logContext }: InngestHandlerContext) => {

    const { submissionId, name, email, category, message } = event.data;

    // Validate category
    const contactCategoryValues = Object.values(ContactCategoryEnum) as readonly contact_category[];
    const isValidCategory = contactCategoryValues.includes(category as contact_category);

    if (!isValidCategory) {
      logger.warn(
        { ...logContext, category, validCategories: contactCategoryValues.join(', ') },
        'Invalid contact category'
      );
      throw new Error(
        `Invalid category: ${category}. Must be one of: ${contactCategoryValues.join(', ')}`
      );
    }

    const validatedCategory = category as contact_category;

    logger.info(
      { ...logContext, submissionId, category: validatedCategory },
      'Contact form submission received'
    );

    // Step 1: Send admin notification email
    const adminEmailResult = await step.run(
      'send-admin-email',
      async (): Promise<{
        sent: boolean;
        emailId: string | null;
      }> => {
        try {
          // Category emoji mapping
          const categoryEmoji: Record<contact_category, string> = {
            bug: '🐛',
            feature: '💡',
            partnership: '🤝',
            general: '💬',
            other: '📧',
          };

          // Build HTML for admin notification using React Email template
          const adminHtml = await renderEmailTemplate(ContactAdminNotificationEmail, {
            submissionId,
            name,
            email,
            category: validatedCategory,
            categoryEmoji: categoryEmoji[validatedCategory] || '📧',
            message,
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
            logger.warn(
              { ...logContext, errorMessage: emailError.message, submissionId },
              'Admin notification email failed'
            );
            return { sent: false, emailId: null };
          }

          return { sent: true, emailId: emailData?.id ?? null };
        } catch (error) {
          const normalized = normalizeError(error, 'Admin notification email failed');
          logger.warn(
            { ...logContext, errorMessage: normalized.message },
            'Admin notification email failed'
          );
          return { sent: false, emailId: null };
        }
      }
    );

    // Step 2: Send user confirmation email
    const userEmailResult = await step.run(
      'send-user-email',
      async (): Promise<{
        sent: boolean;
        emailId: string | null;
      }> => {
        try {
          // Build HTML for user confirmation using React Email template
          const userHtml = await renderEmailTemplate(ContactUserConfirmationEmail, {
            name,
            category: validatedCategory,
            email,
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
            logger.warn(
              { ...logContext, errorMessage: emailError.message, submissionId },
              'User confirmation email failed'
            );
            return { sent: false, emailId: null };
          }

          return { sent: true, emailId: emailData?.id ?? null };
        } catch (error) {
          const normalized = normalizeError(error, 'User confirmation email failed');
          logger.warn(
            { ...logContext, errorMessage: normalized.message },
            'User confirmation email failed'
          );
          return { sent: false, emailId: null };
        }
      }
    );

    // Additional custom logging (duration logging is handled by factory)
    logger.info(
      {
        ...logContext,
        submissionId,
        adminEmailSent: adminEmailResult.sent,
        userEmailSent: userEmailResult.sent,
      },
      'Contact form emails completed'
    );

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

