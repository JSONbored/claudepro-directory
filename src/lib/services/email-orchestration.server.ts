/**
 * Email Orchestration Service - Database-First Architecture
 * Handles subscription via Resend, welcome email, sequence enrollment. Non-blocking async.
 */

import { NewsletterWelcome } from '@/src/emails/templates/newsletter-welcome';
import { logger } from '@/src/lib/logger';
import { enrollInSequence } from '@/src/lib/services/email-sequence.server';
import { resendService } from '@/src/lib/services/resend.server';

export interface EmailSubscriptionMetadata {
  source?: string;
  referrer?: string;
  copyType?: string;
  copyCategory?: string;
  copySlug?: string;
}

export interface EmailSubscriptionResult {
  success: boolean;
  message: string;
  contactId?: string;
  error?: string;
  analytics?: {
    event: string;
    [key: string]: string | undefined;
  };
}

interface EmailOrchestrationConfig {
  email: string;
  metadata: EmailSubscriptionMetadata;
  includeCopyAnalytics?: boolean;
  logContext?: string;
}

class EmailOrchestrationService {
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
            await enrollInSequence(email);
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

  private buildAnalyticsEvent(params: {
    includeCopyAnalytics: boolean;
    contactId?: string;
    referrer?: string;
    copyType?: string;
    copyCategory?: string;
    copySlug?: string;
  }):
    | {
        event: string;
        [key: string]: string | undefined;
      }
    | undefined {
    const { includeCopyAnalytics, contactId, referrer, copyType, copyCategory, copySlug } = params;

    // Determine event type based on context
    // Only post-copy has specific analytics
    if (!includeCopyAnalytics) {
      return undefined; // Regular newsletter signups don't need analytics tracking
    }

    const event = 'email_subscribed_post_copy';

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
      event: string;
      [key: string]: string | undefined;
    };
  }
}

export const emailOrchestrationService = new EmailOrchestrationService();
