import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
// Import SafeActionResult type from safemocker for proper typing in tests
import type { SafeActionResult } from '@jsonbored/safemocker';

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

describe('bookmarks', () => {
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

    // 5. Set up $queryRawUnsafe for RPC testing (if needed)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    // This is what runRpc → BasePrismaService.callRpc → prisma.$queryRawUnsafe calls
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);

    // Note: safemocker automatically provides auth context:
    // - ctx.userId = 'test-user-id'
    // - ctx.userEmail = 'test@example.com'
    // - ctx.authToken = 'test-token'
    // No manual auth mocks needed!
  });

  describe('addBookmark', () => {
    it('should call add_bookmark RPC with correct parameters', async () => {
      const { addBookmark } = await import('./bookmarks.ts');

      // Mock result must match addBookmarkReturnsSchema structure (AddBookmarkResult composite)
      const mockResult = {
        success: true,
        bookmark: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          user_id: '123e4567-e89b-12d3-a456-426614174001',
          content_type: 'agents',
          content_slug: 'test-agent',
          notes: 'My notes',
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      // Set up Prismocker to return the RPC result
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      // Call action - now returns SafeActionResult structure
      const result = await addBookmark({
        content_type: 'agents',
        content_slug: 'test-agent',
        notes: 'My notes',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Verify RPC was called with correct SQL and parameters
      // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
      // Args object: { p_user_id, p_content_type, p_content_slug, p_notes }
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('add_bookmark'),
        'test-user-id', // p_user_id (from ctx.userId in authedAction middleware)
        'agents', // p_content_type
        'test-agent', // p_content_slug
        'My notes' // p_notes
      );

      // Verify result data structure (wrapped in SafeActionResult.data)
      expect(safeResult.data?.success).toBe(true);
      expect(safeResult.data?.bookmark).toBeDefined();
    });

    it('should revalidate paths and tags', async () => {
      const { addBookmark } = await import('./bookmarks.ts');

      const mockResult = {
        success: true,
        bookmark: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          user_id: '123e4567-e89b-12d3-a456-426614174001',
          content_type: 'agents',
          content_slug: 'test-agent',
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await addBookmark({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify cache invalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library');
      expect(mockRevalidateTag).toHaveBeenCalledWith('user-bookmarks', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('users', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('user-test-user-id', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('content-test-agent', 'default');
    });

    it('should handle optional notes parameter', async () => {
      const { addBookmark } = await import('./bookmarks.ts');

      const mockResult = {
        success: true,
        bookmark: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          user_id: '123e4567-e89b-12d3-a456-426614174001',
          content_type: 'agents',
          content_slug: 'test-agent',
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      // Call without notes (should pass undefined to RPC)
      const result = await addBookmark({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('add_bookmark'),
        'test-user-id',
        'agents',
        'test-agent',
        undefined // p_notes (optional)
      );
    });
  });

  describe('input validation', () => {
    it('should return fieldErrors for invalid input', async () => {
      const { addBookmark } = await import('./bookmarks.ts');

      // Call with invalid input (missing required fields)
      const result = await addBookmark({} as any);

      // Verify SafeActionResult structure with fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();
      
      // Verify field errors for missing required fields
      expect(safeResult.fieldErrors?.content_type).toBeDefined();
      expect(safeResult.fieldErrors?.content_slug).toBeDefined();
    });

    it('should return fieldErrors for invalid enum values', async () => {
      const { addBookmark } = await import('./bookmarks.ts');

      // Call with invalid enum value
      const result = await addBookmark({
        content_type: 'invalid-category' as any,
        content_slug: 'test-agent',
      });

      // Verify SafeActionResult structure with fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.fieldErrors?.content_type).toBeDefined();
      expect(safeResult.data).toBeUndefined();
    });
  });

  describe('authentication', () => {
    it('should inject auth context from safemocker', async () => {
      const { addBookmark } = await import('./bookmarks.ts');

      // Use valid UUID format for user_id to match addBookmarkReturnsSchema validation
      // The schema expects UUID format, not 'test-user-id'
      const testUserId = '123e4567-e89b-12d3-a456-426614174001'; // Valid UUID format
      
      const mockResult = {
        success: true,
        bookmark: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          user_id: testUserId, // Must be valid UUID format to pass output schema validation
          content_type: 'agents',
          content_slug: 'test-agent',
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await addBookmark({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.validationErrors).toBeUndefined();

      // Verify auth context was injected (ctx.userId = 'test-user-id' from safemocker)
      // Note: safemocker provides 'test-user-id' as the userId in ctx, but the RPC result
      // must use a valid UUID format for the user_id field to pass output schema validation
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('add_bookmark'),
        'test-user-id', // From safemocker's authedAction context (this is what gets passed to RPC)
        'agents',
        'test-agent',
        undefined
      );

      // Verify the result data matches the mock (with valid UUID)
      expect(safeResult.data?.success).toBe(true);
      expect(safeResult.data?.bookmark?.user_id).toBe(testUserId);
    });

    // Note: With safemocker, unauthenticated requests are handled by the mock's authedAction
    // which always provides auth context in tests. To test unauthenticated behavior,
    // you would need to use a different action type (optionalAuthAction) or configure
    // the mock differently. For authedAction, auth is always provided in tests.
  });

  describe('server errors', () => {
    it('should return serverError when RPC fails', async () => {
      const { addBookmark } = await import('./bookmarks.ts');

      // Mock RPC to throw error
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const result = await addBookmark({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      // Verify SafeActionResult structure with serverError
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
    });
  });

  describe('removeBookmark', () => {
    it('should call remove_bookmark RPC with correct parameters', async () => {
      const { removeBookmark } = await import('./bookmarks.ts');

      const mockResult = { success: true };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      // Call action - now returns SafeActionResult structure
      const result = await removeBookmark({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Verify RPC was called with correct SQL and parameters
      // Args object: { p_user_id, p_content_type, p_content_slug }
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('remove_bookmark'),
        'test-user-id', // p_user_id (from ctx.userId in authedAction middleware)
        'agents', // p_content_type
        'test-agent' // p_content_slug
      );

      // Verify result data structure (wrapped in SafeActionResult.data)
      expect(safeResult.data).toEqual(mockResult);
    });

    it('should revalidate paths and tags', async () => {
      const { removeBookmark } = await import('./bookmarks.ts');

      const mockResult = { success: true };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await removeBookmark({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify cache invalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library');
      expect(mockRevalidateTag).toHaveBeenCalledWith('user-bookmarks', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('users', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('user-test-user-id', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('content-test-agent', 'default');
    });
  });
});
