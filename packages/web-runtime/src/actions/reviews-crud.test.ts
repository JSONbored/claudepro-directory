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

describe('reviews-crud', () => {
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
  });

  describe('createReview', () => {
    describe('input validation', () => {
      it('should return fieldErrors for invalid input', async () => {
        const { createReview } = await import('./reviews-crud.ts');

        // Invalid: rating must be a number if provided
        const result = await createReview({
          rating: 'invalid' as any,
        });

        // Verify SafeActionResult structure
        expect(result.fieldErrors).toBeDefined();
        expect(result.data).toBeUndefined();
        expect(result.serverError).toBeUndefined();
      });

      it('should accept valid input', async () => {
        const { createReview } = await import('./reviews-crud.ts');

        // Set up RPC mock
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
          {
            success: true,
            review: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              user_id: 'test-user-id',
              content_type: 'agents',
              content_slug: 'test-agent',
              rating: 5,
              review_text: 'Great agent!',
              helpful_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            content_type: 'agents',
            content_slug: 'test-agent',
          },
        ]);

        const result = await createReview({
          content_type: 'agents',
          content_slug: 'test-agent',
          rating: 5,
          review_text: 'Great agent!',
        });

        // Verify SafeActionResult structure
        expect(result.data).toBeDefined();
        expect(result.serverError).toBeUndefined();
        expect(result.fieldErrors).toBeUndefined();
      });
    });

    describe('RPC call', () => {
      it('should call manage_review RPC with create action', async () => {
        const { createReview } = await import('./reviews-crud.ts');

        // Set up RPC mock
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
          {
            success: true,
            review: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              user_id: 'test-user-id',
              content_type: 'agents',
              content_slug: 'test-agent',
              rating: 5,
              review_text: 'Great agent!',
              helpful_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            content_type: 'agents',
            content_slug: 'test-agent',
          },
        ]);

        const result = await createReview({
          content_type: 'agents',
          content_slug: 'test-agent',
          rating: 5,
          review_text: 'Great agent!',
        });

        // Verify SafeActionResult structure
        expect(result.data).toBeDefined();
        expect(result.serverError).toBeUndefined();
        expect(result.fieldErrors).toBeUndefined();

        // Verify RPC was called with correct SQL and parameters
        // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
        // Args are passed as positional parameters: $queryRawUnsafe(query, ...argValues)
        // Order: p_action, p_user_id, p_create_data, p_update_data, p_delete_id
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('manage_review'),
          'create', // p_action
          'test-user-id', // p_user_id (from ctx.userId in authedAction middleware)
          expect.objectContaining({
            content_type: 'agents',
            content_slug: 'test-agent',
            rating: 5,
            review_text: 'Great agent!',
          }), // p_create_data
          null, // p_update_data
          null // p_delete_id
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags based on content', async () => {
        const { createReview } = await import('./reviews-crud.ts');

        // Set up RPC mock
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
          {
            success: true,
            review: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              user_id: 'test-user-id',
              content_type: 'agents',
              content_slug: 'test-agent',
              rating: 5,
              review_text: 'Great agent!',
              helpful_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            content_type: 'agents',
            content_slug: 'test-agent',
          },
        ]);

        const result = await createReview({
          content_type: 'agents',
          content_slug: 'test-agent',
          rating: 5,
        });

        // Verify SafeActionResult structure
        expect(result.data).toBeDefined();
        expect(result.serverError).toBeUndefined();
        expect(result.fieldErrors).toBeUndefined();

        // Verify cache invalidation
        expect(mockRevalidatePath).toHaveBeenCalledWith('/agents/test-agent');
        expect(mockRevalidatePath).toHaveBeenCalledWith('/agents');
        expect(mockRevalidateTag).toHaveBeenCalledWith('reviews:agents:test-agent', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('content', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('homepage', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('trending', 'default');
      });
    });

    describe('error handling', () => {
      it('should return SafeActionResult structure with error properties', async () => {
        const { createReview } = await import('./reviews-crud.ts');

        // Set up RPC mock to fail
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(
          new Error('Database error')
        );

        const result = await createReview({
          content_type: 'agents',
          content_slug: 'test-agent',
          rating: 5,
        });

        // Verify SafeActionResult structure
        expect(result.serverError).toBeDefined();
        expect(result.data).toBeUndefined();
        expect(result.fieldErrors).toBeUndefined();
      });
    });
  });

  describe('updateReview', () => {
    describe('input validation', () => {
      it('should return fieldErrors for invalid UUID', async () => {
        const { updateReview } = await import('./reviews-crud.ts');

        // Invalid: review_id must be a valid UUID
        const result = await updateReview({
          review_id: 'invalid-uuid',
        });

        // Verify SafeActionResult structure
        expect(result.fieldErrors).toBeDefined();
        expect(result.data).toBeUndefined();
        expect(result.serverError).toBeUndefined();
      });

      it('should accept valid input', async () => {
        const { updateReview } = await import('./reviews-crud.ts');

        // Set up RPC mock
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
          {
            success: true,
            review: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              user_id: 'test-user-id',
              content_type: 'agents',
              content_slug: 'test-agent',
              rating: 4,
              review_text: 'Updated review',
              helpful_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            content_type: 'agents',
            content_slug: 'test-agent',
          },
        ]);

        const result = await updateReview({
          review_id: '123e4567-e89b-12d3-a456-426614174000',
          rating: 4,
          review_text: 'Updated review',
        });

        // Verify SafeActionResult structure
        expect(result.data).toBeDefined();
        expect(result.serverError).toBeUndefined();
        expect(result.fieldErrors).toBeUndefined();
      });
    });

    describe('RPC call', () => {
      it('should call manage_review RPC with update action', async () => {
        const { updateReview } = await import('./reviews-crud.ts');

        // Set up RPC mock
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
          {
            success: true,
            review: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              user_id: 'test-user-id',
              content_type: 'agents',
              content_slug: 'test-agent',
              rating: 4,
              review_text: 'Updated review',
              helpful_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            content_type: 'agents',
            content_slug: 'test-agent',
          },
        ]);

        const result = await updateReview({
          review_id: '123e4567-e89b-12d3-a456-426614174000',
          rating: 4,
          review_text: 'Updated review',
        });

        // Verify SafeActionResult structure
        expect(result.data).toBeDefined();
        expect(result.serverError).toBeUndefined();
        expect(result.fieldErrors).toBeUndefined();

        // Verify RPC was called with correct SQL and parameters
        // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
        // Args are passed as positional parameters: $queryRawUnsafe(query, ...argValues)
        // Order: p_action, p_user_id, p_create_data, p_update_data, p_delete_id
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('manage_review'),
          'update', // p_action
          'test-user-id', // p_user_id (from ctx.userId in authedAction middleware)
          null, // p_create_data
          expect.objectContaining({
            review_id: '123e4567-e89b-12d3-a456-426614174000',
            rating: 4,
            review_text: 'Updated review',
          }), // p_update_data
          null // p_delete_id
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { updateReview } = await import('./reviews-crud.ts');

        // Set up RPC mock
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
          {
            success: true,
            review: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              user_id: 'test-user-id',
              content_type: 'agents',
              content_slug: 'test-agent',
              rating: 4,
              review_text: 'Updated review',
              helpful_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            content_type: 'agents',
            content_slug: 'test-agent',
          },
        ]);

        const result = await updateReview({
          review_id: '123e4567-e89b-12d3-a456-426614174000',
          rating: 4,
        });

        // Verify SafeActionResult structure
        expect(result.data).toBeDefined();
        expect(result.serverError).toBeUndefined();
        expect(result.fieldErrors).toBeUndefined();

        // Verify cache invalidation
        expect(mockRevalidatePath).toHaveBeenCalledWith('/agents/test-agent');
        expect(mockRevalidatePath).toHaveBeenCalledWith('/agents');
        expect(mockRevalidateTag).toHaveBeenCalledWith('reviews:agents:test-agent', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('content', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('homepage', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('trending', 'default');
      });
    });

    describe('error handling', () => {
      it('should return SafeActionResult structure with error properties', async () => {
        const { updateReview } = await import('./reviews-crud.ts');

        // Set up RPC mock to fail
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(
          new Error('Database error')
        );

        const result = await updateReview({
          review_id: '123e4567-e89b-12d3-a456-426614174000',
          rating: 4,
        });

        // Verify SafeActionResult structure
        expect(result.serverError).toBeDefined();
        expect(result.data).toBeUndefined();
        expect(result.fieldErrors).toBeUndefined();
      });
    });
  });

  describe('deleteReview', () => {
    describe('input validation', () => {
      it('should return fieldErrors for invalid UUID', async () => {
        const { deleteReview } = await import('./reviews-crud.ts');

        // Invalid: delete_id must be a valid UUID
        const result = await deleteReview({
          delete_id: 'invalid-uuid',
        });

        // Verify SafeActionResult structure
        expect(result.fieldErrors).toBeDefined();
        expect(result.data).toBeUndefined();
        expect(result.serverError).toBeUndefined();
      });

      it('should accept valid input', async () => {
        const { deleteReview } = await import('./reviews-crud.ts');

        // Set up RPC mock
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
          {
            success: true,
            review: {
              id: '123e4567-e89b-12d3-a456-426614174000',
            },
          },
        ]);

        const result = await deleteReview({
          delete_id: '123e4567-e89b-12d3-a456-426614174000',
        });

        // Verify SafeActionResult structure
        expect(result.data).toBeDefined();
        expect(result.serverError).toBeUndefined();
        expect(result.fieldErrors).toBeUndefined();
      });
    });

    describe('RPC call', () => {
      it('should call manage_review RPC with delete action', async () => {
        const { deleteReview } = await import('./reviews-crud.ts');

        // Set up RPC mock
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
          {
            success: true,
            review: {
              id: '123e4567-e89b-12d3-a456-426614174000',
            },
          },
        ]);

        const result = await deleteReview({
          delete_id: '123e4567-e89b-12d3-a456-426614174000',
        });

        // Verify SafeActionResult structure
        expect(result.data).toBeDefined();
        expect(result.serverError).toBeUndefined();
        expect(result.fieldErrors).toBeUndefined();

        // Verify RPC was called with correct SQL and parameters
        // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
        // Args are passed as positional parameters: $queryRawUnsafe(query, ...argValues)
        // Order: p_action, p_user_id, p_create_data, p_update_data, p_delete_id
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('manage_review'),
          'delete', // p_action
          'test-user-id', // p_user_id (from ctx.userId in authedAction middleware)
          null, // p_create_data
          null, // p_update_data
          '123e4567-e89b-12d3-a456-426614174000' // p_delete_id
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate tags only (no paths for delete)', async () => {
        const { deleteReview } = await import('./reviews-crud.ts');

        // Set up RPC mock
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
          {
            success: true,
            review: {
              id: '123e4567-e89b-12d3-a456-426614174000',
            },
          },
        ]);

        const result = await deleteReview({
          delete_id: '123e4567-e89b-12d3-a456-426614174000',
        });

        // Verify SafeActionResult structure
        expect(result.data).toBeDefined();
        expect(result.serverError).toBeUndefined();
        expect(result.fieldErrors).toBeUndefined();

        // Verify cache invalidation (delete doesn't revalidate paths)
        expect(mockRevalidatePath).not.toHaveBeenCalled();
        expect(mockRevalidateTag).toHaveBeenCalledWith('content', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('homepage', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('trending', 'default');
      });
    });

    describe('error handling', () => {
      it('should return SafeActionResult structure with error properties', async () => {
        const { deleteReview } = await import('./reviews-crud.ts');

        // Set up RPC mock to fail
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(
          new Error('Database error')
        );

        const result = await deleteReview({
          delete_id: '123e4567-e89b-12d3-a456-426614174000',
        });

        // Verify SafeActionResult structure
        expect(result.serverError).toBeDefined();
        expect(result.data).toBeUndefined();
        expect(result.fieldErrors).toBeUndefined();
      });
    });
  });
});
