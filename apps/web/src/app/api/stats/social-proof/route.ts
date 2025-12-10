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
import { type Database } from '@heyclaude/database-types';
import { logger, normalizeError, createErrorResponse } from '@heyclaude/web-runtime/logging/server';
import { createSupabaseAdminClient } from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { connection, NextResponse } from 'next/server';

/**
 * Cached helper function to fetch social proof stats.
 * Uses database RPC function to do all aggregations in the database.
 * 
 * @returns A promise resolving to social proof stats: contributors (count and names), submissions count, successRate (percentage or null), and totalUsers (count or null).
 */
async function getCachedSocialProofData(): Promise<{
  contributors: { count: number; names: string[] };
  submissions: number;
  successRate: null | number;
  totalUsers: null | number;
}> {
  'use cache';
  cacheLife('quarter'); // 15min stale, 5min revalidate, 2hr expire - Stats change frequently (defined in next.config.mjs)

  const supabase = createSupabaseAdminClient();

  // Use database RPC to do all aggregations in database (much faster than multiple queries + client-side processing)
  // RPC has two overloads - we're calling with no args, so we get the first overload's return type
  const { data, error } = await supabase.rpc('get_social_proof_stats');

  if (error) {
    throw error;
  }

  // Extract the first overload's return type (no args version)
  // The function has two overloads, but when called with no args, TypeScript infers the first one
  type SocialProofStatsFunction = Database['public']['Functions']['get_social_proof_stats'];
  type NoArgsOverload = Extract<SocialProofStatsFunction, { Args: never }>;
  type SocialProofStatsRow = NoArgsOverload['Returns'][number];
  
  const result = (data as NoArgsOverload['Returns']) ?? [];
  const row = Array.isArray(result) && result.length > 0 ? (result[0] as SocialProofStatsRow) : null;
  
  if (!row) {
    // Return defaults if no data
    return {
      contributors: { count: 0, names: [] },
      submissions: 0,
      successRate: null,
      totalUsers: null,
    };
  }

  // Map database return type to expected format
  // TypeScript now knows row has the correct shape from the first overload
  return {
    contributors: {
      count: row.contributor_count ?? 0,
      names: Array.isArray(row.contributor_names) ? row.contributor_names : [],
    },
    submissions: row.submission_count ?? 0,
    successRate: row.success_rate !== null && row.success_rate !== undefined 
      ? Number(row.success_rate) 
      : null,
    totalUsers: row.total_users ?? null,
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
