import { describe, expect, it, vi, beforeEach } from 'vitest';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { workplace_type, job_plan, job_tier } from '@prisma/client';

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
// Pattern: authedAction.inputSchema().metadata().action()
vi.mock('./safe-action.ts', async () => {
  // Import mocked logActionFailure
  const { logActionFailure } = await import('../errors.ts');
  
  // Define all factory functions inside the mock factory to avoid hoisting issues
  const createActionHandler = (inputSchema: any) => {
    return vi.fn((handler: any) => {
      return async (input: unknown) => {
        try {
          const parsed = inputSchema ? inputSchema.parse(input) : input;
          const result = await handler({
            parsedInput: parsed,
            ctx: { userId: 'test-user-id', userEmail: 'test@example.com', authToken: 'test-token' },
          });
          return result;
        } catch (error) {
          // Simulate middleware error handling - logActionFailure is called by middleware
          logActionFailure('jobsCrud', error, { userId: 'test-user-id' });
          throw error;
        }
      };
    });
  };

  const createMetadataResult = (inputSchema: any) => ({
    action: createActionHandler(inputSchema),
  });

  const createInputSchemaResult = (inputSchema: any) => ({
    metadata: vi.fn((metadata: any) => createMetadataResult(inputSchema)),
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

// Mock job hooks
vi.mock('./hooks/job-hooks.ts', () => ({
  onJobCreated: vi.fn(),
}));

describe('jobs-crud', () => {
  let prismocker: PrismaClient;

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
    prismocker.$queryRawUnsafe = vi.fn().mockResolvedValue([]);
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

        // Mock result must match CreateJobWithPaymentReturns structure
        (prismocker.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue([{
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          company_id: '223e4567-e89b-12d3-a456-426614174001',
          payment_amount: null,
          requires_payment: null,
          tier: 'standard' as const,
          plan: 'one-time' as const,
        }]);

        // Use valid enum values from Prisma
        const validTier = Object.values(job_tier)[0] as string;
        const validPlan = Object.values(job_plan)[0] as string;
        const validWorkplace = Object.values(workplace_type)[0] as string | null | undefined;
        
        const result = await createJob({
          tier: validTier,
          plan: validPlan,
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
          workplace: validWorkplace,
          experience: 'intermediate',
          tags: ['react', 'typescript'],
          requirements: ['5 years experience'],
          benefits: ['health insurance'],
          contact_email: 'jobs@example.com',
          company_logo: 'https://example.com/logo.png',
        });

        expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
        expect(result).toBeDefined();
      });
    });

    describe('RPC call', () => {
      it('should call create_job_with_payment RPC with correct parameters', async () => {
        const { createJob } = await import('./jobs-crud.ts');

        const mockResult = {
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          company_id: 'company-123',
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue([mockResult]);

        await createJob({
          tier: 'standard',
          plan: 'one-time',
          title: 'Test Job',
          company: 'Test Company',
        });

        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM create_job_with_payment'),
          expect.objectContaining({
            p_user_id: 'test-user-id',
            p_tier: 'standard',
            p_plan: 'one-time',
            p_job_data: expect.objectContaining({
              title: 'Test Job',
              company: 'Test Company',
            }),
          })
        );
      });

      it('should handle RPC errors', async () => {
        const { createJob } = await import('./jobs-crud.ts');
        const { logActionFailure } = await import('../errors.ts');

        const mockError = new Error('Database error');
        (prismocker.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);

        await expect(
          createJob({
            tier: 'standard',
            plan: 'one-time',
          })
        ).rejects.toThrow();

        expect(logActionFailure).toHaveBeenCalled();
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { createJob } = await import('./jobs-crud.ts');
        const { revalidatePath, revalidateTag } = await import('next/cache');

        // Mock result must match CreateJobWithPaymentReturns structure
        (prismocker.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue([{
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          company_id: '223e4567-e89b-12d3-a456-426614174001',
          payment_amount: null,
          requires_payment: null,
          tier: 'standard' as const,
          plan: 'one-time' as const,
        }]);

        await createJob({
          tier: 'standard',
          plan: 'one-time',
        });

        expect(revalidatePath).toHaveBeenCalledWith('/jobs');
        expect(revalidatePath).toHaveBeenCalledWith('/account/jobs');
        expect(revalidateTag).toHaveBeenCalledWith('job-123e4567-e89b-12d3-a456-426614174000', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('company-223e4567-e89b-12d3-a456-426614174001', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('company-id-223e4567-e89b-12d3-a456-426614174001', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('jobs', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });

    describe('hooks', () => {
      it('should call onJobCreated hook', async () => {
        const { createJob } = await import('./jobs-crud.ts');
        const { onJobCreated } = await import('./hooks/job-hooks.ts');

        const mockResult = {
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          company_id: 'company-123',
          payment_amount: null,
          requires_payment: false,
          tier: 'standard' as const,
          plan: 'one-time' as const,
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue([mockResult]);
        // onJobCreated returns Promise<void>, so mock it to resolve
        vi.mocked(onJobCreated).mockResolvedValue(undefined as any);

        await createJob({
          tier: 'standard',
          plan: 'one-time',
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

        // Mock result must match UpdateJobResult structure
        (prismocker.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue([{
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          message: null,
        }]);

        await updateJob({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          updates: { title: 'Updated Title' },
        });

        expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
      });
    });

    describe('RPC call', () => {
      it('should call update_job RPC with correct parameters', async () => {
        const { updateJob } = await import('./jobs-crud.ts');

        // Mock result must match UpdateJobResult structure
        (prismocker.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue([{
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          message: null,
        }]);

        await updateJob({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          updates: { title: 'New Title' },
        });

        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM update_job'),
          expect.objectContaining({
            p_job_id: '123e4567-e89b-12d3-a456-426614174000',
            p_user_id: 'test-user-id',
            p_updates: { title: 'New Title' },
          })
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { updateJob } = await import('./jobs-crud.ts');
        const { revalidatePath, revalidateTag } = await import('next/cache');

        // Mock result must match UpdateJobResult structure
        (prismocker.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue([{
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          message: null,
        }]);

        await updateJob({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          updates: {},
        });

        expect(revalidatePath).toHaveBeenCalledWith('/account/jobs');
        expect(revalidatePath).toHaveBeenCalledWith('/account/jobs/123e4567-e89b-12d3-a456-426614174000/edit');
        expect(revalidatePath).toHaveBeenCalledWith('/jobs');
        // Tags: ['job-${job_id}', 'jobs', 'companies']
        expect(revalidateTag).toHaveBeenCalledWith('job-123e4567-e89b-12d3-a456-426614174000', 'default');
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

        // Mock result must match DeleteJobResult structure
        (prismocker.$queryRawUnsafe as ReturnType<typeof vi.fn>).mockResolvedValue([{
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          message: null,
        }]);

        await deleteJob({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
        });

        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM delete_job'),
          expect.objectContaining({
            p_job_id: '123e4567-e89b-12d3-a456-426614174000',
            p_user_id: 'test-user-id',
          })
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { deleteJob } = await import('./jobs-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');
        const { revalidatePath, revalidateTag } = await import('next/cache');

        // Mock result must match DeleteJobResult structure
        vi.mocked(runRpc).mockResolvedValue({
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          message: null,
        } as any);

        await deleteJob({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
        });

        expect(revalidatePath).toHaveBeenCalledWith('/jobs');
        expect(revalidatePath).toHaveBeenCalledWith('/account/jobs');
        // Tags: ['job-${job_id}', 'jobs', 'companies']
        expect(revalidateTag).toHaveBeenCalledWith('job-123e4567-e89b-12d3-a456-426614174000', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('jobs', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });
  });
});
