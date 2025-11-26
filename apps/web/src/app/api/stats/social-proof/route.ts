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

import { Constants } from '@heyclaude/database-types';
import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
  withDuration,
} from '@heyclaude/web-runtime/core';
import { createSupabaseAnonClient } from '@heyclaude/web-runtime/server';
import { createErrorResponse } from '@heyclaude/web-runtime/utils/error-handler';
import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  // Generate single requestId for this API request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(
    requestId,
    '/api/stats/social-proof',
    'SocialProofStatsAPI'
  );

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
    interface SubmissionRow {
      id: string;
      status: string;
      created_at: string;
      author: string | null;
    }
    interface StatusRow {
      status: string;
    }

    let recentSubmissions: SubmissionRow[] | null = null;
    let submissionsError: unknown = null;
    if (recentResult.status === 'fulfilled') {
      const response = recentResult.value as { data: SubmissionRow[] | null; error: unknown };
      recentSubmissions = response.data;
      submissionsError = response.error ?? null;
    } else {
      submissionsError = recentResult.reason;
    }

    if (submissionsError) {
      const normalized = normalizeError(submissionsError, 'Failed to fetch recent submissions');
      logger.warn('Failed to fetch recent submissions', undefined, {
        ...baseLogContext,
        error: normalized.message,
      });
    }

    let monthSubmissions: StatusRow[] | null = null;
    let monthError: unknown = null;
    if (monthResult.status === 'fulfilled') {
      const response = monthResult.value as { data: StatusRow[] | null; error: unknown };
      monthSubmissions = response.data;
      monthError = response.error ?? null;
    } else {
      monthError = monthResult.reason;
    }

    if (monthError) {
      const normalized = normalizeError(monthError, 'Failed to fetch month submissions');
      logger.warn('Failed to fetch month submissions', undefined, {
        ...baseLogContext,
        error: normalized.message,
      });
    }

    let contentCount: number | null = null;
    let contentError: unknown = null;
    if (contentResult.status === 'fulfilled') {
      const response = contentResult.value as { count: number | null; error: unknown };
      contentCount = response.count;
      contentError = response.error ?? null;
    } else {
      contentError = contentResult.reason;
    }

    if (contentError) {
      const normalized = normalizeError(contentError, 'Failed to fetch content count');
      logger.warn('Failed to fetch content count', undefined, {
        ...baseLogContext,
        error: normalized.message,
      });
    }

    const submissionCount = recentSubmissions?.length ?? 0;
    const total = monthSubmissions?.length ?? 0;
    const approved =
      monthSubmissions?.filter(
        (s) => s.status === Constants.public.Enums.submission_status[4] // 'merged'
      ).length ?? 0;
    const successRate = total > 0 ? Math.round((approved / total) * 100) : null;

    // Get top contributors this week (unique authors with most submissions)
    const contributorCounts = new Map<string, number>();
    if (recentSubmissions) {
      for (const sub of recentSubmissions) {
        if (sub.author) {
          contributorCounts.set(sub.author, (contributorCounts.get(sub.author) ?? 0) + 1);
        }
      }
    }

    const topContributors = [...contributorCounts.entries()]
      .toSorted((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => {
        // Defensively extract username: handle both email and non-email formats
        const atIndex = name.indexOf('@');
        if (atIndex !== -1) {
          // Email format: extract username part before '@'
          return name.slice(0, Math.max(0, atIndex));
        }
        // Non-email format: return trimmed original name
        return name.trim();
      });

    const totalUsers = contentCount ?? null;
    const timestamp = new Date().toISOString();

    // Structured logging with cache tags, duration, and stats
    logger.info(
      'Social proof stats API: success',
      withDuration(
        {
          ...baseLogContext,
          stats: {
            contributorCount: topContributors.length,
            submissionCount,
            successRate,
            totalUsers,
          },
          cacheTags: ['stats', 'social-proof'],
          cacheTTL: 300,
          revalidate: 300,
        },
        startTime
      )
    );

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
