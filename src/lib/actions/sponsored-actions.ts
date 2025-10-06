'use server';

/**
 * Sponsored Content Actions
 * Server actions for tracking sponsored impressions and clicks
 * 
 * Similar pattern to track-view.ts but for sponsored content
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { createClient } from '@/src/lib/supabase/server';

const trackImpressionSchema = z.object({
  sponsored_id: z.string().uuid(),
  page_url: z.string().max(500).optional(),
  position: z.number().int().min(0).max(100).optional(),
});

const trackClickSchema = z.object({
  sponsored_id: z.string().uuid(),
  target_url: z.string().max(500),
});

/**
 * Track a sponsored impression
 * Called when sponsored content becomes visible (Intersection Observer)
 */
export const trackSponsoredImpression = rateLimitedAction
  .metadata({
    actionName: 'trackSponsoredImpression',
    category: 'analytics',
  })
  .schema(trackImpressionSchema)
  .action(async ({ parsedInput: { sponsored_id, page_url, position } }) => {
    const supabase = await createClient();
    
    // Get current user (optional - track anonymous too)
    const { data: { user } } = await supabase.auth.getUser();

    // Insert impression
    const { error } = await supabase
      .from('sponsored_impressions')
      .insert({
        sponsored_id,
        user_id: user?.id || null,
        page_url: page_url || null,
        position: position || null,
      });

    if (error) {
      // Don't throw - impressions are best-effort
      return { success: false };
    }

    // Increment count on sponsored_content
    await supabase.rpc('increment', {
      table_name: 'sponsored_content',
      row_id: sponsored_id,
      column_name: 'impression_count',
    });

    return { success: true };
  });

/**
 * Track a sponsored click
 * Called when user clicks on sponsored content
 */
export const trackSponsoredClick = rateLimitedAction
  .metadata({
    actionName: 'trackSponsoredClick',
    category: 'analytics',
  })
  .schema(trackClickSchema)
  .action(async ({ parsedInput: { sponsored_id, target_url } }) => {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();

    // Insert click
    const { error } = await supabase
      .from('sponsored_clicks')
      .insert({
        sponsored_id,
        user_id: user?.id || null,
        target_url,
      });

    if (error) {
      return { success: false };
    }

    // Increment count on sponsored_content
    await supabase.rpc('increment', {
      table_name: 'sponsored_content',
      row_id: sponsored_id,
      column_name: 'click_count',
    });

    return { success: true };
  });

/**
 * Get active sponsored content for injection
 */
export async function getActiveSponsoredContent(limit = 5) {
  const supabase = await createClient();
  
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('sponsored_content')
    .select('*')
    .eq('active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('tier', { ascending: true }) // Premium first
    .limit(limit);

  if (error) {
    return [];
  }

  // Filter out items that hit impression limit
  return (data || []).filter(item => {
    if (item.impression_limit && item.impression_count >= item.impression_limit) {
      return false;
    }
    return true;
  });
}
