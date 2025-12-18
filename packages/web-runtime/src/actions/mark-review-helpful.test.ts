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

describe('markReviewHelpful', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate UUID for review_id field', async () => {
      const { markReviewHelpful } = await import('./mark-review-helpful.ts');

      // Invalid UUID should fail
      await expect(
        markReviewHelpful({
          review_id: 'invalid-uuid',
          helpful: true,
        } as any)
      ).rejects.toThrow();
    });

    it('should require helpful boolean', async () => {
      const { markReviewHelpful } = await import('./mark-review-helpful.ts');

      // Missing helpful should fail
      await expect(
        markReviewHelpful({
          review_id: '123e4567-e89b-12d3-a456-426614174000',
        } as any)
      ).rejects.toThrow();
    });

    it('should accept boolean helpful value', async () => {
      const { markReviewHelpful } = await import('./mark-review-helpful.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      vi.mocked(runRpc).mockResolvedValue({
        content_type: 'agents',
        content_slug: 'test-agent',
      } as any);

      await markReviewHelpful({
        review_id: '123e4567-e89b-12d3-a456-426614174000',
        helpful: true,
      });

      expect(runRpc).toHaveBeenCalled();
    });
  });

  describe('RPC call', () => {
    it('should call toggle_review_helpful RPC with correct parameters', async () => {
      const { markReviewHelpful } = await import('./mark-review-helpful.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      const mockResult = {
        content_type: 'agents',
        content_slug: 'test-agent',
      };
      vi.mocked(runRpc).mockResolvedValue(mockResult as any);

      const result = await markReviewHelpful({
        review_id: '123e4567-e89b-12d3-a456-426614174000',
        helpful: true,
      });

      expect(runRpc).toHaveBeenCalledWith(
        'toggle_review_helpful',
        {
          p_review_id: '123e4567-e89b-12d3-a456-426614174000',
          p_user_id: 'test-user-id',
          p_helpful: true,
        },
        {
          action: 'markReviewHelpful.rpc',
          userId: 'test-user-id',
        }
      );

      expect(result).toEqual(mockResult);
    });

    it('should handle RPC errors', async () => {
      const { markReviewHelpful } = await import('./mark-review-helpful.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { logActionFailure } = await import('../errors.ts');

      const mockError = new Error('Database error');
      vi.mocked(runRpc).mockRejectedValue(mockError);

      await expect(
        markReviewHelpful({
          review_id: '123e4567-e89b-12d3-a456-426614174000',
          helpful: true,
        })
      ).rejects.toThrow();

      expect(logActionFailure).toHaveBeenCalledWith(
        'markReviewHelpful',
        mockError,
        expect.objectContaining({
          userId: 'test-user-id',
        })
      );
    });
  });

  describe('cache invalidation', () => {
    it('should revalidate paths and tags', async () => {
      const { markReviewHelpful } = await import('./mark-review-helpful.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath, revalidateTag } = await import('next/cache');

      vi.mocked(runRpc).mockResolvedValue({
        content_type: 'agents',
        content_slug: 'test-agent',
      } as any);

      await markReviewHelpful({
        review_id: '123e4567-e89b-12d3-a456-426614174000',
        helpful: true,
      });

      expect(revalidatePath).toHaveBeenCalledWith('/agents/test-agent');
      expect(revalidateTag).toHaveBeenCalledWith('reviews:agents:test-agent', 'default');
      expect(revalidateTag).toHaveBeenCalledWith('content', 'default');
    });
  });

  describe('metadata', () => {
    it('should have correct metadata', async () => {
      const { authedAction } = await import('./safe-action.ts');

      expect(authedAction.metadata).toHaveBeenCalledWith({
        actionName: 'markReviewHelpful',
        category: 'user',
      });
    });
  });
});
