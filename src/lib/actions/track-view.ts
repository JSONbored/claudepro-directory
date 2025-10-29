/**
 * Analytics Tracking - Database-First Architecture
 * Fire-and-forget event tracking via user_interactions table.
 */

'use server';

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import { nonEmptyString } from '@/src/lib/schemas/primitives';
import { categoryIdSchema } from '@/src/lib/schemas/shared.schema';
import { createClient } from '@/src/lib/supabase/server';

const trackingParamsSchema = z.object({
  category: categoryIdSchema,
  slug: nonEmptyString
    .max(200, 'Content slug is too long')
    .regex(
      /^[a-zA-Z0-9-_/]+$/,
      'Slug can only contain letters, numbers, hyphens, underscores, and forward slashes'
    )
    .transform((val: string) => val.toLowerCase().trim()),
});

export const trackView = rateLimitedAction
  .metadata({
    actionName: 'trackView',
    category: 'analytics',
  })
  .schema(trackingParamsSchema)
  .action(async ({ parsedInput }: { parsedInput: z.infer<typeof trackingParamsSchema> }) => {
    const { category, slug } = parsedInput;

    // Direct PostgreSQL insert - no queue needed
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
        .then(({ error }: { error: unknown }) => {
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
      message: 'View tracked successfully',
    };
  });

export const trackCopy = rateLimitedAction
  .metadata({
    actionName: 'trackCopy',
    category: 'analytics',
  })
  .schema(trackingParamsSchema)
  .action(async ({ parsedInput }: { parsedInput: z.infer<typeof trackingParamsSchema> }) => {
    const { category, slug } = parsedInput;

    // Direct PostgreSQL insert - no queue needed
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
        .then(({ error }: { error: unknown }) => {
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
      message: 'Copy tracked successfully',
    };
  });
