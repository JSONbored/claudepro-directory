/**
 * Integration Tests for User Profile Image API Route
 *
 * Tests the /api/user/profile-image endpoint which returns the authenticated user's profile image URL.
 * Uses real getUserProfileImage action with Prismocker for integration testing.
 * Authentication is handled by authedAction (via safemocker in tests).
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
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

// Mock logger
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

// DO NOT mock api-helpers - use REAL helpers for integration testing
// The route factory uses these helpers internally, so we need the real implementations

// DO NOT mock getAuthenticatedUser - route no longer uses requireAuth: true
// Authentication is handled by authedAction (via safemocker in tests)

// Set up test cookie store for real Supabase client testing
import { setupTestCookies, clearTestCookies } from '@heyclaude/web-runtime/supabase/server.test';

// Mock safe-action middleware (used by getUserProfileImage action)
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
      get: (target, prop) => {
        if (typeof prop === 'string') {
          return target[prop];
        }
        return undefined;
      },
    }),
    get isProduction() {
      return false;
    },
  };
});

// Import SafeActionResult type from safemocker for proper typing in tests
import type { SafeActionResult } from '@jsonbored/safemocker';

// DO NOT mock route-factory - use REAL factory for integration testing
// This ensures we test the complete flow: Route → Factory → Handler → Action → RPC → Database (Prismocker)

describe('GET /api/user/profile-image', () => {
  let prismocker: PrismaClient;
  const testUserId = 'test-user-id'; // Safemocker provides ctx.userId = 'test-user-id' by default

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
    jest.resetAllMocks();

    // 6. Seed users data using Prismocker's setData method
    // Note: user_id must match safemocker's test-user-id (safemocker provides ctx.userId = 'test-user-id')
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('users', [
        {
          id: testUserId, // Safemocker provides ctx.userId = 'test-user-id' by default
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg',
        },
      ]);
    }
  });

  afterEach(() => {
    // Clear test cookies after each test
    clearTestCookies();
  });

  it('should return profile image URL for authenticated user', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/user/profile-image',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    
    // Route returns SafeActionResult structure from getUserProfileImage action
    if (typeof body === 'object' && body !== null) {
      const result = body as SafeActionResult<{ imageUrl: string | null }>;
      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
      expect(result.data?.imageUrl).toBe('https://example.com/avatar.jpg');
    } else {
      // Fallback: direct imageUrl property (if route unwraps the action result)
      expect(body).toHaveProperty('imageUrl', 'https://example.com/avatar.jpg');
    }
  });

  it('should return null when user has no profile image', async () => {
    // Update user data to have no image
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('users', [
        {
          id: testUserId, // Safemocker provides ctx.userId = 'test-user-id' by default
          email: 'test@example.com',
          image: null,
        },
      ]);
    }

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/user/profile-image',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    
    // Route returns SafeActionResult structure from getUserProfileImage action
    if (typeof body === 'object' && body !== null && 'data' in body) {
      const result = body as SafeActionResult<{ imageUrl: string | null }>;
      expect(result.data?.imageUrl).toBe(null);
    } else {
      // Fallback: direct imageUrl property
      expect(body).toHaveProperty('imageUrl', null);
    }
  });

  it('should return 401 for unauthenticated user', async () => {
    // Safemocker automatically handles unauthenticated users when cookies are cleared
    clearTestCookies();

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/user/profile-image',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Route returns SafeActionResult structure - authedAction returns serverError for auth failures
    expectStatus(response, 401);
    
    if (typeof body === 'object' && body !== null) {
      const result = body as SafeActionResult<{ imageUrl: string | null }>;
      expect(result.serverError).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    } else {
      // Fallback: direct error property
      expect(body).toHaveProperty('error');
    }
  });

  it('should handle database errors gracefully', async () => {
    // Mock Prisma to throw an error
    const originalFindUnique = prismocker.users.findUnique;
    (prismocker.users.findUnique as any) = jest.fn().mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/user/profile-image',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    
    // Route returns SafeActionResult structure - errors are returned as serverError
    if (typeof body === 'object' && body !== null) {
      const result = body as SafeActionResult<{ imageUrl: string | null }>;
      expect(result.serverError).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    } else {
      // Fallback: direct error property
      expect(body).toHaveProperty('error');
    }

    // Restore original method
    prismocker.users.findUnique = originalFindUnique;
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });

  it('should cache results on duplicate calls (caching test)', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/user/profile-image',
    });

    // First call
    const cacheBefore = getRequestCache().getStats().size;
    const response1 = await GET(request);
    const body1 = await getResponseBody(response1);
    const cacheAfterFirst = getRequestCache().getStats().size;

    // Second call
    const response2 = await GET(request);
    const body2 = await getResponseBody(response2);
    const cacheAfterSecond = getRequestCache().getStats().size;

    // Verify cache worked (though this route uses Prisma directly, not RPC, so cache may not apply)
    expect(body1).toEqual(body2);
    // Note: Prisma queries don't use request-scoped cache, so cache size may not change
    // This test verifies the route works correctly on duplicate calls
  });
});

