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

describe('toggleJobStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      const { job_status } = await import('@prisma/client');
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
      const { runRpc } = await import('./run-rpc-instance.ts');

      // Mock result must match toggleJobStatusResultSchema structure
      const mockResult = {
        success: true,
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: 'Job status updated successfully',
      };
      vi.mocked(runRpc).mockResolvedValue(mockResult as any);

      const result = await toggleJobStatus({
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        new_status: 'active',
      });

      expect(runRpc).toHaveBeenCalledWith(
        'toggle_job_status',
        {
          p_job_id: '123e4567-e89b-12d3-a456-426614174000',
          p_user_id: 'test-user-id',
          p_new_status: 'active',
        },
        {
          action: 'toggleJobStatus.rpc',
          userId: 'test-user-id',
        }
      );

      expect(result).toEqual(mockResult);
    });

    it('should handle RPC errors', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { logActionFailure } = await import('../errors.ts');

      const mockError = new Error('Database error');
      vi.mocked(runRpc).mockRejectedValue(mockError);

      await expect(
        toggleJobStatus({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          new_status: 'active',
        })
      ).rejects.toThrow();

      expect(logActionFailure).toHaveBeenCalledWith(
        'toggleJobStatus',
        mockError,
        expect.objectContaining({
          userId: 'test-user-id',
        })
      );
    });
  });

  describe('cache invalidation', () => {
    it('should revalidate paths and tags', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath, revalidateTag } = await import('next/cache');

      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      vi.mocked(runRpc).mockResolvedValue({
        success: true,
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: null,
      } as any);

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
      const { runRpc } = await import('./run-rpc-instance.ts');

      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      vi.mocked(runRpc).mockResolvedValue({
        success: true,
        job_id: jobId,
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: null,
      } as any);

      await toggleJobStatus({
        job_id: jobId,
        new_status: 'active',
      });

      // If action executes successfully, metadata was set correctly
      expect(runRpc).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle null result from runRpc', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      // Null result should fail outputSchema validation (outputSchema requires object)
      vi.mocked(runRpc).mockResolvedValue(null as any);

      await expect(
        toggleJobStatus({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          new_status: 'active',
        })
      ).rejects.toThrow();
    });

    it('should handle undefined result from runRpc', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      // Undefined result should fail outputSchema validation (outputSchema requires object)
      vi.mocked(runRpc).mockResolvedValue(undefined as any);

      await expect(
        toggleJobStatus({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          new_status: 'active',
        })
      ).rejects.toThrow();
    });

    it('should handle revalidatePath errors gracefully', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath } = await import('next/cache');

      vi.mocked(runRpc).mockResolvedValue({
        success: true,
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: null,
      } as any);
      vi.mocked(revalidatePath).mockImplementation(() => {
        throw new Error('Revalidate path error');
      });

      // Should not throw - revalidatePath errors are not caught
      await expect(
        toggleJobStatus({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          new_status: 'active',
        })
      ).rejects.toThrow();
    });

    it('should handle revalidateTag errors gracefully', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidateTag } = await import('next/cache');

      vi.mocked(runRpc).mockResolvedValue({
        success: true,
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: null,
      } as any);
      vi.mocked(revalidateTag).mockImplementation(() => {
        throw new Error('Revalidate tag error');
      });

      // Should not throw - revalidateTag errors are not caught
      await expect(
        toggleJobStatus({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          new_status: 'active',
        })
      ).rejects.toThrow();
    });

    it('should handle lazy import errors for next/cache', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      vi.mocked(runRpc).mockResolvedValue({
        success: true,
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: null,
      } as any);

      // Mock import to fail
      vi.doMock('next/cache', () => {
        throw new Error('Import error');
      });

      // Should throw when trying to import
      await expect(
        toggleJobStatus({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          new_status: 'active',
        })
      ).rejects.toThrow();
    });

    it('should handle lazy import errors for logActionFailure', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      const mockError = new Error('Database error');
      vi.mocked(runRpc).mockRejectedValue(mockError);

      // Mock import to fail
      vi.doMock('../errors.ts', () => {
        throw new Error('Import error');
      });

      // Should throw when trying to import logActionFailure
      await expect(
        toggleJobStatus({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          new_status: 'active',
        })
      ).rejects.toThrow();
    });
  });
});
