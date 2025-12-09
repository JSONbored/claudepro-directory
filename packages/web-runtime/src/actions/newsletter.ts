'use server';

import { z } from 'zod';
import type { Database } from '@heyclaude/database-types';
import { rateLimitedAction } from './safe-action.ts';
import { logger, createWebAppContextWithId } from '../logging/server.ts';

// Newsletter source enum from database types
type NewsletterSource = Database['public']['Enums']['newsletter_source'];

// Email validation schema (reusable)
const emailSchema = z.string().email({ message: 'Invalid email address' });

// Schema definitions (defined outside action chain for Next.js compatibility)
const getNewsletterCountSchema = z.object({});

const subscribeSchema = z.object({
  email: emailSchema,
  source: z.string() as z.ZodType<NewsletterSource>,
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
    const logContext = createWebAppContextWithId('action', 'subscribeNewsletterAction');
    
    const normalizedEmail = parsedInput.email.toLowerCase().trim();
    
    logger.info('Newsletter subscription requested', {
      ...logContext,
      source: parsedInput.source,
    });

    try {
      // Send event to Inngest for durable processing
      const { inngest } = await import('../inngest/client.ts');
      
      await inngest.send({
        name: 'email/subscribe',
        data: {
          email: normalizedEmail,
          source: parsedInput.source,
          referrer: parsedInput.metadata?.referrer,
          metadata: parsedInput.metadata,
        },
      });

      logger.info('Newsletter subscription event sent to Inngest', {
        ...logContext,
        source: parsedInput.source,
      });

      return { 
        success: true,
        message: 'Subscription request received',
      };
    } catch (error) {
      const { normalizeError } = await import('../errors.ts');
      const normalized = normalizeError(error, 'Newsletter subscription failed');
      
      logger.error('Newsletter subscription failed', normalized, logContext);
      
      throw new Error('Failed to process subscription. Please try again.');
    }
  });

/**
 * Subscribe via OAuth callback (after user signs in)
 * Uses Inngest for reliable processing
 */
export const subscribeViaOAuthAction = rateLimitedAction
  .inputSchema(subscribeViaOAuthSchema)
  .metadata({ actionName: 'newsletter.subscribeViaOAuth', category: 'form' })
  .action(async ({ parsedInput }) => {
    const logContext = createWebAppContextWithId('action', 'subscribeViaOAuthAction');
    
    const normalizedEmail = parsedInput.email.toLowerCase().trim();

    logger.info('OAuth newsletter subscription requested', {
      ...logContext,
      triggerSource: parsedInput.metadata?.trigger_source,
    });

    try {
      const { inngest } = await import('../inngest/client.ts');
      
      await inngest.send({
        name: 'email/subscribe',
        data: {
          email: normalizedEmail,
          source: 'oauth_signup' as NewsletterSource,
          referrer: parsedInput.metadata?.referrer,
          metadata: {
            trigger_source: parsedInput.metadata?.trigger_source,
          },
        },
      });

      logger.info('OAuth subscription event sent to Inngest', logContext);

      return { success: true };
    } catch (error) {
      const { normalizeError } = await import('../errors.ts');
      const normalized = normalizeError(error, 'OAuth subscription failed');
      
      logger.error('OAuth subscription failed', normalized, logContext);
      
      throw new Error('Failed to process subscription. Please try again.');
    }
  });
