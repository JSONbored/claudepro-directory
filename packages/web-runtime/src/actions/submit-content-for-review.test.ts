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

describe('submitContentForReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate submission_type enum', async () => {
      const { submitContentForReview } = await import('./submit-content-for-review.ts');
      const { submission_typeSchema } = await import('./prisma-zod-schemas.ts');
      const validTypes = submission_typeSchema._def.values;

      expect(() => {
        submission_typeSchema.parse(validTypes[0]);
      }).not.toThrow();
    });

    it('should validate content_category enum', async () => {
      const { submitContentForReview } = await import('./submit-content-for-review.ts');
      const { content_categorySchema } = await import('./prisma-zod-schemas.ts');
      const validCategories = content_categorySchema._def.values;

      expect(() => {
        content_categorySchema.parse(validCategories[0]);
      }).not.toThrow();
    });

    it('should require name, description, category, author, and content_data', async () => {
      const { submitContentForReview } = await import('./submit-content-for-review.ts');

      // Missing required fields should fail
      await expect(
        submitContentForReview({
          // Missing required fields
        } as any)
      ).rejects.toThrow();
    });

    it('should accept optional fields', async () => {
      const { submitContentForReview } = await import('./submit-content-for-review.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      vi.mocked(runRpc).mockResolvedValue({
        submission_id: 'submission-123',
      } as any);

      const result = await submitContentForReview({
        submission_type: 'new',
        name: 'Test Content',
        description: 'Test description',
        category: 'agents',
        author: 'Test Author',
        content_data: { key: 'value' },
        author_profile_url: 'https://example.com/profile',
        github_url: 'https://github.com/example',
        tags: ['tag1', 'tag2'],
      });

      expect(runRpc).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('RPC call', () => {
    it('should call submit_content_for_review RPC with correct parameters', async () => {
      const { submitContentForReview } = await import('./submit-content-for-review.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      const mockResult = {
        submission_id: 'submission-123',
      };
      vi.mocked(runRpc).mockResolvedValue(mockResult as any);

      const result = await submitContentForReview({
        submission_type: 'new',
        name: 'Test Content',
        description: 'Test description',
        category: 'agents',
        author: 'Test Author',
        content_data: { key: 'value' },
        tags: ['tag1'],
      });

      expect(runRpc).toHaveBeenCalledWith(
        'submit_content_for_review',
        {
          p_submission_type: 'new',
          p_name: 'Test Content',
          p_description: 'Test description',
          p_category: 'agents',
          p_author: 'Test Author',
          p_content_data: { key: 'value' },
          p_author_profile_url: undefined,
          p_github_url: undefined,
          p_tags: ['tag1'],
        },
        {
          action: 'submitContentForReview.rpc',
          userId: 'test-user-id',
        }
      );

      expect(result).toEqual(mockResult);
    });

    it('should handle RPC errors', async () => {
      const { submitContentForReview } = await import('./submit-content-for-review.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { logActionFailure } = await import('../errors.ts');

      const mockError = new Error('Database error');
      vi.mocked(runRpc).mockRejectedValue(mockError);

      await expect(
        submitContentForReview({
          submission_type: 'new',
          name: 'Test',
          description: 'Test',
          category: 'agents',
          author: 'Test',
          content_data: {},
        })
      ).rejects.toThrow();

      expect(logActionFailure).toHaveBeenCalledWith(
        'submitContentForReview',
        mockError,
        expect.objectContaining({
          userId: 'test-user-id',
        })
      );
    });
  });

  describe('cache invalidation', () => {
    it('should revalidate paths and tags', async () => {
      const { submitContentForReview } = await import('./submit-content-for-review.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath, revalidateTag } = await import('next/cache');

      vi.mocked(runRpc).mockResolvedValue({
        submission_id: 'submission-123',
      } as any);

      await submitContentForReview({
        submission_type: 'new',
        name: 'Test',
        description: 'Test',
        category: 'agents',
        author: 'Test',
        content_data: {},
      });

      expect(revalidatePath).toHaveBeenCalledWith('/account/submissions');
      expect(revalidateTag).toHaveBeenCalledWith('submissions', 'default');
    });
  });

  describe('metadata', () => {
    it('should have correct metadata', async () => {
      const { authedAction } = await import('./safe-action.ts');

      expect(authedAction.metadata).toHaveBeenCalledWith({
        actionName: 'submitContentForReview',
        category: 'content',
      });
    });
  });
});
