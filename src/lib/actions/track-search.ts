/**
 * Search Analytics Tracking - Database-First Architecture
 * Logs search queries to database for analytics aggregation.
 */

'use server';

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';

const trackSearchSchema = z.object({
  query: z.string().max(100),
  category: z.string(),
  resultsCount: z.number().int().nonnegative(),
  filtersApplied: z.boolean(),
});

export const trackSearch = rateLimitedAction
  .metadata({
    actionName: 'trackSearch',
    category: 'analytics',
  })
  .schema(trackSearchSchema)
  .action(async ({ parsedInput }) => {
    const { query, category, resultsCount, filtersApplied } = parsedInput;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          content_type: 'search',
          content_slug: category,
          interaction_type: 'search',
          metadata: {
            query,
            resultsCount,
            filtersApplied,
          },
        })
        .then(({ error }: { error: unknown }) => {
          if (error) {
            logger.warn('Failed to track search interaction', undefined, {
              query,
              category,
            });
          }
        });
    }

    return {
      success: true,
      message: 'Search tracked successfully',
    };
  });
