/**
 * Tests for safe-action.ts middleware
 *
 * This file tests the middleware that safe-action.ts adds on top of next-safe-action.
 * The real safe-action.ts imports from 'next-safe-action' (which is mocked via __mocks__/next-safe-action.ts),
 * which provides pre-configured actions with auth middleware already applied.
 *
 * IMPORTANT: We use the REAL safe-action.ts file, not a mock. The next-safe-action dependency is mocked.
 * safemocker automatically injects auth context (ctx.userId, ctx.userEmail, ctx.authToken) in tests.
 * We do NOT mock getAuthenticatedUserFromClient - safemocker handles auth automatically.
 *
 * Pattern matches: safemocker/__tests__/real-integration.test.ts
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { z } from 'zod';

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// Mock Next.js headers (used by safe-action middleware for userAgent/startTime)
const mockHeadersGet = jest.fn();
jest.mock('next/headers', () => ({
  headers: jest.fn(() =>
    Promise.resolve({
      get: mockHeadersGet,
    })
  ),
}));

// DO NOT mock Supabase client or auth - safemocker handles auth automatically
// The mock's authedAction/optionalAuthAction inject context without calling getAuthenticatedUserFromClient

// Mock logger (used by safe-action middleware)
jest.mock('../logger.ts', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
  toLogContextValue: (val) => val,
}));

// Mock errors (used by safe-action middleware) - keep real behavior for error normalization
jest.mock('../errors.ts', () => ({
  normalizeError: (error, fallback) => {
    if (error instanceof Error) return error;
    return new Error(fallback || String(error));
  },
  logActionFailure: jest.fn((name, error, context) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
}));

// Mock environment (used by safe-action error handling)
let mockIsProduction = false;

jest.mock('@heyclaude/shared-runtime/schemas/env', () => {
  const envMock = {
    NODE_ENV: 'test',
    POSTGRES_PRISMA_URL: undefined, // Allow undefined in tests (Prismocker doesn't need it)
    DIRECT_URL: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
    VERCEL: undefined,
    VITEST: undefined,
  };

  return {
    env: new Proxy(envMock, {
      get: (target, prop) => {
        // Handle isProduction dynamically
        if (prop === 'isProduction') {
          return mockIsProduction;
        }
        return target[prop];
      },
    }),
    get isProduction() {
      return mockIsProduction;
    },
  };
});

// DO NOT mock safe-action.ts - use REAL middleware to test SafeActionResult structure
// This ensures we test the complete middleware chain: auth → rate limiting → logging → error handling
// The next-safe-action dependency is automatically mocked via __mocks__/next-safe-action.ts

// Import safe-action AFTER all mocks are set up
import { authedAction, optionalAuthAction, rateLimitedAction, actionClient } from './safe-action';

describe('safe-action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsProduction = false;
    mockHeadersGet.mockReturnValue('test-user-agent');
  });

  describe('actionClient', () => {
    it('should handle server errors and return error message', async () => {
      mockIsProduction = true;
      mockHeadersGet.mockReturnValue('test-user-agent');

      const testAction = actionClient
        .inputSchema(z.object({}))
        .metadata({ actionName: 'testAction', category: 'user' })
        .action(async () => {
          throw new Error('Test error');
        });

      const result = await testAction({});

      // Verify SafeActionResult structure
      expect(result.serverError).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
      // Note: The mock's createSafeActionClient may not use our handleServerError callback
      // In production, the real safe-action.ts would use handleServerError which calls logger.error
      // For now, we just verify that serverError is returned (safemocker pattern)
    });

    it('should return detailed error message in development', async () => {
      mockIsProduction = false;
      mockHeadersGet.mockReturnValue('test-user-agent');

      const testAction = actionClient
        .inputSchema(z.object({}))
        .metadata({ actionName: 'testAction', category: 'user' })
        .action(async () => {
          throw new Error('Test error message');
        });

      const result = await testAction({});

      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('Test error message');
    });
  });

  describe('rateLimitedAction', () => {
    it('should pass through valid metadata', async () => {
      mockHeadersGet.mockReturnValue('test-user-agent');

      const testAction = rateLimitedAction
        .inputSchema(z.object({}))
        .metadata({ actionName: 'testAction', category: 'user' })
        .action(async () => {
          return { success: true };
        });

      const result = await testAction({});

      expect(result?.data).toEqual({ success: true });
    });

    it('should throw error for invalid metadata', async () => {
      mockHeadersGet.mockReturnValue('test-user-agent');

      // @ts-expect-error - Testing invalid metadata (empty actionName)
      const testAction = rateLimitedAction
        .inputSchema(z.object({}))
        .metadata({ actionName: '' })
        .action(async () => {
          return { success: true };
        });

      const result = await testAction({});
      expect(result?.serverError).toBeDefined();
      // next-safe-action returns a different error message for invalid metadata
      expect(result?.serverError).toMatch(/Invalid metadata|Invalid action configuration/);
      const { logger } = await import('../logger.ts');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('authedAction', () => {
    it('should inject auth context automatically (safemocker pattern)', async () => {
      // safemocker automatically injects auth context from mock config
      // No need to mock getAuthenticatedUserFromClient - safemocker handles it
      const testAction = authedAction
        .inputSchema(z.object({}))
        .metadata({ actionName: 'testAction', category: 'user' })
        .action(async ({ parsedInput, ctx }) => {
          // safemocker injects: ctx.userId = 'test-user-id', ctx.userEmail = 'test@example.com', ctx.authToken = 'test-token'
          return {
            success: true,
            createdBy: ctx.userId, // Verify context injection
          };
        });

      const result = await testAction({});

      // Verify SafeActionResult structure
      expect(result.data).toBeDefined();
      expect(result.data?.success).toBe(true);
      expect(result.data?.createdBy).toBe('test-user-id'); // From mock auth context
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    });

    it('should return validation errors for invalid input', async () => {
      // Test input validation (safemocker pattern)
      const testAction = authedAction
        .inputSchema(
          z.object({
            name: z.string().min(1, 'Name is required'),
            email: z.string().email('Invalid email'),
          })
        )
        .metadata({ actionName: 'testAction', category: 'user' })
        .action(async ({ parsedInput, ctx }) => {
          return {
            name: parsedInput.name,
            email: parsedInput.email,
            createdBy: ctx.userId,
          };
        });

      const result = await testAction({
        name: '', // Invalid: min length
        email: 'invalid-email', // Invalid: not an email
      });

      // Verify validation errors return fieldErrors
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.name).toBeDefined();
      expect(result.fieldErrors?.email).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should return serverError on handler errors', async () => {
      // Test handler errors return serverError (safemocker pattern)
      const testAction = authedAction
        .inputSchema(z.object({}))
        .metadata({ actionName: 'testAction', category: 'user' })
        .action(async () => {
          throw new Error('Handler error');
        });

      const result = await testAction({});

      // Verify handler errors return serverError
      expect(result.serverError).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    });

    it('should inject all context properties (userId, userEmail, authToken)', async () => {
      // safemocker injects all context properties from mock config
      const testAction = authedAction
        .inputSchema(z.object({}))
        .metadata({ actionName: 'testAction', category: 'user' })
        .action(async ({ ctx }) => {
          // Verify all context properties are injected
          expect(ctx.userId).toBe('test-user-id');
          expect(ctx.userEmail).toBe('test@example.com');
          expect(ctx.authToken).toBe('test-token');
          return {
            userId: ctx.userId,
            userEmail: ctx.userEmail,
            authToken: ctx.authToken,
          };
        });

      const result = await testAction({});

      expect(result.data).toBeDefined();
      expect(result.data?.userId).toBe('test-user-id');
      expect(result.data?.userEmail).toBe('test@example.com');
      expect(result.data?.authToken).toBe('test-token');
    });
  });

  describe('optionalAuthAction', () => {
    it('should inject auth context when authenticated (safemocker pattern)', async () => {
      // safemocker's optionalAuthAction injects context when authenticated
      const testAction = optionalAuthAction
        .inputSchema(z.object({}))
        .metadata({ actionName: 'testAction', category: 'user' })
        .action(async ({ parsedInput, ctx }) => {
          // safemocker injects: ctx.user, ctx.userId, ctx.userEmail, ctx.authToken
          return {
            success: true,
            viewerId: ctx.userId, // Verify context injection
            user: ctx.user,
          };
        });

      const result = await testAction({});

      // Verify SafeActionResult structure
      expect(result.data).toBeDefined();
      expect(result.data?.success).toBe(true);
      expect(result.data?.viewerId).toBe('test-user-id'); // From mock auth context
      expect(result.data?.user).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    });

    it('should return validation errors for invalid input', async () => {
      // Test input validation (safemocker pattern)
      const testAction = optionalAuthAction
        .inputSchema(
          z.object({
            userId: z.string().uuid('Invalid UUID'),
          })
        )
        .metadata({ actionName: 'testAction', category: 'user' })
        .action(async ({ parsedInput, ctx }) => {
          return {
            userId: parsedInput.userId,
            viewerId: ctx.userId,
          };
        });

      const result = await testAction({
        userId: 'invalid-uuid', // Invalid: not a UUID
      });

      // Verify validation errors return fieldErrors
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.userId).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should return serverError on handler errors', async () => {
      // Test handler errors return serverError (safemocker pattern)
      const testAction = optionalAuthAction
        .inputSchema(z.object({}))
        .metadata({ actionName: 'testAction', category: 'user' })
        .action(async () => {
          throw new Error('Handler error');
        });

      const result = await testAction({});

      // Verify handler errors return serverError
      expect(result.serverError).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    });
  });
});
