/**
 * Newsletter Service - Prisma Implementation
 *
 * Fully modernized for Prisma ORM - no backward compatibility.
 * All table types use Prisma types.
 * RPC function types remain using Database type (Prisma doesn't generate RPC types).
 */

import type { Database } from '@heyclaude/database-types';
import type { Prisma } from '@heyclaude/data-layer/prisma';
import { prisma } from '../prisma/client.ts';
import { BasePrismaService } from './base-prisma-service.ts';
import { logRpcError } from '../utils/rpc-error-logging.ts';

export type SubscriberResult = Database['public']['Functions']['subscribe_newsletter']['Returns'];
export type SubscriberArgs = Database['public']['Functions']['subscribe_newsletter']['Args'];

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
    const result = await this.callRpc<Database['public']['Functions']['get_active_subscribers']['Returns']>(
      'get_active_subscribers',
      {},
      { methodName: 'getNewsletterSubscriberCount' }
    );
    return Array.isArray(result) ? result.length : 0;
  }

  async getActiveSubscribers(): Promise<
    Database['public']['Functions']['get_active_subscribers']['Returns']
  > {
    const result = await this.callRpc<Database['public']['Functions']['get_active_subscribers']['Returns']>(
      'get_active_subscribers',
      {},
      { methodName: 'getActiveSubscribers' }
    );
    return result ?? [];
  }

  async getSubscriptionById(
    id: string
  ): Promise<Database['public']['Functions']['get_newsletter_subscription_by_id']['Returns'][0] | null> {
    const result = await this.callRpc<Database['public']['Functions']['get_newsletter_subscription_by_id']['Returns']>(
      'get_newsletter_subscription_by_id',
      { p_id: id },
      { methodName: 'getSubscriptionById' }
    );
    return Array.isArray(result) && result.length > 0 ? (result[0] ?? null) : null;
  }

  async getSubscriptionStatusByEmail(email: string): Promise<{
    status: Prisma.newsletter_subscriptionsGetPayload<{}>['status'];
  } | null> {
    const subscription = await prisma.newsletter_subscriptions.findUnique({
      where: { email },
      select: { status: true },
    });
    return subscription ?? null;
  }

  async getSubscriptionEngagementScore(email: string): Promise<{
    engagement_score: Prisma.newsletter_subscriptionsGetPayload<{}>['engagement_score'];
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
    status: Prisma.newsletter_subscriptionsUpdateInput['status']
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
