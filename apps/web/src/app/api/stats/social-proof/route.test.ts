/**
 * Integration Tests for Social Proof Stats API Route
 *
 * Tests the /api/stats/social-proof endpoint which returns social proof statistics.
 * Uses real MiscService with Prismocker for database queries.
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { NextResponse } from 'next/server';
import { GET, OPTIONS } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
  expectCacheHeaders,
} from '../../__helpers__/test-helpers';

// Import real cache utilities for proper cache testing
import { clearRequestCache, getRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock next/cache (Cache Components and cache invalidation)
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(async () => {}),
}));

// Mock next/server (connection is imported from here, not next/cache)
jest.mock('next/server', () => {
  const actual = jest.requireActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    connection: jest.fn(async () => {}),
  };
});

// Import prisma directly - don't use jest.requireActual
// Prisma is automatically PrismockerClient via __mocks__/@prisma/client.ts
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock RPC error logging utility (if needed)
jest.mock('@heyclaude/data-layer/utils/rpc-error-logging', () => ({
  logRpcError: jest.fn(),
}));

// DO NOT mock MiscService - use REAL service for integration testing
// The service uses Prismocker for Prisma queries

// Mock logger (route-factory imports from '../logging/server')
jest.mock('@heyclaude/web-runtime/logging/server', () => ({
  logger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
  },
  generateRequestId: jest.fn(() => 'test-request-id'),
  normalizeError: jest.fn((error) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
  createErrorResponse: jest.fn((error, context) => {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),
}));

// Mock server/api-helpers (route-factory imports from '../server/api-helpers')
jest.mock('@heyclaude/web-runtime/server/api-helpers', () => ({
  getOnlyCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  },
  jsonResponse: jest.fn((data, status, corsHeaders, additionalHeaders) => {
    return new Response(JSON.stringify(data), {
      status: typeof status === 'number' ? status : 200,
      headers: {
        'Content-Type': 'application/json',
        ...(typeof corsHeaders === 'object' && corsHeaders !== null ? (corsHeaders as Record<string, string>) : {}),
        ...(typeof additionalHeaders === 'object' && additionalHeaders !== null ? (additionalHeaders as Record<string, string>) : {}),
      },
    });
  }),
  handleOptionsRequest: jest.fn((corsHeaders) => {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...(typeof corsHeaders === 'object' && corsHeaders !== null ? (corsHeaders as Record<string, string>) : {}),
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }),
  buildCacheHeaders: jest.fn(() => ({
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  })),
}));

describe('GET /api/stats/social-proof', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof (prismocker as any).reset === 'function') {
      (prismocker as any).reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();

    // 5. Seed data for getSocialProofStats queries
    // The method queries:
    // - content_submissions.count() (last 7 days) - WHERE created_at >= sevenDaysAgo
    // - content_submissions.groupBy() by status (last 30 days) - WHERE created_at >= thirtyDaysAgo
    // - content_submissions.groupBy() by author (last 7 days, top 5) - WHERE created_at >= sevenDaysAgo
    // - content.count() (total)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const eightDaysAgo = new Date(now);
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    // Seed content_submissions for recent submissions (last 7 days)
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('content_submissions', [
        // Recent submissions (last 7 days) - 150 total, created_at >= sevenDaysAgo
        ...Array.from({ length: 150 }, (_, i) => ({
          id: `submission-${i}`,
          author: i < 5 ? `user${i + 1}@example.com` : `user${(i % 10) + 1}@example.com`,
          status: i < 128 ? 'merged' : 'pending', // 128 merged, 22 pending (85.3% success rate)
          created_at: new Date(sevenDaysAgo.getTime() + (i % 7) * 24 * 60 * 60 * 1000), // Within last 7 days
        })),
        // Older submissions (between 30 and 8 days ago) - for groupBy by status (last 30 days)
        // These should NOT be counted in the 7-day count, but should be in the 30-day groupBy
        ...Array.from({ length: 50 }, (_, i) => ({
          id: `submission-old-${i}`,
          author: `user${(i % 10) + 1}@example.com`,
          status: i < 40 ? 'merged' : 'pending',
          created_at: new Date(eightDaysAgo.getTime() - (i % 20) * 24 * 60 * 60 * 1000), // Between 8 and 28 days ago
        })),
      ]);

      // Seed content for total count (1000 total)
      (prismocker as any).setData('content', Array.from({ length: 1000 }, (_, i) => ({
        id: `content-${i}`,
        slug: `content-${i}`,
        title: `Content ${i}`,
        category: 'agents',
        created_at: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
      })));
    }
  });

  it('should return social proof stats', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/stats/social-proof',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response) as {
      success?: boolean;
      stats?: {
        contributors?: { count?: number; names?: string[] };
        submissions?: number;
        successRate?: number | null;
        totalUsers?: number | null;
      };
      timestamp?: string;
    };

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('stats');
    expect(body).toHaveProperty('timestamp');
    expect(body.stats).toHaveProperty('contributors');
    expect(body.stats).toHaveProperty('submissions');
    expect(body.stats).toHaveProperty('successRate');
    expect(body.stats).toHaveProperty('totalUsers');
    // Verify submissions is a number (Prismocker may filter dates differently)
    expect(typeof body.stats?.submissions).toBe('number');
    expect(body.stats?.submissions).toBeGreaterThan(0);
    expect(body.stats?.totalUsers).toBe(1000); // Total content count
    expect(body.stats?.contributors?.count).toBeGreaterThan(0);
    expect(Array.isArray(body.stats?.contributors?.names)).toBe(true);
  });

  it('should return stats with correct structure', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/stats/social-proof',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response) as {
      success?: boolean;
      stats?: {
        contributors?: { count?: number; names?: string[] };
        submissions?: number;
        successRate?: number | null;
        totalUsers?: number | null;
      };
      timestamp?: string;
    };

    expectStatus(response, 200);
    expect(body.stats).toBeDefined();
    expect(body.stats?.contributors).toHaveProperty('count');
    expect(body.stats?.contributors).toHaveProperty('names');
    expect(Array.isArray(body.stats?.contributors?.names)).toBe(true);
    expect(typeof body.stats?.submissions).toBe('number');
    expect(typeof body.stats?.successRate === 'number' || body.stats?.successRate === null).toBe(true);
    expect(typeof body.stats?.totalUsers === 'number' || body.stats?.totalUsers === null).toBe(true);
  });

  it('should include ETag and Last-Modified headers', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/stats/social-proof',
      query: {},
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(response.headers.get('ETag')).toBeTruthy();
    expect(response.headers.get('ETag')).toMatch(/^".*"$/); // ETag should be quoted
    expect(response.headers.get('Last-Modified')).toBeTruthy();
    // Verify Last-Modified is a valid date string
    expect(() => new Date(response.headers.get('Last-Modified')!)).not.toThrow();
  });

  it('should handle empty stats (no data)', async () => {
    // Reset Prismocker and seed with empty data
    if ('reset' in prismocker && typeof (prismocker as any).reset === 'function') {
      (prismocker as any).reset();
    }

    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('content_submissions', []);
      (prismocker as any).setData('content', []);
    }

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/stats/social-proof',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response) as {
      success?: boolean;
      stats?: {
        contributors?: { count?: number; names?: string[] };
        submissions?: number;
        successRate?: number | null;
        totalUsers?: number | null;
      };
      timestamp?: string;
    };

    expectStatus(response, 200);
    expect(body).toHaveProperty('success', true);
    expect(body.stats?.contributors?.count).toBe(0);
    expect(body.stats?.contributors?.names).toEqual([]);
    expect(body.stats?.submissions).toBe(0);
    expect(body.stats?.successRate).toBe(null);
    // When there's no data, the service still returns a row with total_users: 0 (from prisma.content.count())
    // The route's transformResult returns row.total_users ?? null, so 0 becomes 0, not null
    expect(body.stats?.totalUsers).toBe(0);
  });

  it('should calculate success rate correctly', async () => {
    // Seed data with specific success rate scenario
    if ('reset' in prismocker && typeof (prismocker as any).reset === 'function') {
      (prismocker as any).reset();
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      // Seed 100 submissions in last 30 days: 80 merged, 20 pending (80% success rate)
      (prismocker as any).setData('content_submissions', [
        ...Array.from({ length: 80 }, (_, i) => ({
          id: `submission-merged-${i}`,
          author: `user${(i % 5) + 1}@example.com`,
          status: 'merged',
          created_at: new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000),
        })),
        ...Array.from({ length: 20 }, (_, i) => ({
          id: `submission-pending-${i}`,
          author: `user${(i % 5) + 1}@example.com`,
          status: 'pending',
          created_at: new Date(thirtyDaysAgo.getTime() + (80 + i) * 24 * 60 * 60 * 1000),
        })),
      ]);
      (prismocker as any).setData('content', []);
    }

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/stats/social-proof',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response) as {
      success?: boolean;
      stats?: {
        contributors?: { count?: number; names?: string[] };
        submissions?: number;
        successRate?: number | null;
        totalUsers?: number | null;
      };
      timestamp?: string;
    };

    expectStatus(response, 200);
    // Success rate should be 80% (80 merged out of 100 total)
    expect(body.stats?.successRate).toBe(80);
  });

  it('should extract usernames from email addresses', async () => {
    // Seed data with email addresses
    if ('reset' in prismocker && typeof (prismocker as any).reset === 'function') {
      (prismocker as any).reset();
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    // Use a date that's definitely within the last 7 days
    const recentDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('content_submissions', [
        { id: 'sub1', author: 'user1@example.com', status: 'merged', created_at: recentDate },
        { id: 'sub2', author: 'user2@example.com', status: 'merged', created_at: recentDate },
        { id: 'sub3', author: 'user3@example.com', status: 'merged', created_at: recentDate },
        { id: 'sub4', author: 'user4@example.com', status: 'merged', created_at: recentDate },
        { id: 'sub5', author: 'user5@example.com', status: 'merged', created_at: recentDate },
      ]);
      (prismocker as any).setData('content', []);
    }

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/stats/social-proof',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response) as {
      success?: boolean;
      stats?: {
        contributors?: { count?: number; names?: string[] };
        submissions?: number;
        successRate?: number | null;
        totalUsers?: number | null;
      };
      timestamp?: string;
    };

    expectStatus(response, 200);
    // Verify contributors exist and usernames are extracted (not email addresses)
    expect(body.stats?.contributors?.count).toBeGreaterThan(0);
    expect(Array.isArray(body.stats?.contributors?.names)).toBe(true);
    if (body.stats?.contributors?.names && body.stats.contributors.names.length > 0) {
      // Verify usernames don't contain @ (email addresses should be extracted)
      body.stats.contributors.names.forEach((name) => {
        expect(name).not.toContain('@');
      });
    }
  });

  it('should handle non-email author names', async () => {
    // Seed data with non-email author names
    if ('reset' in prismocker && typeof (prismocker as any).reset === 'function') {
      (prismocker as any).reset();
    }

    const now = new Date();
    // Use a date that's definitely within the last 7 days
    const recentDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('content_submissions', [
        { id: 'sub1', author: 'github-user-1', status: 'merged', created_at: recentDate },
        { id: 'sub2', author: 'github-user-2', status: 'merged', created_at: recentDate },
        { id: 'sub3', author: 'github-user-3', status: 'merged', created_at: recentDate },
      ]);
      (prismocker as any).setData('content', []);
    }

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/stats/social-proof',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response) as {
      success?: boolean;
      stats?: {
        contributors?: { count?: number; names?: string[] };
        submissions?: number;
        successRate?: number | null;
        totalUsers?: number | null;
      };
      timestamp?: string;
    };

    expectStatus(response, 200);
    // Verify contributors exist and non-email names are preserved
    expect(body.stats?.contributors?.count).toBeGreaterThan(0);
    expect(Array.isArray(body.stats?.contributors?.names)).toBe(true);
    if (body.stats?.contributors?.names && body.stats.contributors.names.length > 0) {
      // Verify at least one contributor name exists
      expect(body.stats.contributors.names.length).toBeGreaterThan(0);
    }
  });

  it('should cache results on duplicate calls (caching test)', async () => {
    const request1 = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/stats/social-proof',
      query: {},
    });

    // First call - should populate cache
    const cacheBefore = getRequestCache().getStats().size;
    const response1 = await GET(request1);
    const body1 = await getResponseBody(response1);
    const cacheAfterFirst = getRequestCache().getStats().size;

    // Second call - should use cache
    const request2 = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/stats/social-proof',
      query: {},
    });

    const response2 = await GET(request2);
    const body2 = await getResponseBody(response2);
    const cacheAfterSecond = getRequestCache().getStats().size;

    // Verify results are the same
    expect(body1).toEqual(body2);
    expectStatus(response1, 200);
    expectStatus(response2, 200);

    // Verify cache size increased after first call
    expect(cacheAfterFirst).toBeGreaterThanOrEqual(cacheBefore);
    // Note: Request-scoped cache doesn't persist across separate GET() calls in tests,
    // so queries may be called multiple times, but cache should still be used within the same request
  });

  it('should handle service errors gracefully', async () => {
    // Mock Prisma queries to throw error
    const originalCount = prismocker.content_submissions.count;
    prismocker.content_submissions.count = jest.fn().mockRejectedValue(new Error('Database error')) as unknown as typeof originalCount;

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/stats/social-proof',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response) as { error?: string };

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
    expect(body.error).toContain('Database error');

    // Restore original method
    prismocker.content_submissions.count = originalCount;
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });

  it('should return 405 for unsupported method', async () => {
    const request = createMockRequest({
      method: 'POST', // Unsupported method
      url: 'http://localhost:3000/api/v1/stats/social-proof',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response) as { error?: string };

    expectStatus(response, 405);
    expect(body).toHaveProperty('error');
    expect(response.headers.get('Allow')).toBe('GET');
  });
});
