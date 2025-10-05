'use server';

import { NewsletterWelcome } from '@/src/emails/templates/newsletter-welcome';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import { newsletterSignupSchema } from '@/src/lib/schemas/newsletter.schema';
import { emailSequenceService } from '@/src/lib/services/email-sequence.service';
import { resendService } from '@/src/lib/services/resend.service';

/**
 * Newsletter signup server action
 *
 * Features:
 * - Rate limited: 5 requests per 300 seconds (5 minutes) per IP to prevent spam
 * - Automatic Zod validation for email format
 * - Centralized error handling and logging via middleware
 * - Type-safe with full TypeScript inference
 * - Idempotent: duplicate signups return success
 *
 * Usage:
 * ```tsx
 * const result = await subscribeToNewsletter({
 *   email: 'user@example.com',
 *   source: 'footer'
 * });
 *
 * if (result?.data?.success) {
 *   toast.success('Subscribed!');
 * } else {
 *   toast.error(result?.serverError || 'Failed to subscribe');
 * }
 * ```
 *
 * Rate Limit: 5 signups per 5 minutes per IP
 * - Stricter than default (100 req/60s) to prevent newsletter spam
 * - Allows legitimate retries while blocking abuse
 */
export const subscribeToNewsletter = rateLimitedAction
  .metadata({
    actionName: 'subscribeToNewsletter',
    category: 'form',
    rateLimit: {
      maxRequests: 5,
      windowSeconds: 300, // 5 minutes
    },
  })
  .schema(newsletterSignupSchema)
  .action(async ({ parsedInput: { email, source, referrer } }) => {
    // Check if Resend service is enabled
    if (!resendService.isEnabled()) {
      return {
        success: false,
        message: 'Newsletter service is currently unavailable',
      };
    }

    // Subscribe via Resend
    const metadata: { source?: string; referrer?: string } = {};
    if (source) metadata.source = source;
    if (referrer) metadata.referrer = referrer;

    const result = await resendService.subscribe(email, metadata);

    // If subscription successful, send welcome email and enroll in sequence
    if (result.success) {
      // Send welcome email asynchronously (don't block on email send)
      // If email fails, subscription still succeeded
      resendService
        .sendEmail(
          email,
          'Welcome to ClaudePro Directory! 🎉',
          NewsletterWelcome({ email, ...(source && { source }) }),
          {
            tags: [
              { name: 'template', value: 'newsletter_welcome' },
              { name: 'source', value: source || 'unknown' },
            ],
          }
        )
        .then((emailResult) => {
          if (emailResult.success) {
            logger.info('Welcome email sent successfully', {
              email,
              ...(emailResult.emailId && { emailId: emailResult.emailId }),
              ...(source && { source }),
            });

            // Enroll in onboarding sequence (async, don't block)
            emailSequenceService.enrollInSequence(email).catch((seqError) => {
              logger.error('Failed to enroll in sequence', seqError instanceof Error ? seqError : undefined, {
                email,
              });
            });
          } else {
            logger.error('Failed to send welcome email', undefined, {
              email,
              ...(emailResult.error && { error: emailResult.error }),
              ...(source && { source }),
            });
          }
        })
        .catch((error) => {
          logger.error('Welcome email send error', error instanceof Error ? error : undefined, {
            email,
            ...(source && { source }),
          });
        });

      return {
        success: true,
        message: result.message,
        contactId: result.contactId,
      };
    }

    // Return error response
    return {
      success: false,
      message: result.message,
      error: result.error,
    };
  });
