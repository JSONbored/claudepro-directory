/**
 * Weekly Featured Configs Calculation Cron Job
 *
 * Calculates and stores top featured configs for each category using multi-factor scoring:
 * - Trending score (40%): 24h growth rate from Redis
 * - Rating score (30%): Average user ratings (when reviews feature is implemented)
 * - Engagement score (20%): Bookmarks, copies, comments, views
 * - Freshness score (10%): Recency boost for new content
 *
 * Schedule: Every Monday at 00:00 UTC
 * Configured in vercel.json
 *
 * @module app/api/cron/calculate-weekly-featured
 */

import { NextResponse } from 'next/server';
import { getContentByCategory } from '@/src/lib/content/content-loaders';
import { logger } from '@/src/lib/logger';
import { withCronAuth } from '@/src/lib/middleware/cron-auth';
import {
  type FeaturedContentItem,
  featuredCalculatorService,
} from '@/src/lib/services/featured-calculator.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET handler for weekly featured calculation cron job
 *
 * Protected by CRON_SECRET - only Vercel Cron can trigger this.
 * Calculates top 10 featured items per category and stores in database.
 *
 * @param request - Next.js request object
 * @returns JSON response with calculation results
 */
export async function GET(request: Request) {
  return withCronAuth(request, async () => {
    const startTime = Date.now();
    logger.info('Weekly featured configs calculation started');

    try {
      const weekStart = featuredCalculatorService.getCurrentWeekStart();
      const weekEnd = featuredCalculatorService.getWeekEnd(weekStart);

      logger.info('Calculating featured for week', {
        weekStart: weekStart.toISOString().split('T')[0] as string,
        weekEnd: weekEnd.toISOString().split('T')[0] as string,
      });

      // Step 1: Load all content for each category
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

      // Step 2: Calculate featured for each category in parallel
      const categories = [
        { name: 'rules', items: rules },
        { name: 'mcp', items: mcpServers },
        { name: 'agents', items: agents },
        { name: 'commands', items: commands },
        { name: 'hooks', items: hooks },
        { name: 'statuslines', items: statuslines },
        { name: 'collections', items: collections },
      ];

      const results: Array<{
        category: string;
        featured: FeaturedContentItem[];
        error?: string;
      }> = [];

      // Calculate featured for each category
      for (const { name, items } of categories) {
        try {
          if (items.length === 0) {
            logger.warn(`Skipping ${name} - no content available`);
            results.push({ category: name, featured: [] });
            continue;
          }

          const featured = await featuredCalculatorService.calculateFeaturedForCategory(
            name,
            items,
            { limit: 10 }
          );

          // Store featured selections in database
          await featuredCalculatorService.storeFeaturedSelections(name, featured, weekStart);

          results.push({ category: name, featured });
          logger.info(`Featured ${name} calculated and stored`, {
            count: featured.length,
            topSlug: featured[0]?.slug ?? 'N/A',
            topScore: featured[0]?.finalScore?.toFixed(2) ?? 'N/A',
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`Failed to calculate featured for ${name}`, errorMessage);
          results.push({
            category: name,
            featured: [],
            error: errorMessage,
          });
        }
      }

      const duration = Date.now() - startTime;
      const totalFeatured = results.reduce((sum, r) => sum + r.featured.length, 0);
      const errors = results.filter((r) => r.error).length;

      logger.info('Weekly featured calculation complete', {
        duration: `${duration}ms`,
        totalFeatured,
        errors,
        weekStart: weekStart.toISOString().split('T')[0] as string,
      });

      return NextResponse.json({
        success: true,
        weekStart: weekStart.toISOString().split('T')[0] as string,
        weekEnd: weekEnd.toISOString().split('T')[0] as string,
        duration: `${duration}ms`,
        results: results.map((r) => ({
          category: r.category,
          count: r.featured.length,
          topItem: r.featured[0]
            ? {
                slug: r.featured[0].slug,
                finalScore: r.featured[0].finalScore.toFixed(2),
              }
            : null,
          error: r.error,
        })),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Weekly featured calculation failed', errorMessage);

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          duration: `${Date.now() - startTime}ms`,
        },
        { status: 500 }
      );
    }
  });
}
