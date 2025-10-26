/**
 * Daily Maintenance Cron Job
 *
 * ARCHITECTURE CHANGE (2025-10-27):
 * - Tasks 1 & 3 migrated to pg_cron (database-native scheduling)
 * - This route now only handles Task 2 (Email Sequences)
 * - Reduced from 3 tasks to 1 task (67% reduction in Vercel Edge invocations)
 *
 * Schedule: Daily at 3 AM UTC (0 3 * * *)
 * Configured in vercel.json
 *
 * Tasks performed:
 * ✅ Email Sequences - Process onboarding and drip campaign emails (REMAINS HERE)
 * ❌ Job Expiration - MIGRATED to pg_cron (expire_jobs_daily)
 * ❌ User Stats Refresh - MIGRATED to pg_cron (refresh_user_stats_daily)
 *
 * Why Email Sequences remains in Vercel:
 * - Requires Next.js revalidation after email operations
 * - Uses Edge runtime for faster email sending
 * - Integrates with Resend API (external service)
 *
 * @see /supabase/migrations/20251027000007_add_daily_maintenance_pg_cron_jobs.sql
 * @module app/api/cron/daily-maintenance
 */

import { createApiRoute } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';
import { emailSequenceService } from '@/src/lib/services/email-sequence.server';

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
 * Processes email sequences only (other tasks migrated to pg_cron).
 *
 * @param request - Next.js request object
 * @returns JSON response with task result
 */
const route = createApiRoute({
  auth: { type: 'cron' },
  response: { envelope: false },
  handlers: {
    GET: async ({ okRaw }) => {
      const overallStartTime = performance.now();
      const results: TaskResult[] = [];

      logger.info('Daily maintenance cron started (email sequences only)');

      // ============================================
      // ARCHITECTURE CHANGE (2025-10-27):
      // Tasks 1 & 3 migrated to pg_cron for better reliability and zero latency
      // Only Task 2 (Email Sequences) remains in this Vercel Edge Function
      // ============================================
      // TASK 1: EXPIRE JOBS → MIGRATED to pg_cron (expire_jobs_daily at 3 AM UTC)
      // TASK 3: REFRESH USER STATS → MIGRATED to pg_cron (refresh_user_stats_daily at 3 AM UTC)
      // ============================================

      // TASK: PROCESS EMAIL SEQUENCES (only remaining task)
      try {
        const taskStart = performance.now();
        logger.info('Starting email sequence processing');

        const emailResults = await emailSequenceService.processSequenceQueue();

        logger.info('Email sequence processing complete', {
          sent: emailResults.sent,
          failed: emailResults.failed,
        });

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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          'Email sequence processing failed',
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
      const taskResult = results[0];
      const success = taskResult?.success ?? false;

      logger.info('Daily maintenance cron completed', {
        total_duration_ms: totalDuration,
        total_duration_sec: (totalDuration / 1000).toFixed(2),
        success,
        task: taskResult?.task ?? 'none',
      });

      // ============================================
      // BETTERSTACK HEARTBEAT (Success Only)
      // ============================================
      // Only send heartbeat on success - BetterStack will alert if heartbeat is missing
      // Non-blocking: Heartbeat failure won't break cron execution
      if (success) {
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
          success,
          total_duration_ms: totalDuration,
          task: taskResult?.task ?? 'process_email_sequences',
          data: taskResult?.data,
          error: taskResult?.error,
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
