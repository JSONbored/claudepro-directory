/**
 * Newsletter Service - Prisma Implementation
 *
 * Fully modernized for Prisma ORM - no backward compatibility.
 * All table types use Prisma types.
 * RPC function types use postgres-types generator (Prisma doesn't generate RPC types).
 */

import type {
  SubscribeNewsletterArgs,
  SubscribeNewsletterReturns,
} from '@heyclaude/database-types/postgres-types';
import type { Prisma } from '@prisma/client';

type newsletter_subscriptionsModel = Prisma.newsletter_subscriptionsGetPayload<{}>;
import { prisma } from '../prisma/client';
import { BasePrismaService } from './base-prisma-service';
import { logRpcError } from '../utils/rpc-error-logging';
import { withSmartCache } from '../utils/request-cache';

// Type helpers: Extract model types from Prisma query results
type NewsletterSubscription = Awaited<
  ReturnType<typeof prisma.newsletter_subscriptions.findUnique>
>;
type NewsletterSubscriptionUpdateInput = Parameters<
  typeof prisma.newsletter_subscriptions.update
>[0]['data'];

export type SubscriberResult = SubscribeNewsletterReturns;
export type SubscriberArgs = SubscribeNewsletterArgs;

/**
 * Newsletter Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions
 * - Direct Prisma queries for table operations
 * - Request-scoped caching (via BasePrismaService)
 * - Same public API as Supabase-based service
 */
export class NewsletterService extends BasePrismaService {
  async subscribeNewsletter(args: SubscriberArgs): Promise<SubscriberResult> {
    // Mutations don't use caching
    return this.callRpc<SubscriberResult>('subscribe_newsletter', args, {
      methodName: 'subscribeNewsletter',
      useCache: false,
    });
  }

  /**
   * Get newsletter subscriber count
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple COUNT, which Prisma handles perfectly.
   *
   * @returns Number of active subscribers
   */
  async getNewsletterSubscriberCount(): Promise<number> {
    return withSmartCache(
      'getNewsletterSubscriberCount',
      'getNewsletterSubscriberCount',
      async () => {
        return prisma.newsletter_subscriptions.count({
          where: {
            status: 'active',
            confirmed: true,
            unsubscribed_at: null,
          },
        });
      },
      {}
    );
  }

  /**
   * Get active subscribers
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was using ARRAY_AGG(email), which we can do in TypeScript with better type safety.
   *
   * @returns Array of active subscriber emails
   */
  async getActiveSubscribers(): Promise<string[]> {
    return withSmartCache(
      'getActiveSubscribers',
      'getActiveSubscribers',
      async () => {
        const subscribers = await prisma.newsletter_subscriptions.findMany({
          where: {
            status: 'active',
            confirmed: true,
            unsubscribed_at: null,
          },
          select: { email: true },
          orderBy: { subscribed_at: 'desc' },
        });
        return subscribers.map((s) => s.email);
      },
      {}
    );
  }

  /**
   * Get subscription by ID
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple SELECT by ID, which Prisma handles perfectly.
   *
   * @param id - Subscription ID
   * @returns Newsletter subscription or null if not found
   */
  async getSubscriptionById(id: string): Promise<newsletter_subscriptionsModel | null> {
    return withSmartCache(
      'getSubscriptionById',
      'getSubscriptionById',
      async () => {
        return prisma.newsletter_subscriptions.findUnique({
          where: { id },
        });
      },
      { id }
    );
  }

  async getSubscriptionStatusByEmail(email: string): Promise<{
    status: NonNullable<NewsletterSubscription>['status'];
  } | null> {
    const subscription = await prisma.newsletter_subscriptions.findUnique({
      where: { email },
      select: { status: true },
    });
    return subscription ?? null;
  }

  async getSubscriptionEngagementScore(email: string): Promise<{
    engagement_score: NonNullable<NewsletterSubscription>['engagement_score'];
  } | null> {
    const subscription = await prisma.newsletter_subscriptions.findUnique({
      where: { email },
      select: { engagement_score: true },
    });
    return subscription;
  }

  async updateLastEmailSentAt(email: string): Promise<void> {
    try {
      await prisma.newsletter_subscriptions.update({
        where: { email },
        data: {
          last_email_sent_at: new Date(),
          updated_at: new Date(),
        },
      });
    } catch (error) {
      logRpcError(error, {
        rpcName: 'newsletter_subscriptions.update',
        operation: 'NewsletterService.updateLastEmailSentAt',
        args: { email },
      });
      throw error;
    }
  }

  async updateLastActiveAt(email: string): Promise<void> {
    try {
      await prisma.newsletter_subscriptions.update({
        where: { email },
        data: {
          last_active_at: new Date(),
          updated_at: new Date(),
        },
      });
    } catch (error) {
      logRpcError(error, {
        rpcName: 'newsletter_subscriptions.update',
        operation: 'NewsletterService.updateLastActiveAt',
        args: { email },
      });
      throw error;
    }
  }

  async updateSubscriptionStatus(
    email: string,
    status: NewsletterSubscriptionUpdateInput['status']
  ): Promise<void> {
    try {
      await prisma.newsletter_subscriptions.update({
        where: { email },
        data: {
          status: status as NonNullable<typeof status>,
        },
      });
    } catch (error) {
      logRpcError(error, {
        rpcName: 'newsletter_subscriptions.update',
        operation: 'NewsletterService.updateSubscriptionStatus',
        args: { email, status },
      });
      throw error;
    }
  }

  async updateEngagementScore(email: string, engagementScore: number): Promise<void> {
    try {
      await prisma.newsletter_subscriptions.update({
        where: { email },
        data: {
          engagement_score: engagementScore,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      logRpcError(error, {
        rpcName: 'newsletter_subscriptions.update',
        operation: 'NewsletterService.updateEngagementScore',
        args: { email, engagementScore },
      });
      throw error;
    }
  }

  /**
   * Unsubscribe with timestamp
   *
   * Updates subscription status to 'unsubscribed' and sets unsubscribed_at timestamp.
   */
  async unsubscribeWithTimestamp(email: string): Promise<void> {
    try {
      await prisma.newsletter_subscriptions.update({
        where: { email },
        data: {
          status: 'unsubscribed',
          unsubscribed_at: new Date(),
          updated_at: new Date(),
        },
      });
    } catch (error) {
      logRpcError(error, {
        rpcName: 'newsletter_subscriptions.update',
        operation: 'NewsletterService.unsubscribeWithTimestamp',
        args: { email },
      });
      throw error;
    }
  }
}
