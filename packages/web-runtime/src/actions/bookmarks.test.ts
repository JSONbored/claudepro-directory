import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

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

// Mock Next.js headers (used by safe-action middleware)
const mockHeadersGet = jest.fn();
jest.mock('next/headers', () => ({
  headers: jest.fn(() =>
    Promise.resolve({
      get: mockHeadersGet,
    })
  ),
}));

// Mock Supabase client and auth (used by authedAction middleware)
const mockGetAuthenticatedUserFromClient = jest.fn();
const mockCreateSupabaseServerClient = jest.fn();
const mockGetSession = jest.fn();

jest.mock('../supabase/server.ts', () => ({
  createSupabaseServerClient: () => mockCreateSupabaseServerClient(),
}));

jest.mock('../auth/get-authenticated-user.ts', () => ({
  getAuthenticatedUserFromClient: mockGetAuthenticatedUserFromClient,
}));

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
let mockIsProduction = false;
const mockEnv: Record<string, string | undefined> = {
  NODE_ENV: 'test',
  POSTGRES_PRISMA_URL: undefined, // Allow undefined in tests (Prismocker doesn't need it)
  DIRECT_URL: undefined,
  SUPABASE_SERVICE_ROLE_KEY: undefined,
  VERCEL: undefined,
  VITEST: undefined,
};

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
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    // Clear request cache before each test (required for test isolation)
    clearRequestCache();

    // Get the prisma instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks
    jest.clearAllMocks();

    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    // This is what runRpc → BasePrismaService.callRpc → prisma.$queryRawUnsafe calls
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);

    // Setup mocks for real safe-action middleware
    mockIsProduction = false;
    mockHeadersGet.mockReturnValue('test-user-agent');
    
    // Mock Supabase client for authedAction middleware
    mockCreateSupabaseServerClient.mockResolvedValue({
      auth: {
        getSession: mockGetSession,
      },
    });

    // Mock authenticated user for authedAction middleware
    mockGetAuthenticatedUserFromClient.mockResolvedValue({
      user: mockUser,
      isAuthenticated: true,
    });

    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
        },
      },
    });
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
      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

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
      expect(result.data?.success).toBe(true);
      expect(result.data?.bookmark).toBeDefined();
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
      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();

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
      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();

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
      expect(result.fieldErrors).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      
      // Verify field errors for missing required fields
      expect(result.fieldErrors?.content_type).toBeDefined();
      expect(result.fieldErrors?.content_slug).toBeDefined();
    });

    it('should return fieldErrors for invalid enum values', async () => {
      const { addBookmark } = await import('./bookmarks.ts');

      // Call with invalid enum value
      const result = await addBookmark({
        content_type: 'invalid-category' as any,
        content_slug: 'test-agent',
      });

      // Verify SafeActionResult structure with fieldErrors
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.content_type).toBeDefined();
      expect(result.data).toBeUndefined();
    });
  });

  describe('authentication', () => {
    it('should return serverError for unauthenticated requests', async () => {
      const { addBookmark } = await import('./bookmarks.ts');

      // Mock unauthenticated user
      mockGetAuthenticatedUserFromClient.mockResolvedValueOnce({
        user: null,
        isAuthenticated: false,
        error: new Error('No valid session'),
      });

      mockHeadersGet.mockImplementation((key: string) => {
        if (key === 'cf-connecting-ip') return '1.2.3.4';
        if (key === 'referer') return 'https://example.com/page';
        return null;
      });

      const result = await addBookmark({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      // Verify SafeActionResult structure with serverError
      expect(result.serverError).toBeDefined();
      expect(result.serverError).toContain('Unauthorized');
      expect(result.data).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    });
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
      expect(result.serverError).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
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
      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify RPC was called with correct SQL and parameters
      // Args object: { p_user_id, p_content_type, p_content_slug }
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('remove_bookmark'),
        'test-user-id', // p_user_id (from ctx.userId in authedAction middleware)
        'agents', // p_content_type
        'test-agent' // p_content_slug
      );

      // Verify result data structure (wrapped in SafeActionResult.data)
      expect(result.data).toEqual(mockResult);
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
      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();

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
