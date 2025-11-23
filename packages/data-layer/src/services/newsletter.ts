import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type SubscriberResult = Database['public']['Functions']['subscribe_newsletter']['Returns'];
export type SubscriberArgs = Database['public']['Functions']['subscribe_newsletter']['Args'];

export class NewsletterService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async subscribeNewsletter(args: SubscriberArgs) {
    const { data, error } = await this.supabase.rpc('subscribe_newsletter', args);
    
    if (error) throw error;
    
    return data as SubscriberResult;
  }

  async getNewsletterSubscriberCount() {
    const { data, error } = await this.supabase.rpc('get_active_subscribers');
    if (error) throw error;
    
    return data ? data.length : 0;
  }
  
  // Helper to fetch subscription by ID (used in edge handler after RPC)
  async getSubscriptionById(id: string) {
    const { data, error } = await this.supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }
}
