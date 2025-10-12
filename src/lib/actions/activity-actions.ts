'use server';

/**
 * Activity Actions
 * Server actions for fetching and aggregating user activity
 *
 * Refactored to use Repository pattern for cleaner separation of concerns.
 * All database operations delegated to ActivityRepository.
 *
 * PERFORMANCE:
 * - Repository-level caching (5-minute TTL)
 * - Parallel queries for activity counts
 * - Efficient timeline aggregation
 *
 * Security: Rate limited, user category
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { activityRepository } from '@/src/lib/repositories/activity.repository';
import {
  activityFilterSchema,
  activitySummarySchema,
  activityTimelineResponseSchema,
} from '@/src/lib/schemas/activity.schema';
import { createClient } from '@/src/lib/supabase/server';

/**
 * Get user's activity summary statistics
 */
export const getActivitySummary = rateLimitedAction
  .metadata({
    actionName: 'getActivitySummary',
    category: 'user',
  })
  .schema(z.void())
  .outputSchema(activitySummarySchema)
  .action(async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to view activity');
    }

    // Fetch via repository (includes caching and parallel queries)
    const result = await activityRepository.getSummary(user.id);

    if (!(result.success && result.data)) {
      throw new Error(result.error || 'Failed to fetch activity summary');
    }

    return result.data;
  });

/**
 * Get user's activity timeline
 */
export const getActivityTimeline = rateLimitedAction
  .metadata({
    actionName: 'getActivityTimeline',
    category: 'user',
  })
  .schema(activityFilterSchema)
  .outputSchema(activityTimelineResponseSchema)
  .action(async ({ parsedInput: { type, limit, offset } }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to view activity');
    }

    // Fetch via repository (includes type filtering, sorting, and pagination)
    const result = await activityRepository.getTimeline(user.id, {
      ...(type ? { type } : {}),
      limit,
      offset,
    });

    if (!(result.success && result.data)) {
      throw new Error(result.error || 'Failed to fetch activity timeline');
    }

    return result.data;
  });
