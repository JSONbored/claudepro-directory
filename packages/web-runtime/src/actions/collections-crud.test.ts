import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock safe-action middleware - standardized pattern
// Pattern: authedAction.inputSchema().metadata().action()
vi.mock('./safe-action.ts', async () => {
  // Import mocked logActionFailure
  const { logActionFailure } = await import('../errors.ts');
  
  // Define all factory functions inside the mock factory to avoid hoisting issues
  const createActionHandler = (inputSchema: any) => {
    return vi.fn((handler: any) => {
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
    metadata: vi.fn((metadata: any) => createMetadataResult(inputSchema)),
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
          success: true,
          collection: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '223e4567-e89b-12d3-a456-426614174001',
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
          success: true,
          collection: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '223e4567-e89b-12d3-a456-426614174001',
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
          success: true,
          collection: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '223e4567-e89b-12d3-a456-426614174001',
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
        } as any);

        await updateCollection({
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Updated Collection',
        });

        expect(runRpc).toHaveBeenCalledWith(
          'manage_collection',
          expect.objectContaining({
            p_action: 'update',
            p_user_id: 'test-user-id',
            p_create_data: null,
            p_update_data: expect.objectContaining({
              id: '123e4567-e89b-12d3-a456-426614174000',
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
          success: true,
          collection: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '223e4567-e89b-12d3-a456-426614174001',
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
        } as any);

        await updateCollection({
          id: '123e4567-e89b-12d3-a456-426614174000',
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
          success: true,
          collection: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '223e4567-e89b-12d3-a456-426614174001',
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
        } as any);

        await deleteCollection({
          delete_id: '123e4567-e89b-12d3-a456-426614174000',
        });

        expect(runRpc).toHaveBeenCalledWith(
          'manage_collection',
          expect.objectContaining({
            p_action: 'delete',
            p_user_id: 'test-user-id',
            p_create_data: null,
            p_update_data: null,
            p_delete_id: '123e4567-e89b-12d3-a456-426614174000',
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
          success: true,
          collection: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '223e4567-e89b-12d3-a456-426614174001',
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
        } as any);

        await deleteCollection({
          delete_id: '123e4567-e89b-12d3-a456-426614174000',
        });

        expect(revalidatePath).toHaveBeenCalledWith('/account');
        expect(revalidatePath).toHaveBeenCalledWith('/account/library');
        expect(revalidateTag).toHaveBeenCalledWith('collections', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('users', 'default');
      });
    });
  });
});
