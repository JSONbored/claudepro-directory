'use server';

import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { postCopyEmailCaptureSchema } from '@/src/lib/schemas/email-capture.schema';
import { emailOrchestrationService } from '@/src/lib/services/email-orchestration.server';

/**
 * Post-Copy Email Capture Server Action
 * SHA-3151: Refactored to use unified email orchestration service
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
 * - Full orchestration: subscription + welcome email + sequence enrollment
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
    actionName: 'postCopyEmailCapture',
    category: 'form',
  })
  .schema(postCopyEmailCaptureSchema)
  .action(
    async ({ parsedInput: { email, source, referrer, copyType, copyCategory, copySlug } }) => {
      // Use unified orchestration service with copy analytics
      return await emailOrchestrationService.subscribeWithOrchestration({
        email,
        metadata: {
          ...(source && { source }),
          ...(referrer && { referrer }),
          ...(copyType && { copyType }),
          ...(copyCategory && { copyCategory }),
          ...(copySlug && { copySlug }),
        },
        includeCopyAnalytics: true,
        logContext: ' (post-copy)',
      });
    }
  );
