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

describe('unlinkOAuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate oauth_provider enum', async () => {
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');
      const { oauth_providerSchema } = await import('./prisma-zod-schemas.ts');
      const validProviders = oauth_providerSchema._def.values;

      expect(() => {
        oauth_providerSchema.parse(validProviders[0]);
      }).not.toThrow();
    });

    it('should reject invalid provider', async () => {
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');
      const { oauth_providerSchema } = await import('./prisma-zod-schemas.ts');

      expect(() => {
        oauth_providerSchema.parse('invalid-provider');
      }).toThrow();
    });

    it('should require provider', async () => {
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');

      // Missing provider should fail
      await expect(unlinkOAuthProvider({} as any)).rejects.toThrow();
    });
  });

  describe('RPC call', () => {
    it('should call unlink_oauth_provider RPC with correct parameters', async () => {
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      const mockResult = {
        success: true,
      };
      vi.mocked(runRpc).mockResolvedValue(mockResult as any);

      const result = await unlinkOAuthProvider({
        provider: 'github',
      });

      expect(runRpc).toHaveBeenCalledWith(
        'unlink_oauth_provider',
        {
          p_provider: 'github',
        },
        {
          action: 'unlinkOAuthProvider.rpc',
          userId: 'test-user-id',
        }
      );

      expect(result).toEqual(mockResult);
    });

    it('should handle RPC errors', async () => {
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { logActionFailure } = await import('../errors.ts');

      const mockError = new Error('Database error');
      vi.mocked(runRpc).mockRejectedValue(mockError);

      await expect(
        unlinkOAuthProvider({
          provider: 'github',
        })
      ).rejects.toThrow();

      expect(logActionFailure).toHaveBeenCalledWith(
        'unlinkOAuthProvider',
        mockError,
        expect.objectContaining({
          userId: 'test-user-id',
        })
      );
    });
  });

  describe('cache invalidation', () => {
    it('should revalidate paths and tags', async () => {
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath, revalidateTag } = await import('next/cache');

      vi.mocked(runRpc).mockResolvedValue({ success: true } as any);

      await unlinkOAuthProvider({
        provider: 'github',
      });

      expect(revalidatePath).toHaveBeenCalledWith('/account/settings');
      expect(revalidateTag).toHaveBeenCalledWith('users', 'default');
    });
  });

  describe('metadata', () => {
    it('should have correct metadata', async () => {
      const { authedAction } = await import('./safe-action.ts');

      expect(authedAction.metadata).toHaveBeenCalledWith({
        actionName: 'unlinkOAuthProvider',
        category: 'user',
      });
    });
  });
});
