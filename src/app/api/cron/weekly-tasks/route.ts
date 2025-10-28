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

/**
 * Weekly Tasks Cron - Featured content calculation and digest distribution.
 */

import {
  type DigestContentItem,
  type DigestTrendingItem,
  WeeklyDigest,
} from '@/src/emails/templates/weekly-digest';
import { getAllCategoryIds } from '@/src/lib/config/category-config';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { getContentByCategory } from '@/src/lib/content/supabase-content-loader';
import { createApiRoute } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';
import { env } from '@/src/lib/schemas/env.schema';
import { digestService } from '@/src/lib/services/digest.server';
import { resendService } from '@/src/lib/services/resend.server';
import { createClient } from '@/src/lib/supabase/server';
import { batchFetch } from '@/src/lib/utils/batch.utils';
import { getCurrentWeekStart, getWeekEnd } from '@/src/lib/utils/data.utils';
import type { Database } from '@/src/types/database.types';

interface TaskResult {
  task: string;
  success: boolean;
  duration_ms: number;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * Featured content item with scoring metadata
 * Extends ContentItem with _featured property for featured content scores
 */
interface FeaturedContentItem extends ContentItem {
  _featured?: {
    trendingScore: number;
    ratingScore: number;
    engagementScore: number;
    freshnessScore: number;
    finalScore: number;
  };
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
const route = createApiRoute({
  auth: { type: 'cron' },
  response: { envelope: false },
  handlers: {
    GET: async ({ okRaw }) => {
      const overallStartTime = performance.now();
      const results: TaskResult[] = [];

      logger.info('Weekly tasks cron started');

      // ============================================
      // TASK 1: CALCULATE WEEKLY FEATURED
      // ============================================
      try {
        const taskStart = performance.now();
        logger.info('Task 1/2: Starting weekly featured calculation');

        const weekStart = getCurrentWeekStart();
        const weekEnd = getWeekEnd(weekStart);

        logger.info('Calculating featured for week', {
          weekStart: weekStart.toISOString().split('T')[0] ?? '',
          weekEnd: weekEnd.toISOString().split('T')[0] ?? '',
        });

        // Load all content for each category - Auto-generated from UNIFIED_CATEGORY_REGISTRY
        const allCategoryIds = getAllCategoryIds();
        const categoryContents = await batchFetch(
          allCategoryIds.map((categoryId) => getContentByCategory(categoryId))
        );

        // Combine category IDs with their loaded content
        const categories = allCategoryIds.map((categoryId, index) => ({
          name: categoryId,
          items: categoryContents[index] || [], // Default to empty array if undefined
        }));

        // Log content counts
        const contentCounts = Object.fromEntries(
          categories.map((cat) => [cat.name, cat.items.length])
        );
        logger.info('Content loaded', contentCounts);

        const featuredResults: Array<{
          category: string;
          featured: FeaturedContentItem[];
          error?: string;
        }> = [];

        const supabase = await createClient();

        for (const { name, items } of categories) {
          try {
            if (items.length === 0) {
              logger.warn(`Skipping ${name} - no content available`);
              featuredResults.push({ category: name, featured: [] });
              continue;
            }

            // Call PostgreSQL function to get featured scores (replaces TypeScript scoring logic)
            const { data: featuredScores, error: rpcError } = await supabase.rpc(
              'get_featured_content',
              {
                p_category: name,
                p_limit: 10,
              }
            );

            if (rpcError || !featuredScores || featuredScores.length === 0) {
              logger.warn(`No featured scores for ${name}`, {
                error: rpcError?.message || 'No scores returned',
                category: name,
              });
              featuredResults.push({ category: name, featured: [] });
              continue;
            }

            // Enrich database scores with full content items
            const featured = featuredScores
              .map((score): FeaturedContentItem | null => {
                const item = items.find((i) => i.slug === score.content_slug);
                if (!item) return null;

                return {
                  ...item,
                  _featured: {
                    trendingScore: Number(score.trending_score),
                    ratingScore: Number(score.rating_score),
                    engagementScore: Number(score.engagement_score),
                    freshnessScore: Number(score.freshness_score),
                    finalScore: Number(score.final_score),
                  },
                };
              })
              .filter((item): item is FeaturedContentItem => item !== null);

            const records: Database['public']['Tables']['featured_configs']['Insert'][] =
              featured.map((item, index) => ({
                content_type: name,
                content_slug: item.slug,
                rank: index + 1,
                final_score: item._featured?.finalScore ?? 0,
                trending_score: item._featured?.trendingScore ?? 0,
                rating_score: item._featured?.ratingScore ?? 0,
                engagement_score: item._featured?.engagementScore ?? 0,
                freshness_score: item._featured?.freshnessScore ?? 0,
                week_start: weekStart.toISOString().split('T')[0] ?? '',
                week_end: weekEnd.toISOString().split('T')[0] ?? '',
                calculation_metadata: {
                  views: Number(featuredScores[index]?.total_views ?? 0),
                  growthRate: Number(featuredScores[index]?.growth_rate_pct ?? 0),
                  engagement: {
                    bookmarks: Number(featuredScores[index]?.bookmark_count ?? 0),
                    copies: Number(featuredScores[index]?.copy_count ?? 0),
                    comments: Number(featuredScores[index]?.comment_count ?? 0),
                  },
                  daysOld: Number(featuredScores[index]?.days_old ?? 0),
                },
              }));

            const { error: insertError } = await supabase.from('featured_configs').insert(records);

            if (insertError) {
              throw new Error(`Failed to store featured selections: ${insertError.message}`);
            }

            featuredResults.push({ category: name, featured });
            logger.info(`Featured ${name} calculated and stored`, {
              count: featured.length,
              topSlug: featured[0]?.slug ?? 'N/A',
              topScore: featured[0]?._featured?.finalScore?.toFixed(2) ?? 'N/A',
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
                      final_score: r.featured[0]._featured?.finalScore?.toFixed(2) ?? 'N/A',
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
        const digestData = await digestService.generateDigest(weekStart);

        const digest =
          typeof digestData === 'object' && digestData !== null && !Array.isArray(digestData)
            ? (digestData as unknown as {
                weekOf: string;
                newContent: DigestContentItem[];
                trendingContent: DigestTrendingItem[];
              })
            : { weekOf: '', newContent: [], trendingContent: [] };

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

            const emailResults = await resendService.sendBatchEmails(
              subscribers,
              `This Week in Claude - ${digest.weekOf}`,
              WeeklyDigest({
                email: '{email}',
                weekOf: digest.weekOf,
                newContent: digest.newContent,
                trendingContent: digest.trendingContent,
                personalizedContent: [],
              }),
              {
                tags: [
                  { name: 'template', value: 'weekly_digest' },
                  { name: 'week', value: digest.weekOf },
                ],
                delayMs: 1000,
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

      // ============================================
      // BETTERSTACK HEARTBEAT (Success Only)
      // ============================================
      // Only send heartbeat on complete success - BetterStack will alert if heartbeat is missing
      // Non-blocking: Heartbeat failure won't break cron execution
      if (failedTasks === 0) {
        const { env } = await import('@/src/lib/schemas/env.schema');
        const heartbeatUrl = env.BETTERSTACK_HEARTBEAT_WEEKLY_TASKS;

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
