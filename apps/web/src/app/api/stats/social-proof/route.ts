/**
 * Social Proof Stats API Route
 *
 * Provides live social proof data for the submission wizard:
 * - Top contributors this week
 * - Recent submission count
 * - Success rate
 * - Total user count
 *
 * Runtime: Node.js (required for Supabase client)
 * ISR: 5 minutes (300s) - Social proof updates frequently
 */
export const runtime = 'nodejs';
export const revalidate = 300;

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { createSupabaseAnonClient } from '@heyclaude/web-runtime/server';
import { createErrorResponse } from '@heyclaude/web-runtime/utils/error-handler';
import { generateRequestId } from '@heyclaude/web-runtime/utils/request-context';
import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  try {
    const supabase = createSupabaseAnonClient();

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
        requestId: generateRequestId(),
        operation: 'SocialProofStatsAPI',
        route: '/api/stats/social-proof',
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
        requestId: generateRequestId(),
        operation: 'SocialProofStatsAPI',
        route: '/api/stats/social-proof',
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
        requestId: generateRequestId(),
        operation: 'SocialProofStatsAPI',
        route: '/api/stats/social-proof',
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

    const totalUsers = contentCount ?? null;
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();

    // Structured logging with cache tags, duration, and stats
    logger.info('Social proof stats API: success', {
      requestId: generateRequestId(),
      operation: 'SocialProofStatsAPI',
      route: '/api/stats/social-proof',
      stats: {
        contributorCount: topContributors.length,
        submissionCount,
        successRate,
        totalUsers,
      },
      duration,
      cacheTags: ['stats', 'social-proof'],
      cacheTTL: 300,
      revalidate: 300,
    });

    // Generate ETag from timestamp and stats hash for conditional requests
    const statsHash = `${submissionCount}-${successRate}-${totalUsers}`;
    const etag = `"${Buffer.from(`${timestamp}-${statsHash}`).toString('base64').slice(0, 16)}"`;

    // Return stats with ETag and Last-Modified headers
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
        timestamp,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          ETag: etag,
          'Last-Modified': new Date(timestamp).toUTCString(),
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    return createErrorResponse(error, {
      route: '/api/stats/social-proof',
      operation: 'SocialProofStatsAPI',
      method: 'GET',
      logContext: { duration },
    });
  }
}
