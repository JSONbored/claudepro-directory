/**
 * Weekly Digest Cron Job API Route
 *
 * Sends weekly digest emails to all newsletter subscribers.
 * Protected by CRON_SECRET for security.
 *
 * Schedule: Every Monday at 2 PM UTC (9 AM EST)
 * Configured in vercel.json
 *
 * @module app/api/cron/send-weekly-digest
 */

import { NextResponse } from 'next/server';
import { WeeklyDigest } from '@/src/emails/templates/weekly-digest';
import { logger } from '@/src/lib/logger';
import { withCronAuth } from '@/src/lib/middleware/cron-auth';
import { env } from '@/src/lib/schemas/env.schema';
import { digestService } from '@/src/lib/services/digest.service';
import { resendService } from '@/src/lib/services/resend.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET handler for weekly digest cron job
 *
 * Protected by CRON_SECRET - only Vercel Cron can trigger this.
 * Generates digest content and sends to all subscribers.
 *
 * @param request - Next.js request object
 * @returns JSON response with send results
 */
export async function GET(request: Request) {
  return withCronAuth(request, async () => {
    try {
      logger.info('Weekly digest cron job started');

      // Generate digest content for previous week
      const weekStart = digestService.getStartOfPreviousWeek();
      const digest = await digestService.generateDigest(weekStart);

      // Check if we have content to send
      if (digest.newContent.length === 0 && digest.trendingContent.length === 0) {
        logger.warn('No content for weekly digest - skipping send', {
          weekOf: digest.weekOf,
        });
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: 'No content available',
          weekOf: digest.weekOf,
        });
      }

      // Get all subscribers
      const subscribers = await resendService.getAllContacts(env.RESEND_AUDIENCE_ID);

      if (subscribers.length === 0) {
        logger.warn('No subscribers found - skipping digest send');
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: 'No subscribers',
          weekOf: digest.weekOf,
        });
      }

      logger.info(`Sending digest to ${subscribers.length} subscribers`, {
        weekOf: digest.weekOf,
        newContent: digest.newContent.length,
        trending: digest.trendingContent.length,
      });

      // Send emails in batches
      const results = await resendService.sendBatchEmails(
        subscribers,
        `This Week in Claude - ${digest.weekOf}`,
        WeeklyDigest({ email: '{email}', ...digest }), // {email} will be replaced per recipient
        {
          tags: [
            { name: 'template', value: 'weekly_digest' },
            { name: 'week', value: digest.weekOf },
          ],
          delayMs: 1000, // 1 second delay between batches
        }
      );

      logger.info('Weekly digest cron job completed', {
        weekOf: digest.weekOf,
        totalSubscribers: subscribers.length,
        success: results.success,
        failed: results.failed,
        successRate: `${((results.success / subscribers.length) * 100).toFixed(1)}%`,
      });

      // Log errors if any
      if (results.errors.length > 0) {
        logger.error('Some digest emails failed to send', undefined, {
          failedCount: results.failed,
          errorCount: results.errors.length,
          // Log first 3 errors as samples
          sampleError1: results.errors[0] || 'none',
          sampleError2: results.errors[1] || 'none',
          sampleError3: results.errors[2] || 'none',
        });
      }

      return NextResponse.json({
        success: true,
        weekOf: digest.weekOf,
        sent: results.success,
        failed: results.failed,
        total: subscribers.length,
        successRate: `${((results.success / subscribers.length) * 100).toFixed(1)}%`,
        newContentCount: digest.newContent.length,
        trendingCount: digest.trendingContent.length,
      });
    } catch (error) {
      logger.error(
        'Weekly digest cron job failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'send-weekly-digest-cron',
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}
