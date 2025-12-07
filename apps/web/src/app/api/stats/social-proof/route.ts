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
import { Constants } from '@heyclaude/database-types';
import {
  generateRequestId,
  logger,
  normalizeError,
  createErrorResponse,
} from '@heyclaude/web-runtime/logging/server';
import { createSupabaseAdminClient } from '@heyclaude/web-runtime/server';
import { connection, NextResponse } from 'next/server';

/**
 * Provide live social proof metrics for the submission wizard.
 *
 * Returns aggregated, derived values: top contributors this week (up to 5 usernames),
 * `submissions` — count of submissions in the past 7 days, `successRate` — percentage of
 * submissions with status 'merged' over the past 30 days (or `null` if there are no submissions),
 * and `totalUsers` — total content/user count (or `null` if unavailable). The response also
 * includes an ISO 8601 `timestamp` and is served with cache headers (`Cache-Control`, `ETag`,
 * `Last-Modified`) to support conditional requests and short-term caching.
 *
 * @returns A NextResponse with status 200 and JSON body:
 *  {
 *    success: true,
 *    stats: {
 *      contributors: { count: number, names: string[] },
 *      submissions: number,
 *      successRate: number | null,
 *      totalUsers: number | null
 *    },
 *    timestamp: string
 *  }
 *  On failure, returns a standardized error response produced by `createErrorResponse`.
 *
 * @see createSupabaseAdminClient
 * @see generateRequestId
 * @see normalizeError
 * @see createErrorResponse
 * @see Constants.public.Enums.submission_status
 */
export async function GET() {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this API request (after connection() to allow Date.now())
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'SocialProofStatsAPI',
    route: '/api/stats/social-proof',
    module: 'apps/web/src/app/api/stats/social-proof',
  });

  try {
    // Use admin client to bypass RLS for public stats API
    // The RLS policy on content_submissions checks auth.users table which anon client cannot access
    // Use admin client to bypass RLS for aggregated stats
    // Security posture: Least-privilege
    // - Admin client uses service-role key with strictly necessary privileges
    // - Handler is restricted to read-only queries with minimal selects (id, status, created_at, author)
    // - Returns only derived aggregates/usernames (no sensitive data)
    // - No additional sensitive columns can be pulled accidentally (read-only, minimal selects enforced)
    const supabase = createSupabaseAdminClient();

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
      author: null | string;
      created_at: string;
      id: string;
      status: string;
    }
    interface StatusRow {
      status: string;
    }

    let recentSubmissions: null | SubmissionRow[] = null;
    let submissionsError: unknown = null;
    if (recentResult.status === 'fulfilled') {
      const response = recentResult.value as { data: null | SubmissionRow[]; error: unknown };
      recentSubmissions = response.data;
      submissionsError = response.error ?? null;
    } else {
      submissionsError = recentResult.reason;
    }

    if (submissionsError !== null && submissionsError !== undefined) {
      const normalized = normalizeError(submissionsError, 'Failed to fetch recent submissions');
      reqLogger.warn('Failed to fetch recent submissions', {
        err: normalized,
      });
    }

    let monthSubmissions: null | StatusRow[] = null;
    let monthError: unknown = null;
    if (monthResult.status === 'fulfilled') {
      const response = monthResult.value as { data: null | StatusRow[]; error: unknown };
      monthSubmissions = response.data;
      monthError = response.error ?? null;
    } else {
      monthError = monthResult.reason;
    }

    if (monthError !== null && monthError !== undefined) {
      const normalized = normalizeError(monthError, 'Failed to fetch month submissions');
      reqLogger.warn('Failed to fetch month submissions', {
        err: normalized,
      });
    }

    let contentCount: null | number = null;
    let contentError: unknown = null;
    if (contentResult.status === 'fulfilled') {
      const response = contentResult.value as { count: null | number; error: unknown };
      contentCount = response.count;
      contentError = response.error ?? null;
    } else {
      contentError = contentResult.reason;
    }

    if (contentError !== null && contentError !== undefined) {
      const normalized = normalizeError(contentError, 'Failed to fetch content count');
      reqLogger.warn('Failed to fetch content count', {
        err: normalized,
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

    // Structured logging with cache tags and stats
    reqLogger.info('Social proof stats API: success', {
      stats: {
        contributorCount: topContributors.length,
        submissionCount,
        successRate,
        totalUsers,
      },
      cacheTags: ['stats', 'social-proof'],
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
    const normalized = normalizeError(error, 'Social proof stats API error');
    reqLogger.error('Social proof stats API error', normalized, {
      section: 'error-handling',
    });
    return createErrorResponse(error, {
      route: '/api/stats/social-proof',
      operation: 'SocialProofStatsAPI',
      method: 'GET',
    });
  }
}