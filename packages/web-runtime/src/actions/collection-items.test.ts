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

// Mock errors first (needed by safe-action mock)
jest.mock('../errors.ts', () => ({
  logActionFailure: jest.fn((actionName, error, context) => {
    const err = error instanceof Error ? error : new Error(String(error));
    err.name = actionName;
    return err;
  }),
  normalizeError: jest.fn((error: unknown, message?: string) => {
    if (error instanceof Error) return error;
    return new Error(message || String(error));
  }),
}));

// Mock safe-action middleware - standardized pattern
// Pattern: authedAction.inputSchema().outputSchema().metadata().action()
jest.mock('./safe-action.ts', () => {
  // Define all factory functions inside the mock factory to avoid hoisting issues
  const createActionHandler = (inputSchema: any, outputSchema?: any) => {
    return jest.fn((handler: any) => {
      return async (input: unknown) => {
        try {
          const parsed = inputSchema ? inputSchema.parse(input) : input;
          const result = await handler({
            parsedInput: parsed,
            ctx: { userId: 'test-user-id', userEmail: 'test@example.com', authToken: 'test-token' },
          });
          if (outputSchema) {
            return outputSchema.parse(result);
          }
          return result;
        } catch (error) {
          // Simulate middleware error handling - logActionFailure is called by middleware
          const { logActionFailure } = require('../errors.ts');
          logActionFailure('collectionItems', error, { userId: 'test-user-id' });
          throw error;
        }
      };
    });
  };

  const createMetadataResult = (inputSchema: any, outputSchema?: any) => ({
    action: createActionHandler(inputSchema, outputSchema),
  });

  const createOutputSchemaResult = (inputSchema: any, outputSchema?: any) => ({
    metadata: jest.fn((metadata: any) => createMetadataResult(inputSchema, outputSchema)),
    action: createActionHandler(inputSchema, outputSchema),
  });

  const createInputSchemaResult = (inputSchema: any) => ({
    metadata: jest.fn((metadata: any) => createMetadataResult(inputSchema)),
    outputSchema: jest.fn((outputSchema: any) => createOutputSchemaResult(inputSchema, outputSchema)),
    action: createActionHandler(inputSchema),
  });

  return {
    authedAction: {
      inputSchema: jest.fn((schema: any) => createInputSchemaResult(schema)),
    },
  };
});

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
          user_id: '123e4567-e89b-12d3-a456-426614174000',
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

      const result = await addItemToCollection({
        collection_id: collectionId,
        content_type: 'agents',
        content_slug: 'test-agent',
        notes: 'Test notes',
      });

      // Verify RPC was called with correct SQL and parameters
      // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('manage_collection'),
        'add_item', // p_action
        'test-user-id', // p_user_id
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

      expect(result.success).toBe(true);
      expect(result.collection).toBeDefined();
    });

    it('should revalidate paths and tags', async () => {
      const { addItemToCollection } = await import('./collection-items.ts');

      const collectionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResult = {
        success: true,
        collection: {
          id: collectionId,
          user_id: '123e4567-e89b-12d3-a456-426614174000',
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

      await addItemToCollection({
        collection_id: collectionId,
        content_type: 'agents',
        content_slug: 'test-agent',
      });

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
          user_id: '123e4567-e89b-12d3-a456-426614174000',
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
      await addItemToCollection({
        collection_id: collectionId,
      });

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('manage_collection'),
        'add_item',
        'test-user-id',
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
          user_id: '123e4567-e89b-12d3-a456-426614174000',
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

      // Verify RPC was called with correct SQL and parameters
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('manage_collection'),
        'remove_item', // p_action
        'test-user-id', // p_user_id
        null, // p_create_data
        null, // p_update_data
        null, // p_delete_id
        null, // p_add_item_data
        itemId // p_remove_item_id
      );

      expect(result.success).toBe(true);
      expect(result.collection).toBeDefined();
    });

    it('should revalidate paths and tags', async () => {
      const { removeItemFromCollection } = await import('./collection-items.ts');

      const collectionId = '123e4567-e89b-12d3-a456-426614174000';
      const itemId = '223e4567-e89b-12d3-a456-426614174001';
      const mockResult = {
        success: true,
        collection: {
          id: collectionId,
          user_id: '123e4567-e89b-12d3-a456-426614174000',
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

      await removeItemFromCollection({
        remove_item_id: itemId,
      });

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

      const result = await reorderCollectionItems({
        collection_id: collectionId,
        items: [{ id: 'item-1', order: 1 }, { id: 'item-2', order: 2 }],
      });

      // Verify RPC was called with correct SQL and parameters
      // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('reorder_collection_items'),
        collectionId, // p_collection_id
        'test-user-id', // p_user_id
        [{ id: 'item-1', order: 1 }, { id: 'item-2', order: 2 }] // p_items
      );

      expect(result).toMatchObject(mockResult);
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

      await reorderCollectionItems({
        collection_id: collectionId,
        items: [{ id: 'item-1', order: 1 }],
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library');
      expect(mockRevalidateTag).toHaveBeenCalledWith('collections', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('users', 'default');
    });
  });
});
