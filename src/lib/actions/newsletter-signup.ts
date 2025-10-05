'use server';

import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { newsletterSignupSchema } from '@/src/lib/schemas/newsletter.schema';
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

    // Return structured response
    if (result.success) {
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
