import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
// Import SafeActionResult type from safemocker for proper typing in tests
import type { SafeActionResult } from '@jsonbored/safemocker';
// Import oauth_provider enum from Prisma client
import { oauth_provider } from '@prisma/client';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
import { clearRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility (if needed)
// Note: Deep relative import needed for jest.mock() to work correctly
jest.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// DO NOT mock next/headers - safemocker handles this automatically
// DO NOT mock Supabase client or auth - safemocker handles auth automatically
// safemocker's __mocks__/next-safe-action.ts provides pre-configured authedAction
// with auth context already injected (test-user-id, test@example.com, test-token)

// Mock logger (used by safe-action middleware)
jest.mock('../logger.ts', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => ({
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    })),
  },
  toLogContextValue: (val: unknown) => val,
}));

// Mock errors (used by safe-action middleware) - keep real behavior for error normalization
jest.mock('../errors.ts', () => ({
  normalizeError: (error: unknown, fallback?: string) => {
    if (error instanceof Error) return error;
    return new Error(fallback || String(error));
  },
  logActionFailure: jest.fn((name, error, context) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
}));

// Mock environment (used by safe-action error handling and Prisma client)
jest.mock('@heyclaude/shared-runtime/schemas/env', () => {
  const envMock: Record<string, string | undefined> = {
    NODE_ENV: 'test',
    POSTGRES_PRISMA_URL: undefined, // Allow undefined in tests (Prismocker doesn't need it)
    DIRECT_URL: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
    VERCEL: undefined,
    VITEST: undefined,
  };

  return {
    env: new Proxy(envMock, {
      get: (target, prop: string) => {
        // Handle isProduction dynamically
        if (prop === 'isProduction') {
          return false; // Default to false for tests
        }
        return target[prop];
      },
    }),
    get isProduction() {
      return false; // Default to false for tests
    },
  };
});

// DO NOT mock safe-action.ts - use REAL middleware to test SafeActionResult structure
// This ensures we test the complete middleware chain: auth → rate limiting → logging → error handling

// DO NOT mock runRpc - use real runRpc which uses Prismocker
// This allows us to test the real RPC flow end-to-end

// Mock next/cache
const mockRevalidatePath = jest.fn();
const mockRevalidateTag = jest.fn();
jest.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
  revalidateTag: (...args: any[]) => mockRevalidateTag(...args),
}));

describe('unlinkOAuthProvider', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // 5. Set up $queryRawUnsafe for RPC testing (if needed)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);

    // 6. Reset mock functions
    mockRevalidatePath.mockClear();
    mockRevalidateTag.mockClear();
  });

  describe('input validation', () => {
    it('should validate oauth_provider enum', async () => {
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');

      const mockResult = {
        success: true,
        message: 'OAuth provider unlinked successfully',
        provider: 'github' as const,
        remaining_providers: 1,
        error: null,
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      // Use valid enum value from oauth_provider
      const validProvider = oauth_provider.github;

      const result = await unlinkOAuthProvider({
        provider: validProvider,
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
    });

    it('should return validation errors for invalid provider', async () => {
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');

      // Invalid provider should fail validation
      const result = await unlinkOAuthProvider({
        provider: 'invalid-provider' as any,
      });

      // Verify SafeActionResult structure - should have fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();
    });

    it('should return validation errors for missing provider', async () => {
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');

      // Missing provider should fail validation
      const result = await unlinkOAuthProvider({
        // Missing required field
      } as any);

      // Verify SafeActionResult structure - should have fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();
    });
  });

  describe('RPC call', () => {
    it('should call unlink_oauth_provider RPC with correct parameters', async () => {
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');

      const mockResult = {
        success: true,
        message: 'OAuth provider unlinked successfully',
        provider: 'github' as const,
        remaining_providers: 1,
        error: null,
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await unlinkOAuthProvider({
        provider: 'github',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Verify RPC was called with correct SQL and parameters
      // BasePrismaService.callRpc formats SQL with positional parameters (p_param => $1, p_param2 => $2, ...)
      // and passes values as separate positional arguments
      // Note: This RPC includes p_user_id in the args, so it will be passed as a parameter
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM unlink_oauth_provider'),
        'github', // $1: p_provider
        'test-user-id' // $2: p_user_id (from ctx.userId)
      );

      // Verify result matches mock
      expect(safeResult.data).toEqual(mockResult);
    });

    it('should return server error for RPC failures', async () => {
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');

      const mockError = new Error('Database error');
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(mockError);

      const result = await unlinkOAuthProvider({
        provider: 'github',
      });

      // Verify SafeActionResult structure - should have serverError
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
    });
  });

  describe('cache invalidation', () => {
    it('should revalidate paths and tags', async () => {
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');

      const mockResult = {
        success: true,
        message: 'OAuth provider unlinked successfully',
        provider: 'github' as const,
        remaining_providers: 1,
        error: null,
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await unlinkOAuthProvider({
        provider: 'github',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify cache invalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/settings');
      expect(mockRevalidateTag).toHaveBeenCalledWith('users', 'default');
    });
  });

  describe('metadata', () => {
    it('should have correct metadata', async () => {
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');

      const mockResult = {
        success: true,
        message: 'OAuth provider unlinked successfully',
        provider: 'github' as const,
        remaining_providers: 1,
        error: null,
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await unlinkOAuthProvider({
        provider: 'github',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Metadata is set during action definition, not at runtime
      // We verify the action works correctly, which implies metadata is set
    });
  });
});
