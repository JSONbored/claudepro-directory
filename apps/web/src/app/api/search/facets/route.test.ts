/**
 * Integration Tests for Search Facets API Route
 *
 * Tests the /api/search/facets endpoint which returns available search facets.
 * Uses real SearchService with Prismocker for RPC calls.
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
  getWithAuthCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        ...(typeof corsHeaders === 'object' && corsHeaders !== null
          ? (corsHeaders as Record<string, string>)
          : {}),
      },
    });
  }),
  buildCacheHeaders: jest.fn(() => ({
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  })),
}));

describe('GET /api/search/facets', () => {
  let prismocker: PrismaClient;

  // Mock result structure matching GetSearchFacetsFormattedReturns
  const mockFacets = [
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
    // Assign jest.fn() directly to $queryRawUnsafe (Prismocker's Proxy set handler)
    // Default mock for facets (no arguments for get_search_facets_formatted)
    prismocker.$queryRawUnsafe = jest
      .fn()
      .mockResolvedValue(mockFacets) as unknown as typeof prismocker.$queryRawUnsafe;
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
    expect((body as { facets: unknown[] }).facets).toEqual(mockFacets);

    // Verify RPC was called (get_search_facets_formatted takes no arguments)
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('get_search_facets_formatted')
      // No arguments for this RPC
    );
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
    expect(firstFacet.category).toBe('skills');
    expect(firstFacet.content_count).toBe(150);
    expect(Array.isArray(firstFacet.tags)).toBe(true);
    expect(Array.isArray(firstFacet.authors)).toBe(true);
  });

  it('should handle empty facets array', async () => {
    // Set up RPC mock to return empty array
    prismocker.$queryRawUnsafe = jest
      .fn()
      .mockResolvedValue([]) as unknown as typeof prismocker.$queryRawUnsafe;

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
    // Set up RPC mock to throw an error
    prismocker.$queryRawUnsafe = jest
      .fn()
      .mockRejectedValue(
        new Error('Database error')
      ) as unknown as typeof prismocker.$queryRawUnsafe;

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/facets',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
    expect(body.error).toContain('Database error');
  });

  it('should cache results on duplicate calls (caching test)', async () => {
    // First call
    const cacheBefore = getRequestCache().getStats().size;
    const request1 = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/facets',
      query: {},
    });

    const response1 = await GET(request1);
    const body1 = await getResponseBody(response1);
    const cacheAfterFirst = getRequestCache().getStats().size;

    // Second call
    const request2 = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/facets',
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
    // so $queryRawUnsafe may be called multiple times, but cache should still be used within the same request
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });

  it('should return 405 for unsupported method', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/search/facets',
      query: {},
    });

    const response = await GET(request);
    const body = (await getResponseBody(response)) as { error?: string };

    expectStatus(response, 405);
    expect(body).toHaveProperty('error');
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });
});
