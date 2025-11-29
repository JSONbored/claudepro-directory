import  { type Database } from '@heyclaude/database-types';
import  { type SupabaseClient } from '@supabase/supabase-js';

import { logRpcError } from '../utils/rpc-error-logging.ts';

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

  async getNewsletterSubscriberCount() {
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
  }
  
  // Helper to fetch subscription by ID (used in edge handler after RPC)
  async getSubscriptionById(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('newsletter_subscriptions')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        // Log table query errors (not RPC, but similar pattern)
        logRpcError(error, {
          rpcName: 'newsletter_subscriptions.select',
          operation: 'NewsletterService.getSubscriptionById',
          args: { id },
        });
        throw error;
      }
      return data;
    } catch (error) {
      // Error already logged above
      throw error;
    }
  }
}
