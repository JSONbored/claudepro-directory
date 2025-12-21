/**
 * Unit Tests for Search API Route
 *
 * Tests the /api/search endpoint which provides unified search across content, jobs, companies, and users.
 * Tests query validation, job filters, category filters, sorting, pagination, search type detection, and service errors.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
// Note: GET and OPTIONS are imported after the route mock below
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
  expectCacheHeaders,
} from '../__helpers__/test-helpers';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock shared-runtime (route imports normalizeError)
vi.mock('@heyclaude/shared-runtime', () => ({
  normalizeError: vi.fn((error) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
}));

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
const mockExecuteSearch = vi.hoisted(() => vi.fn());
const mockHighlightResults = vi.hoisted(() => vi.fn());

vi.mock('@heyclaude/data-layer', async () => {
  // Import actual modules to get prisma export (PrismockClient in tests)
  // Required because pgmqSend imports prisma from @heyclaude/data-layer
  const actual = await vi.importActual<typeof import('@heyclaude/data-layer')>('@heyclaude/data-layer');
  return {
    ...actual,
    SearchService: class {
      executeSearch = mockExecuteSearch;
      static highlightResults = mockHighlightResults;
    },
    AccountService: class {},
    ChangelogService: class {},
    CompaniesService: class {},
    ContentService: class {},
    JobsService: class {},
    MiscService: class {},
    NewsletterService: class {},
    TrendingService: class {},
    // prisma is already exported from actual (will be PrismockClient in tests)
  };
});

// Import route handlers (after mocks are set up)
import { GET, OPTIONS } from './route';

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

// Mock auth (search route doesn't require auth)
vi.mock('../../../../packages/web-runtime/src/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

// Mock pulse (analytics tracking - non-blocking)
vi.mock('../../../../packages/web-runtime/src/pulse', () => ({
  enqueuePulseEventServer: vi.fn(async () => {}),
}));

// Mock category validation
vi.mock('../../../../packages/web-runtime/src/utils/category-validation', () => ({
  isValidCategory: vi.fn((cat: string) => {
    const validCategories = [
      'agents',
      'mcp',
      'rules',
      'commands',
      'hooks',
      'statuslines',
      'skills',
      'collections',
      'guides',
      'jobs',
      'changelog',
    ];
    return validCategories.includes(cat.toLowerCase());
  }),
  VALID_CATEGORIES: [
    'agents',
    'mcp',
    'rules',
    'commands',
    'hooks',
    'statuslines',
    'skills',
    'collections',
    'guides',
    'jobs',
    'changelog',
  ],
}));

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: successful search with content results
    const mockResults = [
      {
        id: 'content-1',
        title: 'AI Agent Framework',
        slug: 'ai-agent-framework',
        category: 'agents',
        description: 'A comprehensive framework for building AI agents',
      },
    ];
    mockExecuteSearch.mockResolvedValue({
      results: mockResults,
      totalCount: 1,
    });
    mockHighlightResults.mockImplementation((results) => results);
  });

  it('should return search results for content search', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: { q: 'ai agents', limit: 20, offset: 0 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('query', 'ai agents');
    expect(body).toHaveProperty('results');
    expect(body).toHaveProperty('filters');
    expect(body).toHaveProperty('pagination');
    expect(body).toHaveProperty('searchType', 'content');
    expect(mockExecuteSearch).toHaveBeenCalled();
  });

  it('should handle job filters and set searchType to jobs', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: {
        q: 'engineer',
        job_category: 'engineering',
        job_employment: 'full-time',
        limit: 20,
        offset: 0,
      },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect((body as { searchType: string }).searchType).toBe('jobs');
    expect(mockExecuteSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        jobCategory: 'engineering',
        jobEmployment: 'full-time',
        searchType: 'jobs',
      })
    );
  });

  it('should handle category filters', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: {
        q: 'automation',
        categories: 'agents,mcp',
        limit: 20,
        offset: 0,
      },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(mockExecuteSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: ['agents', 'mcp'],
      })
    );
  });

  it('should handle sorting options', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: {
        q: 'test',
        sort: 'popularity',
        limit: 20,
        offset: 0,
      },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(mockExecuteSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: 'popularity',
      })
    );
    expect((body as { filters: { sort: string } }).filters.sort).toBe('popularity');
  });

  it('should handle pagination', async () => {
    mockExecuteSearch.mockResolvedValueOnce({
      results: [],
      totalCount: 100,
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: {
        q: 'test',
        limit: 20,
        offset: 40,
      },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    const pagination = (body as { pagination: { total: number; limit: number; offset: number; hasMore: boolean } })
      .pagination;
    expect(pagination.total).toBe(100);
    expect(pagination.limit).toBe(20);
    expect(pagination.offset).toBe(40);
    expect(pagination.hasMore).toBe(true);
  });

  it('should return 500 for invalid categories (route validates and throws)', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: {
        q: 'test',
        categories: 'invalid-category,another-invalid',
        limit: 20,
        offset: 0,
      },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Route throws Error for invalid categories, factory returns 500
    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
    expect(mockExecuteSearch).not.toHaveBeenCalled();
  });

  it('should handle unified search type with entities', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: {
        q: 'test',
        entities: 'content,company',
        limit: 20,
        offset: 0,
      },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect((body as { searchType: string }).searchType).toBe('unified');
    expect(mockExecuteSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        entities: ['content', 'company'],
        searchType: 'unified',
      })
    );
  });

  it('should handle tags and authors filters', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: {
        q: 'test',
        tags: 'ai,automation',
        authors: 'user1,user2',
        limit: 20,
        offset: 0,
      },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(mockExecuteSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ['ai', 'automation'],
        authors: ['user1', 'user2'],
      })
    );
  });

  it('should handle service errors gracefully', async () => {
    mockExecuteSearch.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: { q: 'test', limit: 20, offset: 0 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should handle empty query string', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: { q: '', limit: 20, offset: 0 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect((body as { query: string }).query).toBe('');
    expect(mockExecuteSearch).toHaveBeenCalled();
  });

  it('should handle OPTIONS request', async () => {
    const request = createMockRequest({
      method: 'OPTIONS',
      url: 'http://localhost:3000/api/v1/search',
    });

    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });

  it('should trim query string', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: { q: '  ai agents  ', limit: 20, offset: 0 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect((body as { query: string }).query).toBe('ai agents');
  });

  it('should handle all job filters together', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: {
        q: 'engineer',
        job_category: 'engineering',
        job_employment: 'full-time',
        job_experience: 'intermediate',
        job_remote: 'true',
        limit: 20,
        offset: 0,
      },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect((body as { searchType: string }).searchType).toBe('jobs');
    expect(mockExecuteSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        jobCategory: 'engineering',
        jobEmployment: 'full-time',
        jobExperience: 'intermediate',
        jobRemote: true,
      })
    );
  });
});
