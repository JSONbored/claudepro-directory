/**
 * Welcome Email Inngest Function
 *
 * Handles welcome emails for:
 * - Newsletter subscriptions
 * - OAuth signups
 */

import { normalizeError } from '@heyclaude/shared-runtime';
import { renderEmailTemplate } from '../../../email/base-template';
import { NewsletterWelcome } from '../../../email/templates/newsletter-welcome';
import { HELLO_FROM } from '../../../email/config/email-config';
import { sendEmail, enrollInOnboardingSequence } from '../../../integrations/resend';
import { logger } from '../../../logging/server';
import { createInngestFunction, type InngestHandlerContext } from '../../utils/function-factory';

/**
 * Welcome email function
 *
 * This function sends welcome emails based on trigger source:
 * - newsletter_subscription: Sends newsletter welcome email
 * - auth_signup: Sends OAuth signup welcome email
 */
export const sendWelcomeEmail = createInngestFunction(
  {
    id: 'email-welcome',
    name: 'Welcome Email',
    route: '/inngest/email/welcome',
    retries: 3,
    // Idempotency: Use email + triggerSource to prevent duplicate welcome emails
    // Same email with same trigger source will only be processed once
    idempotency: 'event.data.email + "-" + event.data.triggerSource',
  },
  { event: 'email/welcome' },
  async ({ event, step, logContext }: InngestHandlerContext) => {

    const { email, subscriptionId, triggerSource } = event.data;

    logger.info(
      { ...logContext, email, triggerSource, subscriptionId: subscriptionId ?? null },
      'Welcome email request received'
    );

    // Step 1: Render and send the appropriate welcome email
    const emailResult = await step.run(
      'send-welcome-email',
      async (): Promise<{
        sent: boolean;
        emailId: string | null;
      }> => {
        try {
          // For now, both trigger sources use the same newsletter welcome template
          // In the future, OAuth signup could use a different template
          const html = await renderEmailTemplate(NewsletterWelcome, {
            email,
          });

          const { data: emailData, error: emailError } = await sendEmail(
            {
              from: HELLO_FROM,
              to: email,
              subject: 'Welcome to Claude Pro Directory! 🎉',
              html,
              tags: [
                {
                  name: 'type',
                  value: triggerSource === 'auth_signup' ? 'auth-signup' : 'newsletter',
                },
              ],
            },
            'Resend welcome email send timed out'
          );

          if (emailError) {
            logger.warn(
              { ...logContext, errorMessage: emailError.message },
              'Welcome email failed'
            );
            return { sent: false, emailId: null };
          }

          logger.info(
            { ...logContext, emailId: emailData?.id ?? null },
            'Welcome email sent successfully'
          );

          return { sent: true, emailId: emailData?.id ?? null };
        } catch (error) {
          const normalized = normalizeError(error, 'Welcome email failed');
          logger.warn({ ...logContext, errorMessage: normalized.message }, 'Welcome email failed');
          return { sent: false, emailId: null };
        }
      }
    );

    // Step 2: Enroll in onboarding sequence (only if welcome email was sent)
    if (emailResult.sent) {
      await step.run('enroll-onboarding', async () => {
        try {
          await enrollInOnboardingSequence(email);
          logger.info({ ...logContext, email }, 'Enrolled in onboarding sequence');
        } catch (error) {
          const normalized = normalizeError(error, 'Onboarding enrollment failed');
          logger.warn(
            { ...logContext, errorMessage: normalized.message },
            'Onboarding enrollment failed'
          );
        }
      });
    }

    // Additional custom logging (duration logging is handled by factory)
    logger.info(
      {
        ...logContext,
        sent: emailResult.sent,
        emailId: emailResult.emailId,
        triggerSource,
      },
      'Welcome email completed'
    );

    return {
      success: emailResult.sent,
      sent: emailResult.sent,
      emailId: emailResult.emailId,
      ...(subscriptionId ? { subscriptionId } : {}),
    };
  }
);
