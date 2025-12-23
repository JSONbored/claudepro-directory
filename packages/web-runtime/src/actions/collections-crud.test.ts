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
// Pattern: authedAction.inputSchema().metadata().action()
jest.mock('./safe-action.ts', () => {
  // Define all factory functions inside the mock factory to avoid hoisting issues
  const createActionHandler = (inputSchema: any) => {
    return jest.fn((handler: any) => {
      return async (input: unknown) => {
        try {
          const parsed = inputSchema ? inputSchema.parse(input) : input;
          const result = await handler({
            parsedInput: parsed,
            ctx: { userId: 'test-user-id', userEmail: 'test@example.com', authToken: 'test-token' },
          });
          return result;
        } catch (error) {
          // Simulate middleware error handling - logActionFailure is called by middleware
          const { logActionFailure } = require('../errors.ts');
          logActionFailure('collectionsCrud', error, { userId: 'test-user-id' });
          throw error;
        }
      };
    });
  };

  const createMetadataResult = (inputSchema: any) => ({
    action: createActionHandler(inputSchema),
  });

  const createInputSchemaResult = (inputSchema: any) => ({
    metadata: jest.fn((metadata: any) => createMetadataResult(inputSchema)),
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

describe('collections-crud', () => {
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

        const result = await createCollection({
          name: 'Test Collection',
          slug: 'test-collection',
          description: 'Test description',
          is_public: true,
        });

        // Verify RPC was called with correct SQL and parameters
        // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('manage_collection'),
          'create', // p_action
          'test-user-id', // p_user_id
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

        expect(result).toMatchObject(mockResult);
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

        await createCollection({
          name: 'Test Collection',
        });

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
            user_id: '123e4567-e89b-12d3-a456-426614174000',
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

        const result = await updateCollection({
          id: collectionId,
          name: 'Updated Collection',
        });

        // Verify RPC was called with correct SQL and parameters
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('manage_collection'),
          'update', // p_action
          'test-user-id', // p_user_id
          null, // p_create_data
          expect.objectContaining({
            id: collectionId,
            name: 'Updated Collection',
          }), // p_update_data
          null, // p_delete_id
          null, // p_add_item_data
          null // p_remove_item_id
        );

        expect(result).toMatchObject(mockResult);
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

        await updateCollection({
          id: collectionId,
          name: 'Updated Collection',
        });

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

        const result = await deleteCollection({
          delete_id: collectionId,
        });

        // Verify RPC was called with correct SQL and parameters
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('manage_collection'),
          'delete', // p_action
          'test-user-id', // p_user_id
          null, // p_create_data
          null, // p_update_data
          collectionId, // p_delete_id
          null, // p_add_item_data
          null // p_remove_item_id
        );

        expect(result).toMatchObject(mockResult);
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

        await deleteCollection({
          delete_id: collectionId,
        });

        expect(mockRevalidatePath).toHaveBeenCalledWith('/account');
        expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library');
        expect(mockRevalidateTag).toHaveBeenCalledWith('collections', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('users', 'default');
      });
    });
  });
});
