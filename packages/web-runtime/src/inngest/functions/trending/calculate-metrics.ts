/**
 * Trending Metrics Calculation Inngest Function
 *
 * Cron job that calculates time-windowed metrics and updates trending scores.
 * Aggregates user_interactions data and refreshes the materialized view for fast queries.
 *
 * Runs every 30 minutes to keep trending rankings fresh.
 */

import { inngest } from '../../client';
import { createSupabaseAdminClient } from '../../../supabase/admin';
import { logger, createWebAppContextWithId } from '../../../logging/server';
import { normalizeError } from '@heyclaude/shared-runtime';
import type { Database } from '@heyclaude/database-types';

/**
 * Calculate trending metrics and refresh materialized view
 */
export const calculateTrendingMetrics = inngest.createFunction(
  {
    id: 'trending-calculate-metrics',
    name: 'Calculate Trending Metrics',
    retries: 2,
  },
  { cron: '*/30 * * * *' }, // Every 30 minutes
  async ({ step }) => {
    const startTime = Date.now();
    const logContext = createWebAppContextWithId(
      '/inngest/trending/calculate-metrics',
      'calculateTrendingMetrics'
    );

    logger.info(logContext, 'Trending metrics calculation started');

    const supabase = createSupabaseAdminClient();

    // Step 1: Calculate time-windowed metrics from user_interactions
    const metricsResult = await step.run('calculate-time-metrics', async (): Promise<{
      updated: number;
      created: number;
    }> => {
      try {
        const { data, error } = await supabase.rpc('calculate_content_time_metrics');

        if (error) {
          throw error;
        }

        // Handle RPC return type: returns TABLE(updated_count, created_count)
        // Type: { created_count: number; updated_count: number }[]
        const result: Database['public']['Functions']['calculate_content_time_metrics']['Returns'] = 
          (data as Database['public']['Functions']['calculate_content_time_metrics']['Returns']) ?? [];
        
        // Function returns a single row, so take first element
        const firstRow = result[0];
        const updatedCount = firstRow?.updated_count ?? 0;
        const createdCount = firstRow?.created_count ?? 0;

        logger.info(
          {
            ...logContext,
            updatedCount,
            createdCount,
          },
          'Time-windowed metrics calculated'
        );

        return {
          updated: updatedCount,
          created: createdCount,
        };
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to calculate time-windowed metrics');
        logger.error(
          {
            ...logContext,
            err: normalized,
          },
          'Failed to calculate time-windowed metrics'
        );
        throw normalized;
      }
    });

    // Step 2: Refresh materialized view with updated metrics
    await step.run('refresh-materialized-view', async () => {
      try {
        const { error } = await supabase.rpc('refresh_trending_metrics_view');

        if (error) {
          throw error;
        }

        logger.info(logContext, 'Materialized view refreshed successfully');
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to refresh materialized view');
        logger.error(
          {
            ...logContext,
            err: normalized,
          },
          'Failed to refresh materialized view'
        );
        throw normalized;
      }
    });

    const durationMs = Date.now() - startTime;
    logger.info(
      {
        ...logContext,
        durationMs,
        updatedMetrics: metricsResult.updated,
        createdMetrics: metricsResult.created,
      },
      'Trending metrics calculation completed'
    );

    return {
      updated: metricsResult.updated,
      created: metricsResult.created,
      durationMs,
    };
  }
);
