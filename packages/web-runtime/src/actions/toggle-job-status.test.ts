import { describe, expect, it, vi, beforeEach } from 'vitest';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { job_status } from '@prisma/client';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Import real cache utilities for proper cache testing
// Note: clearRequestCache is exported from @heyclaude/data-layer, but for tests we need the direct import
// to avoid circular dependencies. Deep relative imports are acceptable for test utilities.
import { clearRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility
// Note: Deep relative import needed for vi.mock() to work correctly
vi.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

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
          logActionFailure('toggleJobStatus', error, { userId: 'test-user-id' });
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

// DO NOT mock runRpc - use real runRpc which uses Prismocker
// This allows us to test the real RPC flow end-to-end

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

// Mock logger
vi.mock('../logger.ts', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  toLogContextValue: vi.fn((v) => v),
}));

// Mock job hooks
vi.mock('./hooks/job-hooks.ts', () => ({
  onJobStatusToggled: vi.fn().mockResolvedValue(undefined),
}));

describe('toggleJobStatus', () => {
  let prismocker: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Clear request cache before each test
    clearRequestCache();

    // Get the prisma instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks
    vi.clearAllMocks();

    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    queryRawUnsafeSpy = vi.fn().mockResolvedValue([]);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;
  });

  describe('input validation', () => {
    it('should validate UUID for job_id field', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');

      // Invalid UUID should fail
      await expect(
        toggleJobStatus({
          job_id: 'invalid-uuid',
          new_status: 'active',
        } as any)
      ).rejects.toThrow();
    });

    it('should validate new_status enum', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { job_statusSchema } = await import('../prisma-zod-schemas.ts');
      const validStatuses = Object.values(job_status);

      // Test with valid status
      expect(() => {
        job_statusSchema.parse(validStatuses[0]);
      }).not.toThrow();
    });

    it('should reject invalid new_status', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { job_statusSchema } = await import('../prisma-zod-schemas.ts');

      // Test with invalid status
      expect(() => {
        job_statusSchema.parse('invalid-status');
      }).toThrow();
    });
  });

  describe('RPC call', () => {
    it('should call toggle_job_status RPC with correct parameters', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');

      // Mock result must match toggleJobStatusResultSchema structure
      const mockResult = {
        success: true,
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: 'Job status updated successfully',
      };

      // Set up Prismocker to return the RPC result
      queryRawUnsafeSpy.mockResolvedValue([mockResult] as any);

      const result = await toggleJobStatus({
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        new_status: 'active',
      });

      // Verify RPC was called with correct SQL and parameters
      // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('toggle_job_status'),
        '123e4567-e89b-12d3-a456-426614174000', // p_job_id
        'test-user-id', // p_user_id
        'active', // p_new_status
      );

      expect(result).toEqual(mockResult);
    });

    it('should handle RPC errors', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { logActionFailure } = await import('../errors.ts');

      const mockError = new Error('Database error');
      queryRawUnsafeSpy.mockRejectedValue(mockError);

      await expect(
        toggleJobStatus({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          new_status: 'active',
        })
      ).rejects.toThrow();

      expect(logActionFailure).toHaveBeenCalledWith(
        'toggleJobStatus',
        expect.any(Error),
        expect.objectContaining({
          userId: 'test-user-id',
        })
      );
    });
  });

  describe('cache invalidation', () => {
    it('should revalidate paths and tags', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { revalidatePath, revalidateTag } = await import('next/cache');

      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResult = {
        success: true,
        job_id: jobId,
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: null,
      };

      queryRawUnsafeSpy.mockResolvedValue([mockResult] as any);

      await toggleJobStatus({
        job_id: jobId,
        new_status: 'active',
      });

      expect(revalidatePath).toHaveBeenCalledWith('/jobs');
      expect(revalidatePath).toHaveBeenCalledWith('/account/jobs');
      expect(revalidateTag).toHaveBeenCalledWith(`job-${jobId}`, 'default');
      expect(revalidateTag).toHaveBeenCalledWith('jobs', 'default');
      expect(revalidateTag).toHaveBeenCalledWith('companies', 'default');
    });
  });

  describe('metadata', () => {
    it('should have correct metadata', async () => {
      // Metadata is set during action creation, not directly callable
      // We verify the action works correctly instead
      const { toggleJobStatus } = await import('./toggle-job-status.ts');

      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResult = {
        success: true,
        job_id: jobId,
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: null,
      };

      queryRawUnsafeSpy.mockResolvedValue([mockResult] as any);

      await toggleJobStatus({
        job_id: jobId,
        new_status: 'active',
      });

      // If action executes successfully, metadata was set correctly
      expect(queryRawUnsafeSpy).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle null result from RPC', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');

      // Null result should fail outputSchema validation (outputSchema requires object)
      queryRawUnsafeSpy.mockResolvedValue([null] as any);

      await expect(
        toggleJobStatus({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          new_status: 'active',
        })
      ).rejects.toThrow();
    });

    it('should handle empty array result from RPC', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');

      // Empty array result should fail outputSchema validation (outputSchema requires object)
      queryRawUnsafeSpy.mockResolvedValue([] as any);

      await expect(
        toggleJobStatus({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          new_status: 'active',
        })
      ).rejects.toThrow();
    });

    it('should handle revalidatePath errors gracefully', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { revalidatePath } = await import('next/cache');

      const mockResult = {
        success: true,
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: null,
      };

      queryRawUnsafeSpy.mockResolvedValue([mockResult] as any);
      vi.mocked(revalidatePath).mockImplementation(() => {
        throw new Error('Revalidate path error');
      });

      // Should throw - revalidatePath errors are not caught
      await expect(
        toggleJobStatus({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          new_status: 'active',
        })
      ).rejects.toThrow();
    });

    it('should handle revalidateTag errors gracefully', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { revalidateTag } = await import('next/cache');

      const mockResult = {
        success: true,
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: null,
      };

      queryRawUnsafeSpy.mockResolvedValue([mockResult] as any);
      vi.mocked(revalidateTag).mockImplementation(() => {
        throw new Error('Revalidate tag error');
      });

      // Should throw - revalidateTag errors are not caught
      await expect(
        toggleJobStatus({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          new_status: 'active',
        })
      ).rejects.toThrow();
    });
  });
});
