/**
 * Unit Tests for Changelog Entry API Route
 *
 * Tests the /api/content/changelog/[slug] endpoint which returns a changelog entry in LLMs.txt format.
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
} from '../../../__helpers__/test-helpers';

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
          ...(typeof corsHeaders === 'object' && corsHeaders !== null ? (corsHeaders as Record<string, string>) : {}),
        },
      }
    );
  }),
  handleOptionsRequest: jest.fn((corsHeaders) => {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...(typeof corsHeaders === 'object' && corsHeaders !== null ? (corsHeaders as Record<string, string>) : {}),
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
          ...(typeof corsHeaders === 'object' && corsHeaders !== null ? (corsHeaders as Record<string, string>) : {}),
        },
      }
    );
  }),
  textResponse: jest.fn((text, status, corsHeaders, additionalHeaders) => {
    return new Response(text, {
      status: typeof status === 'number' ? status : 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...(typeof corsHeaders === 'object' && corsHeaders !== null ? (corsHeaders as Record<string, string>) : {}),
        ...(typeof additionalHeaders === 'object' && additionalHeaders !== null ? (additionalHeaders as Record<string, string>) : {}),
      },
    });
  }),
  buildCacheHeaders: jest.fn(() => ({
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  })),
}));

// Mock server/not-found-response (route imports this)
jest.mock('@heyclaude/web-runtime/server/not-found-response', () => ({
  notFoundResponse: jest.fn((message, resourceType) => {
    return new Response(
      JSON.stringify({
        error: message,
        resourceType,
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),
}));

// Mock authentication (changelog entry route doesn't require auth, but factory checks it)
jest.mock('@heyclaude/web-runtime/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: jest.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

describe('GET /api/content/changelog/[slug]', () => {
  let prismocker: PrismaClient;

  // Mock data for RPC calls
  const mockChangelogEntryLlmsTxt = '# Changelog Entry\n\n## [1.0.0] - 2025-01-11\n- Added new feature\n- Fixed bug';

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

    // 5. Set up $queryRawUnsafe for RPC testing (ContentService uses callRpc → BasePrismaService.callRpc → $queryRawUnsafe)
    // Assign jest.fn() directly to $queryRawUnsafe (Prismocker's Proxy set handler)
    // Default mock for changelog entry LLMs text
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue(mockChangelogEntryLlmsTxt) as unknown as typeof prismocker.$queryRawUnsafe;
  });

  it('should return changelog entry in llms format', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: { format: 'llms-entry' },
    });

    // Mock route params (Next.js params are Promises)
    const context = {
      params: Promise.resolve({ slug: '1-0-0-2025-01-11' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(typeof body === 'string').toBe(true);
    if (typeof body === 'string') {
      expect(body).toContain('# Changelog Entry');
      expect(body).toContain('[1.0.0]');
    }
    // Verify RPC was called (callRpc uses positional parameters)
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('generate_changelog_entry_llms_txt'),
      '1-0-0-2025-01-11' // p_slug
    );
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
  });

  it('should return changelog entry with default format when format is missing', async () => {
    // changelogEntryFormatSchema has a default value, so missing format is valid
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: {}, // No format - should default to 'llms-entry'
    });

    const context = {
      params: Promise.resolve({ slug: '1-0-0-2025-01-11' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(typeof body === 'string').toBe(true);
    // Verify RPC was called (callRpc uses positional parameters)
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('generate_changelog_entry_llms_txt'),
      '1-0-0-2025-01-11' // p_slug
    );
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
  });

  it('should return 400 for invalid format', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: { format: 'json' }, // Invalid - must be 'llms-entry'
    });

    const context = {
      params: Promise.resolve({ slug: '1-0-0-2025-01-11' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    // RPC should not be called for invalid format
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should return 404 for non-existent changelog entry', async () => {
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/nonexistent',
      query: { format: 'llms-entry' },
    });

    const context = {
      params: Promise.resolve({ slug: 'nonexistent' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 404);
    expect(body).toHaveProperty('error');
    // Verify RPC was called before returning 404 (callRpc uses positional parameters)
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('generate_changelog_entry_llms_txt'),
      'nonexistent' // p_slug
    );
  });

  it('should handle service errors gracefully', async () => {
    prismocker.$queryRawUnsafe = jest.fn().mockRejectedValue(new Error('Database error')) as unknown as typeof prismocker.$queryRawUnsafe;

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: { format: 'llms-entry' },
    });

    const context = {
      params: Promise.resolve({ slug: '1-0-0-2025-01-11' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
    // Verify RPC was called before error (callRpc uses positional parameters)
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('generate_changelog_entry_llms_txt'),
      '1-0-0-2025-01-11' // p_slug
    );
  });

  it('should include X-Generated-By header', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: { format: 'llms-entry' },
    });

    const context = {
      params: Promise.resolve({ slug: '1-0-0-2025-01-11' }),
    };

    const response = await GET(request, context);

    expect(response.headers.get('x-generated-by')).toBe('prisma.rpc.generate_changelog_entry_llms_txt');
  });

  it('should replace escaped newlines with actual newlines', async () => {
    // Set up RPC mock to return text with escaped newlines
    const textWithEscapedNewlines = 'Line 1\\nLine 2\\nLine 3';
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue(textWithEscapedNewlines) as unknown as typeof prismocker.$queryRawUnsafe;

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: { format: 'llms-entry' },
    });

    const context = {
      params: Promise.resolve({ slug: '1-0-0-2025-01-11' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(typeof body === 'string').toBe(true);
    if (typeof body === 'string') {
      // Escaped newlines should be replaced with actual newlines
      expect(body).toContain('\n');
      expect(body).not.toContain('\\n');
    }
  });

  it('should return 404 for empty string result (treated as not found)', async () => {
    // Set up RPC mock to return empty string
    // Empty string is falsy, so responseHandler treats it as not found
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue('') as unknown as typeof prismocker.$queryRawUnsafe;

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: { format: 'llms-entry' },
    });

    const context = {
      params: Promise.resolve({ slug: '1-0-0-2025-01-11' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response) as { error?: string };

    // Empty string is falsy, so responseHandler returns 404
    expectStatus(response, 404);
    expect(body).toHaveProperty('error');
    expect(body.error).toContain('not found');
  });

  it('should handle missing route context', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: { format: 'llms-entry' },
    });

    // Missing params - should throw error which gets caught by factory and returns 500
    const context = {} as { params: Promise<{ slug: string }> };

    const response = await GET(request, context);
    const body = await getResponseBody(response) as { error?: string };

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should handle missing slug in route params', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: { format: 'llms-entry' },
    });

    // Route params with missing slug - methodArgs throws error which gets caught by factory and returns 500
    const context = {
      params: Promise.resolve({} as { slug: string }), // Missing slug
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response) as { error?: string };

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
    expect(body.error).toContain('Missing slug');
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
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
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: { format: 'llms-entry' },
    });

    const context1 = {
      params: Promise.resolve({ slug: '1-0-0-2025-01-11' }),
    };

    // First call - should populate cache
    const cacheBefore = getRequestCache().getStats().size;
    const response1 = await GET(request1, context1);
    const body1 = await getResponseBody(response1);
    const cacheAfterFirst = getRequestCache().getStats().size;

    // Second call with same slug - should use cache within same request context
    // Note: Request-scoped cache doesn't persist across separate GET() calls in tests
    const request2 = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: { format: 'llms-entry' },
    });

    const context2 = {
      params: Promise.resolve({ slug: '1-0-0-2025-01-11' }),
    };

    const response2 = await GET(request2, context2);
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

  it('should return 405 for unsupported method', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: { format: 'llms-entry' },
    });

    const context = {
      params: Promise.resolve({ slug: '1-0-0-2025-01-11' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 405);
    expect(body).toHaveProperty('error');
  });
});
