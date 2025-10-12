'use server';

/**
 * Sponsored Content Actions
 * Server actions for tracking sponsored impressions and clicks
 *
 * Refactored to use Repository pattern for cleaner separation of concerns.
 * All database operations delegated to SponsoredContentRepository.
 *
 * PERFORMANCE:
 * - Repository-level caching (5-minute TTL)
 * - Fire-and-forget tracking (don't block on errors)
 * - Minimal data transfer
 *
 * Security: Rate limited, analytics category
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { sponsoredContentRepository } from '@/src/lib/repositories/sponsored-content.repository';
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Track impression via repository (fire-and-forget)
    const result = await sponsoredContentRepository.trackImpression({
      sponsored_id,
      user_id: user?.id || null,
      page_url: page_url || null,
      position: position || null,
    });

    return { success: result.success ? result.data : false };
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Track click via repository (fire-and-forget)
    const result = await sponsoredContentRepository.trackClick({
      sponsored_id,
      user_id: user?.id || null,
      target_url,
    });

    return { success: result.success ? result.data : false };
  });

/**
 * Get active sponsored content for injection
 */
export async function getActiveSponsoredContent(limit = 5) {
  // Fetch via repository (includes caching, date filtering, and impression limit filtering)
  const result = await sponsoredContentRepository.findActive(limit);

  if (!result.success) {
    return [];
  }

  return result.data || [];
}
