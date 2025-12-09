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
 * Caching: 5 minutes via Cache-Control headers (s-maxage=300)
 */
// Constants import removed - not used
import { logger, normalizeError, createErrorResponse, toLogContextValue } from '@heyclaude/web-runtime/logging/server';
import { createSupabaseAdminClient } from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { connection, NextResponse } from 'next/server';

/**
 * Cached helper function to fetch social proof stats.
 * Note: This uses Date.now() for timestamp, so we cache the data fetching but generate timestamp at request time.
 
 * @returns {unknown} Description of return value*/
async function getCachedSocialProofData(): Promise<{
  contributors: { count: number; names: string[] };
  submissions: number;
  successRate: null | number;
  totalUsers: null | number;
}> {
  'use cache';
  cacheLife('quarter'); // 15min stale, 1hr revalidate, 1 day expire - Stats change frequently

  // NOTE: Admin client bypasses RLS and is required here because:
  // 1. This is a public stats API endpoint that aggregates data from content_submissions
  // 2. The RLS policy on content_submissions checks auth.users table which anon client cannot access
  // 3. Admin client bypasses RLS to allow read-only aggregation queries for public stats

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
    supabase.from('content_submissions').select('status').gte('created_at', monthAgo.toISOString()),
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

  // Log errors from Promise.allSettled results
  if (recentResult.status === 'rejected') {
    logger.error(
      {
        query: 'stats:social-proof:recent',
        error: toLogContextValue(recentResult.reason),
      },
      'stats:social-proof:recent query failed'
    );
  }
  if (monthResult.status === 'rejected') {
    logger.error(
      {
        query: 'stats:social-proof:month',
        error: toLogContextValue(monthResult.reason),
      },
      'stats:social-proof:month query failed'
    );
  }
  if (contentResult.status === 'rejected') {
    logger.error(
      {
        query: 'stats:social-proof:content',
        error: toLogContextValue(contentResult.reason),
      },
      'stats:social-proof:content query failed'
    );
  }

  let recentSubmissions: null | SubmissionRow[] = null;
  if (recentResult.status === 'fulfilled') {
    const response = recentResult.value as { data: null | SubmissionRow[]; error: unknown };
    if (response.error) {
      logger.error(
        {
          query: 'stats:social-proof:recent',
          error: toLogContextValue(response.error),
        },
        'stats:social-proof:recent query returned error'
      );
    }
    recentSubmissions = response.data;
  }

  let monthSubmissions: null | StatusRow[] = null;
  if (monthResult.status === 'fulfilled') {
    const response = monthResult.value as { data: null | StatusRow[]; error: unknown };
    if (response.error) {
      logger.error(
        {
          query: 'stats:social-proof:month',
          error: toLogContextValue(response.error),
        },
        'stats:social-proof:month query returned error'
      );
    }
    monthSubmissions = response.data;
  }

  let contentCount: null | number = null;
  if (contentResult.status === 'fulfilled') {
    const response = contentResult.value as { count: null | number; error: unknown };
    if (response.error) {
      logger.error(
        {
          query: 'stats:social-proof:content',
          error: toLogContextValue(response.error),
        },
        'stats:social-proof:content query returned error'
      );
    }
    contentCount = response.count;
  }

  const submissionCount = recentSubmissions?.length ?? 0;
  const total = monthSubmissions?.length ?? 0;
  const approved = monthSubmissions ? monthSubmissions.filter((s) => s.status === 'merged').length : 0;
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

  return {
    contributors: {
      count: topContributors.length,
      names: topContributors,
    },
    submissions: submissionCount,
    successRate,
    totalUsers,
  };
}

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
 * @see normalizeError
 * @see createErrorResponse
 * @see Constants.public.Enums.submission_status
 */
export async function GET() {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    operation: 'SocialProofStatsAPI',
    route: '/api/stats/social-proof',
    module: 'apps/web/src/app/api/stats/social-proof',
  });

  try {
    // Fetch cached stats data
    const stats = await getCachedSocialProofData();

    // Generate timestamp at request time (not cached)
    const timestamp = new Date().toISOString();

    // Structured logging with cache tags and stats
    reqLogger.info(
      {
        stats: {
          contributorCount: stats.contributors.count,
          submissionCount: stats.submissions,
          successRate: stats.successRate,
          totalUsers: stats.totalUsers,
        },
        cacheTags: ['stats', 'social-proof'],
      },
      'Social proof stats retrieved'
    );

    // Generate ETag from timestamp and stats hash for conditional requests
    const statsHash = `${stats.contributors.count}-${stats.submissions}-${stats.successRate}-${stats.totalUsers}`;
    const etag = `"${Buffer.from(`${timestamp}-${statsHash}`).toString('base64').slice(0, 16)}"`;

    // Return stats with ETag and Last-Modified headers
    return NextResponse.json(
      {
        success: true,
        stats,
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
    reqLogger.error(
      {
        err: normalized,
        section: 'error-handling',
      },
      'Social proof stats API error'
    );
    return createErrorResponse(normalized, {
      route: '/api/stats/social-proof',
      operation: 'SocialProofStatsAPI',
      method: 'GET',
    });
  }
}
