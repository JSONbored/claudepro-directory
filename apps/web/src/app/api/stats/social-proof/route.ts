/**
 * Social Proof Stats API Route
 *
 * Provides live social proof data for the submission wizard:
 * - Top contributors this week
 * - Recent submission count
 * - Success rate
 * - Total user count
 */

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { createSupabaseServerClient } from '@heyclaude/web-runtime/data';
import { NextResponse } from 'next/server';

export const revalidate = 300;

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Calculate date ranges
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Execute all queries in parallel
    const [recentResult, monthResult, contentResult] = await Promise.allSettled([
      supabase
        .from('content_submissions')
        .select('id, status, created_at, author')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false }),
      supabase
        .from('content_submissions')
        .select('status')
        .gte('created_at', monthAgo.toISOString()),
      supabase.from('content').select('id', { count: 'exact', head: true }),
    ]);

    // Extract results and handle errors
    const recentSubmissions = recentResult.status === 'fulfilled' ? recentResult.value.data : null;
    const submissionsError =
      recentResult.status === 'rejected'
        ? recentResult.reason
        : recentResult.status === 'fulfilled'
          ? recentResult.value.error || null
          : null;

    if (submissionsError) {
      const normalized = normalizeError(submissionsError, 'Failed to fetch recent submissions');
      logger.warn('Failed to fetch recent submissions', undefined, {
        error: normalized.message,
      });
    }

    const monthSubmissions = monthResult.status === 'fulfilled' ? monthResult.value.data : null;
    const monthError =
      monthResult.status === 'rejected'
        ? monthResult.reason
        : monthResult.status === 'fulfilled'
          ? monthResult.value.error || null
          : null;

    if (monthError) {
      const normalized = normalizeError(monthError, 'Failed to fetch month submissions');
      logger.warn('Failed to fetch month submissions', undefined, {
        error: normalized.message,
      });
    }

    const contentCount = contentResult.status === 'fulfilled' ? contentResult.value.count : null;
    const contentError =
      contentResult.status === 'rejected'
        ? contentResult.reason
        : contentResult.status === 'fulfilled'
          ? contentResult.value.error || null
          : null;

    if (contentError) {
      const normalized = normalizeError(contentError, 'Failed to fetch content count');
      logger.warn('Failed to fetch content count', undefined, {
        error: normalized.message,
      });
    }

    const submissionCount = recentSubmissions?.length || 0;
    const total = monthSubmissions?.length || 0;
    const approved = monthSubmissions?.filter((s) => s.status === 'merged').length || 0;
    const successRate = total > 0 ? Math.round((approved / total) * 100) : null;

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
      .map(([name]) => {
        // Defensively extract username: handle both email and non-email formats
        const atIndex = name.indexOf('@');
        if (atIndex !== -1) {
          // Email format: extract username part before '@'
          return name.substring(0, atIndex);
        }
        // Non-email format: return trimmed original name
        return name.trim();
      });

    const totalUsers = contentCount || null;

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
    const normalized = normalizeError(error, 'Social proof stats API error');
    logger.error('Social proof stats API error', normalized, {
      endpoint: '/api/stats/social-proof',
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch stats',
        message:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : 'An error occurred while fetching statistics',
      },
      { status: 500 }
    );
  }
}
