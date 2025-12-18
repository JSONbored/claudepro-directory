/**
 * Newsletter Subscribe Inngest Function
 *
 * Handles newsletter subscription:
 * 1. Validates email
 * 2. Syncs contact to Resend
 * 3. Creates/updates subscription in database
 * 4. Invalidates cache
 * 5. Sends welcome email
 * 6. Enrolls in onboarding sequence
 */

import type {
  newsletter_source,
  copy_type,
  content_category,
} from '@heyclaude/data-layer/prisma';
import type {
  newsletter_sync_status,
} from '@heyclaude/database-types/prisma';
import {
  NewsletterSource,
  ContentCategory,
} from '@heyclaude/data-layer/prisma';
import {
  copy_type as CopyTypeEnum,
} from '@heyclaude/database-types/prisma';
import type { SubscribeNewsletterArgs } from '@heyclaude/database-types/postgres-types';
// NewsletterService methods accessed via getService('newsletter')
import { validateEmail, normalizeError } from '@heyclaude/shared-runtime';
import { revalidateTag } from 'next/cache';

import { inngest } from '../../client';
import { renderEmailTemplate } from '../../../email/base-template';
import { NewsletterWelcome } from '../../../email/templates/newsletter-welcome';
import { HELLO_FROM } from '../../../email/config/email-config';
import {
  syncContactToResend,
  buildContactProperties,
  resolveNewsletterInterest,
  sendEmail,
  enrollInOnboardingSequence,
} from '../../../integrations/resend';
import { logger, createWebAppContextWithId } from '../../../logging/server';

/**
 * Newsletter subscribe function
 *
 * This function handles the full newsletter subscription flow:
 * - Validates the email
 * - Syncs the contact to Resend
 * - Creates/updates the subscription in the database
 * - Sends a welcome email
 * - Enrolls the user in the onboarding sequence
 */
export const subscribeNewsletter = inngest.createFunction(
  {
    id: 'email-subscribe',
    name: 'Newsletter Subscribe',
    retries: 3,
    // Idempotency: Use email to prevent duplicate subscriptions
    // Same email will only be processed once (source changes don't matter for deduplication)
    idempotency: 'event.data.email',
  },
  { event: 'email/subscribe' },
  async ({ event, step }) => {
    const startTime = Date.now();
    const logContext = createWebAppContextWithId('/inngest/email/subscribe', 'subscribeNewsletter');

    const { email, source, referrer, copyType, copyCategory, copySlug } = event.data;

    // Step 1: Validate email
    const validatedEmail = await step.run('validate-email', async () => {
      const emailValidation = validateEmail(email);
      if (!(emailValidation.valid && emailValidation.normalized)) {
        throw new Error(emailValidation.error ?? 'Valid email address is required');
      }
      return emailValidation.normalized;
    });

    logger.info({ ...logContext,
      email: validatedEmail, // Auto-hashed by pino redaction config
      source: source ?? null,
      copyCategory: copyCategory ?? null, }, 'Newsletter subscription started');

    // Step 2: Resolve newsletter interest and build contact properties
    const { contactProperties, primaryInterest } = await step.run(
      'build-contact-properties',
      async () => {
        const interest = resolveNewsletterInterest(copyCategory ?? null);
        const properties = buildContactProperties({
          source: source ?? null,
          ...(copyType ? { copyType } : {}),
          ...(referrer ? { referrer } : {}),
          primaryInterest: interest,
        });
        return { contactProperties: properties, primaryInterest: interest };
      }
    );

    // Step 3: Sync contact to Resend
    const syncResult = await step.run('sync-to-resend', async (): Promise<{
      resendContactId: string | null;
      syncStatus: newsletter_sync_status;
      syncError: string | null;
      topicIds: string[];
    }> => {
      try {
        return await syncContactToResend(
          validatedEmail,
          contactProperties,
          source ?? null,
          copyCategory ?? null
        );
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to sync contact to Resend');
        logger.warn({ ...logContext,
          errorMessage: normalized.message, }, 'Resend sync failed, continuing with subscription');
        return {
          resendContactId: null,
          syncStatus: 'failed',
          syncError: normalized.message,
          topicIds: [],
        };
      }
    });

    // Step 4: Create/update subscription in database
    const subscription = await step.run('create-subscription', async (): Promise<{
      subscriptionId: string;
      wasResubscribed: boolean;
    }> => {
      const { getService } = await import('../../../data/service-factory');
      const newsletterService = await getService('newsletter');

      const newsletterSourceValues = Object.values(NewsletterSource) as readonly newsletter_source[];
      const copyTypeValues = Object.values(CopyTypeEnum) as readonly copy_type[];
      const contentCategoryValues = Object.values(ContentCategory) as readonly content_category[];

      const isValidNewsletterSource = (
        value: string | null | undefined
      ): value is newsletter_source => {
        if (!value) return false;
        return newsletterSourceValues.includes(value as newsletter_source);
      };

      const isValidCopyType = (
        value: string | null | undefined
      ): value is copy_type => {
        if (!value) return false;
        return copyTypeValues.includes(value as copy_type);
      };

      const isValidContentCategory = (
        value: string | null | undefined
      ): value is content_category => {
        if (!value) return false;
        return contentCategoryValues.includes(value as content_category);
      };

      const getNumberProperty = (obj: Record<string, string | number>, key: string): number => {
        const value = obj[key];
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const parsed = Number(value);
          return Number.isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      const finalSource: newsletter_source =
        isValidNewsletterSource(source) ? source : 'footer';

      // Build rpcArgs object, only including properties with values (for exactOptionalPropertyTypes)
      const rpcArgs: SubscribeNewsletterArgs = {
        p_email: validatedEmail,
        p_source: finalSource,
        p_sync_status: syncResult['syncStatus'] as newsletter_sync_status,
        p_engagement_score: getNumberProperty(contactProperties, 'engagement_score'),
        p_primary_interest: primaryInterest,
        p_total_copies: getNumberProperty(contactProperties, 'total_copies'),
        p_last_active_at: new Date().toISOString(),
      };
      
      // Only add optional properties if they have values
      if (referrer) { rpcArgs.p_referrer = referrer; }
      if (copyType && isValidCopyType(copyType)) { rpcArgs.p_copy_type = copyType; }
      if (copyCategory && isValidContentCategory(copyCategory)) { rpcArgs.p_copy_category = copyCategory; }
      if (copySlug) { rpcArgs.p_copy_slug = copySlug; }
      if (syncResult['resendContactId']) { rpcArgs.p_resend_contact_id = syncResult['resendContactId'] as string; }
      if (syncResult['syncError']) { rpcArgs.p_sync_error = syncResult['syncError'] as string; }
      if (syncResult['topicIds'] && Array.isArray(syncResult['topicIds']) && syncResult['topicIds'].length > 0) { 
        rpcArgs.p_resend_topics = syncResult['topicIds'] as string[]; 
      }

      const rpcResult = await newsletterService.subscribeNewsletter(rpcArgs);

      if (!(rpcResult && rpcResult.success)) {
        throw new Error(rpcResult?.error ?? 'Subscription failed');
      }

      const subscriptionId = rpcResult.subscription_id;
      if (!subscriptionId) {
        throw new Error('Subscription succeeded but no subscription ID returned');
      }

      // Verify subscription was created
      const subscriptionData = await newsletterService.getSubscriptionById(subscriptionId);
      if (!subscriptionData) {
        throw new Error('Subscription succeeded but failed to fetch subscription data');
      }

      return {
        subscriptionId,
        wasResubscribed: rpcResult.was_resubscribed ?? false,
      };
    });

    // Step 5: Invalidate cache
    await step.run('invalidate-cache', async () => {
      try {
        revalidateTag('newsletter', 'default');
        logger.info({ ...logContext,
          tag: 'newsletter', }, 'Cache invalidated');
      } catch (error) {
        const normalized = normalizeError(error, 'Cache invalidation failed');
        logger.warn({ ...logContext,
          errorMessage: normalized.message, }, 'Cache invalidation failed');
      }
    });

    // Step 6: Send welcome email
    const welcomeEmailResult = await step.run('send-welcome-email', async (): Promise<{
      sent: boolean;
      emailId: string | null;
    }> => {
      try {
        const html = await renderEmailTemplate(NewsletterWelcome, {
          email: validatedEmail,
        });

        const { data: emailData, error: emailError } = await sendEmail(
          {
            from: HELLO_FROM,
            to: validatedEmail,
            subject: 'Welcome to Claude Pro Directory! 🎉',
            html,
            tags: [{ name: 'type', value: 'newsletter' }],
          },
          'Resend welcome email send timed out'
        );

        if (emailError) {
          logger.warn({ ...logContext,
            subscriptionId: subscription.subscriptionId,
            errorMessage: emailError.message, }, 'Welcome email failed');
          return { sent: false, emailId: null };
        }

        return { sent: true, emailId: emailData?.id ?? null };
      } catch (error) {
        const normalized = normalizeError(error, 'Welcome email failed');
        logger.warn({ ...logContext,
          errorMessage: normalized.message, }, 'Welcome email failed');
        return { sent: false, emailId: null };
      }
    });

    // Step 7: Enroll in onboarding sequence (only if welcome email was sent)
    if (welcomeEmailResult.sent) {
      await step.run('enroll-onboarding', async () => {
        try {
          await enrollInOnboardingSequence(validatedEmail);
          logger.info({ ...logContext,
            email: validatedEmail, }, 'Enrolled in onboarding sequence');
        } catch (error) {
          const normalized = normalizeError(error, 'Onboarding enrollment failed');
          logger.warn({ ...logContext,
            errorMessage: normalized.message, }, 'Onboarding enrollment failed');
        }
      });
    }

    const durationMs = Date.now() - startTime;
    logger.info({ ...logContext,
      durationMs,
      subscriptionId: subscription.subscriptionId,
      resendContactId: String(syncResult['resendContactId'] ?? ''),
      syncStatus: String(syncResult['syncStatus'] ?? ''),
      emailSent: welcomeEmailResult.sent,
      emailId: welcomeEmailResult.emailId, }, 'Newsletter subscription completed');

    return {
      success: true,
      subscriptionId: subscription.subscriptionId,
      email: validatedEmail,
      resendContactId: syncResult['resendContactId'],
      syncStatus: syncResult['syncStatus'],
      emailSent: welcomeEmailResult.sent,
      emailId: welcomeEmailResult.emailId,
    };
  }
);
