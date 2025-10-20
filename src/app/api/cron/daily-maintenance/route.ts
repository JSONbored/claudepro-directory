/**
 * Consolidated Maintenance Cron Job
 *
 * OPTIMIZATION: Consolidated to stay within Vercel free tier (2 cron jobs max)
 * 
 * Schedule: Every 15 minutes (*/15 * * * *)
 * Configured in vercel.json
 *
 * Tasks performed:
 * 1. Trending Calculation - EVERY 15 minutes (Redis optimization)
 * 2. Cache Warming - Daily at 3 AM UTC only
 * 3. Job Expiration - Daily at 3 AM UTC only
 * 4. Email Sequences - Daily at 3 AM UTC only
 *
 * Performance:
 * - Trending runs frequently (low overhead, cached results)
 * - Heavy tasks only run once daily at 3 AM
 * - Individual task error handling
 * - Comprehensive logging
 *
 * @module app/api/cron/daily-maintenance
 */

import {
  agents,
  collections,
  commands,
  hooks,
  mcp,
  rules,
  skills,
  statuslines,
} from '@/generated/content';
import { cacheWarmer, contentCache } from '@/src/lib/cache.server';
import { createApiRoute } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';
import { emailSequenceService } from '@/src/lib/services/email-sequence.server';
import { createClient } from '@/src/lib/supabase/admin-client';
import { getBatchTrendingData } from '@/src/lib/trending/calculator.server';
import { batchLoadContent } from '@/src/lib/utils/batch.utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ExpiredJob {
  id: string;
  slug: string;
  title: string;
  company: string;
  expires_at: string;
  user_id: string;
}

interface TaskResult {
  task: string;
  success: boolean;
  duration_ms: number;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * GET handler for daily maintenance cron job
 *
 * Protected by CRON_SECRET - only Vercel Cron can trigger this.
 * Executes all daily maintenance tasks sequentially.
 *
 * @param request - Next.js request object
 * @returns JSON response with all task results
 */
const route = createApiRoute({
  auth: { type: 'cron' },
  response: { envelope: false },
  handlers: {
    GET: async ({ okRaw }) => {
      const overallStartTime = performance.now();
      const results: TaskResult[] = [];
      
      const now = new Date();
      const currentHour = now.getUTCHours();
      const isDailyMaintenanceTime = currentHour === 3; // 3 AM UTC

      logger.info('Consolidated maintenance cron started', {
        hour_utc: currentHour,
        is_daily_time: isDailyMaintenanceTime,
      });

      // ============================================
      // TASK 0: TRENDING CALCULATION (EVERY 15 MIN)
      // ============================================
      try {
        const taskStart = performance.now();
        logger.info('Task 0/4: Starting trending calculation (runs every 15 min)');

        // Load all content
        const {
          rules: rulesData,
          mcp: mcpData,
          agents: agentsData,
          commands: commandsData,
          hooks: hooksData,
          statuslines: statuslinesData,
          collections: collectionsData,
          skills: skillsData,
        } = await batchLoadContent({
          rules,
          mcp,
          agents,
          commands,
          hooks,
          statuslines,
          collections,
          skills,
        });

        // Calculate trending data
        const trendingData = await getBatchTrendingData(
          {
            agents: agentsData.map((item: { [key: string]: unknown }) => ({
              ...item,
              category: 'agents' as const,
            })),
            mcp: mcpData.map((item: { [key: string]: unknown }) => ({
              ...item,
              category: 'mcp' as const,
            })),
            rules: rulesData.map((item: { [key: string]: unknown }) => ({
              ...item,
              category: 'rules' as const,
            })),
            commands: commandsData.map((item: { [key: string]: unknown }) => ({
              ...item,
              category: 'commands' as const,
            })),
            hooks: hooksData.map((item: { [key: string]: unknown }) => ({
              ...item,
              category: 'hooks' as const,
            })),
            statuslines: statuslinesData.map((item: { [key: string]: unknown }) => ({
              ...item,
              category: 'statuslines' as const,
            })),
            collections: collectionsData.map((item: { [key: string]: unknown }) => ({
              ...item,
              category: 'collections' as const,
            })),
            skills: skillsData.map((item: { [key: string]: unknown }) => ({
              ...item,
              category: 'skills' as const,
            })),
          },
          { includeSponsored: true }
        );

        // Store in cache for 15 minutes
        await contentCache.set(
          'trending:all',
          {
            trending: trendingData.trending,
            popular: trendingData.popular,
            recent: trendingData.recent,
            metadata: trendingData.metadata,
            calculatedAt: now.toISOString(),
          },
          900 // 15 minutes TTL
        );

        results.push({
          task: 'trending_calculation',
          success: true,
          duration_ms: Math.round(performance.now() - taskStart),
          data: {
            trending_count: trendingData.trending.length,
            popular_count: trendingData.popular.length,
            recent_count: trendingData.recent.length,
          },
        });

        logger.info('Task 0/4: Trending calculation complete', {
          trending_count: trendingData.trending.length,
          popular_count: trendingData.popular.length,
          recent_count: trendingData.recent.length,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          'Task 0/4: Trending calculation failed',
          error instanceof Error ? error : new Error(String(error))
        );

        results.push({
          task: 'trending_calculation',
          success: false,
          duration_ms: Math.round(performance.now() - overallStartTime),
          error: errorMessage,
        });
      }

      // ============================================
      // DAILY TASKS (ONLY AT 3 AM UTC)
      // ============================================
      if (!isDailyMaintenanceTime) {
        const totalDuration = Math.round(performance.now() - overallStartTime);
        logger.info('Skipping daily tasks (not 3 AM UTC)', {
          total_duration_ms: totalDuration,
        });

        return okRaw(
          {
            success: results.every((r) => r.success),
            total_duration_ms: totalDuration,
            skipped_daily_tasks: true,
            results,
            timestamp: now.toISOString(),
          },
          { sMaxAge: 0, staleWhileRevalidate: 0 }
        );
      }

      // ============================================
      // TASK 1: CACHE WARMING (DAILY AT 3 AM)
      // ============================================
      try {
        const taskStart = performance.now();
        logger.info('Task 1/3: Starting cache warming');

        const cacheResult = await cacheWarmer.triggerManualWarming();

        results.push({
          task: 'cache_warming',
          success: cacheResult.success ?? false,
          duration_ms: Math.round(performance.now() - taskStart),
          data: {
            message: cacheResult.message,
          },
        });

        logger.info('Task 1/3: Cache warming complete', {
          success: cacheResult.success ? 'true' : 'false',
          message: cacheResult.message ?? 'No message',
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          'Task 1/3: Cache warming failed',
          error instanceof Error ? error : new Error(String(error))
        );

        results.push({
          task: 'cache_warming',
          success: false,
          duration_ms: Math.round(performance.now() - overallStartTime),
          error: errorMessage,
        });
      }

      // ============================================
      // TASK 2: EXPIRE JOBS
      // ============================================
      try {
        const taskStart = performance.now();
        logger.info('Task 2/3: Starting job expiration');

        const supabase = await createClient();
        const now = new Date().toISOString();

        // Find all active jobs that have expired
        const { data: expiredJobs, error: selectError } = await supabase
          .from('jobs')
          .select('id, slug, title, company, expires_at, user_id')
          .eq('status', 'active')
          .lt('expires_at', now)
          .not('expires_at', 'is', null);

        if (selectError) {
          throw new Error(`Failed to query expired jobs: ${selectError.message}`);
        }

        // Update expired jobs if any found
        let expiredCount = 0;
        if (expiredJobs && expiredJobs.length > 0) {
          const typedExpiredJobs = expiredJobs as ExpiredJob[];

          const { error: updateError } = await supabase
            .from('jobs')
            .update({
              status: 'expired',
              active: false,
            })
            .in(
              'id',
              typedExpiredJobs.map((j) => j.id)
            );

          if (updateError) {
            throw new Error(`Failed to update expired jobs: ${updateError.message}`);
          }

          expiredCount = typedExpiredJobs.length;
          logger.info(
            `Expired ${expiredCount} jobs: ${typedExpiredJobs.map((j) => j.slug).join(', ')}`
          );
        }

        results.push({
          task: 'expire_jobs',
          success: true,
          duration_ms: Math.round(performance.now() - taskStart),
          data: {
            expired_count: expiredCount,
            jobs_expired:
              expiredJobs?.map((j) => ({
                id: j.id,
                slug: j.slug,
                title: j.title,
              })) || [],
          },
        });

        logger.info('Task 2/3: Job expiration complete', {
          expired_count: expiredCount,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          'Task 2/3: Job expiration failed',
          error instanceof Error ? error : new Error(String(error))
        );

        results.push({
          task: 'expire_jobs',
          success: false,
          duration_ms: Math.round(performance.now() - overallStartTime),
          error: errorMessage,
        });
      }

      // ============================================
      // TASK 3: PROCESS EMAIL SEQUENCES
      // ============================================
      try {
        const taskStart = performance.now();
        logger.info('Task 3/3: Starting email sequence processing');

        const emailResults = await emailSequenceService.processSequenceQueue();

        results.push({
          task: 'process_email_sequences',
          success: true,
          duration_ms: Math.round(performance.now() - taskStart),
          data: {
            sent: emailResults.sent,
            failed: emailResults.failed,
            total: emailResults.sent + emailResults.failed,
            success_rate:
              emailResults.sent > 0
                ? `${((emailResults.sent / (emailResults.sent + emailResults.failed)) * 100).toFixed(1)}%`
                : '0%',
          },
        });

        logger.info('Task 3/3: Email sequence processing complete', {
          sent: emailResults.sent,
          failed: emailResults.failed,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          'Task 3/3: Email sequence processing failed',
          error instanceof Error ? error : new Error(String(error))
        );

        results.push({
          task: 'process_email_sequences',
          success: false,
          duration_ms: Math.round(performance.now() - overallStartTime),
          error: errorMessage,
        });
      }

      // ============================================
      // SUMMARY
      // ============================================
      const totalDuration = Math.round(performance.now() - overallStartTime);
      const successfulTasks = results.filter((r) => r.success).length;
      const failedTasks = results.filter((r) => !r.success).length;

      logger.info('Consolidated maintenance cron completed', {
        total_duration_ms: totalDuration,
        total_duration_sec: (totalDuration / 1000).toFixed(2),
        successful_tasks: successfulTasks,
        failed_tasks: failedTasks,
        ran_daily_tasks: isDailyMaintenanceTime,
        task_summary: JSON.stringify(
          results.map((r) => ({
            task: r.task,
            success: r.success,
            duration_ms: r.duration_ms,
          }))
        ),
      });

      // ============================================
      // BETTERSTACK HEARTBEAT (Success Only)
      // ============================================
      // Only send heartbeat on complete success - BetterStack will alert if heartbeat is missing
      // Non-blocking: Heartbeat failure won't break cron execution
      if (failedTasks === 0) {
        const { env } = await import('@/src/lib/schemas/env.schema');
        const heartbeatUrl = env.BETTERSTACK_HEARTBEAT_DAILY_MAINTENANCE;

        if (heartbeatUrl) {
          try {
            await fetch(heartbeatUrl, {
              method: 'GET',
              signal: AbortSignal.timeout(5000), // 5 second timeout
            });
            logger.info('BetterStack heartbeat sent successfully');
          } catch (error) {
            // Non-critical: Log warning but don't fail the cron
            logger.warn('Failed to send BetterStack heartbeat (non-critical)', {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      return okRaw(
        {
          success: failedTasks === 0,
          total_duration_ms: totalDuration,
          successful_tasks: successfulTasks,
          failed_tasks: failedTasks,
          ran_daily_tasks: isDailyMaintenanceTime,
          results,
          timestamp: now.toISOString(),
        },
        { sMaxAge: 0, staleWhileRevalidate: 0 }
      );
    },
  },
});

export async function GET(
  request: Request,
  context: { params: Promise<Record<string, never>> }
): Promise<Response> {
  if (!route.GET) return new Response('Method Not Allowed', { status: 405 });
  return route.GET(request, context);
}
