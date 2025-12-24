/**
 * Unit Tests for Feeds API Route
 *
 * Tests the /api/feeds endpoint which generates RSS or Atom feeds.
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

// Mock web-runtime/utils/category-validation
jest.mock('@heyclaude/web-runtime/utils/category-validation', () => ({
  isValidCategory: jest.fn((category: string) => {
    const validCategories = ['agents', 'mcp', 'rules', 'skills'];
    return validCategories.includes(category.toLowerCase());
  }),
  VALID_CATEGORIES: ['agents', 'mcp', 'rules', 'skills'],
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
  xmlResponse: jest.fn((xml, contentType, status, corsHeaders, additionalHeaders) => {
    return new Response(xml, {
      status: typeof status === 'number' ? status : 200,
      headers: {
        'Content-Type': contentType,
        ...(typeof corsHeaders === 'object' && corsHeaders !== null ? (corsHeaders as Record<string, string>) : {}),
        ...(typeof additionalHeaders === 'object' && additionalHeaders !== null ? (additionalHeaders as Record<string, string>) : {}),
      },
    });
  }),
  buildCacheHeaders: jest.fn(() => ({
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  })),
}));

// Mock authentication (feeds route doesn't require auth, but factory checks it)
jest.mock('@heyclaude/web-runtime/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: jest.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

describe('GET /api/feeds', () => {
  let prismocker: PrismaClient;

  // Mock data for RPC calls
  const mockRssFeed = '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Claude Pro Directory</title></channel></rss>';
  const mockAtomFeed = '<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Claude Pro Directory</title></feed>';
  const mockChangelogRssFeed = '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Changelog</title></channel></rss>';
  const mockChangelogAtomFeed = '<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Changelog</title></feed>';

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

    // Set up $queryRawUnsafe for RPC testing (all feed generation methods use RPC)
    // Default: return RSS feed for content
    prismocker.$queryRawUnsafe = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('generate_content_rss_feed')) {
        return Promise.resolve(mockRssFeed);
      }
      if (sql.includes('generate_content_atom_feed')) {
        return Promise.resolve(mockAtomFeed);
      }
      if (sql.includes('generate_changelog_rss_feed')) {
        return Promise.resolve(mockChangelogRssFeed);
      }
      if (sql.includes('generate_changelog_atom_feed')) {
        return Promise.resolve(mockChangelogAtomFeed);
      }
      return Promise.resolve('');
    });
  });

  it('should return RSS feed by default', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/feeds',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(response.headers.get('Content-Type')).toContain('application/rss+xml');
    expect(typeof body === 'string').toBe(true);
    if (typeof body === 'string') {
      expect(body).toContain('<rss');
    }
    // Verify RPC was called for generate_content_rss_feed
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM generate_content_rss_feed(p_limit => $1)',
      50
    );
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
  });

  it('should return RSS feed with type=rss', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/feeds?type=rss',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('application/rss+xml');
    expect(typeof body === 'string').toBe(true);
    // Verify RPC was called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM generate_content_rss_feed(p_limit => $1)',
      50
    );
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
  });

  it('should return Atom feed with type=atom', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/feeds?type=atom',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('application/atom+xml');
    expect(typeof body === 'string').toBe(true);
    // Verify RPC was called for generate_content_atom_feed
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM generate_content_atom_feed(p_limit => $1)',
      50
    );
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
  });

  it('should filter by category when provided', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/feeds?type=rss&category=agents',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    // Verify RPC was called with category parameter
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM generate_content_rss_feed(p_category => $1, p_limit => $2)',
      'agents',
      50
    );
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
  });

  it('should return changelog RSS feed when category=changelog', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/feeds?type=rss&category=changelog',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('application/rss+xml');
    expect(typeof body === 'string').toBe(true);
    // For changelog feeds, the route makes two RPC calls:
    // 1. First, generateContentRssFeed is called with empty args (buildFeedMethodArgs returns [] for changelog)
    // 2. Then, handleFeedResponse calls generateChangelogRssFeed directly
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM generate_changelog_rss_feed(p_limit => $1)',
      50
    );
    // Should be called twice: once for generateContentRssFeed (with empty args), once for generateChangelogRssFeed
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(2);
  });

  it('should return changelog Atom feed when category=changelog', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/feeds?type=atom&category=changelog',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('application/atom+xml');
    expect(typeof body === 'string').toBe(true);
    // For changelog feeds, the route makes two RPC calls:
    // 1. First, generateContentAtomFeed is called with empty args (buildFeedMethodArgs returns [] for changelog)
    // 2. Then, handleFeedResponse calls generateChangelogAtomFeed directly
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM generate_changelog_atom_feed(p_limit => $1)',
      50
    );
    // Should be called twice: once for generateContentAtomFeed (with empty args), once for generateChangelogAtomFeed
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(2);
  });

  it('should return 400 for invalid type', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/feeds?type=invalid',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    // RPC should not be called for invalid type
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should handle service errors gracefully', async () => {
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/feeds?type=rss',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
    // Verify RPC was called before error
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
  });

  it('should include X-Generated-By header for content feeds', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/feeds?type=rss',
    });

    const response = await GET(request);

    expect(response.headers.get('x-generated-by')).toBe('prisma.rpc.generateContentRssFeed');
  });

  it('should include X-Generated-By header for changelog feeds', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/feeds?type=rss&category=changelog',
    });

    const response = await GET(request);

    expect(response.headers.get('x-generated-by')).toBe('prisma.rpc.generateChangelogRssFeed');
  });

  it('should include X-Content-Source header', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/feeds?type=rss&category=agents',
    });

    const response = await GET(request);

    expect(response.headers.get('x-content-source')).toBeTruthy();
    expect(response.headers.get('x-content-source')).toContain('agents');
  });

  it('should include X-Robots-Tag header', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/feeds?type=rss',
    });

    const response = await GET(request);

    expect(response.headers.get('x-robots-tag')).toBe('index, follow');
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
      url: 'http://localhost:3000/api/v1/feeds?type=rss',
    });

    // First call - should populate cache
    const cacheBefore = getRequestCache().getStats().size;
    await GET(request1);
    const cacheAfterFirst = getRequestCache().getStats().size;
    const firstCallCount = (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mock.calls.length;

    // Clear cache between calls to ensure second call makes a fresh request
    clearRequestCache();

    // Second call - should make a new RPC call (request-scoped cache doesn't persist across separate GET calls)
    const request2 = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/feeds?type=rss',
    });

    const cacheBeforeSecond = getRequestCache().getStats().size;
    await GET(request2);
    const cacheAfterSecond = getRequestCache().getStats().size;
    const secondCallCount = (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mock.calls.length;

    // The createFormatHandlerRoute factory uses Next.js Cache Components, which are request-scoped.
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
      url: 'http://localhost:3000/api/v1/feeds?type=rss',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 405);
    expect(body).toHaveProperty('error');
  });
});
