/**
 * Unit Tests for Trending API Route
 *
 * Tests the /api/trending endpoint which returns trending, popular, or recent content.
 * Tests tab validation, category filtering, limit validation, sidebar mode, page mode, and service errors.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
  expectCacheHeaders,
} from '../__helpers__/test-helpers';

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

// Mock data-layer services using hoisted mocks
const mockGetTrendingMetricsFormatted = vi.hoisted(() => vi.fn());
const mockGetPopularContentFormatted = vi.hoisted(() => vi.fn());
const mockGetRecentContentFormatted = vi.hoisted(() => vi.fn());
const mockGetSidebarTrendingFormatted = vi.hoisted(() => vi.fn());
const mockGetSidebarRecentFormatted = vi.hoisted(() => vi.fn());

vi.mock('@heyclaude/data-layer', async () => {
  // Import actual modules to get prisma export (PrismockClient in tests)
  // Required because pgmqSend imports prisma from @heyclaude/data-layer
  const actual = await vi.importActual<typeof import('@heyclaude/data-layer')>('@heyclaude/data-layer');
  return {
    ...actual,
    TrendingService: class {
      getTrendingMetricsFormatted = mockGetTrendingMetricsFormatted;
      getPopularContentFormatted = mockGetPopularContentFormatted;
      getRecentContentFormatted = mockGetRecentContentFormatted;
      getSidebarTrendingFormatted = mockGetSidebarTrendingFormatted;
      getSidebarRecentFormatted = mockGetSidebarRecentFormatted;
    },
    AccountService: class {},
    ChangelogService: class {},
    CompaniesService: class {},
    ContentService: class {},
    JobsService: class {},
    MiscService: class {},
    NewsletterService: class {},
    SearchService: class {},
    // prisma is already exported from actual (will be PrismockClient in tests)
  };
});

// Mock service-factory (getService)
vi.mock('../../../../packages/web-runtime/src/data/service-factory', () => ({
  getService: vi.fn(async (serviceKey: string) => {
    const { TrendingService } = await import('@heyclaude/data-layer');
    if (serviceKey === 'trending') {
      return new TrendingService();
    }
    throw new Error(`Unknown service key: ${serviceKey}`);
  }),
}));

// Mock logging/server
vi.mock('../../../../packages/web-runtime/src/logging/server', () => ({
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
vi.mock('../../../../packages/web-runtime/src/server/api-helpers', () => ({
  getOnlyCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  },
  jsonResponse: vi.fn((data, status, corsHeaders) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
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
  badRequestResponse: vi.fn((message, corsHeaders) => {
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...(corsHeaders || {}),
        },
      }
    );
  }),
}));

// Mock auth (trending route doesn't require auth)
vi.mock('../../../../packages/web-runtime/src/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

// Import route handlers
import { GET, OPTIONS } from './route';

describe('GET /api/trending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: successful trending results
    const mockResults = [
      {
        id: 'content-1',
        title: 'Trending Content',
        slug: 'trending-content',
        category: 'agents',
        popularity_score: 95.5,
      },
    ];
    mockGetTrendingMetricsFormatted.mockResolvedValue(mockResults);
    mockGetPopularContentFormatted.mockResolvedValue(mockResults);
    mockGetRecentContentFormatted.mockResolvedValue(mockResults);
    mockGetSidebarTrendingFormatted.mockResolvedValue(mockResults);
    mockGetSidebarRecentFormatted.mockResolvedValue(mockResults);
  });

  it('should return trending content (default tab)', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/trending',
      query: { limit: 20 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(body).toHaveProperty('trending');
    expect(body).toHaveProperty('totalCount');
    expect(mockGetTrendingMetricsFormatted).toHaveBeenCalled();
  });

  it('should return popular content when tab=popular', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/trending',
      query: { tab: 'popular', limit: 20 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('popular');
    expect(body).toHaveProperty('totalCount');
    expect(mockGetPopularContentFormatted).toHaveBeenCalled();
  });

  it('should return recent content when tab=recent', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/trending',
      query: { tab: 'recent', limit: 20 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('recent');
    expect(body).toHaveProperty('totalCount');
    expect(mockGetRecentContentFormatted).toHaveBeenCalledWith(
      expect.objectContaining({
        p_days: 30,
      })
    );
  });

  it('should handle category filtering', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/trending',
      query: { tab: 'trending', category: 'agents', limit: 20 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(mockGetTrendingMetricsFormatted).toHaveBeenCalledWith(
      expect.objectContaining({
        p_category: 'agents',
        p_limit: 20,
      })
    );
  });

  it('should handle sidebar mode', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/trending',
      query: { mode: 'sidebar', limit: 10 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('trending');
    expect(body).toHaveProperty('recent');
    expect(mockGetSidebarTrendingFormatted).toHaveBeenCalled();
    expect(mockGetSidebarRecentFormatted).toHaveBeenCalledWith(
      expect.objectContaining({
        p_days: 30,
      })
    );
  });

  it('should handle sidebar mode with category', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/trending',
      query: { mode: 'sidebar', category: 'guides', limit: 10 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(mockGetSidebarTrendingFormatted).toHaveBeenCalledWith(
      expect.objectContaining({
        p_category: 'guides',
        p_limit: 10,
      })
    );
  });

  it('should return 400 for invalid tab', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/trending',
      query: { tab: 'invalid', limit: 20 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Schema validates tab enum, returns 400
    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
  });

  it('should return 400 for invalid limit (too low)', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/trending',
      query: { limit: 0 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Schema validates limit (must be >= 1), returns 400
    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
  });

  it('should return 400 for invalid limit (too high)', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/trending',
      query: { limit: 101 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Schema validates limit (must be <= 100), returns 400
    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
  });

  it('should handle service errors gracefully', async () => {
    mockGetTrendingMetricsFormatted.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/trending',
      query: { limit: 20 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should handle OPTIONS request', async () => {
    const request = createMockRequest({
      method: 'OPTIONS',
      url: 'http://localhost:3000/api/v1/trending',
    });

    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });

  it('should use default category (guides) for sidebar mode when category not provided', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/trending',
      query: { mode: 'sidebar', limit: 10 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    // Sidebar defaults to 'guides' category when not provided
    expect(mockGetSidebarTrendingFormatted).toHaveBeenCalledWith(
      expect.objectContaining({
        p_category: 'guides',
        p_limit: 10,
      })
    );
  });

  it('should handle page mode (default)', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/trending',
      query: { mode: 'page', tab: 'trending', limit: 20 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('trending');
    expect(mockGetTrendingMetricsFormatted).toHaveBeenCalled();
    expect(mockGetSidebarTrendingFormatted).not.toHaveBeenCalled();
  });
});
