'use server';

import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { newsletterSignupSchema } from '@/src/lib/schemas/newsletter.schema';
import { emailOrchestrationService } from '@/src/lib/services/email-orchestration.server';

/**
 * Newsletter signup server action
 * SHA-3151: Refactored to use unified email orchestration service
 *
 * Features:
 * - Rate limited: 5 requests per 300 seconds (5 minutes) per IP to prevent spam
 * - Automatic Zod validation for email format
 * - Centralized error handling and logging via middleware
 * - Type-safe with full TypeScript inference
 * - Idempotent: duplicate signups return success
 * - Full orchestration: subscription + welcome email + sequence enrollment
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
    // Use unified orchestration service
    return await emailOrchestrationService.subscribeWithOrchestration({
      email,
      metadata: {
        ...(source && { source }),
        ...(referrer && { referrer }),
      },
      includeCopyAnalytics: false,
      logContext: ' (newsletter)',
    });
  });
