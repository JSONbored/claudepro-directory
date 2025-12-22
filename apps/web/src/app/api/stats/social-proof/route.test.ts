/**
 * Unit Tests for Social Proof Stats API Route
 *
 * Tests the /api/stats/social-proof endpoint which returns social proof statistics.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from './route';
import { createMockRequest, getResponseBody, expectStatus, expectCorsHeaders, expectCacheHeaders } from '../../__helpers__/test-helpers';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/cache (Cache Components)
vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

// Mock next/server (connection)
vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    connection: vi.fn(async () => {}),
  };
});

// Import prisma directly - don't use vi.importActual
// Prisma is automatically PrismockerClient via __mocks__/@prisma/client.ts
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock data-layer services
const mockGetSocialProofStats = vi.fn();

vi.mock('@heyclaude/data-layer', () => ({
  AccountService: class {},
  ChangelogService: class {},
  CompaniesService: class {},
  ContentService: class {},
  JobsService: class {},
  MiscService: class {
    getSocialProofStats = mockGetSocialProofStats;
  },
  NewsletterService: class {},
  SearchService: class {},
  TrendingService: class {},
}));

// Mock service-factory (getService)
vi.mock('@heyclaude/web-runtime/data/service-factory', () => ({
  getService: vi.fn(async (serviceKey: string) => {
    const { MiscService } = await import('@heyclaude/data-layer');
    if (serviceKey === 'misc') {
      return new MiscService();
    }
    throw new Error(`Unknown service key: ${serviceKey}`);
  }),
}));

// Mock logging/server
vi.mock('../../../../../packages/web-runtime/src/logging/server', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
  generateRequestId: vi.fn(() => 'test-request-id'),
  normalizeError: vi.fn((error) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
}));

// Mock server/api-helpers
vi.mock('../../../../../packages/web-runtime/src/server/api-helpers', () => ({
  getOnlyCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  },
  jsonResponse: vi.fn((data, status, corsHeaders, additionalHeaders) => {
    // Handle case where corsHeaders is empty object {}
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (corsHeaders && typeof corsHeaders === 'object') {
      Object.assign(headers, corsHeaders);
    }
    if (additionalHeaders && typeof additionalHeaders === 'object') {
      Object.assign(headers, additionalHeaders);
    }
    return new Response(JSON.stringify(data), {
      status,
      headers,
    });
  }),
  handleOptionsRequest: vi.fn(() => {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }),
  buildSecurityHeaders: vi.fn(() => ({})),
}));

// Mock auth (social-proof route doesn't require auth)
vi.mock('../../../../../packages/web-runtime/src/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

describe('GET /api/stats/social-proof', () => {
  let prismocker: PrismaClient;

  beforeEach(() => {
    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;
    
    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }
    
    vi.clearAllMocks();
    // Mock service returns array with single row (RPC pattern)
    // The route uses transformResult to extract the first row
    mockGetSocialProofStats.mockResolvedValue([
      {
        contributor_count: 42,
        contributor_names: ['user1', 'user2', 'user3', 'user4', 'user5'],
        submission_count: 150,
        success_rate: 85.5,
        total_users: 1000,
      },
    ]);
  });

  it('should return social proof stats', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/stats/social-proof',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('stats');
    expect(body).toHaveProperty('timestamp');
    const stats = (body as { stats: unknown }).stats as {
      contributors?: { count?: number; names?: string[] };
      submissions?: number;
      successRate?: number | null;
      totalUsers?: number | null;
    };
    expect(stats).toHaveProperty('contributors');
    expect(stats).toHaveProperty('submissions');
    expect(stats).toHaveProperty('successRate');
    expect(stats).toHaveProperty('totalUsers');
    expect(mockGetSocialProofStats).toHaveBeenCalledWith();
  });

  it('should return stats with correct structure', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/stats/social-proof',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    const stats = (body as { stats: unknown }).stats as {
      contributors?: { count?: number; names?: string[] };
      submissions?: number;
      successRate?: number | null;
      totalUsers?: number | null;
    };
    expect(stats.contributors).toHaveProperty('count');
    expect(stats.contributors).toHaveProperty('names');
    expect(Array.isArray(stats.contributors?.names)).toBe(true);
    expect(typeof stats.submissions).toBe('number');
    expect(typeof stats.successRate === 'number' || stats.successRate === null).toBe(true);
    expect(typeof stats.totalUsers === 'number' || stats.totalUsers === null).toBe(true);
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
    expect(response.headers.get('Last-Modified')).toBeTruthy();
  });

  it('should handle empty stats (no data)', async () => {
    mockGetSocialProofStats.mockResolvedValue([]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/stats/social-proof',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('success', true);
    const stats = (body as { stats: unknown }).stats as {
      contributors?: { count?: number; names?: string[] };
      submissions?: number;
      successRate?: number | null;
      totalUsers?: number | null;
    };
    expect(stats.contributors?.count).toBe(0);
    expect(stats.contributors?.names).toEqual([]);
    expect(stats.submissions).toBe(0);
    expect(stats.successRate).toBe(null);
    expect(stats.totalUsers).toBe(null);
  });

  it('should handle service errors gracefully', async () => {
    mockGetSocialProofStats.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/stats/social-proof',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });
});
