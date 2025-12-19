import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock safe-action middleware - properly chain the API to match actual usage
// authedAction.inputSchema().outputSchema().metadata().action()
vi.mock('./safe-action.ts', () => {
  const createActionMock = (inputSchema: any, outputSchema?: any) => ({
    action: vi.fn((handler) => {
      return async (input: unknown) => {
        const parsed = inputSchema.parse(input);
        const result = await handler({ 
          parsedInput: parsed, 
          ctx: { userId: 'test-user-id', userEmail: 'test@example.com' } 
        });
        if (outputSchema) {
          return outputSchema.parse(result);
        }
        return result;
      };
    }),
  });

  return {
    authedAction: {
      inputSchema: vi.fn((inputSchema: any) => ({
        outputSchema: vi.fn((outputSchema: any) => ({
          metadata: vi.fn(() => createActionMock(inputSchema, outputSchema)),
        })),
        metadata: vi.fn(() => createActionMock(inputSchema)),
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

describe('bookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addBookmark', () => {
    it('should call add_bookmark RPC with correct parameters', async () => {
      const { addBookmark } = await import('./bookmarks.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      // Mock result must match addBookmarkReturnsSchema structure (AddBookmarkResult composite)
      const mockResult = { 
        success: true,
        bookmark: { 
          id: '123e4567-e89b-12d3-a456-426614174000', 
          user_id: '123e4567-e89b-12d3-a456-426614174001', 
          content_type: 'agents', 
          content_slug: 'test-agent',
          notes: 'My notes',
          created_at: '2024-01-01T00:00:00Z'
        } 
      };
      vi.mocked(runRpc).mockResolvedValue(mockResult as any);

      const result = await addBookmark({
        content_type: 'agents',
        content_slug: 'test-agent',
        notes: 'My notes',
      });

      expect(runRpc).toHaveBeenCalledWith(
        'add_bookmark',
        {
          p_user_id: 'test-user-id',
          p_content_type: 'agents',
          p_content_slug: 'test-agent',
          p_notes: 'My notes',
        },
        expect.objectContaining({
          action: 'addBookmark.rpc',
          userId: 'test-user-id',
        })
      );

      expect(result).toEqual(mockResult);
    });

    it('should revalidate paths and tags', async () => {
      const { addBookmark } = await import('./bookmarks.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath, revalidateTag } = await import('next/cache');

      // Mock result must match addBookmarkReturnsSchema structure (AddBookmarkResult composite)
      const mockResult = { 
        success: true,
        bookmark: { 
          id: '123e4567-e89b-12d3-a456-426614174000', 
          user_id: '123e4567-e89b-12d3-a456-426614174001', 
          content_type: 'agents', 
          content_slug: 'test-agent',
          notes: null,
          created_at: '2024-01-01T00:00:00Z'
        } 
      };
      vi.mocked(runRpc).mockResolvedValue(mockResult as any);

      await addBookmark({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      expect(revalidatePath).toHaveBeenCalledWith('/account');
      expect(revalidatePath).toHaveBeenCalledWith('/account/library');
      expect(revalidateTag).toHaveBeenCalledWith('user-bookmarks', 'default');
      expect(revalidateTag).toHaveBeenCalledWith('users', 'default');
      expect(revalidateTag).toHaveBeenCalledWith('user-test-user-id', 'default');
      expect(revalidateTag).toHaveBeenCalledWith('content-test-agent', 'default');
    });
  });

  describe('removeBookmark', () => {
    it('should call remove_bookmark RPC with correct parameters', async () => {
      const { removeBookmark } = await import('./bookmarks.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      const mockResult = { success: true };
      vi.mocked(runRpc).mockResolvedValue(mockResult as any);

      const result = await removeBookmark({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      expect(runRpc).toHaveBeenCalledWith(
        'remove_bookmark',
        {
          p_user_id: 'test-user-id',
          p_content_type: 'agents',
          p_content_slug: 'test-agent',
        },
        expect.objectContaining({
          action: 'removeBookmark.rpc',
          userId: 'test-user-id',
        })
      );

      expect(result).toEqual(mockResult);
    });

    it('should revalidate paths and tags', async () => {
      const { removeBookmark } = await import('./bookmarks.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath, revalidateTag } = await import('next/cache');

      vi.mocked(runRpc).mockResolvedValue({ success: true } as any);

      await removeBookmark({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      expect(revalidatePath).toHaveBeenCalledWith('/account');
      expect(revalidatePath).toHaveBeenCalledWith('/account/library');
      expect(revalidateTag).toHaveBeenCalledWith('user-bookmarks', 'default');
      expect(revalidateTag).toHaveBeenCalledWith('users', 'default');
      expect(revalidateTag).toHaveBeenCalledWith('user-test-user-id', 'default');
      expect(revalidateTag).toHaveBeenCalledWith('content-test-agent', 'default');
    });
  });
});
