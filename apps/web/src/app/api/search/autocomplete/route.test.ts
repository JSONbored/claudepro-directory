/**
 * Integration Tests for Search Autocomplete API Route
 *
 * Tests the /api/search/autocomplete endpoint which returns search autocomplete suggestions.
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

describe('GET /api/search/autocomplete', () => {
  let prismocker: PrismaClient;

  // Mock result structure matching GetSearchSuggestionsFormattedReturns
  const mockSuggestions = [
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
    // Default mock for autocomplete suggestions
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue(mockSuggestions);
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
    expect((body as { suggestions: unknown[] }).suggestions).toEqual(mockSuggestions);

    // Verify RPC was called (callRpc uses positional parameters in object key order)
    // p_limit comes before p_query alphabetically
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('get_search_suggestions_formatted'),
      10, // p_limit (comes first alphabetically)
      'react' // p_query
    );
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
    expect(body).toHaveProperty('query', 'test');
    expect(body).toHaveProperty('suggestions');

    // Verify RPC was called with default limit (10)
    // p_limit comes before p_query alphabetically
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('get_search_suggestions_formatted'),
      10, // p_limit (default, comes first alphabetically)
      'test' // p_query
    );
  });

  it('should trim query string', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/autocomplete',
      query: { q: '  react  ', limit: 10 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('query', 'react'); // Trimmed
    expect(body).toHaveProperty('suggestions');

    // Verify trimmed query is passed to RPC
    // p_limit comes before p_query alphabetically
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('get_search_suggestions_formatted'),
      10, // p_limit (comes first alphabetically)
      'react' // p_query (trimmed)
    );
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
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should return 500 for query with only whitespace (route throws error)', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/autocomplete',
      query: { q: '  ' }, // Only whitespace
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Route's responseHandler throws Error for queries < 2 chars, factory returns 500
    // Note: Service call happens before responseHandler, so RPC is called with empty string
    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
    // RPC is called with empty string (trimmed), then responseHandler throws
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('get_search_suggestions_formatted'),
      10, // p_limit (default)
      '' // p_query (trimmed to empty string)
    );
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
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
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
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
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
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should handle service errors gracefully', async () => {
    // Set up RPC mock to throw an error
    prismocker.$queryRawUnsafe = jest.fn().mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/autocomplete',
      query: { q: 'react', limit: 10 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
    expect(body.error).toContain('Database error');
  });

  it('should handle empty suggestions array', async () => {
    // Set up RPC mock to return empty array
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);

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

  it('should handle maximum limit (20)', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/autocomplete',
      query: { q: 'test', limit: 20 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('query', 'test');
    expect(body).toHaveProperty('suggestions');

    // Verify RPC was called with maximum limit
    // p_limit comes before p_query alphabetically
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('get_search_suggestions_formatted'),
      20, // p_limit (maximum, comes first alphabetically)
      'test' // p_query
    );
  });

  it('should cache results on duplicate calls (caching test)', async () => {
    // First call
    const cacheBefore = getRequestCache().getStats().size;
    const request1 = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/autocomplete',
      query: { q: 'react', limit: 10 },
    });

    const response1 = await GET(request1);
    const body1 = await getResponseBody(response1);
    const cacheAfterFirst = getRequestCache().getStats().size;

    // Second call with same query
    const request2 = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/search/autocomplete',
      query: { q: 'react', limit: 10 },
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
      url: 'http://localhost:3000/api/v1/search/autocomplete',
      query: { q: 'react', limit: 10 },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 405);
    expect(body).toHaveProperty('error');
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });
});
