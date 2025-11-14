'use server';

/**
 * Tracking Server Actions
 * Secure server-side RPC calls for event tracking
 */

import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';

interface TrackSponsoredEventData {
  sponsored_id: string;
  page_url?: string;
  position?: number;
  target_url?: string;
  [key: string]: string | number | undefined;
}

/**
 * Track sponsored content impression
 * Fire-and-forget, best-effort tracking
 */
export async function trackSponsoredImpression(data: {
  sponsoredId: string;
  pageUrl?: string;
  position?: number;
}): Promise<void> {
  try {
    const supabase = await createClient();

    const eventData: TrackSponsoredEventData = {
      sponsored_id: data.sponsoredId,
      page_url: data.pageUrl || '',
      position: data.position ?? 0,
    };

    await supabase.rpc('track_sponsored_event', {
      p_event_type: 'impression',
      p_user_id: '',
      p_data: eventData,
    });
  } catch (error) {
    // Silent fail - impressions are best-effort
    logger.error(
      'Failed to track sponsored impression',
      error instanceof Error ? error : new Error(String(error)),
      { sponsoredId: data.sponsoredId }
    );
  }
}

/**
 * Track sponsored content click
 * Fire-and-forget, best-effort tracking
 */
export async function trackSponsoredClick(data: {
  sponsoredId: string;
  targetUrl: string;
}): Promise<void> {
  try {
    const supabase = await createClient();

    const eventData: TrackSponsoredEventData = {
      sponsored_id: data.sponsoredId,
      target_url: data.targetUrl,
    };

    await supabase.rpc('track_sponsored_event', {
      p_event_type: 'click',
      p_user_id: '',
      p_data: eventData,
    });
  } catch (error) {
    // Silent fail - clicks are best-effort
    logger.error(
      'Failed to track sponsored click',
      error instanceof Error ? error : new Error(String(error)),
      { sponsoredId: data.sponsoredId }
    );
  }
}
