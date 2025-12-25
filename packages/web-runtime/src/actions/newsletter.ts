'use server';

import { z } from 'zod';
import type { newsletter_source } from '@prisma/client';
import { rateLimitedAction, authedAction } from './safe-action.ts';
import { newsletter_sourceSchema } from '../prisma-zod-schemas.ts';

// Email validation schema (reusable)
const emailSchema = z.string().email({ message: 'Invalid email address' });

// Schema definitions
const getNewsletterCountSchema = z.object({});

const subscribeSchema = z.object({
  email: emailSchema,
  source: newsletter_sourceSchema,
  metadata: z
    .object({
      referrer: z.string().optional(),
      trigger_source: z.string().optional(),
      copy_type: z.string().optional(),
      copy_category: z.string().optional(),
      copy_slug: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

const subscribeViaOAuthSchema = z.object({
  email: emailSchema,
  metadata: z
    .object({
      referrer: z.string().optional(),
      trigger_source: z.enum(['auth_callback']).optional(),
    })
    .optional(),
});

export const getNewsletterCountAction = rateLimitedAction
  .inputSchema(getNewsletterCountSchema)
  .metadata({ actionName: 'newsletter.getCount', category: 'analytics' })
  .action(async () => {
    const { getNewsletterSubscriberCount } = await import('../data/newsletter.ts');
    const count = await getNewsletterSubscriberCount();
    return count ?? null;
  });

/**
 * Shared helper for newsletter subscription via Inngest
 */
async function subscribeToNewsletter(
  email: string,
  source: newsletter_source,
  metadata?: Record<string, unknown>
) {
  const { inngest } = await import('../inngest/client.ts');

  await inngest.send({
    name: 'email/subscribe',
    data: {
      email: email.toLowerCase().trim(),
      source,
      referrer: metadata?.['referrer'] as string | undefined,
      metadata,
    },
  });
}

/**
 * Subscribe to newsletter via Inngest
 *
 * This action sends an event to Inngest which handles:
 * - Adding to Resend audience
 * - Database subscription record
 * - Welcome email
 * - Drip campaign enrollment
 */
export const subscribeNewsletterAction = rateLimitedAction
  .inputSchema(subscribeSchema)
  .metadata({ actionName: 'newsletter.subscribe', category: 'form' })
  .action(async ({ parsedInput }) => {
    await subscribeToNewsletter(parsedInput.email, parsedInput.source, parsedInput.metadata);

    return {
      success: true,
      message: 'Subscription request received',
    };
  });

/**
 * Subscribe via OAuth callback (after user signs in)
 * Uses Inngest for reliable processing
 */
export const subscribeViaOAuthAction = rateLimitedAction
  .inputSchema(subscribeViaOAuthSchema)
  .metadata({ actionName: 'newsletter.subscribeViaOAuth', category: 'form' })
  .action(async ({ parsedInput }) => {
    await subscribeToNewsletter(parsedInput.email, 'oauth_signup', {
      trigger_source: parsedInput.metadata?.trigger_source,
      referrer: parsedInput.metadata?.referrer,
    });

    return { success: true };
  });

/**
 * Update newsletter topic preferences
 *
 * Allows users to opt-in or opt-out of specific topics.
 * Topic IDs are validated in the action handler to avoid circular dependencies.
 */
const updateTopicPreferencesSchema = z.object({
  topicIds: z.array(z.string()).min(0),
  optIn: z.boolean(),
});

export const updateTopicPreferencesAction = authedAction
  .inputSchema(updateTopicPreferencesSchema)
  .metadata({ actionName: 'newsletter.updateTopicPreferences', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    const { getResendClient } = await import('../integrations/resend');
    const { getNewsletterSubscriptionByEmail } = await import('../data/newsletter');
    const { logger, normalizeError } = await import('../logging/server');

    // Use auth context from authedAction (ctx.userEmail is guaranteed)
    const userEmail = ctx.userEmail;

    if (!userEmail) {
      throw new Error('User email is required');
    }

    // Get subscription
    const subscription = await getNewsletterSubscriptionByEmail(userEmail);
    if (!subscription) {
      throw new Error('Newsletter subscription not found');
    }

    if (!subscription.resend_contact_id) {
      throw new Error('Resend contact ID not found. Please contact support.');
    }

    // Validate topic IDs
    const { validateTopicIds, RESEND_TOPIC_IDS } = await import('../integrations/resend');
    if (!validateTopicIds(parsedInput.topicIds)) {
      throw new Error(
        `Invalid topic IDs. Valid topic IDs are: ${Object.values(RESEND_TOPIC_IDS).join(', ')}`
      );
    }

    // Update topics via Resend API
    const resend = getResendClient();
    const logContext = {
      module: 'actions/newsletter',
      operation: 'updateTopicPreferences',
      email: userEmail,
      contactId: subscription.resend_contact_id,
    };

    try {
      // Update topics via Resend API
      const updateResponse = await resend.contacts.topics.update({
        id: subscription.resend_contact_id,
        topics: parsedInput.topicIds.map((id) => ({
          id,
          subscription: parsedInput.optIn ? 'opt_in' : 'opt_out',
        })),
      });

      if (updateResponse.error) {
        throw new Error(updateResponse.error.message || 'Failed to update topics');
      }

      // Fetch current topics from Resend to get accurate list of opted-in topics
      const { getContactTopics } = await import('../integrations/resend');
      const currentTopics = await getContactTopics(resend, subscription.resend_contact_id);

      // Sync updated topics back to database
      const { getService } = await import('../data/service-factory');
      const newsletterService = await getService('newsletter');
      await (newsletterService as any).updateResendTopics(userEmail, currentTopics);

      logger.info(
        {
          ...logContext,
          topicCount: parsedInput.topicIds.length,
          optIn: parsedInput.optIn,
          syncedTopics: currentTopics.length,
        },
        'Topic preferences updated and synced to database'
      );

      return { success: true };
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to update topic preferences');
      logger.error({ ...logContext, err: normalized }, 'Failed to update topic preferences');
      throw normalized;
    }
  });

/**
 * Unsubscribe from newsletter
 *
 * Unsubscribes the authenticated user from all newsletter communications.
 */
const unsubscribeSchema = z.object({});

export const unsubscribeFromNewsletterAction = authedAction
  .inputSchema(unsubscribeSchema)
  .metadata({ actionName: 'newsletter.unsubscribe', category: 'user' })
  .action(async ({ ctx }) => {
    const { getResendClient } = await import('../integrations/resend');
    const { getNewsletterSubscriptionByEmail } = await import('../data/newsletter');
    const { logger, normalizeError } = await import('../logging/server');

    // Use auth context from authedAction (ctx.userEmail is guaranteed)
    const userEmail = ctx.userEmail;

    if (!userEmail) {
      throw new Error('User email is required');
    }

    // Get subscription
    const subscription = await getNewsletterSubscriptionByEmail(userEmail);
    if (!subscription) {
      throw new Error('Newsletter subscription not found');
    }

    if (!subscription.resend_contact_id) {
      throw new Error('Resend contact ID not found. Please contact support.');
    }

    const resend = getResendClient();
    const logContext = {
      module: 'actions/newsletter',
      operation: 'unsubscribe',
      email: userEmail,
      contactId: subscription.resend_contact_id,
    };

    try {
      // Unsubscribe in Resend by updating contact's unsubscribed status
      type ResendContactsApi = {
        update: (args: { id: string; unsubscribed?: boolean }) => Promise<{
          data: unknown;
          error: { message?: string } | null;
        }>;
      };

      const contactsApi = resend.contacts as unknown as ResendContactsApi;
      const updateResponse = await contactsApi.update({
        id: subscription.resend_contact_id,
        unsubscribed: true,
      });

      if (updateResponse.error) {
        throw new Error(updateResponse.error.message || 'Failed to unsubscribe');
      }

      // Update database
      const { getService } = await import('../data/service-factory');
      const newsletterService = await getService('newsletter');
      await newsletterService.unsubscribeWithTimestamp(userEmail);

      logger.info(logContext, 'User unsubscribed from newsletter');

      return { success: true };
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to unsubscribe from newsletter');
      logger.error({ ...logContext, err: normalized }, 'Failed to unsubscribe from newsletter');
      throw normalized;
    }
  });
