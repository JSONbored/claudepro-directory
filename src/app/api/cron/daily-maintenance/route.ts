/**
 * Daily Maintenance Cron Job
 *
 * Consolidates multiple daily tasks into a single cron job for Vercel free tier compliance.
 * Runs daily at 3 AM UTC to perform essential maintenance operations.
 *
 * Schedule: Daily at 3 AM UTC (0 3 * * *)
 * Configured in vercel.json
 *
 * Tasks performed (in parallel):
 * 1. Job Expiration - Mark expired job listings as inactive
 * 2. Email Sequences - Process onboarding and drip campaign emails
 * 3. User Stats Refresh - Update materialized view for dashboard performance
 *
 * Performance:
 * - Parallel execution for 2-3x faster completion (OPTIMIZATION 2025-10-22)
 * - Individual task error handling (one failure doesn't break others)
 * - Comprehensive logging for monitoring
 *
 * @module app/api/cron/daily-maintenance
 */

import { createApiRoute } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';
import { emailSequenceService } from '@/src/lib/services/email-sequence.server';
import { createClient } from '@/src/lib/supabase/admin-client';

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

      logger.info('Daily maintenance cron started');

      // ============================================
      // OPTIMIZATION (2025-10-22): PARALLEL EXECUTION
      // All 3 tasks are independent and can run in parallel
      // BEFORE: Sequential execution (Task 1 → Task 2 → Task 3)
      // AFTER: Parallel execution (Task 1 + Task 2 + Task 3 simultaneously)
      // Expected speedup: 2-3x faster total execution time
      // ============================================
      // REMOVED: Cache warming task (~225K Redis commands/month saved)
      // Next.js ISR already handles cache pre-population automatically
      // ============================================

      const taskPromises = [
        // TASK 1: EXPIRE JOBS
        (async (): Promise<TaskResult> => {
          try {
            const taskStart = performance.now();
            logger.info('Task 1/3: Starting job expiration');

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

            logger.info('Task 1/3: Job expiration complete', {
              expired_count: expiredCount,
            });

            return {
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
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(
              'Task 1/3: Job expiration failed',
              error instanceof Error ? error : new Error(String(error))
            );

            return {
              task: 'expire_jobs',
              success: false,
              duration_ms: Math.round(performance.now() - overallStartTime),
              error: errorMessage,
            };
          }
        })(),

        // TASK 2: PROCESS EMAIL SEQUENCES
        (async (): Promise<TaskResult> => {
          try {
            const taskStart = performance.now();
            logger.info('Task 2/3: Starting email sequence processing');

            const emailResults = await emailSequenceService.processSequenceQueue();

            logger.info('Task 2/3: Email sequence processing complete', {
              sent: emailResults.sent,
              failed: emailResults.failed,
            });

            return {
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
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(
              'Task 2/3: Email sequence processing failed',
              error instanceof Error ? error : new Error(String(error))
            );

            return {
              task: 'process_email_sequences',
              success: false,
              duration_ms: Math.round(performance.now() - overallStartTime),
              error: errorMessage,
            };
          }
        })(),

        // TASK 3: REFRESH USER STATS MATERIALIZED VIEW
        (async (): Promise<TaskResult> => {
          try {
            const taskStart = performance.now();
            logger.info('Task 3/3: Starting user stats refresh');

            const supabase = await createClient();
            const { data: refreshResult, error: rpcError } =
              await supabase.rpc('refresh_user_stats');

            if (rpcError) {
              throw new Error(`RPC call failed: ${rpcError.message}`);
            }

            const result = Array.isArray(refreshResult) ? refreshResult[0] : refreshResult;

            if (!result?.success) {
              throw new Error(result?.message || 'Unknown error during refresh');
            }

            logger.info('Task 3/3: User stats refresh complete', {
              rows_refreshed: result.rows_refreshed,
              duration_ms: result.duration_ms,
            });

            return {
              task: 'refresh_user_stats',
              success: true,
              duration_ms: Math.round(performance.now() - taskStart),
              data: {
                rows_refreshed: result.rows_refreshed,
                refresh_duration_ms: result.duration_ms,
              },
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(
              'Task 3/3: User stats refresh failed',
              error instanceof Error ? error : new Error(String(error))
            );

            return {
              task: 'refresh_user_stats',
              success: false,
              duration_ms: Math.round(performance.now() - overallStartTime),
              error: errorMessage,
            };
          }
        })(),
      ];

      // Execute all tasks in parallel and wait for completion
      const taskResults = await Promise.all(taskPromises);
      results.push(...taskResults);

      // ============================================
      // SUMMARY
      // ============================================
      const totalDuration = Math.round(performance.now() - overallStartTime);
      const successfulTasks = results.filter((r) => r.success).length;
      const failedTasks = results.filter((r) => !r.success).length;

      logger.info('Daily maintenance cron completed', {
        total_duration_ms: totalDuration,
        total_duration_sec: (totalDuration / 1000).toFixed(2),
        successful_tasks: successfulTasks,
        failed_tasks: failedTasks,
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
          results,
          timestamp: new Date().toISOString(),
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
