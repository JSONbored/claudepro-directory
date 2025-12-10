import  { type Database } from '@heyclaude/database-types';
import  { type SupabaseClient } from '@supabase/supabase-js';

import { logRpcError } from '../utils/rpc-error-logging.ts';
import { withSmartCache } from '../utils/request-cache.ts';

export type SubscriberResult = Database['public']['Functions']['subscribe_newsletter']['Returns'];
export type SubscriberArgs = Database['public']['Functions']['subscribe_newsletter']['Args'];

export class NewsletterService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async subscribeNewsletter(args: SubscriberArgs) {
    try {
      const { data, error } = await this.supabase.rpc('subscribe_newsletter', args);
      
      if (error) {
        logRpcError(error, {
          rpcName: 'subscribe_newsletter',
          operation: 'NewsletterService.subscribeNewsletter',
          args: args,
          isMutation: true, // This is a mutation (creates subscription)
        });
        throw error;
      }
      
      return data;
    } catch (error) {
      // Error already logged above
      throw error;
    }
  }

  /**
   * Gets newsletter subscriber count
   * Uses request-scoped caching to avoid duplicate calls within the same request
   */
  async getNewsletterSubscriberCount() {
    return withSmartCache(
      'get_active_subscribers',
      'getNewsletterSubscriberCount',
      async () => {
        try {
          const { data, error } = await this.supabase.rpc('get_active_subscribers');
          if (error) {
            logRpcError(error, {
              rpcName: 'get_active_subscribers',
              operation: 'NewsletterService.getNewsletterSubscriberCount',
            });
            throw error;
          }
          
          return data ? data.length : 0;
        } catch (error) {
          // Error already logged above
          throw error;
        }
      },
      undefined
    );
  }

  /**
   * Calls the database RPC: get_active_subscribers
   * Returns array of active subscriber email addresses
   * Uses request-scoped caching to avoid duplicate calls within the same request
   */
  async getActiveSubscribers(): Promise<
    Database['public']['Functions']['get_active_subscribers']['Returns']
  > {
    return withSmartCache(
      'get_active_subscribers',
      'getActiveSubscribers',
      async () => {
        try {
          const { data, error } = await this.supabase.rpc('get_active_subscribers');
          if (error) {
            logRpcError(error, {
              rpcName: 'get_active_subscribers',
              operation: 'NewsletterService.getActiveSubscribers',
            });
            throw error;
          }
          return data ?? [];
        } catch (error) {
          // Error already logged above
          throw error;
        }
      },
      undefined
    );
  }
  
  /**
   * Calls the database RPC: get_newsletter_subscription_by_id
   * Uses request-scoped caching to avoid duplicate calls within the same request
   */
  async getSubscriptionById(id: string) {
    return withSmartCache(
      'get_newsletter_subscription_by_id',
      'getSubscriptionById',
      async () => {
        try {
          const { data, error } = await this.supabase.rpc('get_newsletter_subscription_by_id', {
            p_id: id,
          });
          
          if (error) {
            logRpcError(error, {
              rpcName: 'get_newsletter_subscription_by_id',
              operation: 'NewsletterService.getSubscriptionById',
              args: { id },
            });
            throw error;
          }
          
          // RPC returns SETOF (array), but we expect single row - return first element or null
          return Array.isArray(data) && data.length > 0 ? data[0] : null;
        } catch (error) {
          // Error already logged above
          throw error;
        }
      },
      { id }
    );
  }

  /**
   * Gets newsletter subscription status by email
   * Returns the subscription status for the given email
   * Uses request-scoped caching to avoid duplicate calls within the same request
   */
  async getSubscriptionStatusByEmail(email: string): Promise<{
    status: Database['public']['Tables']['newsletter_subscriptions']['Row']['status'];
  } | null> {
    return withSmartCache(
      'newsletter_subscriptions.select',
      'getSubscriptionStatusByEmail',
      async () => {
        try {
          const { data, error } = await this.supabase
            .from('newsletter_subscriptions')
            .select('status')
            .eq('email', email)
            .single();

          if (error) {
            logRpcError(error, {
              rpcName: 'newsletter_subscriptions.select',
              operation: 'NewsletterService.getSubscriptionStatusByEmail',
              args: { email },
            });
            return null;
          }

          return data;
        } catch (error) {
          // Error already logged above
          return null;
        }
      },
      { email }
    );
  }

  /**
   * Gets newsletter subscription engagement score by email
   * Returns the engagement_score for the given email
   * Uses request-scoped caching to avoid duplicate calls within the same request
   */
  async getSubscriptionEngagementScore(email: string): Promise<{
    engagement_score: Database['public']['Tables']['newsletter_subscriptions']['Row']['engagement_score'];
  } | null> {
    return withSmartCache(
      'newsletter_subscriptions.select',
      'getSubscriptionEngagementScore',
      async () => {
        try {
          const { data, error } = await this.supabase
            .from('newsletter_subscriptions')
            .select('engagement_score')
            .eq('email', email)
            .single();

          if (error) {
            logRpcError(error, {
              rpcName: 'newsletter_subscriptions.select',
              operation: 'NewsletterService.getSubscriptionEngagementScore',
              args: { email },
            });
            return null;
          }

          return data;
        } catch (error) {
          // Error already logged above
          return null;
        }
      },
      { email }
    );
  }

  /**
   * Updates newsletter subscription last_email_sent_at timestamp
   */
  async updateLastEmailSentAt(email: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('newsletter_subscriptions')
        .update({
          last_email_sent_at: new Date().toISOString(),
        })
        .eq('email', email);

      if (error) {
        logRpcError(error, {
          rpcName: 'newsletter_subscriptions.update',
          operation: 'NewsletterService.updateLastEmailSentAt',
          args: { email },
        });
        throw error;
      }
    } catch (error) {
      // Error already logged above
      throw error;
    }
  }

  /**
   * Updates newsletter subscription last_active_at timestamp
   */
  async updateLastActiveAt(email: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('newsletter_subscriptions')
        .update({
          last_active_at: new Date().toISOString(),
        })
        .eq('email', email);

      if (error) {
        logRpcError(error, {
          rpcName: 'newsletter_subscriptions.update',
          operation: 'NewsletterService.updateLastActiveAt',
          args: { email },
        });
        throw error;
      }
    } catch (error) {
      // Error already logged above
      throw error;
    }
  }

  /**
   * Updates newsletter subscription status
   */
  async updateSubscriptionStatus(
    email: string,
    status: Database['public']['Tables']['newsletter_subscriptions']['Update']['status']
  ): Promise<void> {
    try {
      const updateData: Database['public']['Tables']['newsletter_subscriptions']['Update'] = {};
      if (status !== undefined) {
        updateData.status = status as NonNullable<typeof status>;
      }
      const { error } = await this.supabase
        .from('newsletter_subscriptions')
        .update(updateData)
        .eq('email', email);

      if (error) {
        logRpcError(error, {
          rpcName: 'newsletter_subscriptions.update',
          operation: 'NewsletterService.updateSubscriptionStatus',
          args: { email, status },
        });
        throw error;
      }
    } catch (error) {
      // Error already logged above
      throw error;
    }
  }

  /**
   * Updates newsletter subscription engagement score
   */
  async updateEngagementScore(email: string, engagementScore: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('newsletter_subscriptions')
        .update({
          engagement_score: engagementScore,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email);

      if (error) {
        logRpcError(error, {
          rpcName: 'newsletter_subscriptions.update',
          operation: 'NewsletterService.updateEngagementScore',
          args: { email, engagementScore },
        });
        throw error;
      }
    } catch (error) {
      // Error already logged above
      throw error;
    }
  }

  /**
   * Updates newsletter subscription with unsubscribed_at timestamp and status
   */
  async unsubscribeWithTimestamp(email: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('newsletter_subscriptions')
        .update({
          unsubscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('email', email);

      if (error) {
        logRpcError(error, {
          rpcName: 'newsletter_subscriptions.update',
          operation: 'NewsletterService.unsubscribeWithTimestamp',
          args: { email },
        });
        throw error;
      }

      // Also update status to unsubscribed
      await this.updateSubscriptionStatus(email, 'unsubscribed');
    } catch (error) {
      // Error already logged above
      throw error;
    }
  }
}
