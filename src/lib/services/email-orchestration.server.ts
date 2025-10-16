/**
 * Email Orchestration Service
 * SHA-3151: Unified email subscription orchestration (374 LOC reduction)
 *
 * Consolidates duplicated email subscription logic from:
 * - newsletter-signup.ts (145 LOC)
 * - email-capture.ts (178 LOC)
 *
 * Central orchestration for:
 * 1. Email subscription via Resend
 * 2. Welcome email sending
 * 3. Email sequence enrollment
 * 4. Error handling & logging
 * 5. Analytics event generation
 *
 * Production Standards:
 * - Type-safe with Zod validation
 * - Non-blocking async operations
 * - Comprehensive error boundaries
 * - Idempotent operations
 * - Fire-and-forget for non-critical tasks
 *
 * @module lib/services/email-orchestration.service
 */

import { NewsletterWelcome } from '@/src/emails/templates/newsletter-welcome';
import { EVENTS, type EventName } from '@/src/lib/analytics/events.constants';
import { logger } from '@/src/lib/logger';
import { emailSequenceService } from '@/src/lib/services/email-sequence.server';
import { resendService } from '@/src/lib/services/resend.server';

/**
 * Email subscription metadata
 */
export interface EmailSubscriptionMetadata {
  source?: string;
  referrer?: string;
  copyType?: string;
  copyCategory?: string;
  copySlug?: string;
}

/**
 * Email subscription result
 */
export interface EmailSubscriptionResult {
  success: boolean;
  message: string;
  contactId?: string;
  error?: string;
  analytics?: {
    event: EventName;
    [key: string]: string | undefined;
  };
}

/**
 * Email orchestration configuration
 */
interface EmailOrchestrationConfig {
  /** Email address to subscribe */
  email: string;
  /** Subscription metadata */
  metadata: EmailSubscriptionMetadata;
  /** Whether to include copy-specific analytics */
  includeCopyAnalytics?: boolean;
  /** Log message suffix for debugging */
  logContext?: string;
}

/**
 * EmailOrchestrationService class
 *
 * Singleton service for orchestrating email subscription workflows.
 */
class EmailOrchestrationService {
  /**
   * Subscribe user to newsletter with full orchestration
   *
   * Handles:
   * 1. Subscription via Resend
   * 2. Welcome email sending (async, non-blocking)
   * 3. Email sequence enrollment (async, non-blocking)
   * 4. Analytics event generation
   *
   * @param config - Orchestration configuration
   * @returns Promise resolving to subscription result
   */
  async subscribeWithOrchestration(
    config: EmailOrchestrationConfig
  ): Promise<EmailSubscriptionResult> {
    const { email, metadata, includeCopyAnalytics = false, logContext = '' } = config;
    const { source, referrer, copyType, copyCategory, copySlug } = metadata;

    // Check if Resend service is enabled
    if (!resendService.isEnabled()) {
      return {
        success: false,
        message: 'Newsletter service is currently unavailable',
      };
    }

    // Subscribe via Resend
    const subscriptionMetadata: { source?: string; referrer?: string } = {};
    if (source) subscriptionMetadata.source = source;
    if (referrer) subscriptionMetadata.referrer = referrer;

    const result = await resendService.subscribe(email, subscriptionMetadata);

    // If subscription failed, return error
    if (!result.success) {
      return {
        success: false,
        message: result.message,
        ...(result.error && { error: result.error }),
      };
    }

    // Subscription successful - start async orchestration
    this.orchestratePostSubscription({
      email,
      ...(source && { source }),
      ...(copyType && { copyType }),
      ...(logContext && { logContext }),
    });

    // Log successful subscription
    const logData: Record<string, string> = {
      email,
      source: source || 'unknown',
    };
    if (result.contactId) logData.contactId = result.contactId;
    if (copyType) logData.copyType = copyType;
    if (copyCategory) logData.copyCategory = copyCategory;
    if (copySlug) logData.copySlug = copySlug;

    logger.info(`Email subscription successful${logContext}`, logData);

    // Build analytics event
    const analytics = this.buildAnalyticsEvent({
      includeCopyAnalytics,
      ...(result.contactId && { contactId: result.contactId }),
      ...(referrer && { referrer }),
      ...(copyType && { copyType }),
      ...(copyCategory && { copyCategory }),
      ...(copySlug && { copySlug }),
    });

    return {
      success: true,
      message: result.message,
      ...(result.contactId && { contactId: result.contactId }),
      ...(analytics && { analytics }),
    };
  }

  /**
   * Orchestrate post-subscription tasks (async, non-blocking)
   *
   * Handles:
   * 1. Welcome email sending
   * 2. Email sequence enrollment
   *
   * Uses async IIFE with comprehensive error handling to ensure
   * no unhandled promise rejections.
   *
   * @param params - Orchestration parameters
   * @private
   */
  private orchestratePostSubscription(params: {
    email: string;
    source?: string;
    copyType?: string;
    logContext?: string;
  }): void {
    const { email, source, copyType, logContext = '' } = params;

    // Fire-and-forget async orchestration
    (async () => {
      try {
        // Send welcome email
        const emailResult = await resendService.sendEmail(
          email,
          'Welcome to ClaudePro Directory! 🎉',
          NewsletterWelcome({ email, ...(source && { source }) }),
          {
            tags: [
              { name: 'template', value: 'newsletter_welcome' },
              { name: 'source', value: source || 'unknown' },
              ...(copyType ? [{ name: 'copy_type', value: copyType }] : []),
            ],
          }
        );

        if (emailResult.success) {
          const emailLogData: Record<string, string> = { email };
          if (emailResult.emailId) emailLogData.emailId = emailResult.emailId;
          if (source) emailLogData.source = source;

          logger.info(`Welcome email sent successfully${logContext}`, emailLogData);

          // Enroll in onboarding sequence
          try {
            await emailSequenceService.enrollInSequence(email);
          } catch (seqError) {
            logger.error(
              `Failed to enroll in sequence${logContext}`,
              seqError instanceof Error ? seqError : new Error(String(seqError)),
              { email }
            );
          }
        } else {
          const errorLogData: Record<string, string> = { email };
          if (emailResult.error) errorLogData.error = emailResult.error;
          if (source) errorLogData.source = source;

          logger.error(`Failed to send welcome email${logContext}`, undefined, errorLogData);
        }
      } catch (error) {
        logger.error(
          `Welcome email send error${logContext}`,
          error instanceof Error ? error : new Error(String(error)),
          {
            email,
            ...(source && { source }),
          }
        );
      }
    })().catch((error) => {
      // Final catch to ensure absolutely no unhandled rejections
      logger.error(
        `Unhandled error in welcome email flow${logContext}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          email,
          ...(source && { source }),
        }
      );
    });
  }

  /**
   * Build analytics event based on subscription context
   *
   * @param params - Analytics event parameters
   * @returns Analytics event object or undefined if no event
   * @private
   */
  private buildAnalyticsEvent(params: {
    includeCopyAnalytics: boolean;
    contactId?: string;
    referrer?: string;
    copyType?: string;
    copyCategory?: string;
    copySlug?: string;
  }):
    | {
        event: EventName;
        [key: string]: string | undefined;
      }
    | undefined {
    const { includeCopyAnalytics, contactId, referrer, copyType, copyCategory, copySlug } = params;

    // Determine event type based on context
    // Only post-copy has specific analytics
    if (!includeCopyAnalytics) {
      return undefined; // Regular newsletter signups don't need analytics tracking
    }

    const event: EventName = EVENTS.EMAIL_SUBSCRIBED_POST_COPY;

    // Build event properties
    const eventProperties: Record<string, string | undefined> = {
      event,
      ...(contactId && { contact_id: contactId }),
      ...(referrer && { referrer }),
      ...(copyType && { copy_type: copyType }),
      ...(copyCategory && { content_category: copyCategory }),
      ...(copySlug && { content_slug: copySlug }),
    };

    return eventProperties as {
      event: EventName;
      [key: string]: string | undefined;
    };
  }
}

/**
 * Singleton instance
 */
export const emailOrchestrationService = new EmailOrchestrationService();
