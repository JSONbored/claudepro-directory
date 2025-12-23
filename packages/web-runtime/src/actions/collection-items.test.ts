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

describe('collection-items', () => {
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

  describe('addItemToCollection', () => {
    it('should call manage_collection RPC with add_item action', async () => {
      const { addItemToCollection } = await import('./collection-items.ts');

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
      const result = await addItemToCollection({
        collection_id: collectionId,
        content_type: 'agents',
        content_slug: 'test-agent',
        notes: 'Test notes',
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
        'add_item', // p_action
        'test-user-id', // p_user_id (from ctx.userId in authedAction middleware)
        null, // p_create_data
        null, // p_update_data
        null, // p_delete_id
        expect.objectContaining({
          collection_id: collectionId,
          content_type: 'agents',
          content_slug: 'test-agent',
          notes: 'Test notes',
        }), // p_add_item_data
        null // p_remove_item_id
      );

      // Verify result data structure (wrapped in SafeActionResult.data)
      expect(safeResult.data?.success).toBe(true);
      expect(safeResult.data?.collection).toBeDefined();
    });

    it('should revalidate paths and tags', async () => {
      const { addItemToCollection } = await import('./collection-items.ts');

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

      const result = await addItemToCollection({
        collection_id: collectionId,
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify cache invalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library/test-collection');
      expect(mockRevalidateTag).toHaveBeenCalledWith('collections', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('users', 'default');
    });

    it('should handle optional parameters', async () => {
      const { addItemToCollection } = await import('./collection-items.ts');

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

      // Call with minimal parameters
      const result = await addItemToCollection({
        collection_id: collectionId,
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('manage_collection'),
        'add_item',
        'test-user-id', // From safemocker's authedAction context
        null,
        null,
        null,
        expect.objectContaining({
          collection_id: collectionId,
        }),
        null
      );
    });
  });

  describe('removeItemFromCollection', () => {
    it('should call manage_collection RPC with remove_item action', async () => {
      const { removeItemFromCollection } = await import('./collection-items.ts');

      const collectionId = '123e4567-e89b-12d3-a456-426614174000';
      const itemId = '223e4567-e89b-12d3-a456-426614174001';
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
      const result = await removeItemFromCollection({
        remove_item_id: itemId,
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
        'remove_item', // p_action
        'test-user-id', // p_user_id (from ctx.userId in authedAction middleware)
        null, // p_create_data
        null, // p_update_data
        null, // p_delete_id
        null, // p_add_item_data
        itemId // p_remove_item_id
      );

      // Verify result data structure (wrapped in SafeActionResult.data)
      expect(safeResult.data?.success).toBe(true);
      expect(safeResult.data?.collection).toBeDefined();
    });

    it('should revalidate paths and tags', async () => {
      const { removeItemFromCollection } = await import('./collection-items.ts');

      const collectionId = '123e4567-e89b-12d3-a456-426614174000';
      const itemId = '223e4567-e89b-12d3-a456-426614174001';
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

      const result = await removeItemFromCollection({
        remove_item_id: itemId,
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify cache invalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library/test-collection');
      expect(mockRevalidateTag).toHaveBeenCalledWith('collections', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('users', 'default');
    });
  });

  describe('reorderCollectionItems', () => {
    it('should call reorder_collection_items RPC with correct parameters', async () => {
      const { reorderCollectionItems } = await import('./collection-items.ts');

      const collectionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResult = {
        success: true,
        updated: 2,
        error: null,
        errors: null,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      // Call action - now returns SafeActionResult structure
      const result = await reorderCollectionItems({
        collection_id: collectionId,
        items: [{ id: 'item-1', order: 1 }, { id: 'item-2', order: 2 }],
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
        expect.stringContaining('reorder_collection_items'),
        collectionId, // p_collection_id
        'test-user-id', // p_user_id (from ctx.userId in authedAction middleware)
        [{ id: 'item-1', order: 1 }, { id: 'item-2', order: 2 }] // p_items
      );

      // Verify result data structure (wrapped in SafeActionResult.data)
      expect(safeResult.data).toMatchObject(mockResult);
    });

    it('should revalidate paths and tags', async () => {
      const { reorderCollectionItems } = await import('./collection-items.ts');

      const collectionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResult = {
        success: true,
        updated: 2,
        error: null,
        errors: null,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await reorderCollectionItems({
        collection_id: collectionId,
        items: [{ id: 'item-1', order: 1 }],
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify cache invalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library');
      expect(mockRevalidateTag).toHaveBeenCalledWith('collections', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('users', 'default');
    });
  });

  describe('input validation', () => {
    it('should return fieldErrors for invalid input', async () => {
      const { addItemToCollection } = await import('./collection-items.ts');

      // Call with invalid input (invalid UUID format)
      const result = await addItemToCollection({
        collection_id: 'invalid-uuid' as any,
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      // Verify SafeActionResult structure with fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();
    });
  });

  describe('authentication', () => {
    it('should inject auth context from safemocker', async () => {
      const { addItemToCollection } = await import('./collection-items.ts');

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

      const result = await addItemToCollection({
        collection_id: collectionId,
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
      // This is verified by checking that RPC was called with 'test-user-id'
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('manage_collection'),
        'add_item',
        'test-user-id', // From safemocker's authedAction context
        null,
        null,
        null,
        expect.objectContaining({
          collection_id: collectionId,
          content_type: 'agents',
          content_slug: 'test-agent',
        }),
        null
      );
    });
  });

  describe('server errors', () => {
    it('should return serverError when RPC fails', async () => {
      const { addItemToCollection } = await import('./collection-items.ts');

      // Mock RPC to throw error
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const result = await addItemToCollection({
        collection_id: '123e4567-e89b-12d3-a456-426614174000',
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
});
