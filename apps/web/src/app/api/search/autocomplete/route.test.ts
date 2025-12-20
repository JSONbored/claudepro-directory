/**
 * Unit Tests for Search Autocomplete API Route
 *
 * Tests the /api/search/autocomplete endpoint which returns search autocomplete suggestions.
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
const mockGetSearchSuggestionsFormatted = vi.fn();

vi.mock('@heyclaude/data-layer', () => ({
  AccountService: class {},
  ChangelogService: class {},
  CompaniesService: class {},
  ContentService: class {},
  JobsService: class {},
  MiscService: class {},
  NewsletterService: class {},
  SearchService: class {
    getSearchSuggestionsFormatted = mockGetSearchSuggestionsFormatted;
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

// Mock auth (autocomplete route doesn't require auth)
vi.mock('../../../../packages/web-runtime/src/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

describe('GET /api/search/autocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSearchSuggestionsFormatted.mockResolvedValue([
      {
        text: 'react hooks',
        search_count: 150,
        is_popular: true,
      },
      {
        text: 'react native',
        search_count: 120,
        is_popular: false,
      },
    ]);
  });

  it('should return autocomplete suggestions for valid query', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/autocomplete',
      query: { q: 'react', limit: 10 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(body).toHaveProperty('query', 'react');
    expect(body).toHaveProperty('suggestions');
    expect(Array.isArray((body as { suggestions: unknown[] }).suggestions)).toBe(true);
    expect(mockGetSearchSuggestionsFormatted).toHaveBeenCalledWith({
      p_query: 'react',
      p_limit: 10,
    });
  });

  it('should use default limit when not provided', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/autocomplete',
      query: { q: 'test' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(mockGetSearchSuggestionsFormatted).toHaveBeenCalledWith({
      p_query: 'test',
      p_limit: 10, // Default limit
    });
  });

  it('should return 400 for query shorter than 2 characters', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/autocomplete',
      query: { q: 'a' }, // Only 1 character
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    expect(mockGetSearchSuggestionsFormatted).not.toHaveBeenCalled();
  });

  it('should return 400 for missing query', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/autocomplete',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    expect(mockGetSearchSuggestionsFormatted).not.toHaveBeenCalled();
  });

  it('should return 400 for limit outside valid range (too low)', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/autocomplete',
      query: { q: 'test', limit: 0 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    expect(mockGetSearchSuggestionsFormatted).not.toHaveBeenCalled();
  });

  it('should return 400 for limit outside valid range (too high)', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/autocomplete',
      query: { q: 'test', limit: 21 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    expect(mockGetSearchSuggestionsFormatted).not.toHaveBeenCalled();
  });

  it('should handle service errors gracefully', async () => {
    mockGetSearchSuggestionsFormatted.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/autocomplete',
      query: { q: 'react', limit: 10 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should handle empty suggestions array', async () => {
    mockGetSearchSuggestionsFormatted.mockResolvedValue([]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/autocomplete',
      query: { q: 'nonexistent', limit: 10 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('query', 'nonexistent');
    expect(body).toHaveProperty('suggestions');
    expect(Array.isArray((body as { suggestions: unknown[] }).suggestions)).toBe(true);
    expect((body as { suggestions: unknown[] }).suggestions.length).toBe(0);
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });
});
