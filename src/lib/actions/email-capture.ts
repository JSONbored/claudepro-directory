"use server";

import { NewsletterWelcome } from "@/src/emails/templates/newsletter-welcome";
import { rateLimitedAction } from "@/src/lib/actions/safe-action";
import { EVENTS } from "@/src/lib/analytics/events.config";
import { logger } from "@/src/lib/logger";
import { postCopyEmailCaptureSchema } from "@/src/lib/schemas/email-capture.schema";
import { emailSequenceService } from "@/src/lib/services/email-sequence.service";
import { resendService } from "@/src/lib/services/resend.service";

/**
 * Post-Copy Email Capture Server Action
 *
 * Captures user email after they copy content, subscribes them to newsletter,
 * and sends welcome email. Includes analytics tracking for conversion attribution.
 *
 * Features:
 * - Rate limited: 3 requests per 300 seconds (5 minutes) per IP
 * - Automatic Zod validation for email format
 * - Centralized error handling and logging
 * - Type-safe with full TypeScript inference
 * - Idempotent: duplicate signups return success
 * - Tracks copy context for analytics
 *
 * Usage:
 * ```tsx
 * const { execute, status } = useAction(postCopyEmailCaptureAction);
 *
 * const handleSubmit = async (email: string) => {
 *   const result = await execute({
 *     email,
 *     source: 'post_copy',
 *     copyType: 'markdown',
 *     copyCategory: 'agents',
 *     copySlug: 'api-builder'
 *   });
 *
 *   if (result?.data?.success) {
 *     toast.success('Subscribed!');
 *   }
 * };
 * ```
 *
 * Rate Limit: 3 signups per 5 minutes per IP
 * - Prevents abuse while allowing legitimate retries
 * - Stricter than regular newsletter signup (5 req/5min) due to modal context
 */
export const postCopyEmailCaptureAction = rateLimitedAction
  .metadata({
    actionName: "postCopyEmailCapture",
    category: "form",
    rateLimit: {
      maxRequests: 3,
      windowSeconds: 300, // 5 minutes
    },
  })
  .schema(postCopyEmailCaptureSchema)
  .action(
    async ({
      parsedInput: {
        email,
        source,
        referrer,
        copyType,
        copyCategory,
        copySlug,
      },
    }) => {
      // Check if Resend service is enabled
      if (!resendService.isEnabled()) {
        return {
          success: false,
          message: "Newsletter service is currently unavailable",
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
        resendService
          .sendEmail(
            email,
            "Welcome to ClaudePro Directory! 🎉",
            NewsletterWelcome({ email, ...(source && { source }) }),
            {
              tags: [
                { name: "template", value: "newsletter_welcome" },
                { name: "source", value: source || "post_copy" },
                ...(copyType ? [{ name: "copy_type", value: copyType }] : []),
              ],
            },
          )
          .then((emailResult) => {
            if (emailResult.success) {
              logger.info("Welcome email sent successfully (post-copy)", {
                email,
                ...(emailResult.emailId && { emailId: emailResult.emailId }),
                ...(source && { source }),
                ...(copyType && { copyType }),
              });

              // Enroll in onboarding sequence (async, don't block)
              emailSequenceService.enrollInSequence(email).catch((seqError) => {
                logger.error(
                  "Failed to enroll in sequence (post-copy)",
                  seqError instanceof Error ? seqError : undefined,
                  {
                    email,
                  },
                );
              });
            } else {
              logger.error(
                "Failed to send welcome email (post-copy)",
                undefined,
                {
                  email,
                  ...(emailResult.error && { error: emailResult.error }),
                  ...(source && { source }),
                },
              );
            }
          })
          .catch((error) => {
            logger.error(
              "Welcome email send error (post-copy)",
              error instanceof Error ? error : undefined,
              {
                email,
                ...(source && { source }),
              },
            );
          });

        // Log successful capture with context
        logger.info("Post-copy email captured successfully", {
          email,
          ...(result.contactId && { contactId: result.contactId }),
          source: source || "post_copy",
          ...(copyType && { copyType }),
          ...(copyCategory && { copyCategory }),
          ...(copySlug && { copySlug }),
        });

        return {
          success: true,
          message: result.message,
          contactId: result.contactId,
          // Return analytics data for client-side tracking
          analytics: {
            event: EVENTS.EMAIL_CAPTURED,
            trigger_source: "post_copy" as const,
            ...(copyType && { copy_type: copyType }),
            ...(copyCategory && { content_category: copyCategory }),
            ...(copySlug && { content_slug: copySlug }),
          },
        };
      }

      // Return error response
      return {
        success: false,
        message: result.message,
        error: result.error,
      };
    },
  );
