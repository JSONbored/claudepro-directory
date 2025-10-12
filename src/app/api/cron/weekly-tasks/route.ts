/**
 * Weekly Tasks Cron Job
 *
 * Consolidates weekly tasks into a single cron job for Vercel free tier compliance.
 * Runs every Monday at 00:00 UTC to perform weekly content curation and email distribution.
 *
 * Schedule: Every Monday at 00:00 UTC (0 0 * * 1)
 * Configured in vercel.json
 *
 * Tasks performed (in sequence):
 * 1. Calculate Weekly Featured - Multi-factor scoring for top content per category
 * 2. Send Weekly Digest - Email newsletter to all subscribers with week's highlights
 *
 * Performance:
 * - Sequential execution (featured calculation feeds into digest content)
 * - Individual task error handling
 * - Comprehensive logging for monitoring
 *
 * @module app/api/cron/weekly-tasks
 */

import { NextResponse } from 'next/server';
import { WeeklyDigest } from '@/src/emails/templates/weekly-digest';
import { getContentByCategory } from '@/src/lib/content/content-loaders';
import { logger } from '@/src/lib/logger';
import { withCronAuth } from '@/src/lib/middleware/cron-auth';
import { env } from '@/src/lib/schemas/env.schema';
import { digestService } from '@/src/lib/services/digest.service';
import {
  type FeaturedContentItem,
  featuredCalculatorService,
} from '@/src/lib/services/featured-calculator.service';
import { resendService } from '@/src/lib/services/resend.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TaskResult {
  task: string;
  success: boolean;
  duration_ms: number;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * GET handler for weekly tasks cron job
 *
 * Protected by CRON_SECRET - only Vercel Cron can trigger this.
 * Executes all weekly tasks sequentially.
 *
 * @param request - Next.js request object
 * @returns JSON response with all task results
 */
export async function GET(request: Request) {
  return withCronAuth(request, async () => {
    const overallStartTime = performance.now();
    const results: TaskResult[] = [];

    logger.info('Weekly tasks cron started');

    // ============================================
    // TASK 1: CALCULATE WEEKLY FEATURED
    // ============================================
    try {
      const taskStart = performance.now();
      logger.info('Task 1/2: Starting weekly featured calculation');

      const weekStart = featuredCalculatorService.getCurrentWeekStart();
      const weekEnd = featuredCalculatorService.getWeekEnd(weekStart);

      logger.info('Calculating featured for week', {
        weekStart: weekStart.toISOString().split('T')[0] ?? '',
        weekEnd: weekEnd.toISOString().split('T')[0] ?? '',
      });

      // Load all content for each category
      const [rules, mcpServers, agents, commands, hooks, statuslines, collections] =
        await Promise.all([
          getContentByCategory('rules'),
          getContentByCategory('mcp'),
          getContentByCategory('agents'),
          getContentByCategory('commands'),
          getContentByCategory('hooks'),
          getContentByCategory('statuslines'),
          getContentByCategory('collections'),
        ]);

      logger.info('Content loaded', {
        rules: rules.length,
        mcp: mcpServers.length,
        agents: agents.length,
        commands: commands.length,
        hooks: hooks.length,
        statuslines: statuslines.length,
        collections: collections.length,
      });

      // Calculate featured for each category
      const categories = [
        { name: 'rules', items: rules },
        { name: 'mcp', items: mcpServers },
        { name: 'agents', items: agents },
        { name: 'commands', items: commands },
        { name: 'hooks', items: hooks },
        { name: 'statuslines', items: statuslines },
        { name: 'collections', items: collections },
      ];

      const featuredResults: Array<{
        category: string;
        featured: FeaturedContentItem[];
        error?: string;
      }> = [];

      for (const { name, items } of categories) {
        try {
          if (items.length === 0) {
            logger.warn(`Skipping ${name} - no content available`);
            featuredResults.push({ category: name, featured: [] });
            continue;
          }

          const featured = await featuredCalculatorService.calculateFeaturedForCategory(
            name,
            items,
            { limit: 10 }
          );

          // Store featured selections in database
          await featuredCalculatorService.storeFeaturedSelections(name, featured, weekStart);

          featuredResults.push({ category: name, featured });
          logger.info(`Featured ${name} calculated and stored`, {
            count: featured.length,
            topSlug: featured[0]?.slug ?? 'N/A',
            topScore: featured[0]?.finalScore?.toFixed(2) ?? 'N/A',
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`Failed to calculate featured for ${name}`, errorMessage);
          featuredResults.push({
            category: name,
            featured: [],
            error: errorMessage,
          });
        }
      }

      const totalFeatured = featuredResults.reduce((sum, r) => sum + r.featured.length, 0);
      const featuredErrors = featuredResults.filter((r) => r.error).length;

      results.push({
        task: 'calculate_weekly_featured',
        success: featuredErrors === 0,
        duration_ms: Math.round(performance.now() - taskStart),
        data: {
          week_start: weekStart.toISOString().split('T')[0] ?? '',
          week_end: weekEnd.toISOString().split('T')[0] ?? '',
          total_featured: totalFeatured,
          errors: featuredErrors,
          categories_summary: JSON.stringify(
            featuredResults.map((r) => ({
              category: r.category,
              count: r.featured.length,
              top_item: r.featured[0]
                ? {
                    slug: r.featured[0].slug,
                    final_score: r.featured[0].finalScore.toFixed(2),
                  }
                : null,
              error: r.error,
            }))
          ),
        },
      });

      logger.info('Task 1/2: Weekly featured calculation complete', {
        total_featured: totalFeatured,
        errors: featuredErrors,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Task 1/2: Weekly featured calculation failed',
        error instanceof Error ? error : new Error(String(error))
      );

      results.push({
        task: 'calculate_weekly_featured',
        success: false,
        duration_ms: Math.round(performance.now() - overallStartTime),
        error: errorMessage,
      });
    }

    // ============================================
    // TASK 2: SEND WEEKLY DIGEST
    // ============================================
    try {
      const taskStart = performance.now();
      logger.info('Task 2/2: Starting weekly digest send');

      // Generate digest content for previous week
      const weekStart = digestService.getStartOfPreviousWeek();
      const digest = await digestService.generateDigest(weekStart);

      // Check if we have content to send
      if (digest.newContent.length === 0 && digest.trendingContent.length === 0) {
        logger.warn('No content for weekly digest - skipping send', {
          weekOf: digest.weekOf,
        });

        results.push({
          task: 'send_weekly_digest',
          success: true,
          duration_ms: Math.round(performance.now() - taskStart),
          data: {
            skipped: true,
            reason: 'No content available',
            week_of: digest.weekOf,
          },
        });

        logger.info('Task 2/2: Weekly digest skipped (no content)');
      } else {
        // Get all subscribers
        const subscribers = await resendService.getAllContacts(env.RESEND_AUDIENCE_ID);

        if (subscribers.length === 0) {
          logger.warn('No subscribers found - skipping digest send');

          results.push({
            task: 'send_weekly_digest',
            success: true,
            duration_ms: Math.round(performance.now() - taskStart),
            data: {
              skipped: true,
              reason: 'No subscribers',
              week_of: digest.weekOf,
            },
          });

          logger.info('Task 2/2: Weekly digest skipped (no subscribers)');
        } else {
          logger.info(`Sending digest to ${subscribers.length} subscribers`, {
            weekOf: digest.weekOf,
            newContent: digest.newContent.length,
            trending: digest.trendingContent.length,
          });

          // Send emails in batches
          const emailResults = await resendService.sendBatchEmails(
            subscribers,
            `This Week in Claude - ${digest.weekOf}`,
            WeeklyDigest({ email: '{email}', ...digest }),
            {
              tags: [
                { name: 'template', value: 'weekly_digest' },
                { name: 'week', value: digest.weekOf },
              ],
              delayMs: 1000, // 1 second delay between batches
            }
          );

          results.push({
            task: 'send_weekly_digest',
            success: true,
            duration_ms: Math.round(performance.now() - taskStart),
            data: {
              week_of: digest.weekOf,
              sent: emailResults.success,
              failed: emailResults.failed,
              total: subscribers.length,
              success_rate: `${((emailResults.success / subscribers.length) * 100).toFixed(1)}%`,
              new_content_count: digest.newContent.length,
              trending_count: digest.trendingContent.length,
              errors_count: emailResults.errors.length,
            },
          });

          logger.info('Task 2/2: Weekly digest send complete', {
            sent: emailResults.success,
            failed: emailResults.failed,
            total: subscribers.length,
          });

          // Log errors if any
          if (emailResults.errors.length > 0) {
            logger.error('Some digest emails failed to send', undefined, {
              failed_count: emailResults.failed,
              error_count: emailResults.errors.length,
              sample_errors: JSON.stringify(emailResults.errors.slice(0, 3)),
            });
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Task 2/2: Weekly digest send failed',
        error instanceof Error ? error : new Error(String(error))
      );

      results.push({
        task: 'send_weekly_digest',
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

    logger.info('Weekly tasks cron completed', {
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

    return NextResponse.json({
      success: failedTasks === 0,
      total_duration_ms: totalDuration,
      successful_tasks: successfulTasks,
      failed_tasks: failedTasks,
      results,
      timestamp: new Date().toISOString(),
    });
  });
}
