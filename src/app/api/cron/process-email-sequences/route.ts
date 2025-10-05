/**
 * Email Sequences Cron Job API Route
 *
 * Processes all pending email sequence sends (onboarding, drip campaigns, etc.)
 * Runs daily at 10 AM UTC (Vercel free tier compatible)
 *
 * Schedule: Daily at 10 AM UTC
 * Configured in vercel.json
 *
 * @module app/api/cron/process-email-sequences
 */

'use server';

import { NextResponse } from 'next/server';
import { logger } from '@/src/lib/logger';
import { emailSequenceService } from '@/src/lib/services/email-sequence.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET handler for email sequence processing cron job
 *
 * Processes all due emails in the onboarding sequence.
 * Runs daily to check for subscribers who need their next email.
 *
 * @param request - Next.js request object
 * @returns JSON response with processing results
 */
export async function GET(request: Request) {
  try {
    logger.info('Email sequence cron job started');

    // Process all due emails
    const results = await emailSequenceService.processSequenceQueue();

    // Check if there were emails to process
    if (results.sent === 0 && results.failed === 0) {
      logger.info('No emails due for processing');
      return NextResponse.json({
        success: true,
        message: 'No emails due',
        sent: 0,
        failed: 0,
      });
    }

    logger.info('Email sequence cron job completed', {
      sent: results.sent,
      failed: results.failed,
      total: results.sent + results.failed,
      successRate: results.sent > 0 
        ? `${((results.sent / (results.sent + results.failed)) * 100).toFixed(1)}%`
        : '0%',
    });

    return NextResponse.json({
      success: true,
      sent: results.sent,
      failed: results.failed,
      total: results.sent + results.failed,
      successRate: results.sent > 0
        ? `${((results.sent / (results.sent + results.failed)) * 100).toFixed(1)}%`
        : '0%',
    });
  } catch (error) {
    logger.error(
      'Email sequence cron job failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'process-email-sequences-cron',
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
}
