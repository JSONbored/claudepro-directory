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
  GetActiveSubscribersReturns,
  GetNewsletterSubscriptionByIdArgs,
  GetNewsletterSubscriptionByIdReturns,
} from '@heyclaude/database-types/postgres-types';
import { prisma } from '../prisma/client.ts';
import { BasePrismaService } from './base-prisma-service.ts';
import { logRpcError } from '../utils/rpc-error-logging.ts';

// Type helpers: Extract model types from Prisma query results
type NewsletterSubscription = Awaited<ReturnType<typeof prisma.newsletter_subscriptions.findUnique>>;
type NewsletterSubscriptionUpdateInput = Parameters<typeof prisma.newsletter_subscriptions.update>[0]['data'];

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
    return this.callRpc<SubscriberResult>(
      'subscribe_newsletter',
      args,
      { methodName: 'subscribeNewsletter', useCache: false }
    );
  }

  async getNewsletterSubscriberCount(): Promise<number> {
    const result = await this.callRpc<GetActiveSubscribersReturns>(
      'get_active_subscribers',
      {},
      { methodName: 'getNewsletterSubscriberCount' }
    );
    return Array.isArray(result) ? result.length : 0;
  }

  async getActiveSubscribers(): Promise<GetActiveSubscribersReturns> {
    const result = await this.callRpc<GetActiveSubscribersReturns>(
      'get_active_subscribers',
      {},
      { methodName: 'getActiveSubscribers' }
    );
    return result ?? [];
  }

  async getSubscriptionById(
    id: string
  ): Promise<GetNewsletterSubscriptionByIdReturns[0] | null> {
    const result = await this.callRpc<GetNewsletterSubscriptionByIdReturns>(
      'get_newsletter_subscription_by_id',
      { p_id: id } as GetNewsletterSubscriptionByIdArgs,
      { methodName: 'getSubscriptionById' }
    );
    return Array.isArray(result) && result.length > 0 ? (result[0] ?? null) : null;
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

  async unsubscribeWithTimestamp(email: string): Promise<void> {
    try {
      await prisma.newsletter_subscriptions.update({
        where: { email },
        data: {
          unsubscribed_at: new Date(),
          updated_at: new Date(),
        },
      });
      // Also update status to unsubscribed
      await this.updateSubscriptionStatus(email, 'unsubscribed');
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
