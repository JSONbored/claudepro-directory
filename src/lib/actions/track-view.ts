'use server';

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import { statsRedis } from '@/src/lib/redis';
import { nonEmptyString } from '@/src/lib/schemas/primitives/base-strings';
import { contentCategorySchema } from '@/src/lib/schemas/shared.schema';
import { createClient } from '@/src/lib/supabase/server';

/**
 * Tracking parameters schema for view and copy events
 */
const trackingParamsSchema = z.object({
  category: contentCategorySchema,
  slug: nonEmptyString
    .max(200, 'Content slug is too long')
    .regex(
      /^[a-zA-Z0-9-_/]+$/,
      'Slug can only contain letters, numbers, hyphens, underscores, and forward slashes'
    )
    .transform((val) => val.toLowerCase().trim()),
});

/**
 * Track a view event for content
 *
 * Features:
 * - Rate limited: 100 requests per 60 seconds per IP
 * - Automatic validation via Zod schema
 * - Centralized logging via middleware
 * - Type-safe with full inference
 *
 * Usage:
 * ```ts
 * const result = await trackView({ category: 'agents', slug: 'my-agent' });
 * if (result?.data) {
 *   console.log('View count:', result.data.viewCount);
 * }
 * ```
 */
export const trackView = rateLimitedAction
  .metadata({
    actionName: 'trackView',
    category: 'analytics',
  })
  .schema(trackingParamsSchema)
  .action(async ({ parsedInput: { category, slug } }) => {
    if (!statsRedis.isEnabled()) {
      return {
        success: false,
        message: 'Stats tracking not enabled',
      };
    }

    const viewCount = await statsRedis.incrementView(category, slug);

    // Track interaction for personalization (non-blocking)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          content_type: category,
          content_slug: slug,
          interaction_type: 'view',
          metadata: {},
        })
        .then(({ error }) => {
          if (error) {
            logger.warn('Failed to track view interaction', undefined, {
              category,
              slug,
            });
          }
        });
    }

    return {
      success: true,
      viewCount: viewCount ?? 0,
    };
  });

/**
 * Track a copy event for content (e.g., code snippets)
 *
 * Features:
 * - Rate limited: 100 requests per 60 seconds per IP
 * - Automatic validation via Zod schema
 * - Centralized logging via middleware
 * - Type-safe with full inference
 *
 * Usage:
 * ```ts
 * const result = await trackCopy({ category: 'commands', slug: 'my-command' });
 * if (result?.data?.success) {
 *   console.log('Copy tracked successfully');
 * }
 * ```
 */
export const trackCopy = rateLimitedAction
  .metadata({
    actionName: 'trackCopy',
    category: 'analytics',
  })
  .schema(trackingParamsSchema)
  .action(async ({ parsedInput: { category, slug } }) => {
    if (!statsRedis.isEnabled()) {
      return {
        success: false,
        message: 'Stats tracking not enabled',
      };
    }

    await statsRedis.trackCopy(category, slug);

    // Track interaction for personalization (non-blocking)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          content_type: category,
          content_slug: slug,
          interaction_type: 'copy',
          metadata: {},
        })
        .then(({ error }) => {
          if (error) {
            logger.warn('Failed to track copy interaction', undefined, {
              category,
              slug,
            });
          }
        });
    }

    return {
      success: true,
    };
  });
