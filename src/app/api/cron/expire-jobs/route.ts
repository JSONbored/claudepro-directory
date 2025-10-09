/**
 * Job Expiration Cron Job API Route
 *
 * Automatically expires job listings that have passed their expiration date.
 * Runs daily to keep job board current and accurate.
 *
 * Schedule: Daily at midnight UTC (0 0 * * *)
 * Configured in vercel.json
 *
 * Process:
 * 1. Find all active jobs where expires_at < NOW()
 * 2. Update status to 'expired'
 * 3. Log results for monitoring
 *
 * @module app/api/cron/expire-jobs
 */

import { NextResponse } from 'next/server';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/admin-client';

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

/**
 * GET handler for job expiration cron job
 *
 * Protected by CRON_SECRET - only Vercel Cron can trigger this.
 * Validates authorization header before processing.
 *
 * @param request - Next.js request object
 * @returns JSON response with expiration results
 */
export async function GET(request: Request) {
  try {
    // Verify CRON_SECRET for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron request attempt', {
        hasAuthHeader: !!authHeader,
        hasCronSecret: !!cronSecret,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Job expiration cron started');

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
      logger.error(`Failed to query expired jobs: ${selectError.message}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to query expired jobs',
        },
        { status: 500 }
      );
    }

    // If no jobs to expire, return early
    if (!expiredJobs || expiredJobs.length === 0) {
      logger.info('No jobs to expire');
      return NextResponse.json({
        success: true,
        expiredCount: 0,
        message: 'No jobs needed expiration',
      });
    }

    const typedExpiredJobs = expiredJobs as ExpiredJob[];

    logger.info(
      `Found ${typedExpiredJobs.length} jobs to expire: ${typedExpiredJobs.map((j) => j.slug).join(', ')}`
    );

    // Update all expired jobs to 'expired' status
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
      logger.error(`Failed to update expired jobs: ${updateError.message}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update expired jobs',
        },
        { status: 500 }
      );
    }

    logger.info(
      `Successfully expired ${typedExpiredJobs.length} jobs: ${typedExpiredJobs.map((j) => `${j.slug} (${j.company})`).join(', ')}`
    );

    // TODO: Future enhancement - send expiration notification emails
    // For now, just log successful expiration

    return NextResponse.json({
      success: true,
      expiredCount: typedExpiredJobs.length,
      jobs: typedExpiredJobs.map((j) => ({
        id: j.id,
        slug: j.slug,
        title: j.title,
      })),
    });
  } catch (error) {
    logger.error(
      `Job expiration cron failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
