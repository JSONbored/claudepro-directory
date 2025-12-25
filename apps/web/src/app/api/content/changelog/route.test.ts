/**
 * Unit Tests for Changelog Index API Route
 *
 * Tests the /api/content/changelog endpoint which returns changelog in LLMs.txt format.
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

// Mock next/cache (Cache Components)
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(async () => {}),
}));

// Import prisma directly - don't use jest.requireActual
// Prisma is automatically PrismockerClient via __mocks__/@prisma/client.ts
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock data-layer services (use real ContentService, but mock other services to avoid side effects)
jest.mock('@heyclaude/data-layer', () => {
  const actual = jest.requireActual('@heyclaude/data-layer');
  return {
    ...actual, // Include all real exports (including ContentService)
    AccountService: class {},
    ChangelogService: class {},
    CompaniesService: class {},
    JobsService: class {},
    MiscService: class {},
    NewsletterService: class {},
    SearchService: class {},
    TrendingService: class {},
  };
});

// Mock RPC error logging utility (if needed)
jest.mock('@heyclaude/data-layer/utils/rpc-error-logging', () => ({
  logRpcError: jest.fn(),
}));

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
jest.mock('@heyclaude/web-runtime/server/api-helpers', () => ({
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
  badRequestResponse: jest.fn((message, errors, corsHeaders) => {
    return new Response(
      JSON.stringify({
        error: message,
        ...(errors && { errors }),
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...(typeof corsHeaders === 'object' && corsHeaders !== null
            ? (corsHeaders as Record<string, string>)
            : {}),
        },
      }
    );
  }),
  handleOptionsRequest: jest.fn((corsHeaders) => {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...(typeof corsHeaders === 'object' && corsHeaders !== null
          ? (corsHeaders as Record<string, string>)
          : {}),
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
          ...(typeof corsHeaders === 'object' && corsHeaders !== null
            ? (corsHeaders as Record<string, string>)
            : {}),
        },
      }
    );
  }),
  textResponse: jest.fn((text, status, corsHeaders, additionalHeaders) => {
    return new Response(text, {
      status: typeof status === 'number' ? status : 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...(typeof corsHeaders === 'object' && corsHeaders !== null
          ? (corsHeaders as Record<string, string>)
          : {}),
        ...(typeof additionalHeaders === 'object' && additionalHeaders !== null
          ? (additionalHeaders as Record<string, string>)
          : {}),
      },
    });
  }),
  buildCacheHeaders: jest.fn(() => ({
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  })),
}));

// Mock authentication (changelog route doesn't require auth, but factory checks it)
jest.mock('@heyclaude/web-runtime/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: jest.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

describe('GET /api/content/changelog', () => {
  let prismocker: PrismaClient;

  // Mock data for RPC calls
  const mockChangelogLlmsTxt =
    '# Changelog\n\n## [1.0.0] - 2025-01-11\n- Added new feature\n- Fixed bug\n\n## [0.9.0] - 2025-01-10\n- Initial release';

  beforeEach(() => {
    // Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof (prismocker as any).reset === 'function') {
      (prismocker as any).reset();
    }

    jest.clearAllMocks();

    // Set up $queryRawUnsafe for RPC testing (getChangelogLlmsTxt uses RPC)
    // Default: return successful results
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue(mockChangelogLlmsTxt);
  });

  it('should return changelog in llms format', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog',
      query: { format: 'llms-changelog' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(typeof body === 'string').toBe(true);
    if (typeof body === 'string') {
      expect(body).toContain('# Changelog');
      expect(body).toContain('[1.0.0]');
    }
    // Verify RPC was called for generate_changelog_llms_txt
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM generate_changelog_llms_txt()'
    );
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
  });

  it('should return changelog with default format when format is missing', async () => {
    // changelogFormatSchema has a default value, so missing format is valid
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog',
      query: {}, // No format - should default to 'llms-changelog'
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(typeof body === 'string').toBe(true);
    // Verify RPC was called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM generate_changelog_llms_txt()'
    );
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
  });

  it('should return 400 for invalid format', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog',
      query: { format: 'json' }, // Invalid - must be 'llms-changelog'
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    // RPC should not be called for invalid format
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should handle service errors gracefully', async () => {
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(
      new Error('Database error')
    );

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog',
      query: { format: 'llms-changelog' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
    // Verify RPC was called before error
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM generate_changelog_llms_txt()'
    );
  });

  it('should handle null/empty changelog data', async () => {
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog',
      query: { format: 'llms-changelog' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Route handler throws error if data is null, which gets caught by factory and returns 500
    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should include X-Generated-By header', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog',
      query: { format: 'llms-changelog' },
    });

    const response = await GET(request);

    expect(response.headers.get('x-generated-by')).toBe('prisma.rpc.generate_changelog_llms_txt');
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
    expect(response.headers.get('access-control-allow-methods')).toBeTruthy();
  });

  it('should cache results on duplicate calls (caching test)', async () => {
    const request1 = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog',
      query: { format: 'llms-changelog' },
    });

    // First call - should populate cache
    const cacheBefore = getRequestCache().getStats().size;
    await GET(request1);
    const cacheAfterFirst = getRequestCache().getStats().size;
    const firstCallCount = (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mock.calls
      .length;

    // Clear cache between calls to ensure second call makes a fresh request
    clearRequestCache();

    // Second call - should make a new RPC call (request-scoped cache doesn't persist across separate GET calls)
    const request2 = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog',
      query: { format: 'llms-changelog' },
    });

    const cacheBeforeSecond = getRequestCache().getStats().size;
    await GET(request2);
    const cacheAfterSecond = getRequestCache().getStats().size;
    const secondCallCount = (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mock.calls
      .length;

    // The createCachedApiRoute factory uses Next.js Cache Components, which are request-scoped.
    // This means each call to GET(request) creates a new request context, and thus a new cache.
    // Therefore, the underlying service method will be called once for each GET() call.
    expect(firstCallCount).toBe(1);
    expect(secondCallCount).toBe(2);
    // Verify cache worked within each request (cache size increased after first call)
    expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
    // Second call creates a new cache context, so cache size should increase again
    expect(cacheAfterSecond).toBeGreaterThan(cacheBeforeSecond);
  });

  it('should return 405 for unsupported method', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/content/changelog',
      query: { format: 'llms-changelog' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 405);
    expect(body).toHaveProperty('error');
  });
});
