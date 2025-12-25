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

describe('collections-crud', () => {
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

  describe('createCollection', () => {
    describe('RPC call', () => {
      it('should call manage_collection RPC with create action', async () => {
        const { createCollection } = await import('./collections-crud.ts');

        const collectionId = '123e4567-e89b-12d3-a456-426614174000';
        // Mock result must match manageCollectionReturnsSchema structure
        // collection must match userCollectionsSchema (all required fields)
        const mockResult = {
          success: true,
          collection: {
            id: collectionId,
            user_id: '123e4567-e89b-12d3-a456-426614174001', // Valid UUID format
            name: 'Test Collection',
            slug: 'test-collection',
            description: null,
            is_public: false,
            view_count: 0,
            bookmark_count: 0,
            item_count: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          item: null,
        };

        // Set up Prismocker to return the RPC result
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        // Call action - now returns SafeActionResult structure
        const result = await createCollection({
          name: 'Test Collection',
          slug: 'test-collection',
          description: 'Test description',
          is_public: true,
        });

        // Verify SafeActionResult structure
        // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
        const safeResult = result as SafeActionResult<typeof mockResult>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();
        expect(safeResult.fieldErrors).toBeUndefined();
        expect(safeResult.validationErrors).toBeUndefined();

        // Verify RPC was called with correct SQL and parameters
        // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('manage_collection'),
          'create', // p_action
          'test-user-id', // p_user_id (from ctx.userId in authedAction middleware)
          expect.objectContaining({
            name: 'Test Collection',
            slug: 'test-collection',
            description: 'Test description',
            is_public: true,
          }), // p_create_data
          null, // p_update_data
          null, // p_delete_id
          null, // p_add_item_data
          null // p_remove_item_id
        );

        // Verify result data structure (wrapped in SafeActionResult.data)
        expect(safeResult.data).toMatchObject(mockResult);
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { createCollection } = await import('./collections-crud.ts');

        const collectionId = '123e4567-e89b-12d3-a456-426614174000';
        const mockResult = {
          success: true,
          collection: {
            id: collectionId,
            user_id: '123e4567-e89b-12d3-a456-426614174001', // Valid UUID format
            name: 'Test Collection',
            slug: 'test-collection',
            description: null,
            is_public: false,
            view_count: 0,
            bookmark_count: 0,
            item_count: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          item: null,
        };

        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        const result = await createCollection({
          name: 'Test Collection',
        });

        // Verify SafeActionResult structure
        // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
        const safeResult = result as SafeActionResult<typeof mockResult>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();

        // Verify cache invalidation
        expect(mockRevalidatePath).toHaveBeenCalledWith('/account');
        expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library');
        expect(mockRevalidateTag).toHaveBeenCalledWith('collections', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('users', 'default');
      });
    });
  });

  describe('updateCollection', () => {
    describe('RPC call', () => {
      it('should call manage_collection RPC with update action', async () => {
        const { updateCollection } = await import('./collections-crud.ts');

        const collectionId = '123e4567-e89b-12d3-a456-426614174000';
        const mockResult = {
          success: true,
          collection: {
            id: collectionId,
            user_id: '123e4567-e89b-12d3-a456-426614174001', // Valid UUID format
            name: 'Updated Collection',
            slug: 'test-collection',
            description: null,
            is_public: false,
            view_count: 0,
            bookmark_count: 0,
            item_count: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          item: null,
        };

        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        // Call action - now returns SafeActionResult structure
        const result = await updateCollection({
          id: collectionId,
          name: 'Updated Collection',
        });

        // Verify SafeActionResult structure
        // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
        const safeResult = result as SafeActionResult<typeof mockResult>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();
        expect(safeResult.fieldErrors).toBeUndefined();
        expect(safeResult.validationErrors).toBeUndefined();

        // Verify RPC was called with correct SQL and parameters
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('manage_collection'),
          'update', // p_action
          'test-user-id', // p_user_id (from ctx.userId in authedAction middleware)
          null, // p_create_data
          expect.objectContaining({
            id: collectionId,
            name: 'Updated Collection',
          }), // p_update_data
          null, // p_delete_id
          null, // p_add_item_data
          null // p_remove_item_id
        );

        // Verify result data structure (wrapped in SafeActionResult.data)
        expect(safeResult.data).toMatchObject(mockResult);
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { updateCollection } = await import('./collections-crud.ts');

        const collectionId = '123e4567-e89b-12d3-a456-426614174000';
        const mockResult = {
          success: true,
          collection: {
            id: collectionId,
            user_id: '123e4567-e89b-12d3-a456-426614174001', // Valid UUID format
            name: 'Test Collection',
            slug: 'test-collection',
            description: null,
            is_public: false,
            view_count: 0,
            bookmark_count: 0,
            item_count: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          item: null,
        };

        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        const result = await updateCollection({
          id: collectionId,
          name: 'Updated Collection',
        });

        // Verify SafeActionResult structure
        // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
        const safeResult = result as SafeActionResult<typeof mockResult>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();

        // Verify cache invalidation
        expect(mockRevalidatePath).toHaveBeenCalledWith('/account');
        expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library');
        expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library/test-collection');
        expect(mockRevalidateTag).toHaveBeenCalledWith('collections', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('users', 'default');
      });
    });
  });

  describe('deleteCollection', () => {
    describe('RPC call', () => {
      it('should call manage_collection RPC with delete action', async () => {
        const { deleteCollection } = await import('./collections-crud.ts');

        const collectionId = '123e4567-e89b-12d3-a456-426614174000';
        const mockResult = {
          success: true,
          collection: {
            id: collectionId,
            user_id: '123e4567-e89b-12d3-a456-426614174001', // Valid UUID format
            name: 'Test Collection',
            slug: 'test-collection',
            description: null,
            is_public: false,
            view_count: 0,
            bookmark_count: 0,
            item_count: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          item: null,
        };

        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        // Call action - now returns SafeActionResult structure
        const result = await deleteCollection({
          delete_id: collectionId,
        });

        // Verify SafeActionResult structure
        // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
        const safeResult = result as SafeActionResult<typeof mockResult>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();
        expect(safeResult.fieldErrors).toBeUndefined();
        expect(safeResult.validationErrors).toBeUndefined();

        // Verify RPC was called with correct SQL and parameters
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('manage_collection'),
          'delete', // p_action
          'test-user-id', // p_user_id (from ctx.userId in authedAction middleware)
          null, // p_create_data
          null, // p_update_data
          collectionId, // p_delete_id
          null, // p_add_item_data
          null // p_remove_item_id
        );

        // Verify result data structure (wrapped in SafeActionResult.data)
        expect(safeResult.data).toMatchObject(mockResult);
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { deleteCollection } = await import('./collections-crud.ts');

        const collectionId = '123e4567-e89b-12d3-a456-426614174000';
        const mockResult = {
          success: true,
          collection: {
            id: collectionId,
            user_id: '123e4567-e89b-12d3-a456-426614174001', // Valid UUID format
            name: 'Test Collection',
            slug: 'test-collection',
            description: null,
            is_public: false,
            view_count: 0,
            bookmark_count: 0,
            item_count: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          item: null,
        };

        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        const result = await deleteCollection({
          delete_id: collectionId,
        });

        // Verify SafeActionResult structure
        // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
        const safeResult = result as SafeActionResult<typeof mockResult>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();

        // Verify cache invalidation
        expect(mockRevalidatePath).toHaveBeenCalledWith('/account');
        expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library');
        expect(mockRevalidateTag).toHaveBeenCalledWith('collections', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('users', 'default');
      });
    });
  });

  describe('input validation', () => {
    it('should return fieldErrors for invalid input', async () => {
      const { createCollection } = await import('./collections-crud.ts');

      // Call with invalid input (wrong type - number instead of string)
      // Schema allows: name: z.string().nullable().optional()
      // So name: null is valid, but name: 123 is invalid
      const result = await createCollection({
        name: 123 as any, // Invalid: name should be string, null, or undefined, not number
      });

      // Verify SafeActionResult structure with fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify field errors for invalid type
      expect(safeResult.fieldErrors?.name).toBeDefined();
    });
  });

  describe('authentication', () => {
    it('should inject auth context from safemocker', async () => {
      const { createCollection } = await import('./collections-crud.ts');

      const collectionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResult = {
        success: true,
        collection: {
          id: collectionId,
          user_id: '123e4567-e89b-12d3-a456-426614174001', // Valid UUID format
          name: 'Test Collection',
          slug: 'test-collection',
          description: null,
          is_public: false,
          view_count: 0,
          bookmark_count: 0,
          item_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        item: null,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await createCollection({
        name: 'Test Collection',
        slug: 'test-collection',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.validationErrors).toBeUndefined();

      // Verify auth context was injected (ctx.userId = 'test-user-id' from safemocker)
      // This is verified by checking that RPC was called with 'test-user-id'
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('manage_collection'),
        'create',
        'test-user-id', // From safemocker's authedAction context
        expect.objectContaining({
          name: 'Test Collection',
          slug: 'test-collection',
        }),
        null,
        null,
        null,
        null
      );
    });
  });

  describe('server errors', () => {
    it('should return serverError when RPC fails', async () => {
      const { createCollection } = await import('./collections-crud.ts');

      // Mock RPC to throw error
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const result = await createCollection({
        name: 'Test Collection',
        slug: 'test-collection',
      });

      // Verify SafeActionResult structure with serverError
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
    });
  });
});
