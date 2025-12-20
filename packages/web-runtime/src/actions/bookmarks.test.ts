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
          logActionFailure('bookmarks', error, { userId: 'test-user-id' });
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
          created_at: '2024-01-01T00:00:00Z',
        },
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
          created_at: '2024-01-01T00:00:00Z',
        },
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
