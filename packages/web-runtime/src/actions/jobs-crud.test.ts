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

// Mock job hooks
vi.mock('./hooks/job-hooks.ts', () => ({
  onJobCreated: vi.fn(),
}));

describe('jobs-crud', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createJob', () => {
    describe('input validation', () => {
      it('should validate required tier and plan fields', async () => {
        const { createJob } = await import('./jobs-crud.ts');

        await expect(
          createJob({
            // tier and plan missing
          } as any)
        ).rejects.toThrow();
      });

      it('should accept all optional fields', async () => {
        const { createJob } = await import('./jobs-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');

        vi.mocked(runRpc).mockResolvedValue({
          job_id: 'job-123',
          company_id: 'company-123',
        } as any);

        const result = await createJob({
          tier: 'standard',
          plan: 'monthly',
          title: 'Test Job',
          description: 'Test description',
          company: 'Test Company',
          company_id: '123e4567-e89b-12d3-a456-426614174000',
          type: 'full-time',
          category: 'engineering',
          link: 'https://example.com/job',
          location: 'Remote',
          salary: '$100k',
          remote: true,
          workplace: 'remote',
          experience: 'mid',
          tags: ['react', 'typescript'],
          requirements: ['5 years experience'],
          benefits: ['health insurance'],
          contact_email: 'jobs@example.com',
          company_logo: 'https://example.com/logo.png',
        });

        expect(runRpc).toHaveBeenCalled();
        expect(result).toBeDefined();
      });
    });

    describe('RPC call', () => {
      it('should call create_job_with_payment RPC with correct parameters', async () => {
        const { createJob } = await import('./jobs-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');

        const mockResult = {
          job_id: 'job-123',
          company_id: 'company-123',
        };
        vi.mocked(runRpc).mockResolvedValue(mockResult as any);

        await createJob({
          tier: 'standard',
          plan: 'monthly',
          title: 'Test Job',
          company: 'Test Company',
        });

        expect(runRpc).toHaveBeenCalledWith(
          'create_job_with_payment',
          expect.objectContaining({
            p_user_id: 'test-user-id',
            p_tier: 'standard',
            p_plan: 'monthly',
            p_job_data: expect.objectContaining({
              title: 'Test Job',
              company: 'Test Company',
            }),
          }),
          expect.objectContaining({
            action: 'createJob.rpc',
            userId: 'test-user-id',
          })
        );
      });

      it('should handle RPC errors', async () => {
        const { createJob } = await import('./jobs-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');
        const { logActionFailure } = await import('../errors.ts');

        const mockError = new Error('Database error');
        vi.mocked(runRpc).mockRejectedValue(mockError);

        await expect(
          createJob({
            tier: 'standard',
            plan: 'monthly',
          })
        ).rejects.toThrow();

        expect(logActionFailure).toHaveBeenCalled();
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { createJob } = await import('./jobs-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');
        const { revalidatePath, revalidateTag } = await import('next/cache');

        vi.mocked(runRpc).mockResolvedValue({
          job_id: 'job-123',
          company_id: 'company-123',
        } as any);

        await createJob({
          tier: 'standard',
          plan: 'monthly',
        });

        expect(revalidatePath).toHaveBeenCalledWith('/jobs');
        expect(revalidatePath).toHaveBeenCalledWith('/account/jobs');
        expect(revalidateTag).toHaveBeenCalledWith('job-job-123', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('company-company-123', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('company-id-company-123', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('jobs', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });

    describe('hooks', () => {
      it('should call onJobCreated hook', async () => {
        const { createJob } = await import('./jobs-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');
        const { onJobCreated } = await import('./hooks/job-hooks.ts');

        const mockResult = {
          job_id: 'job-123',
          company_id: 'company-123',
        };
        vi.mocked(runRpc).mockResolvedValue(mockResult as any);
        vi.mocked(onJobCreated).mockResolvedValue(undefined);

        await createJob({
          tier: 'standard',
          plan: 'monthly',
        });

        expect(onJobCreated).toHaveBeenCalled();
      });
    });
  });

  describe('updateJob', () => {
    describe('input validation', () => {
      it('should require job_id', async () => {
        const { updateJob } = await import('./jobs-crud.ts');

        await expect(
          updateJob({
            // job_id missing
            updates: {},
          } as any)
        ).rejects.toThrow();
      });

      it('should accept updates object', async () => {
        const { updateJob } = await import('./jobs-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');

        vi.mocked(runRpc).mockResolvedValue({ success: true } as any);

        await updateJob({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          updates: { title: 'Updated Title' },
        });

        expect(runRpc).toHaveBeenCalled();
      });
    });

    describe('RPC call', () => {
      it('should call update_job RPC with correct parameters', async () => {
        const { updateJob } = await import('./jobs-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');

        vi.mocked(runRpc).mockResolvedValue({ success: true } as any);

        await updateJob({
          job_id: 'job-123',
          updates: { title: 'New Title' },
        });

        expect(runRpc).toHaveBeenCalledWith(
          'update_job',
          {
            p_job_id: 'job-123',
            p_user_id: 'test-user-id',
            p_updates: { title: 'New Title' },
          },
          expect.objectContaining({
            action: 'updateJob.rpc',
            userId: 'test-user-id',
          })
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { updateJob } = await import('./jobs-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');
        const { revalidatePath, revalidateTag } = await import('next/cache');

        vi.mocked(runRpc).mockResolvedValue({ success: true } as any);

        await updateJob({
          job_id: 'job-123',
          updates: {},
        });

        expect(revalidatePath).toHaveBeenCalledWith('/account/jobs');
        expect(revalidatePath).toHaveBeenCalledWith('/account/jobs/job-123/edit');
        expect(revalidatePath).toHaveBeenCalledWith('/jobs');
        expect(revalidateTag).toHaveBeenCalledWith('job-job-123', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('jobs', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });
  });

  describe('deleteJob', () => {
    describe('input validation', () => {
      it('should require job_id', async () => {
        const { deleteJob } = await import('./jobs-crud.ts');

        await expect(
          deleteJob({
            // job_id missing
          } as any)
        ).rejects.toThrow();
      });
    });

    describe('RPC call', () => {
      it('should call delete_job RPC with correct parameters', async () => {
        const { deleteJob } = await import('./jobs-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');

        vi.mocked(runRpc).mockResolvedValue({ success: true } as any);

        await deleteJob({
          job_id: 'job-123',
        });

        expect(runRpc).toHaveBeenCalledWith(
          'delete_job',
          {
            p_job_id: 'job-123',
            p_user_id: 'test-user-id',
          },
          expect.objectContaining({
            action: 'deleteJob.rpc',
            userId: 'test-user-id',
          })
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { deleteJob } = await import('./jobs-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');
        const { revalidatePath, revalidateTag } = await import('next/cache');

        vi.mocked(runRpc).mockResolvedValue({ success: true } as any);

        await deleteJob({
          job_id: 'job-123',
        });

        expect(revalidatePath).toHaveBeenCalledWith('/jobs');
        expect(revalidatePath).toHaveBeenCalledWith('/account/jobs');
        expect(revalidateTag).toHaveBeenCalledWith('job-job-123', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('jobs', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });
  });
});
