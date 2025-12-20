'use server';

import { z } from 'zod';
import type { newsletter_source } from '@prisma/client';
import { rateLimitedAction } from './safe-action.ts';
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
