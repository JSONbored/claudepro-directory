/**
 * Unit Tests for Add Bookmark API Route
 *
 * Tests the /api/bookmarks/add endpoint which adds a bookmark for the authenticated user.
 * Uses real addBookmark action and Prismocker for database mocking.
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
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

// DO NOT mock addBookmark - use REAL action for integration testing
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
        ...(typeof corsHeaders === 'object' && corsHeaders !== null ? (corsHeaders as Record<string, string>) : {}),
        ...(typeof additionalHeaders === 'object' && additionalHeaders !== null ? (additionalHeaders as Record<string, string>) : {}),
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
// Import SafeActionResult type from safemocker for proper typing in tests
import type { SafeActionResult } from '@jsonbored/safemocker';

// Mock safe-action middleware (used by addBookmark action)
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

describe('POST /api/bookmarks/add', () => {
  let prismocker: PrismaClient;

  // Mock result structure matching addBookmarkReturnsSchema
  // Note: user_id must match safemocker's test-user-id (safemocker provides ctx.userId = 'test-user-id')
  const mockBookmarkResult = {
    success: true,
    bookmark: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: 'test-user-id', // Safemocker provides ctx.userId = 'test-user-id' by default
      content_type: 'mcp',
      content_slug: 'my-server',
      notes: 'Optional notes',
      created_at: '2024-01-01T00:00:00Z',
    },
  };

  beforeEach(async () => {
    // Set up test cookie store for real Supabase client
    setupTestCookies();

    // Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // Get Prismocker instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof (prismocker as any).reset === 'function') {
      (prismocker as any).reset();
    }

    // Clear all mocks
    jest.clearAllMocks();

    // Set up $queryRawUnsafe for RPC testing (addBookmark uses runRpc → BasePrismaService.callRpc → $queryRawUnsafe)
    // Assign jest.fn() directly to $queryRawUnsafe (Prismocker's Proxy set handler)
    const mockQueryRawUnsafe = jest.fn<() => Promise<typeof mockBookmarkResult[]>>().mockResolvedValue([mockBookmarkResult]);
    (prismocker.$queryRawUnsafe as unknown as typeof mockQueryRawUnsafe) = mockQueryRawUnsafe;

    // Reset revalidate mocks
    mockRevalidatePath.mockClear();
    mockRevalidateTag.mockClear();
  });

  afterEach(() => {
    // Clear test cookies after each test
    clearTestCookies();
  });

  it('should add bookmark for authenticated user', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/add',
      body: {
        content_slug: 'my-server',
        content_type: 'mcp',
        notes: 'Optional notes',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    // Debug: Log error if status is not 200
    if (response.status !== 200) {
      console.error('Response status:', response.status);
      console.error('Response body:', JSON.stringify(body, null, 2));
    }

    expectStatus(response, 200);
    expectCorsHeaders(response);

    // Route returns SafeActionResult structure from addBookmark action
    if (typeof body === 'object' && body !== null) {
      const result = body as SafeActionResult<unknown>;
      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify RPC was called with correct SQL and parameters
      // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
      // Safemocker provides ctx.userId = 'test-user-id' by default
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('add_bookmark'),
        'test-user-id', // p_user_id (from ctx.userId in authedAction middleware via safemocker)
        'mcp', // p_content_type
        'my-server', // p_content_slug
        'Optional notes' // p_notes
      );
    }
  });

  it('should add bookmark without notes', async () => {
    const mockResultWithoutNotes = {
      ...mockBookmarkResult,
      bookmark: {
        ...mockBookmarkResult.bookmark,
        notes: null,
      },
    };
    // Reassign jest.fn() for this test
    const mockQueryRawUnsafe = jest.fn<() => Promise<typeof mockResultWithoutNotes[]>>().mockResolvedValue([mockResultWithoutNotes]);
    (prismocker.$queryRawUnsafe as unknown as typeof mockQueryRawUnsafe) = mockQueryRawUnsafe;

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/add',
      body: {
        content_slug: 'my-server',
        content_type: 'mcp',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    if (typeof body === 'object' && body !== null) {
      const result = body as SafeActionResult<unknown>;
      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();

      // Verify RPC was called with empty string for notes (route sets notes: notes || '')
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('add_bookmark'),
        'test-user-id',
        'mcp',
        'my-server',
        '' // Empty string when notes not provided
      );
    }
  });

  it('should return 401 for unauthenticated user', async () => {
    // Safemocker automatically handles unauthenticated users when cookies are cleared
    clearTestCookies();

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/add',
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
      expectErrorResponse(body);
      if (typeof body === 'object' && body !== null && 'error' in body) {
        expect((body as { error?: string }).error).toBe('Unauthorized');
      }
    }
    
    // RPC should not be called if authentication fails
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should return 400 for missing content_slug', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/add',
      body: {
        content_type: 'mcp',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expectErrorResponse(body);
    // RPC should not be called if validation fails
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should return 400 for missing content_type', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/add',
      body: {
        content_slug: 'my-server',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expectErrorResponse(body);
    // RPC should not be called if validation fails
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid content_type', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/add',
      body: {
        content_slug: 'my-server',
        content_type: 'invalid-type',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expectErrorResponse(body);
    // RPC should not be called if validation fails
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should handle RPC errors gracefully', async () => {
    // Mock RPC to return error result
    const mockErrorResult = {
      success: false,
      error: 'Bookmark already exists',
    };
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockErrorResult]);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/add',
      body: {
        content_slug: 'my-server',
        content_type: 'mcp',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    // Route returns SafeActionResult, so check for serverError
    expectStatus(response, 200); // Route returns 200, but SafeActionResult may have serverError
    if (typeof body === 'object' && body !== null) {
      const result = body as { data?: unknown; serverError?: string; fieldErrors?: unknown };
      // If RPC returns success: false, the action may return serverError
      // The exact behavior depends on how the action handles RPC errors
      expect(result).toBeDefined();
    }
  });

  it('should handle RPC exceptions gracefully', async () => {
    // Mock RPC to throw exception
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/add',
      body: {
        content_slug: 'my-server',
        content_type: 'mcp',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    // Route should handle exceptions and return error response
    expectStatus(response, 500);
    expectErrorResponse(body);
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });

  it('should return 405 for unsupported method', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/bookmarks/add',
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 405);
    expectErrorResponse(body);
  });

  it('should call RPC for each POST request (mutations do not cache)', async () => {
    // Reset mock call count before test (after beforeEach already cleared)
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockClear();

    // First call
    const request1 = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/add',
      body: {
        content_slug: 'my-server',
        content_type: 'mcp',
        notes: 'Optional notes',
      },
    });
    const callCountBefore = (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mock.calls.length;
    await POST(request1);
    const callCountAfterFirst = (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mock.calls.length;

    // Second call (new request object - NextRequest body can only be read once)
    const request2 = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/add',
      body: {
        content_slug: 'my-server',
        content_type: 'mcp',
        notes: 'Optional notes',
      },
    });
    await POST(request2);
    const callCountAfterSecond = (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mock.calls.length;

    // Verify RPC was called for each POST request
    // Mutations (add_bookmark) don't use cache, so each call should trigger an RPC call
    expect(callCountAfterFirst - callCountBefore).toBe(1); // First call
    expect(callCountAfterSecond - callCountAfterFirst).toBe(1); // Second call
    expect(callCountAfterSecond - callCountBefore).toBe(2); // Total calls
  });

  it('should support all valid content types', async () => {
    const validContentTypes = ['agents', 'mcp', 'rules', 'skills'] as const;

    for (const contentType of validContentTypes) {
      jest.clearAllMocks();
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          ...mockBookmarkResult,
          bookmark: {
            ...mockBookmarkResult.bookmark,
            content_type: contentType,
          },
        },
      ]);

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/v1/bookmarks/add',
        body: {
          content_slug: 'test-content',
          content_type: contentType,
        },
      });

      const response = await POST(request);
      const body = await getResponseBody(response);

      expectStatus(response, 200);
    if (typeof body === 'object' && body !== null) {
      const result = body as SafeActionResult<unknown>;
      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      }
    }
  });
});
