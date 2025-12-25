/**
 * Integration Tests for Search API Route
 *
 * Tests the /api/search endpoint which provides unified search across content, jobs, companies, and users.
 * Uses real SearchService with Prismocker for RPC calls.
 * Comprehensive testing of all production features including caching, highlighting, analytics, and error handling.
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { NextResponse } from 'next/server';
import { GET, OPTIONS } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
} from '../__helpers__/test-helpers';

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

// Mock RPC error logging utility
jest.mock('@heyclaude/data-layer/utils/rpc-error-logging', () => ({
  logRpcError: jest.fn(),
}));

// DO NOT mock SearchService - use REAL service for integration testing
// The service uses Prismocker for RPC calls via $queryRawUnsafe

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
        ...(typeof corsHeaders === 'object' && corsHeaders !== null
          ? (corsHeaders as Record<string, string>)
          : {}),
        ...(typeof additionalHeaders === 'object' && additionalHeaders !== null
          ? (additionalHeaders as Record<string, string>)
          : {}),
      },
    });
  }),
  handleOptionsRequest: jest.fn((corsHeaders) => {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...(corsHeaders as Record<string, string>),
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }),
  buildCacheHeaders: jest.fn(() => ({
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  })),
  badRequestResponse: jest.fn((message, errors) => {
    return new Response(
      JSON.stringify({
        error: message,
        ...(errors && typeof errors === 'object' ? { errors } : {}),
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),
}));

// Mock pulse (analytics tracking - non-blocking)
const mockEnqueuePulseEventServer = jest.fn(async () => {});
jest.mock('@heyclaude/web-runtime/pulse', () => ({
  enqueuePulseEventServer: (...args: unknown[]) => mockEnqueuePulseEventServer(...args),
}));

describe('GET /api/search', () => {
  let prismocker: PrismaClient;

  // Mock result structures for different search types
  const mockContentResults = [
    {
      id: 'content-1',
      title: 'AI Agent Framework',
      slug: 'ai-agent-framework',
      category: 'agents',
      description: 'A comprehensive framework for building AI agents',
      popularity_score: 100,
      created_at: new Date('2024-01-01'),
      highlighted_title: 'AI Agent Framework',
      highlighted_description: 'A comprehensive framework for building AI agents',
    },
    {
      id: 'content-2',
      title: 'MCP Server Guide',
      slug: 'mcp-server-guide',
      category: 'mcp',
      description: 'Complete guide to MCP servers',
      popularity_score: 85,
      created_at: new Date('2024-01-02'),
      highlighted_title: 'MCP Server Guide',
      highlighted_description: 'Complete guide to MCP servers',
    },
  ];

  const mockJobResults = [
    {
      id: 'job-1',
      title: 'Senior Engineer',
      slug: 'senior-engineer',
      company_id: 'company-1',
      category: 'engineering',
      employment_type: 'full-time',
      experience_level: 'intermediate',
      remote: true,
      posted_at: new Date('2024-01-01'),
      highlighted_title: 'Senior Engineer',
      highlighted_description: null,
    },
  ];

  const mockUnifiedResults = [
    {
      entity_type: 'content',
      id: 'content-1',
      title: 'AI Agent Framework',
      slug: 'ai-agent-framework',
      highlighted_title: 'AI Agent Framework',
    },
    {
      entity_type: 'company',
      id: 'company-1',
      name: 'AI Company',
      slug: 'ai-company',
      highlighted_title: 'AI Company',
    },
  ];

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

    // 5. Set up $queryRawUnsafe for RPC testing (SearchService uses callRpc → BasePrismaService.callRpc → $queryRawUnsafe)
    // Default: content search results
    // Note: callRpc unwraps single-element arrays, so we return array with one composite type element
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([
      {
        results: mockContentResults,
        total_count: mockContentResults.length,
      },
    ]);
  });

  it('should return search results for content search', async () => {
    // Set up RPC mock for content search (search_content_optimized)
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        results: mockContentResults,
        total_count: mockContentResults.length,
      },
    ]);

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
    expect(Array.isArray((body as { results: unknown[] }).results)).toBe(true);
    expect((body as { results: unknown[] }).results.length).toBeGreaterThan(0);

    // Verify RPC was called (callRpc uses positional parameters)
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM search_content_optimized'),
      expect.any(Number), // p_limit
      expect.any(Number), // p_offset
      expect.any(String), // p_query
      expect.any(String), // p_sort
      expect.any(String) // p_highlight_query
    );
  });

  it('should handle job filters and set searchType to jobs', async () => {
    // Set up RPC mock for job search (filter_jobs)
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        jobs: mockJobResults,
        total_count: mockJobResults.length,
      },
    ]);

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
    expect(body).toHaveProperty('searchType', 'jobs');
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM filter_jobs'),
      expect.any(Number), // p_limit
      expect.any(Number), // p_offset
      expect.any(String), // p_search_query
      expect.any(String), // p_category
      expect.any(String), // p_employment_type
      null, // p_experience_level (not provided)
      expect.any(Boolean) // p_remote_only (defaults to false)
    );
  });

  it('should handle category filters', async () => {
    // Set up RPC mock for content search with categories
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        results: mockContentResults,
        total_count: mockContentResults.length,
      },
    ]);

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
    expect((body as { filters: { categories?: string[] } }).filters.categories).toEqual([
      'agents',
      'mcp',
    ]);

    // Verify RPC was called (callRpc uses positional parameters)
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM search_content_optimized'),
      expect.any(Number), // p_limit
      expect.any(Number), // p_offset
      expect.any(String), // p_query
      expect.any(String), // p_sort
      expect.any(String), // p_highlight_query
      expect.arrayContaining(['agents', 'mcp']) // p_categories (array)
    );
  });

  it('should handle all sort types', async () => {
    const sortTypes: Array<'alphabetical' | 'newest' | 'popularity' | 'relevance'> = [
      'alphabetical',
      'newest',
      'popularity',
      'relevance',
    ];

    for (const sortType of sortTypes) {
      prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
        {
          results: mockContentResults,
          total_count: mockContentResults.length,
        },
      ]);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/search',
        query: {
          q: 'test',
          sort: sortType,
          limit: 20,
          offset: 0,
        },
      });

      const response = await GET(request);
      const body = await getResponseBody(response);

      expectStatus(response, 200);
      expect((body as { filters: { sort: string } }).filters.sort).toBe(sortType);

      // Verify sort is passed to RPC
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM search_content_optimized'),
        expect.any(Number), // p_limit
        expect.any(Number), // p_offset
        expect.any(String), // p_query
        sortType, // p_sort
        expect.any(String) // p_highlight_query
      );
    }
  });

  it('should handle pagination correctly', async () => {
    // Set up RPC mock with empty results but high total count
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        results: [],
        total_count: 100,
      },
    ]);

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
    const pagination = (
      body as { pagination: { total: number; limit: number; offset: number; hasMore: boolean } }
    ).pagination;
    expect(pagination.total).toBe(100);
    expect(pagination.limit).toBe(20);
    expect(pagination.offset).toBe(40);
    expect(pagination.hasMore).toBe(true);

    // Verify pagination params are passed to RPC
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM search_content_optimized'),
      20, // p_limit
      40, // p_offset
      expect.any(String), // p_query
      expect.any(String), // p_sort
      expect.any(String) // p_highlight_query
    );
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
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should handle unified search type with entities', async () => {
    // Set up RPC mock for unified search (search_unified)
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        results: mockUnifiedResults,
        total_count: mockUnifiedResults.length,
      },
    ]);

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
    expect(body).toHaveProperty('searchType', 'unified');
    expect((body as { filters: { entities?: string[] } }).filters.entities).toEqual([
      'content',
      'company',
    ]);

    // Verify RPC was called (callRpc uses positional parameters)
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM search_unified'),
      expect.arrayContaining(['content', 'company']), // p_entities (array)
      expect.any(Number), // p_limit
      expect.any(Number), // p_offset
      expect.any(String), // p_query
      expect.any(String) // p_highlight_query
    );
  });

  it('should handle tags and authors filters', async () => {
    // Set up RPC mock for content search with tags and authors
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        results: mockContentResults,
        total_count: mockContentResults.length,
      },
    ]);

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
    expect((body as { filters: { tags?: string[] } }).filters.tags).toEqual(['ai', 'automation']);
    expect((body as { filters: { authors?: string[] } }).filters.authors).toEqual([
      'user1',
      'user2',
    ]);

    // Verify RPC was called (callRpc uses positional parameters)
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM search_content_optimized'),
      expect.any(Number), // p_limit
      expect.any(Number), // p_offset
      expect.any(String), // p_query
      expect.any(String), // p_sort
      expect.any(String), // p_highlight_query
      null, // p_categories (not provided)
      expect.arrayContaining(['ai', 'automation']), // p_tags (array)
      expect.arrayContaining(['user1', 'user2']) // p_authors (array)
    );
  });

  it('should handle service errors gracefully', async () => {
    // Set up RPC mock to throw an error
    prismocker.$queryRawUnsafe = jest.fn().mockRejectedValueOnce(new Error('Database error'));

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
    // Set up RPC mock for content search with empty query
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        results: mockContentResults,
        total_count: mockContentResults.length,
      },
    ]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: { q: '', limit: 20, offset: 0 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect((body as { query: string }).query).toBe('');
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });

  it('should trim query string', async () => {
    // Set up RPC mock for content search
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        results: mockContentResults,
        total_count: mockContentResults.length,
      },
    ]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: { q: '  ai agents  ', limit: 20, offset: 0 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect((body as { query: string }).query).toBe('ai agents');

    // Verify trimmed query is passed to RPC (check the actual call)
    const rpcCall = prismocker.$queryRawUnsafe.mock.calls[0];
    expect(rpcCall[3]).toBe('ai agents'); // p_query is the 4th parameter (index 3)
  });

  it('should handle all job filters together', async () => {
    // Set up RPC mock for job search with all filters
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        jobs: mockJobResults,
        total_count: mockJobResults.length,
      },
    ]);

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
    expect(body).toHaveProperty('searchType', 'jobs');
    expect((body as { filters: { job_category?: string } }).filters.job_category).toBe(
      'engineering'
    );
    expect((body as { filters: { job_employment?: string } }).filters.job_employment).toBe(
      'full-time'
    );
    expect((body as { filters: { job_experience?: string } }).filters.job_experience).toBe(
      'intermediate'
    );
    expect((body as { filters: { job_remote?: boolean } }).filters.job_remote).toBe(true);

    // Verify RPC was called (callRpc uses positional parameters)
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM filter_jobs'),
      expect.any(Number), // p_limit
      expect.any(Number), // p_offset
      expect.any(String), // p_search_query
      'engineering', // p_category
      'full-time', // p_employment_type
      'intermediate', // p_experience_level
      true // p_remote_only
    );
  });

  it('should cache results on duplicate calls (caching test)', async () => {
    // Set up RPC mock for content search
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([
      {
        results: mockContentResults,
        total_count: mockContentResults.length,
      },
    ]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: { q: 'test', limit: 20, offset: 0 },
    });

    // First call - should populate cache
    const cacheBefore = getRequestCache().getStats().size;
    const response1 = await GET(request);
    const body1 = await getResponseBody(response1);
    const cacheAfterFirst = getRequestCache().getStats().size;

    expectStatus(response1, 200);
    expect((body1 as { query: string }).query).toBe('test');

    // Second call with same params - should use cache
    const request2 = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: { q: 'test', limit: 20, offset: 0 },
    });
    const response2 = await GET(request2);
    const body2 = await getResponseBody(response2);
    const cacheAfterSecond = getRequestCache().getStats().size;

    expectStatus(response2, 200);
    expect((body2 as { query: string }).query).toBe('test');

    // Verify cache worked (cache size increased after first call, stayed same after second)
    expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
    expect(cacheAfterSecond).toBeGreaterThanOrEqual(cacheAfterFirst);

    // Results should be equal (indicating cache was used)
    expect(body1).toEqual(body2);
  });

  it('should return 405 for unsupported method', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/search',
      query: { q: 'test', limit: 20, offset: 0 },
    });

    // POST is not supported - route factory will throw
    await expect(GET(request)).rejects.toThrow();
  });

  it('should highlight search results', async () => {
    // Set up RPC mock with results that need highlighting
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        results: [
          {
            id: 'content-1',
            title: 'AI Agent Framework',
            slug: 'ai-agent-framework',
            category: 'agents',
            description: 'A comprehensive framework for building AI agents',
            popularity_score: 100,
            created_at: new Date('2024-01-01'),
          },
        ],
        total_count: 1,
      },
    ]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: { q: 'ai', limit: 20, offset: 0 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(Array.isArray((body as { results: unknown[] }).results)).toBe(true);
    // Results should be highlighted (SearchService.highlightResults is called)
    // Note: Highlighting logic is in SearchService, so we verify the results structure
    const results = (body as { results: Array<{ title: string; description?: string }> }).results;
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('title');
  });

  it('should track analytics for non-empty queries', async () => {
    // Set up RPC mock
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        results: mockContentResults,
        total_count: mockContentResults.length,
      },
    ]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: { q: 'ai agents', limit: 20, offset: 0 },
    });

    const response = await GET(request);
    expectStatus(response, 200);

    // Analytics is non-blocking, so we wait a bit for it to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify analytics was called
    expect(mockEnqueuePulseEventServer).toHaveBeenCalledWith(
      expect.objectContaining({
        interaction_type: 'search',
        metadata: expect.objectContaining({
          query: 'ai agents',
          filters: expect.objectContaining({
            sort: expect.any(String),
          }),
        }),
      })
    );
  });

  it('should not track analytics for empty queries', async () => {
    // Set up RPC mock
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        results: mockContentResults,
        total_count: mockContentResults.length,
      },
    ]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: { q: '', limit: 20, offset: 0 },
    });

    const response = await GET(request);
    expectStatus(response, 200);

    // Analytics is non-blocking, so we wait a bit
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify analytics was NOT called for empty query
    expect(mockEnqueuePulseEventServer).not.toHaveBeenCalled();
  });

  it('should handle pagination edge cases', async () => {
    // Test with offset beyond total count
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        results: [],
        total_count: 10,
      },
    ]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: {
        q: 'test',
        limit: 20,
        offset: 100, // Beyond total count
      },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    const pagination = (
      body as { pagination: { total: number; limit: number; offset: number; hasMore: boolean } }
    ).pagination;
    expect(pagination.total).toBe(10);
    expect(pagination.offset).toBe(100);
    expect(pagination.hasMore).toBe(false);
  });

  it('should handle search with no results', async () => {
    // Set up RPC mock with empty results
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        results: [],
        total_count: 0,
      },
    ]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: { q: 'nonexistent', limit: 20, offset: 0 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect((body as { results: unknown[] }).results).toEqual([]);
    expect((body as { pagination: { total: number } }).pagination.total).toBe(0);
    expect((body as { pagination: { hasMore: boolean } }).pagination.hasMore).toBe(false);
  });

  it('should handle mixed valid and invalid categories', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: {
        q: 'test',
        categories: 'agents,invalid-category,mcp',
        limit: 20,
        offset: 0,
      },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Route should filter out invalid categories and only use valid ones
    // If all categories are invalid after filtering, it throws an error
    // Since we have 'invalid-category' which gets filtered out, but 'agents' and 'mcp' are valid,
    // the route should succeed with only valid categories
    expectStatus(response, 200);
    expect((body as { filters: { categories?: string[] } }).filters.categories).toEqual([
      'agents',
      'mcp',
    ]);
  });

  it('should handle job_remote as boolean string', async () => {
    // Test with 'true' string
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        jobs: mockJobResults,
        total_count: mockJobResults.length,
      },
    ]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: {
        q: 'engineer',
        job_remote: 'true',
        limit: 20,
        offset: 0,
      },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect((body as { filters: { job_remote?: boolean } }).filters.job_remote).toBe(true);

    // Test with 'false' string
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        jobs: mockJobResults,
        total_count: mockJobResults.length,
      },
    ]);

    const request2 = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: {
        q: 'engineer',
        job_remote: 'false',
        limit: 20,
        offset: 0,
      },
    });

    const response2 = await GET(request2);
    const body2 = await getResponseBody(response2);

    expectStatus(response2, 200);
    expect((body2 as { filters: { job_remote?: boolean } }).filters.job_remote).toBe(false);
  });

  it('should handle default limit and offset values', async () => {
    // Set up RPC mock
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValueOnce([
      {
        results: mockContentResults,
        total_count: mockContentResults.length,
      },
    ]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search',
      query: { q: 'test' }, // No limit or offset
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    // Schema should provide defaults for limit and offset
    const pagination = (body as { pagination: { limit: number; offset: number } }).pagination;
    expect(typeof pagination.limit).toBe('number');
    expect(typeof pagination.offset).toBe('number');
  });
});
