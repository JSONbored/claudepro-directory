import { type NextRequest, NextResponse } from 'next/server';
import { cacheWarmer } from '@/lib/cache-warmer';
import { logger } from '@/lib/logger';

/**
 * API endpoint to manually trigger cache warming
 * POST /api/cache/warm
 *
 * This can be triggered by:
 * - Admin dashboard
 * - Cron job (Vercel Cron or GitHub Actions)
 * - Manual trigger for testing
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication here if needed
    // For now, we'll allow manual triggering but rate limit it

    // Check if this is a scheduled cron job (Vercel Cron)
    const authHeader = request.headers.get('authorization');
    const isScheduledJob = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (isScheduledJob) {
      logger.info('Cache warming triggered by scheduled job');
    } else {
      logger.info('Cache warming triggered manually', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
    }

    // Trigger cache warming
    const result = await cacheWarmer.triggerManualWarming();

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          timestamp: new Date().toISOString(),
        },
        { status: 429 } // Too Many Requests if already running
      );
    }
  } catch (error) {
    logger.error('Cache warming API error', error as Error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error during cache warming',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check cache warming status
 */
export async function GET() {
  try {
    const status = await cacheWarmer.getStatus();

    return NextResponse.json(
      {
        ...status,
        currentTime: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Failed to get cache warming status', error as Error);

    return NextResponse.json(
      {
        error: 'Failed to retrieve cache warming status',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
