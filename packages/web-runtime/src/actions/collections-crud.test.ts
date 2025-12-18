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

describe('collections-crud', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCollection', () => {
    describe('RPC call', () => {
      it('should call manage_collection RPC with create action', async () => {
        const { createCollection } = await import('./collections-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');

        vi.mocked(runRpc).mockResolvedValue({
          collection: { id: 'collection-123', slug: 'test-collection' },
        } as any);

        await createCollection({
          name: 'Test Collection',
          slug: 'test-collection',
          description: 'Test description',
          is_public: true,
        });

        expect(runRpc).toHaveBeenCalledWith(
          'manage_collection',
          expect.objectContaining({
            p_action: 'create',
            p_user_id: 'test-user-id',
            p_create_data: expect.objectContaining({
              name: 'Test Collection',
              slug: 'test-collection',
              description: 'Test description',
              is_public: true,
            }),
            p_update_data: null,
            p_delete_id: null,
          }),
          expect.objectContaining({
            action: 'createCollection.rpc',
            userId: 'test-user-id',
          })
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { createCollection } = await import('./collections-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');
        const { revalidatePath, revalidateTag } = await import('next/cache');

        vi.mocked(runRpc).mockResolvedValue({
          collection: { id: 'collection-123', slug: 'test-collection' },
        } as any);

        await createCollection({
          name: 'Test Collection',
        });

        expect(revalidatePath).toHaveBeenCalledWith('/account');
        expect(revalidatePath).toHaveBeenCalledWith('/account/library');
        expect(revalidateTag).toHaveBeenCalledWith('collections', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('users', 'default');
      });
    });
  });

  describe('updateCollection', () => {
    describe('RPC call', () => {
      it('should call manage_collection RPC with update action', async () => {
        const { updateCollection } = await import('./collections-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');

        vi.mocked(runRpc).mockResolvedValue({
          collection: { id: 'collection-123', slug: 'test-collection' },
        } as any);

        await updateCollection({
          id: 'collection-123',
          name: 'Updated Collection',
        });

        expect(runRpc).toHaveBeenCalledWith(
          'manage_collection',
          expect.objectContaining({
            p_action: 'update',
            p_user_id: 'test-user-id',
            p_create_data: null,
            p_update_data: expect.objectContaining({
              id: 'collection-123',
              name: 'Updated Collection',
            }),
            p_delete_id: null,
          }),
          expect.objectContaining({
            action: 'updateCollection.rpc',
            userId: 'test-user-id',
          })
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { updateCollection } = await import('./collections-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');
        const { revalidatePath, revalidateTag } = await import('next/cache');

        vi.mocked(runRpc).mockResolvedValue({
          collection: { id: 'collection-123', slug: 'test-collection' },
        } as any);

        await updateCollection({
          id: 'collection-123',
          name: 'Updated Collection',
        });

        expect(revalidatePath).toHaveBeenCalledWith('/account');
        expect(revalidatePath).toHaveBeenCalledWith('/account/library');
        expect(revalidatePath).toHaveBeenCalledWith('/account/library/test-collection');
        expect(revalidateTag).toHaveBeenCalledWith('collections', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('users', 'default');
      });
    });
  });

  describe('deleteCollection', () => {
    describe('RPC call', () => {
      it('should call manage_collection RPC with delete action', async () => {
        const { deleteCollection } = await import('./collections-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');

        vi.mocked(runRpc).mockResolvedValue({
          collection: { id: 'collection-123' },
        } as any);

        await deleteCollection({
          delete_id: 'collection-123',
        });

        expect(runRpc).toHaveBeenCalledWith(
          'manage_collection',
          expect.objectContaining({
            p_action: 'delete',
            p_user_id: 'test-user-id',
            p_create_data: null,
            p_update_data: null,
            p_delete_id: 'collection-123',
          }),
          expect.objectContaining({
            action: 'deleteCollection.rpc',
            userId: 'test-user-id',
          })
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { deleteCollection } = await import('./collections-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');
        const { revalidatePath, revalidateTag } = await import('next/cache');

        vi.mocked(runRpc).mockResolvedValue({
          collection: { id: 'collection-123' },
        } as any);

        await deleteCollection({
          delete_id: 'collection-123',
        });

        expect(revalidatePath).toHaveBeenCalledWith('/account');
        expect(revalidatePath).toHaveBeenCalledWith('/account/library');
        expect(revalidateTag).toHaveBeenCalledWith('collections', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('users', 'default');
      });
    });
  });
});
