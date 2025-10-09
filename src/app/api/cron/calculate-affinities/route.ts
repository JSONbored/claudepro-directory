/**
 * Affinity Calculation Cron Job
 * Runs daily to calculate user affinity scores
 *
 * Schedule: Daily at 2 AM UTC
 * Purpose: Pre-compute affinity scores for all active users
 * Performance: Batch processes users to avoid timeouts
 */

import { NextResponse } from 'next/server';
import { logger } from '@/src/lib/logger';
import {
  aggregateInteractions,
  calculateAffinityScore,
  validateAffinityScore,
} from '@/src/lib/personalization/affinity-scorer';
import { createClient } from '@/src/lib/supabase/server';

// Runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Verify cron secret to prevent unauthorized access
 */
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.warn('CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  try {
    // Verify cron authentication
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = performance.now();
    const supabase = await createClient();

    // Get all users with activity in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activeUsers, error: usersError } = await supabase
      .from('user_interactions')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (usersError) {
      throw new Error(`Failed to fetch active users: ${usersError.message}`);
    }

    // Get unique user IDs
    const uniqueUserIds = [
      ...new Set(activeUsers?.map((u: { user_id: string }) => u.user_id) || []),
    ];

    logger.info('Starting affinity calculation', {
      total_users: uniqueUserIds.length,
      since: thirtyDaysAgo.toISOString(),
    });

    let processedUsers = 0;
    let totalAffinities = 0;
    let errors = 0;

    // Process users in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < uniqueUserIds.length; i += BATCH_SIZE) {
      const batch = uniqueUserIds.slice(i, i + BATCH_SIZE);

      // OPTIMIZATION: Fetch all interactions for batch in single query (N+1 → 1 query)
      // Previous: 50 separate queries per batch (2500+ total queries)
      // New: 1 query per batch (50 total queries) = 50x reduction
      const { data: allBatchInteractions, error: batchError } = await supabase
        .from('user_interactions')
        .select('user_id, content_type, content_slug, interaction_type, metadata, created_at')
        .in(
          'user_id',
          batch.filter((id): id is string => id !== null)
        )
        .order('created_at', { ascending: false });

      if (batchError) {
        logger.error('Failed to fetch batch interactions', batchError, {
          batch_size: batch.length,
          batch_index: i / BATCH_SIZE,
        });
        errors += batch.length;
        continue;
      }

      // Group interactions by user_id for processing
      const interactionsByUserId = new Map<
        string,
        Array<{
          content_type: string;
          content_slug: string;
          interaction_type: string;
          metadata: Record<string, unknown>;
          created_at: string;
        }>
      >();

      for (const interaction of allBatchInteractions || []) {
        if (!interactionsByUserId.has(interaction.user_id)) {
          interactionsByUserId.set(interaction.user_id, []);
        }
        const userInteractions = interactionsByUserId.get(interaction.user_id);
        if (userInteractions) {
          userInteractions.push({
            content_type: interaction.content_type,
            content_slug: interaction.content_slug,
            interaction_type: interaction.interaction_type,
            metadata: interaction.metadata as Record<string, unknown>,
            created_at: interaction.created_at,
          });
        }
      }

      const batchResults = await Promise.allSettled(
        batch.map(async (userId) => {
          if (!userId) return;

          // Get interactions from pre-fetched batch data
          const interactions = interactionsByUserId.get(userId);

          if (!interactions || interactions.length === 0) {
            return;
          }

          // Group by content item
          const interactionsByContent = new Map<
            string,
            {
              content_type: string;
              content_slug: string;
              interactions: Array<{
                interaction_type: string;
                metadata: Record<string, unknown>;
                created_at: string;
              }>;
            }
          >();

          for (const interaction of interactions) {
            const key = `${interaction.content_type}:${interaction.content_slug}`;
            if (!interactionsByContent.has(key)) {
              interactionsByContent.set(key, {
                content_type: interaction.content_type,
                content_slug: interaction.content_slug,
                interactions: [],
              });
            }
            const contentData = interactionsByContent.get(key);
            if (contentData) {
              contentData.interactions.push({
                interaction_type: interaction.interaction_type,
                metadata: interaction.metadata as Record<string, unknown>,
                created_at: interaction.created_at,
              });
            }
          }

          // Calculate affinities
          const affinities = [];
          for (const [_key, data] of interactionsByContent.entries()) {
            const summary = aggregateInteractions(data.interactions);
            const affinity = calculateAffinityScore(summary);

            if (validateAffinityScore(affinity.affinity_score) && affinity.affinity_score >= 10) {
              affinities.push({
                user_id: userId,
                content_type: data.content_type,
                content_slug: data.content_slug,
                affinity_score: affinity.affinity_score,
                based_on: affinity.breakdown,
                calculated_at: new Date().toISOString(),
              });
            }
          }

          // Batch upsert affinities
          if (affinities.length > 0) {
            const { error: upsertError } = await supabase
              .from('user_affinities')
              .upsert(affinities, {
                onConflict: 'user_id,content_type,content_slug',
              });

            if (upsertError) {
              logger.error('Failed to upsert affinities', upsertError, { userId });
              throw upsertError;
            }

            return affinities.length;
          }

          return 0;
        })
      );

      // Count results
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          processedUsers++;
          totalAffinities += result.value;
        } else if (result.status === 'rejected') {
          errors++;
          logger.error('Error processing user affinity', result.reason);
        }
      }
    }

    const duration = performance.now() - startTime;

    logger.info('Affinity calculation complete', {
      processed_users: processedUsers,
      total_affinities: totalAffinities,
      errors,
      duration_ms: Math.round(duration),
    });

    return NextResponse.json({
      success: true,
      processed_users: processedUsers,
      total_affinities: totalAffinities,
      errors,
      duration_ms: Math.round(duration),
    });
  } catch (error) {
    logger.error(
      'Affinity calculation cron failed',
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
