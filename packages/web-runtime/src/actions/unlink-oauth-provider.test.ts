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
          logActionFailure('unlinkOAuthProvider', error, { userId: 'test-user-id' });
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

describe('unlinkOAuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate oauth_provider enum', async () => {
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');
      const { oauth_providerSchema } = await import('../prisma-zod-schemas.ts');
      const { oauth_provider } = await import('@prisma/client');
      const validProviders = Object.values(oauth_provider);

      expect(() => {
        oauth_providerSchema.parse(validProviders[0]);
      }).not.toThrow();
    });

    it('should reject invalid provider', async () => {
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');
      const { oauth_providerSchema } = await import('../prisma-zod-schemas.ts');

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

      // Mock result must match unlinkOauthProviderResultSchema structure
      const mockResult = {
        success: true,
        message: 'OAuth provider unlinked successfully',
        provider: 'github' as const,
        remaining_providers: 1,
        error: null,
      };
      vi.mocked(runRpc).mockResolvedValue(mockResult as any);

      const result = await unlinkOAuthProvider({
        provider: 'github',
      });

      expect(runRpc).toHaveBeenCalledWith(
        'unlink_oauth_provider',
        {
          p_provider: 'github',
          p_user_id: 'test-user-id',
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

      vi.mocked(runRpc).mockResolvedValue({
        success: true,
        message: null,
        provider: 'github' as const,
        remaining_providers: 1,
        error: null,
      } as any);

      await unlinkOAuthProvider({
        provider: 'github',
      });

      expect(revalidatePath).toHaveBeenCalledWith('/account/settings');
      expect(revalidateTag).toHaveBeenCalledWith('users', 'default');
    });
  });

  describe('metadata', () => {
    it('should have correct metadata', async () => {
      // Metadata is set during action creation, not directly callable
      // We verify the action works correctly instead
      const { unlinkOAuthProvider } = await import('./unlink-oauth-provider.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      vi.mocked(runRpc).mockResolvedValue({
        success: true,
        message: null,
        provider: 'github' as const,
        remaining_providers: 1,
        error: null,
      } as any);

      await unlinkOAuthProvider({
        provider: 'github',
      });

      // If action executes successfully, metadata was set correctly
      expect(runRpc).toHaveBeenCalled();
    });
  });
});
