import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock safe-action middleware - standardized pattern
// Pattern: authedAction.inputSchema().outputSchema().metadata().action()
vi.mock('./safe-action.ts', async () => {
  // Import mocked logActionFailure
  const { logActionFailure } = await import('../errors.ts');
  
  // Define all factory functions inside the mock factory to avoid hoisting issues
  const createActionHandler = (inputSchema: any, outputSchema?: any) => {
    return vi.fn((handler: any) => {
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
    metadata: vi.fn((metadata: any) => createMetadataResult(inputSchema, outputSchema)),
    action: createActionHandler(inputSchema, outputSchema),
  });

  const createInputSchemaResult = (inputSchema: any) => ({
    metadata: vi.fn((metadata: any) => createMetadataResult(inputSchema)),
    outputSchema: vi.fn((outputSchema: any) => createOutputSchemaResult(inputSchema, outputSchema)),
    action: createActionHandler(inputSchema),
  });

  return {
    authedAction: {
      inputSchema: vi.fn((schema: any) => createInputSchemaResult(schema)),
    },
  };
});

// Mock runRpc
vi.mock('./run-rpc-instance.ts', () => ({
  runRpc: vi.fn(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock errors
vi.mock('../errors.ts', () => ({
  logActionFailure: vi.fn((actionName, error, context) => {
    const err = error instanceof Error ? error : new Error(String(error));
    err.name = actionName;
    return err;
  }),
  normalizeError: vi.fn((error: unknown, message?: string) => {
    if (error instanceof Error) return error;
    return new Error(message || String(error));
  }),
}));

describe('collection-items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addItemToCollection', () => {
    it('should call manage_collection RPC with add_item action', async () => {
      const { addItemToCollection } = await import('./collection-items.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      const collectionId = '123e4567-e89b-12d3-a456-426614174000';
      // Mock result must match manageCollectionReturnsSchema structure
      // collection must match userCollectionsSchema (all required fields)
      vi.mocked(runRpc).mockResolvedValue({
        success: true,
        collection: {
          id: collectionId,
          user_id: '123e4567-e89b-12d3-a456-426614174000', // Must be valid UUID
          name: 'Test Collection',
          slug: 'test-collection',
          description: null,
          is_public: false,
          view_count: 0,
          bookmark_count: 0,
          item_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        item: null,
      } as any);

      await addItemToCollection({
        collection_id: collectionId,
        content_type: 'agents',
        content_slug: 'test-agent',
        notes: 'Test note',
        order: 1,
      });

      expect(runRpc).toHaveBeenCalledWith(
        'manage_collection',
        expect.objectContaining({
          p_action: 'add_item',
          p_user_id: 'test-user-id',
          p_add_item_data: expect.objectContaining({
            collection_id: '123e4567-e89b-12d3-a456-426614174000',
            content_type: 'agents',
            content_slug: 'test-agent',
            notes: 'Test note',
            order: 1,
          }),
        }),
        expect.objectContaining({
          action: 'addItemToCollection.rpc',
          userId: 'test-user-id',
        })
      );
    });

    it('should revalidate paths and tags', async () => {
      const { addItemToCollection } = await import('./collection-items.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath, revalidateTag } = await import('next/cache');

      const collectionId = '123e4567-e89b-12d3-a456-426614174000';
      // Mock result must match manageCollectionReturnsSchema structure
      // collection must match userCollectionsSchema (all required fields)
      vi.mocked(runRpc).mockResolvedValue({
        success: true,
        collection: {
          id: collectionId,
          user_id: '123e4567-e89b-12d3-a456-426614174000', // Must be valid UUID
          name: 'Test Collection',
          slug: 'test-collection',
          description: null,
          is_public: false,
          view_count: 0,
          bookmark_count: 0,
          item_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        item: null,
      } as any);

      await addItemToCollection({
        collection_id: collectionId,
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      expect(revalidatePath).toHaveBeenCalledWith('/account/library');
      expect(revalidatePath).toHaveBeenCalledWith('/account/library/test-collection');
      expect(revalidateTag).toHaveBeenCalledWith('collections', 'default');
      expect(revalidateTag).toHaveBeenCalledWith('users', 'default');
    });
  });

  describe('removeItemFromCollection', () => {
    it('should call manage_collection RPC with remove_item action', async () => {
      const { removeItemFromCollection } = await import('./collection-items.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      const collectionId = '123e4567-e89b-12d3-a456-426614174000';
      // Mock result must match manageCollectionReturnsSchema structure
      // collection must match userCollectionsSchema (all required fields)
      vi.mocked(runRpc).mockResolvedValue({
        success: true,
        collection: {
          id: collectionId,
          user_id: '123e4567-e89b-12d3-a456-426614174000', // Must be valid UUID
          name: 'Test Collection',
          slug: 'test-collection',
          description: null,
          is_public: false,
          view_count: 0,
          bookmark_count: 0,
          item_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        item: null,
      } as any);

      await removeItemFromCollection({
        remove_item_id: '223e4567-e89b-12d3-a456-426614174001',
      });

      expect(runRpc).toHaveBeenCalledWith(
        'manage_collection',
        expect.objectContaining({
          p_action: 'remove_item',
          p_user_id: 'test-user-id',
          p_remove_item_id: '223e4567-e89b-12d3-a456-426614174001',
        }),
        expect.objectContaining({
          action: 'removeItemFromCollection.rpc',
          userId: 'test-user-id',
        })
      );
    });

    it('should revalidate paths and tags', async () => {
      const { removeItemFromCollection } = await import('./collection-items.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath, revalidateTag } = await import('next/cache');

      const collectionId = '123e4567-e89b-12d3-a456-426614174000';
      // Mock result must match manageCollectionReturnsSchema structure
      // collection must match userCollectionsSchema (all required fields)
      vi.mocked(runRpc).mockResolvedValue({
        success: true,
        collection: {
          id: collectionId,
          user_id: '123e4567-e89b-12d3-a456-426614174000', // Must be valid UUID
          name: 'Test Collection',
          slug: 'test-collection',
          description: null,
          is_public: false,
          view_count: 0,
          bookmark_count: 0,
          item_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        item: null,
      } as any);

      await removeItemFromCollection({
        remove_item_id: '223e4567-e89b-12d3-a456-426614174001',
      });

      expect(revalidatePath).toHaveBeenCalledWith('/account/library');
      expect(revalidatePath).toHaveBeenCalledWith('/account/library/test-collection');
      expect(revalidateTag).toHaveBeenCalledWith('collections', 'default');
      expect(revalidateTag).toHaveBeenCalledWith('users', 'default');
    });
  });

  describe('reorderCollectionItems', () => {
    it('should call reorder_collection_items RPC', async () => {
      const { reorderCollectionItems } = await import('./collection-items.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      // Mock result must match reorderCollectionItemsReturnsSchema structure
      vi.mocked(runRpc).mockResolvedValue({
        success: true,
        updated: 2,
        error: null,
        errors: null,
      } as any);

      await reorderCollectionItems({
        collection_id: '123e4567-e89b-12d3-a456-426614174000',
        items: [{ id: 'item-1' }, { id: 'item-2' }],
      });

      expect(runRpc).toHaveBeenCalledWith(
        'reorder_collection_items',
        {
          p_collection_id: '123e4567-e89b-12d3-a456-426614174000',
          p_user_id: 'test-user-id',
          p_items: [{ id: 'item-1' }, { id: 'item-2' }],
        },
        expect.objectContaining({
          action: 'reorderCollectionItems.rpc',
          userId: 'test-user-id',
        })
      );
    });

    it('should revalidate paths and tags', async () => {
      const { reorderCollectionItems } = await import('./collection-items.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath, revalidateTag } = await import('next/cache');

      // Mock result must match reorderCollectionItemsReturnsSchema structure
      vi.mocked(runRpc).mockResolvedValue({
        success: true,
        updated: 0,
        error: null,
        errors: null,
      } as any);

      await reorderCollectionItems({
        collection_id: '123e4567-e89b-12d3-a456-426614174000',
        items: [],
      });

      expect(revalidatePath).toHaveBeenCalledWith('/account/library');
      expect(revalidateTag).toHaveBeenCalledWith('collections', 'default');
      expect(revalidateTag).toHaveBeenCalledWith('users', 'default');
    });
  });
});
