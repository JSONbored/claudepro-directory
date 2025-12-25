/**
 * Unit Tests for Remove Bookmark API Route
 *
 * Tests the /api/bookmarks/remove endpoint which removes a bookmark for the authenticated user.
 * Uses real removeBookmark action and Prismocker for database mocking.
 */

import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { NextResponse } from 'next/server';
import { POST, OPTIONS } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
  expectErrorResponse,
} from '../../__helpers__/test-helpers';

// Import real cache utilities for proper cache testing
import { clearRequestCache, getRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock next/cache (Cache Components and cache invalidation)
const mockRevalidatePath = jest.fn();
const mockRevalidateTag = jest.fn();
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(async () => {}),
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
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

// DO NOT mock removeBookmark - use REAL action for integration testing
// The action uses safemocker for authentication and runRpc for RPC calls

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
  handleOptionsRequest: jest.fn((corsHeaders) => {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...(corsHeaders as Record<string, string>),
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
          ...(corsHeaders as Record<string, string>),
        },
      }
    );
  }),
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
  buildCacheHeaders: jest.fn(() => ({
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  })),
}));

// DO NOT mock getAuthenticatedUser - route no longer uses requireAuth: true
// Authentication is handled by authedAction (via safemocker in tests)

// Set up test cookie store for real Supabase client testing
import { setupTestCookies, clearTestCookies } from '@heyclaude/web-runtime/supabase/server.test';

// Mock safe-action middleware (used by removeBookmark action)
// safe-action imports from '../logger.ts' and '../errors.ts' relative to actions directory
// Use moduleNameMapper paths for proper resolution
jest.mock('@heyclaude/web-runtime/actions/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
  toLogContextValue: (val: unknown) => val,
}));

jest.mock('@heyclaude/web-runtime/actions/errors', () => ({
  normalizeError: (error: unknown, fallback?: string) => {
    if (error instanceof Error) return error;
    return new Error(fallback || String(error));
  },
  logActionFailure: jest.fn(),
}));

// Mock environment (used by safe-action error handling and Prisma client)
jest.mock('@heyclaude/shared-runtime/schemas/env', () => {
  const envMock: Record<string, string | undefined> = {
    NODE_ENV: 'test',
    POSTGRES_PRISMA_URL: undefined,
    DIRECT_URL: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
    VERCEL: undefined,
    VITEST: undefined,
  };

  return {
    env: new Proxy(envMock, {
      get: (target, prop: string) => {
        if (prop === 'isProduction') {
          return false;
        }
        return target[prop];
      },
    }),
    get isProduction() {
      return false;
    },
  };
});

// Import SafeActionResult type from safemocker for proper typing in tests
import type { SafeActionResult } from '@jsonbored/safemocker';

describe('POST /api/bookmarks/remove', () => {
  let prismocker: PrismaClient;

  // Mock result structure matching removeBookmarkReturnsSchema
  // Note: user_id must match safemocker's test-user-id (safemocker provides ctx.userId = 'test-user-id')
  const mockBookmarkResult = {
    success: true,
    bookmark: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: 'test-user-id', // Safemocker provides ctx.userId = 'test-user-id' by default
      content_type: 'mcp',
      content_slug: 'my-server',
      created_at: '2024-01-01T00:00:00Z',
    },
  };

  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Set up working cookie store for Supabase client
    setupTestCookies();

    // 3. Get Prismocker instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // 4. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof (prismocker as any).reset === 'function') {
      (prismocker as any).reset();
    }

    // 5. Clear all mocks
    jest.clearAllMocks();

    // 6. Set up $queryRawUnsafe for RPC testing (removeBookmark uses runRpc → BasePrismaService.callRpc → $queryRawUnsafe)
    // Assign jest.fn() directly to $queryRawUnsafe (Prismocker's Proxy set handler)
    const mockQueryRawUnsafe = jest.fn().mockResolvedValue([mockBookmarkResult]);
    (prismocker.$queryRawUnsafe as unknown as typeof mockQueryRawUnsafe) = mockQueryRawUnsafe;

    // 7. Reset revalidate mocks
    mockRevalidatePath.mockClear();
    mockRevalidateTag.mockClear();
  });

  afterEach(() => {
    // Clear cookies after each test
    clearTestCookies();
  });

  it('should remove bookmark for authenticated user', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/remove',
      body: {
        content_slug: 'my-server',
        content_type: 'mcp',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);

    // Verify SafeActionResult structure
    const safeResult = body as SafeActionResult<typeof mockBookmarkResult>;
    expect(safeResult.data).toBeDefined();
    expect(safeResult.serverError).toBeUndefined();
    expect(safeResult.fieldErrors).toBeUndefined();

    // Verify RPC was called with correct SQL and parameters
    // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
    // Args object: { p_user_id, p_content_type, p_content_slug }
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('remove_bookmark'),
      'test-user-id', // p_user_id (from ctx.userId in authedAction middleware)
      'mcp', // p_content_type
      'my-server' // p_content_slug
    );

    // Verify result data structure (wrapped in SafeActionResult.data)
    expect(safeResult.data?.success).toBe(true);
    expect(safeResult.data?.bookmark).toBeDefined();
    expect(safeResult.data?.bookmark?.content_slug).toBe('my-server');
    expect(safeResult.data?.bookmark?.content_type).toBe('mcp');
  });

  it('should return 401 for unauthenticated user', async () => {
    // Safemocker automatically handles unauthenticated users when cookies are cleared
    clearTestCookies();

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/remove',
      body: {
        content_slug: 'my-server',
        content_type: 'mcp',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    // Route returns SafeActionResult structure - authedAction returns serverError for auth failures
    expectStatus(response, 401);

    if (typeof body === 'object' && body !== null) {
      const result = body as SafeActionResult<unknown>;
      expect(result.serverError).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    } else {
      // Fallback: direct error property
      expect(body).toHaveProperty('error');
      expect((body as { error?: string }).error).toContain('Unauthorized');
    }
  });

  it('should return 400 for missing content_slug', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/remove',
      body: {
        content_type: 'mcp',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should return 400 for missing content_type', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/remove',
      body: {
        content_slug: 'my-server',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid content_type', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/remove',
      body: {
        content_slug: 'my-server',
        content_type: 'invalid-type',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should handle RPC exceptions gracefully', async () => {
    // Override $queryRawUnsafe to throw an error
    (prismocker.$queryRawUnsafe as unknown as ReturnType<typeof jest.fn>).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/remove',
      body: {
        content_slug: 'my-server',
        content_type: 'mcp',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    // Route now explicitly handles serverError from action, returning 500
    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should call RPC for each POST request (mutations do not cache)', async () => {
    // First call
    const request1 = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/remove',
      body: {
        content_slug: 'my-server',
        content_type: 'mcp',
      },
    });
    await POST(request1);

    // Second call (new request object - NextRequest body can only be read once)
    const request2 = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/remove',
      body: {
        content_slug: 'my-server',
        content_type: 'mcp',
      },
    });
    await POST(request2);

    // Verify RPC was called twice (mutations don't cache)
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(2);
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });

  it('should invalidate cache tags on successful removal', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/remove',
      body: {
        content_slug: 'my-server',
        content_type: 'mcp',
      },
    });

    await POST(request);

    // Verify cache invalidation was called
    expect(mockRevalidatePath).toHaveBeenCalledWith('/account');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library');
    expect(mockRevalidateTag).toHaveBeenCalledWith('user-bookmarks', 'default');
    expect(mockRevalidateTag).toHaveBeenCalledWith('users', 'default');
    expect(mockRevalidateTag).toHaveBeenCalledWith('user-test-user-id', 'default');
    expect(mockRevalidateTag).toHaveBeenCalledWith('content-my-server', 'default');
  });
});
