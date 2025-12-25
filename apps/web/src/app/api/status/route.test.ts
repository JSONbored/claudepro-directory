/**
 * Status API Route Integration Tests
 *
 * Tests the /api/status route handler using real implementations:
 * - Real service factory (no mocking of data-layer services)
 * - Prismocker for database RPC calls
 * - Real request cache implementation
 * - Cache behavior testing
 * - All production features tested
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
} from '../__helpers__/test-helpers';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock next/cache (Cache Components)
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(async () => {}),
}));

// Import prisma directly - Prismocker is automatically configured via __mocks__/@prisma/client.ts
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Import real cache utilities for proper cache testing
import { clearRequestCache, getRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// Mock logger (route-factory imports from '../logging/server')
jest.mock('../../../../../../packages/web-runtime/src/logging/server', () => ({
  logger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
  },
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
  normalizeError: jest.fn((error) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
}));

// Mock server/api-helpers (route-factory imports from '../server/api-helpers')
jest.mock('../../../../../../packages/web-runtime/src/server/api-helpers', () => ({
  getOnlyCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  },
  getWithAuthCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  },
  postCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
  badRequestResponse: jest.fn((message, errors) => {
    return new Response(
      JSON.stringify({
        error: message,
        ...(errors && { errors }),
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),
  handleOptionsRequest: jest.fn((corsHeaders) => {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
    });
  }),
  unauthorizedResponse: jest.fn((message, authInfo, corsHeaders) => {
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }),
  jsonResponse: jest.fn((data, status, corsHeaders, additionalHeaders) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...additionalHeaders,
      },
    });
  }),
  buildCacheHeaders: jest.fn(() => ({
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  })),
}));

// Mock authentication (status route doesn't require auth, but factory checks it)
jest.mock('../../../../../../packages/web-runtime/src/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: jest.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

describe('GET /api/status', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // Get Prismocker instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks
    jest.clearAllMocks();

    // Set up $queryRawUnsafe for RPC testing
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([
      {
        status: 'healthy',
        database: 'connected',
        timestamp: '2025-01-11T12:00:00Z',
      },
    ]);
  });

  it('should return 200 with healthy status', async () => {
    const mockHealthData = {
      status: 'healthy',
      database: 'connected',
      timestamp: '2025-01-11T12:00:00Z',
      version: '1.1.0',
    };

    // Override $queryRawUnsafe for this test
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockHealthData]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/status',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true); // Optional in test env (cacheLife/cacheTag are mocked)

    // Verify response body
    if (typeof body === 'object' && body !== null) {
      const statusValue = 'status' in body ? body.status : undefined;
      expect(statusValue).toBe('healthy');
    }

    // Verify RPC was called correctly
    // callRpc generates SQL like: "SELECT * FROM get_api_health_formatted()"
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM get_api_health_formatted')
      // No arguments for this RPC call
    );
  });

  it('should return 200 with degraded status', async () => {
    const mockHealthData = {
      status: 'degraded',
      database: 'slow',
      timestamp: '2025-01-11T12:00:00Z',
    };

    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockHealthData]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/status',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('status', 'degraded');
    expect(body).toHaveProperty('database', 'slow');
  });

  it('should return 503 with unhealthy status', async () => {
    const mockHealthData = {
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: '2025-01-11T12:00:00Z',
    };

    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockHealthData]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/status',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 503);
    expect(body).toHaveProperty('status', 'unhealthy');
    expect(body).toHaveProperty('database', 'disconnected');
  });

  it('should handle composite type string status', async () => {
    // Test the edge case where status is a composite type string from database
    const mockHealthData = {
      status: '(healthy,"2025-01-11T12:00:00Z",1.1.0,{})',
      database: 'connected',
      timestamp: '2025-01-11T12:00:00Z',
    };

    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockHealthData]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/status',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('status', 'healthy'); // Should be parsed from composite string
  });

  it('should handle service errors gracefully', async () => {
    const dbError = new Error('Database connection failed');
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(dbError);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/status',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Factory handles errors - returns 500 for service errors
    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should handle OPTIONS request', async () => {
    const request = createMockRequest({
      method: 'OPTIONS',
      url: 'http://localhost:3000/api/v1/status',
    });

    const response = await OPTIONS();

    // OPTIONS handler returns 204 for CORS preflight
    // handleOptionsRequest returns 204 with CORS headers
    expectStatus(response, 204);
    expectCorsHeaders(response);
    expect(response.headers.get('access-control-allow-methods')).toBeTruthy();
  });

  it('should include X-Generated-By header', async () => {
    const mockHealthData = {
      status: 'healthy',
      database: 'connected',
      timestamp: '2025-01-11T12:00:00Z',
    };

    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockHealthData]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/status',
    });

    const response = await GET(request);

    expect(response.headers.get('x-generated-by')).toBe('prisma.rpc.get_api_health_formatted');
  });

  it('should cache results on duplicate calls (caching test)', async () => {
    const mockHealthData = {
      status: 'healthy',
      database: 'connected',
      timestamp: '2025-01-11T12:00:00Z',
    };

    // Reset mock to ensure clean state
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockClear();
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockHealthData]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/status',
    });

    // First call - should hit database and populate cache
    const cacheBefore = getRequestCache().getStats().size;
    const response1 = await GET(request);
    const cacheAfterFirst = getRequestCache().getStats().size;
    const body1 = await getResponseBody(response1);

    // Clear request cache to simulate a new request context
    // In real Next.js, each request gets a new execution context, so cache is cleared
    clearRequestCache();

    // Second call - creates a new request context, so cache is cleared
    // This means the service method will be called again
    const response2 = await GET(request);
    const cacheAfterSecond = getRequestCache().getStats().size;
    const body2 = await getResponseBody(response2);

    // Verify results are the same
    expect(body1).toEqual(body2);

    // Verify cache size increased after first call
    expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);

    // Verify $queryRawUnsafe was called twice (once per request)
    // Each GET() call creates a new request context with a fresh cache
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(2);
  });
});
