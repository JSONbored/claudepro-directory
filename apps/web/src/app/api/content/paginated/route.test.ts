/**
 * Unit Tests for Paginated Content API Route
 *
 * Tests the /api/content/paginated endpoint which returns paginated content with optional category filtering.
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
  connection: vi.fn(async () => {}),
}));

// Mock data-layer services
const mockGetContentPaginatedSlim = vi.fn();

vi.mock('@heyclaude/data-layer', async () => {
  // Import actual modules to get prisma export (PrismockClient in tests)
  // Required because pgmqSend imports prisma from @heyclaude/data-layer
  const actual = await vi.importActual<typeof import('@heyclaude/data-layer')>('@heyclaude/data-layer');
  return {
    ...actual,
    AccountService: class {},
    ChangelogService: class {},
    CompaniesService: class {},
    ContentService: class {
      getContentPaginatedSlim = mockGetContentPaginatedSlim;
    },
    JobsService: class {},
    MiscService: class {},
    NewsletterService: class {},
    SearchService: class {},
    TrendingService: class {},
    // prisma is already exported from actual (will be PrismockClient in tests)
  };
});

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
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...additionalHeaders,
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
}));

// Mock auth (paginated route doesn't require auth)
vi.mock('../../../../../packages/web-runtime/src/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

describe('GET /api/content/paginated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetContentPaginatedSlim.mockResolvedValue({
      items: [
        {
          id: 'content-1',
          title: 'Test Content',
          slug: 'test-content',
          category: 'skills',
        },
        {
          id: 'content-2',
          title: 'Another Content',
          slug: 'another-content',
          category: 'skills',
        },
      ],
      pagination: {
        current_page: 1,
        has_more: false,
        limit: 20,
        offset: 0,
        total_count: 2,
        total_pages: 1,
      },
    });
  });

  it('should return paginated content without category', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/paginated',
      query: { offset: 0, limit: 20 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(Array.isArray(body)).toBe(true);
    // methodArgs returns array with single object
    expect(mockGetContentPaginatedSlim).toHaveBeenCalledWith(
      expect.objectContaining({
        p_limit: 20,
        p_offset: 0,
      })
    );
  });

  it('should return paginated content with category filter', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/paginated',
      query: { offset: 0, limit: 20, category: 'skills' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(Array.isArray(body)).toBe(true);
    expect(mockGetContentPaginatedSlim).toHaveBeenCalledWith(
      expect.objectContaining({
        p_category: 'skills',
        p_limit: 20,
        p_offset: 0,
      })
    );
  });

  it('should handle pagination correctly', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/paginated',
      query: { offset: 20, limit: 10, category: 'agents' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(mockGetContentPaginatedSlim).toHaveBeenCalledWith(
      expect.objectContaining({
        p_category: 'agents',
        p_limit: 10,
        p_offset: 20,
      })
    );
  });

  it('should return 400 for invalid limit (too low) - schema validates', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/paginated',
      query: { offset: 0, limit: 0 }, // Schema validates: min(1)
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Schema validates limit (must be >= 1), returns 400
    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    expect(mockGetContentPaginatedSlim).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid limit (too high) - schema validates', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/paginated',
      query: { offset: 0, limit: 101 }, // Schema validates: max(100)
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Schema validates limit (must be <= 100), returns 400
    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    expect(mockGetContentPaginatedSlim).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid offset (negative) - schema validates', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/paginated',
      query: { offset: -1, limit: 20 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Schema validates offset (must be >= 0), returns 400
    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    expect(mockGetContentPaginatedSlim).not.toHaveBeenCalled();
  });

  it('should return 500 for invalid category (service validates)', async () => {
    // Invalid category passes schema validation but service will throw
    mockGetContentPaginatedSlim.mockRejectedValue(new Error('Invalid category'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/paginated',
      query: { offset: 0, limit: 20, category: 'invalid-category' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Service validates category and throws, factory returns 500
    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
    expect(mockGetContentPaginatedSlim).toHaveBeenCalled();
  });

  it('should handle service errors gracefully', async () => {
    mockGetContentPaginatedSlim.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/paginated',
      query: { offset: 0, limit: 20 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should handle empty results', async () => {
    mockGetContentPaginatedSlim.mockResolvedValue({
      items: [],
      pagination: {
        current_page: 1,
        has_more: false,
        limit: 20,
        offset: 0,
        total_count: 0,
        total_pages: 0,
      },
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/paginated',
      query: { offset: 0, limit: 20 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(Array.isArray(body)).toBe(true);
    expect((body as unknown[]).length).toBe(0);
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });
});
