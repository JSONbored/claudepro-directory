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
          logActionFailure('reviewsCrud', error, { userId: 'test-user-id' });
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

describe('reviews-crud', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReview', () => {
    describe('RPC call', () => {
      it('should call manage_review RPC with create action', async () => {
        const { createReview } = await import('./reviews-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');

        // Mock result must match ManageReviewReturns structure
        vi.mocked(runRpc).mockResolvedValue({
          success: true,
          review: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '223e4567-e89b-12d3-a456-426614174001',
            content_type: 'agents' as const,
            content_slug: 'test-agent',
            rating: 5,
            review_text: 'Great agent!',
            helpful_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          content_type: 'agents' as const,
          content_slug: 'test-agent',
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

        // Mock result must match ManageReviewReturns structure
        vi.mocked(runRpc).mockResolvedValue({
          success: true,
          review: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '223e4567-e89b-12d3-a456-426614174001',
            content_type: 'agents' as const,
            content_slug: 'test-agent',
            rating: 5,
            review_text: 'Great agent!',
            helpful_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          content_type: 'agents' as const,
          content_slug: 'test-agent',
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

        // Mock result must match ManageReviewReturns structure
        vi.mocked(runRpc).mockResolvedValue({
          success: true,
          review: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '223e4567-e89b-12d3-a456-426614174001',
            content_type: 'agents' as const,
            content_slug: 'test-agent',
            rating: 5,
            review_text: 'Great agent!',
            helpful_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          content_type: 'agents' as const,
          content_slug: 'test-agent',
        } as any);

        await updateReview({
          review_id: '123e4567-e89b-12d3-a456-426614174000',
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
              review_id: '123e4567-e89b-12d3-a456-426614174000',
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

        // Mock result must match ManageReviewReturns structure
        vi.mocked(runRpc).mockResolvedValue({
          success: true,
          review: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '223e4567-e89b-12d3-a456-426614174001',
            content_type: 'agents' as const,
            content_slug: 'test-agent',
            rating: 5,
            review_text: 'Great agent!',
            helpful_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          content_type: 'agents' as const,
          content_slug: 'test-agent',
        } as any);

        await updateReview({
          review_id: '123e4567-e89b-12d3-a456-426614174000',
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
          delete_id: '123e4567-e89b-12d3-a456-426614174000',
        });

        expect(runRpc).toHaveBeenCalledWith(
          'manage_review',
          expect.objectContaining({
            p_action: 'delete',
            p_user_id: 'test-user-id',
            p_create_data: null,
            p_update_data: null,
            p_delete_id: '123e4567-e89b-12d3-a456-426614174000',
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
          delete_id: '123e4567-e89b-12d3-a456-426614174000',
        });

        expect(revalidateTag).toHaveBeenCalledWith('content', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('homepage', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('trending', 'default');
      });
    });
  });
});
