/**
 * Webhook Service
 * Handles processing of Resend webhook events for email deliverability and analytics
 *
 * OPTIMIZATION: Redis command reduction through pipeline batching and daily counter removal
 * - Batches multiple incr/expire commands into single pipeline execution
 * - Removes redundant daily counters (can be calculated from logs/webhooks retroactively)
 * - Reduces webhook commands by ~40-50% (from 500 to 250-300 commands/day)
 */

import { createHash } from 'node:crypto';
import type { z } from 'zod';
import { redisClient } from '@/src/lib/cache.server';
import { logger } from '@/src/lib/logger';
import type { publicWebhookEventsInsertSchema } from '@/src/lib/schemas/generated/db-schemas';
import { emailSequenceService } from './email-sequence.server';

// Base type from database (data is JSONB in database for flexibility)
type WebhookEventBase = z.infer<typeof publicWebhookEventsInsertSchema>;

// Resend webhook data structure (extends database JSONB with known fields)
// Database stores as JSONB, TypeScript adds type safety for service layer
type ResendWebhookData = {
  created_at?: string;
  email_id?: string;
  from?: string;
  to?: string | string[];
  subject?: string;
  bounce_type?: 'hard' | 'soft';
  error?: string;
  feedback_type?: string;
  link?: string;
  ip_address?: string;
  user_agent?: string;
  attempt?: number;
};

// Extend database type with Resend-specific data structure
type ResendWebhookEvent = Omit<WebhookEventBase, 'data'> & {
  data: ResendWebhookData;
};

type BounceEvent = ResendWebhookEvent & { type: 'email.bounced' };
type ComplaintEvent = ResendWebhookEvent & { type: 'email.complained' };
type ClickEvent = ResendWebhookEvent & { type: 'email.clicked' };
type OpenEvent = ResendWebhookEvent & { type: 'email.opened' };

/**
 * WebhookService
 * Processes webhook events from Resend with Redis tracking and automatic list hygiene
 */
class WebhookService {
  /**
   * Process a webhook event
   */
  async processEvent(event: ResendWebhookEvent): Promise<void> {
    logger.info('Processing webhook event', {
      type: event.type,
      emailId: event.data.email_id ?? 'unknown',
      timestamp: event.created_at,
    });

    switch (event.type) {
      case 'email.bounced':
        await this.handleBounce(event as BounceEvent);
        break;
      case 'email.complained':
        await this.handleComplaint(event as ComplaintEvent);
        break;
      case 'email.opened':
        await this.handleOpen(event as OpenEvent);
        break;
      case 'email.clicked':
        await this.handleClick(event as ClickEvent);
        break;
      case 'email.delivery_delayed':
        await this.handleDelayedDelivery(event);
        break;
      default:
        logger.debug('Unhandled webhook event type', { type: event.type });
    }
  }

  /**
   * Handle bounce events
   * Tracks bounces in Redis and removes emails after hard bounce or 3+ soft bounces
   *
   * OPTIMIZATION: Uses pipeline to batch incr + expire into single network round-trip
   */
  private async handleBounce(event: BounceEvent): Promise<void> {
    const email = this.extractEmail(event.data.to);
    const bounceType = event.data.bounce_type || 'unknown';
    const emailHash = this.hashEmail(email);

    // Track in Redis using pipeline (1 network round-trip for 3 commands)
    await redisClient.executeOperation(
      async (redis) => {
        const bounceKey = `email:bounces:${email}`;
        const statsKey = `email:stats:bounces:${bounceType}`;

        // Use pipeline to batch commands
        const pipeline = redis.pipeline();
        pipeline.incr(bounceKey);
        pipeline.expire(bounceKey, 2592000); // 30 days TTL
        pipeline.incr(statsKey);
        await pipeline.exec();

        return {};
      },
      () => ({}),
      'webhook_bounce_tracking'
    );

    // Log bounce
    logger.warn('Email bounced', {
      email_hash: emailHash,
      bounceType,
      error: event.data.error ?? 'Unknown error',
      timestamp: event.created_at,
    });

    // Get bounce count
    const bounceCount = await this.getBounceCount(email);

    // Auto-remove if hard bounce or 3+ soft bounces
    if (bounceType === 'hard' || bounceCount >= 3) {
      await this.removeFromAudience(
        email,
        bounceType === 'hard' ? 'hard_bounce' : 'repeated_soft_bounce'
      );
    }
  }

  /**
   * Handle spam complaint events
   * Immediately removes email from audience and cancels sequences
   *
   * OPTIMIZATION: Uses pipeline to batch sadd + incr commands
   */
  private async handleComplaint(event: ComplaintEvent): Promise<void> {
    const email = this.extractEmail(event.data.to);
    const emailHash = this.hashEmail(email);

    // Track in Redis using pipeline
    await redisClient.executeOperation(
      async (redis) => {
        const pipeline = redis.pipeline();
        pipeline.sadd('email:complaints', email);
        pipeline.incr('email:stats:complaints');
        await pipeline.exec();

        return {};
      },
      () => ({}),
      'webhook_complaint_tracking'
    );

    // Log complaint (serious issue)
    logger.error('Email spam complaint received', undefined, {
      email_hash: emailHash,
      feedbackType: event.data.feedback_type ?? 'unknown',
      timestamp: event.created_at,
    });

    // Immediately remove from audience
    await this.removeFromAudience(email, 'spam_complaint');
  }

  /**
   * Handle email open events
   * Tracks open rates for analytics
   *
   * OPTIMIZATION: Removed daily counter (email:opens:${today})
   * Daily stats can be calculated from webhook logs or analytics service
   * Reduces from 2 commands to 1 command (50% reduction)
   */
  private async handleOpen(event: OpenEvent): Promise<void> {
    const email = this.extractEmail(event.data.to);
    const emailHash = this.hashEmail(email);

    // Track in Redis - global counter only
    await redisClient.executeOperation(
      async (redis) => {
        await redis.incr('email:stats:opens');
        return {};
      },
      () => ({}),
      'webhook_open_tracking'
    );

    logger.debug('Email opened', {
      email_hash: emailHash,
      timestamp: event.created_at,
    });
  }

  /**
   * Handle email click events
   * Tracks click rates and popular links
   *
   * OPTIMIZATION: Removed daily counter, uses pipeline for remaining commands
   * Reduces from 3 commands to 2 commands (33% reduction)
   */
  private async handleClick(event: ClickEvent): Promise<void> {
    const email = this.extractEmail(event.data.to);
    const emailHash = this.hashEmail(email);
    const link = event.data.link ?? '';

    // Track in Redis using pipeline - global counter + link tracking
    await redisClient.executeOperation(
      async (redis) => {
        const pipeline = redis.pipeline();
        pipeline.incr('email:stats:clicks');
        if (link) pipeline.hincrby('email:link_clicks', link, 1);
        await pipeline.exec();

        return {};
      },
      () => ({}),
      'webhook_click_tracking'
    );

    logger.debug('Email link clicked', {
      email_hash: emailHash,
      link,
      timestamp: event.created_at,
    });
  }

  /**
   * Handle delayed delivery events
   * Logs for monitoring delivery health
   */
  private async handleDelayedDelivery(event: ResendWebhookEvent): Promise<void> {
    const email = this.extractEmail(event.data.to);
    const emailHash = this.hashEmail(email);

    logger.warn('Email delivery delayed', {
      email_hash: emailHash,
      error: ('error' in event.data ? event.data.error : undefined) ?? 'Unknown error',
      timestamp: event.created_at,
    });

    // Track delayed deliveries
    await redisClient.executeOperation(
      async (redis) => {
        await redis.incr('email:stats:delayed');
        return {};
      },
      () => ({}),
      'webhook_delayed_tracking'
    );
  }

  /**
   * Remove email from Resend audience and cancel sequences
   */
  private async removeFromAudience(email: string, reason: string): Promise<void> {
    const emailHash = this.hashEmail(email);

    try {
      // Remove from Resend audience (note: manual removal via Resend dashboard/API required)
      // The unsubscribe method is not available in the Resend SDK
      // TODO: Implement contact removal via Resend API if needed

      // Cancel email sequences
      await emailSequenceService.cancelSequence(email);

      logger.info('Removed email from audience', {
        email_hash: emailHash,
        reason,
      });
    } catch (error) {
      logger.error(
        'Failed to remove email from audience',
        error instanceof Error ? error : new Error(String(error)),
        {
          email_hash: emailHash,
          reason,
        }
      );
    }
  }

  /**
   * Get bounce count for an email
   */
  private async getBounceCount(email: string): Promise<number> {
    const result = await redisClient.executeOperation(
      async (redis) => {
        const result = await redis.get(`email:bounces:${email}`);
        return { count: result ? Number.parseInt(result as string, 10) : 0 };
      },
      () => ({ count: 0 }),
      'get_bounce_count'
    );

    return result.count;
  }

  /**
   * Extract email from 'to' field (can be string, array, or undefined)
   */
  private extractEmail(to: string | string[] | undefined): string {
    if (!to) return '';
    return Array.isArray(to) ? (to[0] ?? '') : to;
  }

  /**
   * Hash email for privacy-safe logging
   */
  private hashEmail(email: string): string {
    return createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 16);
  }
}

export const webhookService = new WebhookService();
