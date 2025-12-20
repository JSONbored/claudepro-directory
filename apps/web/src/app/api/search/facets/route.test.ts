/**
 * Unit Tests for Search Facets API Route
 *
 * Tests the /api/search/facets endpoint which returns available search facets.
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
const mockGetSearchFacetsFormatted = vi.fn();

vi.mock('@heyclaude/data-layer', () => ({
  AccountService: class {},
  ChangelogService: class {},
  CompaniesService: class {},
  ContentService: class {},
  JobsService: class {},
  MiscService: class {},
  NewsletterService: class {},
  SearchService: class {
    getSearchFacetsFormatted = mockGetSearchFacetsFormatted;
  },
  TrendingService: class {},
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

// Mock auth (facets route doesn't require auth)
vi.mock('../../../../packages/web-runtime/src/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

describe('GET /api/search/facets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSearchFacetsFormatted.mockResolvedValue([
      {
        category: 'skills',
        content_count: 150,
        tags: ['javascript', 'typescript', 'react'],
        authors: ['user1', 'user2'],
      },
      {
        category: 'agents',
        content_count: 75,
        tags: ['ai', 'automation'],
        authors: ['user3'],
      },
    ]);
  });

  it('should return search facets', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/facets',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(body).toHaveProperty('facets');
    expect(Array.isArray((body as { facets: unknown[] }).facets)).toBe(true);
    expect(mockGetSearchFacetsFormatted).toHaveBeenCalledWith();
  });

  it('should return facets with correct structure', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/facets',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    const facets = (body as { facets: unknown[] }).facets;
    expect(facets.length).toBeGreaterThan(0);
    const firstFacet = facets[0] as {
      category?: string;
      content_count?: number;
      tags?: string[];
      authors?: string[];
    };
    expect(firstFacet).toHaveProperty('category');
    expect(firstFacet).toHaveProperty('content_count');
    expect(firstFacet).toHaveProperty('tags');
    expect(firstFacet).toHaveProperty('authors');
  });

  it('should handle empty facets array', async () => {
    mockGetSearchFacetsFormatted.mockResolvedValue([]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/facets',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('facets');
    expect(Array.isArray((body as { facets: unknown[] }).facets)).toBe(true);
    expect((body as { facets: unknown[] }).facets.length).toBe(0);
  });

  it('should handle service errors gracefully', async () => {
    mockGetSearchFacetsFormatted.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/facets',
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
