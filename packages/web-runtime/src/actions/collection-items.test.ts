import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock safe-action middleware
vi.mock('./safe-action.ts', () => {
  const createActionMock = (schema: any) => ({
    action: vi.fn((handler) => {
      return async (input: unknown) => {
        const parsed = schema.parse(input);
        return handler({ parsedInput: parsed, ctx: { userId: 'test-user-id' } });
      };
    }),
  });

  return {
    authedAction: {
      metadata: vi.fn(() => ({
        inputSchema: vi.fn((schema) => createActionMock(schema)),
      })),
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
}));

describe('collection-items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addItemToCollection', () => {
    it('should call manage_collection RPC with add_item action', async () => {
      const { addItemToCollection } = await import('./collection-items.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      vi.mocked(runRpc).mockResolvedValue({
        collection: { id: 'collection-123', slug: 'test-collection' },
      } as any);

      await addItemToCollection({
        collection_id: 'collection-123',
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
            collection_id: 'collection-123',
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

      vi.mocked(runRpc).mockResolvedValue({
        collection: { id: 'collection-123', slug: 'test-collection' },
      } as any);

      await addItemToCollection({
        collection_id: 'collection-123',
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

      vi.mocked(runRpc).mockResolvedValue({
        collection: { id: 'collection-123', slug: 'test-collection' },
      } as any);

      await removeItemFromCollection({
        remove_item_id: 'item-123',
      });

      expect(runRpc).toHaveBeenCalledWith(
        'manage_collection',
        expect.objectContaining({
          p_action: 'remove_item',
          p_user_id: 'test-user-id',
          p_remove_item_id: 'item-123',
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

      vi.mocked(runRpc).mockResolvedValue({
        collection: { id: 'collection-123', slug: 'test-collection' },
      } as any);

      await removeItemFromCollection({
        remove_item_id: 'item-123',
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

      vi.mocked(runRpc).mockResolvedValue({
        success: true,
      } as any);

      await reorderCollectionItems({
        collection_id: 'collection-123',
        items: [{ id: 'item-1' }, { id: 'item-2' }],
      });

      expect(runRpc).toHaveBeenCalledWith(
        'reorder_collection_items',
        {
          p_collection_id: 'collection-123',
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

      vi.mocked(runRpc).mockResolvedValue({
        success: true,
      } as any);

      await reorderCollectionItems({
        collection_id: 'collection-123',
        items: [],
      });

      expect(revalidatePath).toHaveBeenCalledWith('/account/library');
      expect(revalidateTag).toHaveBeenCalledWith('collections', 'default');
      expect(revalidateTag).toHaveBeenCalledWith('users', 'default');
    });
  });
});
