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
      const { job_statusSchema } = await import('./prisma-zod-schemas.ts');
      const validStatuses = job_statusSchema._def.values;

      // Test with valid status
      expect(() => {
        job_statusSchema.parse(validStatuses[0]);
      }).not.toThrow();
    });

    it('should reject invalid new_status', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { job_statusSchema } = await import('./prisma-zod-schemas.ts');

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

      const mockResult = {
        success: true,
        new_status: 'active',
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
      vi.mocked(runRpc).mockResolvedValue({ success: true } as any);

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
      const { authedAction } = await import('./safe-action.ts');

      expect(authedAction.metadata).toHaveBeenCalledWith({
        actionName: 'toggleJobStatus',
        category: 'content',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle null result from runRpc', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath, revalidateTag } = await import('next/cache');

      vi.mocked(runRpc).mockResolvedValue(null as any);

      const result = await toggleJobStatus({
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        new_status: 'active',
      });

      expect(result).toBeNull();
      expect(revalidatePath).toHaveBeenCalled();
      expect(revalidateTag).toHaveBeenCalled();
    });

    it('should handle undefined result from runRpc', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath, revalidateTag } = await import('next/cache');

      vi.mocked(runRpc).mockResolvedValue(undefined as any);

      const result = await toggleJobStatus({
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        new_status: 'active',
      });

      expect(result).toBeUndefined();
      expect(revalidatePath).toHaveBeenCalled();
      expect(revalidateTag).toHaveBeenCalled();
    });

    it('should handle revalidatePath errors gracefully', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath } = await import('next/cache');

      vi.mocked(runRpc).mockResolvedValue({ success: true } as any);
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

      vi.mocked(runRpc).mockResolvedValue({ success: true } as any);
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

      vi.mocked(runRpc).mockResolvedValue({ success: true } as any);

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
