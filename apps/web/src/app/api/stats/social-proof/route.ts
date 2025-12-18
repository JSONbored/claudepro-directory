/**
 * Social Proof Stats API Route
 *
 * Provides live social proof data for the submission wizard:
 * - Top contributors this week
 * - Recent submission count
 * - Success rate
 * - Total user count
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

import { type GetSocialProofStatsReturnRow } from '@heyclaude/database-types/postgres-types';
import { createOptionsHandler as createApiOptionsHandler, createCachedApiRoute, type RouteHandlerContext } from '@heyclaude/web-runtime/api/route-factory';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { connection } from 'next/server';

/**
 * GET /api/stats/social-proof - Get social proof statistics
 *
 * Returns aggregated social proof metrics: top contributors this week (up to 5 usernames),
 * submissions count in the past 7 days, success rate percentage over the past 30 days,
 * and total user count. Includes ETag and Last-Modified headers for conditional requests.
 * 
 * OPTIMIZATION: Uses createCachedApiRoute to eliminate cached helper function boilerplate.
 */
const responseHandler = async (result: unknown, _query: unknown, _body: unknown, ctx: RouteHandlerContext<unknown, unknown>) => {
  const { logger } = ctx;
  
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  await connection();

  const stats = result as {
    contributors: { count: number; names: string[] };
    submissions: number;
    successRate: null | number;
    totalUsers: null | number;
  };
  const timestamp = new Date().toISOString();

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
  const statsHash = `${stats.contributors.count}-${stats.submissions}-${stats.successRate}-${stats.totalUsers}`;
  const etag = `"${timestamp}-${statsHash}"`;

  return jsonResponse(
    {
      stats,
      success: true,
      timestamp,
    },
    200,
    {},
    {
      ETag: etag,
      'Last-Modified': new Date(timestamp).toUTCString(),
    }
  );
};

export const GET = createCachedApiRoute({
  cacheLife: 'short', // 15min stale, 5min revalidate, 2hr expire
  cacheTags: ['stats', 'social-proof'],
  cors: 'anon',
  method: 'GET',
  openapi: {
    description:
      'Returns aggregated social proof metrics for the submission wizard: top contributors this week, recent submission count, success rate, and total user count. Includes ETag and Last-Modified headers for conditional requests.',
    operationId: 'getSocialProofStats',
    responses: {
      200: {
        description: 'Social proof statistics retrieved successfully',
      },
    },
    summary: 'Get social proof statistics',
    tags: ['stats', 'social-proof'],
  },
  operation: 'SocialProofStatsAPI',
  route: getVersionedRoute('stats/social-proof'),
  service: {
    methodArgs: () => [],
    methodName: 'getSocialProofStats',
    serviceKey: 'misc',
  },
  transformResult: (result: unknown) => {
    // Extract the return row type (function returns array of rows)
    type SocialProofStatsRow = GetSocialProofStatsReturnRow;

    const data = result ?? [];
    const row =
      Array.isArray(data) && data.length > 0 ? (data[0] as SocialProofStatsRow) : null;

    if (!row) {
      return {
        contributors: { count: 0, names: [] },
        submissions: 0,
        successRate: null,
        totalUsers: null,
      };
    }

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
  },
  responseHandler,
} as unknown as Parameters<typeof createCachedApiRoute>[0]);

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
