/**
 * Trending Metrics Calculation Inngest Function
 *
 * Cron job that calculates time-windowed metrics and updates trending scores.
 * Aggregates user_interactions data and refreshes the materialized view for fast queries.
 *
 * Runs every hour to keep trending rankings fresh.
 * Optimized: Increased from 30 minutes (trending doesn't need to be that fresh).
 */

import { inngest } from '../../client';
import { logger, createWebAppContextWithId } from '../../../logging/server';
import { normalizeError } from '@heyclaude/shared-runtime';
import { getService } from '../../../data/service-factory';
import { sendCronSuccessHeartbeat } from '../../utils/monitoring';

/**
 * Calculate trending metrics and refresh materialized view
 */
export const calculateTrendingMetrics = inngest.createFunction(
  {
    id: 'trending-calculate-metrics',
    name: 'Calculate Trending Metrics',
    retries: 2,
  },
  { cron: '0 * * * *' }, // Every hour (optimized from 30 minutes)
  async ({ step }) => {
    const startTime = Date.now();
    const logContext = createWebAppContextWithId(
      '/inngest/trending/calculate-metrics',
      'calculateTrendingMetrics'
    );

    logger.info(logContext, 'Trending metrics calculation started');

    const trendingService = await getService('trending');

    // Step 1: Calculate time-windowed metrics from user_interactions
    // NOTE: calculateContentTimeMetrics RPC was removed in migration 20251217000229
    // The materialized view refresh is sufficient for trending metrics
    // If time-windowed metrics are needed in the future, implement using Prisma queries directly
    const metricsResult = await step.run(
      'calculate-time-metrics',
      async (): Promise<{
        updated: number;
        created: number;
      }> => {
        // Return zero metrics since the RPC was removed
        // The materialized view refresh below will update trending scores
        logger.info(logContext, 'Time-windowed metrics calculation skipped (RPC removed)');
        return {
          updated: 0,
          created: 0,
        };
      }
    );

    // Step 2: Refresh materialized view with updated metrics
    await step.run('refresh-materialized-view', async () => {
      try {
        // Use TrendingService for proper data layer architecture
        await trendingService.refreshTrendingMetricsView();

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

    const result = {
      updated: metricsResult.updated,
      created: metricsResult.created,
      durationMs,
    };

    // BetterStack monitoring: Send success heartbeat (feature-flagged)
    if (result.updated > 0 || result.created > 0) {
      sendCronSuccessHeartbeat('BETTERSTACK_HEARTBEAT_INNGEST_CRON', {
        functionName: 'calculateTrendingMetrics',
        result: { updated: result.updated, created: result.created },
      });
    }

    return result;
  }
);
