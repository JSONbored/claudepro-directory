'use server';

/**
 * Tracking Server Actions
 * Secure server-side RPC calls for event tracking
 */

import { invalidateByKeys, runRpc } from '@/src/lib/actions/action-helpers';
import { logger } from '@/src/lib/logger';

interface TrackSponsoredEventData {
  sponsored_id: string;
  page_url?: string;
  position?: number;
  target_url?: string;
  [key: string]: string | number | undefined;
}

async function invalidateSponsoredTrackingCaches(): Promise<void> {
  try {
    await invalidateByKeys({
      invalidateKeys: ['cache.invalidate.sponsored_tracking'],
    });
  } catch (error) {
    logger.error(
      'Failed to invalidate sponsored tracking caches',
      error instanceof Error ? error : new Error(String(error))
    );
  }
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
    const eventData: TrackSponsoredEventData = {
      sponsored_id: data.sponsoredId,
      page_url: data.pageUrl || '',
      position: data.position ?? 0,
    };

    await runRpc<void>(
      'track_sponsored_event',
      {
        p_event_type: 'impression',
        p_user_id: '',
        p_data: eventData,
      },
      {
        action: 'tracking.trackSponsoredImpression',
        meta: {
          sponsoredId: data.sponsoredId,
          pageUrl: data.pageUrl ?? null,
        },
      }
    );
    await invalidateSponsoredTrackingCaches();
  } catch (error) {
    // logActionFailure already captured the error; impressions are best-effort.
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
    const eventData: TrackSponsoredEventData = {
      sponsored_id: data.sponsoredId,
      target_url: data.targetUrl,
    };

    await runRpc<void>(
      'track_sponsored_event',
      {
        p_event_type: 'click',
        p_user_id: '',
        p_data: eventData,
      },
      {
        action: 'tracking.trackSponsoredClick',
        meta: {
          sponsoredId: data.sponsoredId,
          targetUrl: data.targetUrl,
        },
      }
    );
    await invalidateSponsoredTrackingCaches();
  } catch (error) {
    // logActionFailure already captured the error; clicks are best-effort.
  }
}
