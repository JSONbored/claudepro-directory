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

describe('reviews-crud', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReview', () => {
    describe('RPC call', () => {
      it('should call manage_review RPC with create action', async () => {
        const { createReview } = await import('./reviews-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');

        vi.mocked(runRpc).mockResolvedValue({
          review: {
            id: 'review-123',
            content_type: 'agents',
            content_slug: 'test-agent',
          },
        } as any);

        await createReview({
          content_type: 'agents',
          content_slug: 'test-agent',
          rating: 5,
          review_text: 'Great agent!',
        });

        expect(runRpc).toHaveBeenCalledWith(
          'manage_review',
          expect.objectContaining({
            p_action: 'create',
            p_user_id: 'test-user-id',
            p_create_data: expect.objectContaining({
              content_type: 'agents',
              content_slug: 'test-agent',
              rating: 5,
              review_text: 'Great agent!',
            }),
            p_update_data: null,
            p_delete_id: null,
          }),
          expect.objectContaining({
            action: 'createReview.rpc',
            userId: 'test-user-id',
          })
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags based on content', async () => {
        const { createReview } = await import('./reviews-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');
        const { revalidatePath, revalidateTag } = await import('next/cache');

        vi.mocked(runRpc).mockResolvedValue({
          review: {
            id: 'review-123',
            content_type: 'agents',
            content_slug: 'test-agent',
          },
        } as any);

        await createReview({
          content_type: 'agents',
          content_slug: 'test-agent',
          rating: 5,
        });

        expect(revalidatePath).toHaveBeenCalledWith('/agents/test-agent');
        expect(revalidatePath).toHaveBeenCalledWith('/agents');
        expect(revalidateTag).toHaveBeenCalledWith('reviews:agents:test-agent', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('content', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('homepage', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('trending', 'default');
      });
    });
  });

  describe('updateReview', () => {
    describe('RPC call', () => {
      it('should call manage_review RPC with update action', async () => {
        const { updateReview } = await import('./reviews-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');

        vi.mocked(runRpc).mockResolvedValue({
          review: {
            id: 'review-123',
            content_type: 'agents',
            content_slug: 'test-agent',
          },
        } as any);

        await updateReview({
          review_id: 'review-123',
          rating: 4,
          review_text: 'Updated review',
        });

        expect(runRpc).toHaveBeenCalledWith(
          'manage_review',
          expect.objectContaining({
            p_action: 'update',
            p_user_id: 'test-user-id',
            p_create_data: null,
            p_update_data: expect.objectContaining({
              review_id: 'review-123',
              rating: 4,
              review_text: 'Updated review',
            }),
            p_delete_id: null,
          }),
          expect.objectContaining({
            action: 'updateReview.rpc',
            userId: 'test-user-id',
          })
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { updateReview } = await import('./reviews-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');
        const { revalidatePath, revalidateTag } = await import('next/cache');

        vi.mocked(runRpc).mockResolvedValue({
          review: {
            id: 'review-123',
            content_type: 'agents',
            content_slug: 'test-agent',
          },
        } as any);

        await updateReview({
          review_id: 'review-123',
          rating: 4,
        });

        expect(revalidatePath).toHaveBeenCalledWith('/agents/test-agent');
        expect(revalidatePath).toHaveBeenCalledWith('/agents');
        expect(revalidateTag).toHaveBeenCalledWith('reviews:agents:test-agent', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('content', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('homepage', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('trending', 'default');
      });
    });
  });

  describe('deleteReview', () => {
    describe('RPC call', () => {
      it('should call manage_review RPC with delete action', async () => {
        const { deleteReview } = await import('./reviews-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');

        vi.mocked(runRpc).mockResolvedValue({
          review: { id: 'review-123' },
        } as any);

        await deleteReview({
          delete_id: 'review-123',
        });

        expect(runRpc).toHaveBeenCalledWith(
          'manage_review',
          expect.objectContaining({
            p_action: 'delete',
            p_user_id: 'test-user-id',
            p_create_data: null,
            p_update_data: null,
            p_delete_id: 'review-123',
          }),
          expect.objectContaining({
            action: 'deleteReview.rpc',
            userId: 'test-user-id',
          })
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate tags only (no paths for delete)', async () => {
        const { deleteReview } = await import('./reviews-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');
        const { revalidateTag } = await import('next/cache');

        vi.mocked(runRpc).mockResolvedValue({
          review: { id: 'review-123' },
        } as any);

        await deleteReview({
          delete_id: 'review-123',
        });

        expect(revalidateTag).toHaveBeenCalledWith('content', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('homepage', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('trending', 'default');
      });
    });
  });
});
