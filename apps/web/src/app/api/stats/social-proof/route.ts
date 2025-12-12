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
 * Caching: Two-layer caching strategy:
 * - Next.js Cache Components: 15min stale, 5min revalidate, 2hr expire (cacheLife('quarter'))
 * - HTTP Cache-Control: 5 minutes via Cache-Control headers (s-maxage=300)
 * 
 * @example
 * ```ts
 * // Request
 * GET /api/stats/social-proof
 * 
 * // Response (200)
 * {
 *   "success": true,
 *   "stats": {
 *     "contributors": { "count": 42, "names": ["user1", "user2"] },
 *     "submissions": 150,
 *     "successRate": 85.5,
 *     "totalUsers": 1000
 *   },
 *   "timestamp": "2025-01-11T12:00:00Z"
 * }
 * ```
 */
import 'server-only';
import { MiscService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { createApiRoute, createApiOptionsHandler } from '@heyclaude/web-runtime/server';
import { createSupabaseAdminClient } from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { connection } from 'next/server';
import { NextResponse } from 'next/server';

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
  const service = new MiscService(supabase);

  // Use database RPC to do all aggregations in database (much faster than multiple queries + client-side processing)
  // RPC has two overloads - we're calling with no args, so we get the first overload's return type
  const data = await service.getSocialProofStats();

  // Extract the first overload's return type (no args version)
  // The function has two overloads, but when called with no args, TypeScript infers the first one
  type SocialProofStatsFunction = Database['public']['Functions']['get_social_proof_stats'];
  type NoArgsOverload = Extract<SocialProofStatsFunction, { Args: never }>;
  type SocialProofStatsRow = NoArgsOverload['Returns'][number];

  const result = data ?? [];
  const row =
    Array.isArray(result) && result.length > 0 ? (result[0] as SocialProofStatsRow) : null;

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
    successRate:
      row.success_rate !== null && row.success_rate !== undefined ? Number(row.success_rate) : null,
    totalUsers: row.total_users ?? null,
  };
}

/**
 * GET /api/stats/social-proof - Get social proof statistics
 * 
 * Returns aggregated social proof metrics: top contributors this week (up to 5 usernames),
 * submissions count in the past 7 days, success rate percentage over the past 30 days,
 * and total user count. Includes ETag and Last-Modified headers for conditional requests.
 */
export const GET = createApiRoute({
  route: '/api/stats/social-proof',
  operation: 'SocialProofStatsAPI',
  method: 'GET',
  cors: 'anon',
  openapi: {
    summary: 'Get social proof statistics',
    description: 'Returns aggregated social proof metrics for the submission wizard: top contributors this week, recent submission count, success rate, and total user count. Includes ETag and Last-Modified headers for conditional requests.',
    tags: ['stats', 'social-proof'],
    operationId: 'getSocialProofStats',
    responses: {
      200: {
        description: 'Social proof statistics retrieved successfully',
      },
    },
  },
  handler: async ({ logger }) => {
    // Explicitly defer to request time before using non-deterministic operations (Date.now())
    // This is required by Cache Components for non-deterministic operations
    await connection();

    // Fetch cached stats data
    const stats = await getCachedSocialProofData();

    // Generate timestamp at request time (not cached)
    const timestamp = new Date().toISOString();

    // Structured logging with cache tags and stats
    logger.info(
      {
        cacheTags: ['stats', 'social-proof'],
        stats: {
          contributorCount: stats.contributors.count,
          submissionCount: stats.submissions,
          successRate: stats.successRate,
          totalUsers: stats.totalUsers,
        },
      },
      'Social proof stats retrieved'
    );

    // Generate ETag from timestamp and stats hash for conditional requests
    // Using simple string concatenation instead of base64 to avoid potential collisions
    const statsHash = `${stats.contributors.count}-${stats.submissions}-${stats.successRate}-${stats.totalUsers}`;
    const etag = `"${timestamp}-${statsHash}"`;

    // Return stats with ETag and Last-Modified headers
    return NextResponse.json(
      {
        stats,
        success: true,
        timestamp,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          ETag: etag,
          'Last-Modified': new Date(timestamp).toUTCString(),
        },
        status: 200,
      }
    );
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
