/**
 * Social Proof Stats API Route
 *
 * Provides live social proof data for the submission wizard:
 * - Top contributors this week
 * - Recent submission count
 * - Success rate
 * - Total user count
 */

import { NextResponse } from 'next/server';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = await createClient();

    // Get submissions this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: recentSubmissions, error: submissionsError } = await supabase
      .from('content_submissions')
      .select('id, status, created_at, author')
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false });

    if (submissionsError) {
      logger.warn('Failed to fetch recent submissions', {
        error: submissionsError.message,
      });
    }

    const submissionCount = recentSubmissions?.length || 0;

    // Calculate success rate (approved / total in last 30 days)
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const { data: monthSubmissions, error: monthError } = await supabase
      .from('content_submissions')
      .select('status')
      .gte('created_at', monthAgo.toISOString());

    if (monthError) {
      logger.warn('Failed to fetch month submissions', {
        error: monthError.message,
      });
    }

    const total = monthSubmissions?.length || 1;
    const approved = monthSubmissions?.filter((s) => s.status === 'merged').length || 0;
    const successRate = Math.round((approved / total) * 100);

    // Get top contributors this week (unique authors with most submissions)
    const contributorCounts = new Map<string, number>();
    if (recentSubmissions) {
      for (const sub of recentSubmissions) {
        if (sub.author) {
          contributorCounts.set(sub.author, (contributorCounts.get(sub.author) || 0) + 1);
        }
      }
    }

    const topContributors = Array.from(contributorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name.split('@')[0]); // Extract username from email

    // Get total content count as proxy for total users
    const { count: contentCount, error: contentError } = await supabase
      .from('content')
      .select('id', { count: 'exact', head: true });

    if (contentError) {
      logger.warn('Failed to fetch content count', {
        error: contentError.message,
      });
    }

    const totalUsers = contentCount || 1000; // Fallback to 1000

    // Return stats
    return NextResponse.json(
      {
        success: true,
        stats: {
          contributors: {
            count: topContributors.length,
            names: topContributors,
          },
          submissions: submissionCount,
          successRate,
          totalUsers,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    logger.error(
      'Social proof stats API error',
      error instanceof Error ? error : new Error(String(error)),
      {
        endpoint: '/api/stats/social-proof',
      }
    );

    return NextResponse.json(
      {
        error: 'Failed to fetch stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
