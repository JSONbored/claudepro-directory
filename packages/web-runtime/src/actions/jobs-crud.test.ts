import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { workplace_type, job_plan, job_tier } from '@prisma/client';
// Import SafeActionResult type from safemocker for proper typing in tests
import type { SafeActionResult } from '@jsonbored/safemocker';
import type {
  CreateJobWithPaymentReturns,
  UpdateJobReturns,
  DeleteJobReturns,
} from '@heyclaude/database-types/postgres-types';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
import { clearRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility (if needed)
// Note: Deep relative import needed for jest.mock() to work correctly
jest.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// DO NOT mock next/headers - safemocker handles this automatically
// DO NOT mock Supabase client or auth - safemocker handles auth automatically
// safemocker's __mocks__/next-safe-action.ts provides pre-configured authedAction
// with auth context already injected (test-user-id, test@example.com, test-token)

// Mock logger (used by safe-action middleware)
jest.mock('../logger.ts', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
  toLogContextValue: (val: unknown) => val,
}));

// Mock errors (used by safe-action middleware) - keep real behavior for error normalization
jest.mock('../errors.ts', () => ({
  normalizeError: (error: unknown, fallback?: string) => {
    if (error instanceof Error) return error;
    return new Error(fallback || String(error));
  },
  logActionFailure: jest.fn((name, error, context) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
}));

// Mock environment (used by safe-action error handling and Prisma client)
jest.mock('@heyclaude/shared-runtime/schemas/env', () => {
  const envMock: Record<string, string | undefined> = {
    NODE_ENV: 'test',
    POSTGRES_PRISMA_URL: undefined, // Allow undefined in tests (Prismocker doesn't need it)
    DIRECT_URL: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
    VERCEL: undefined,
    VITEST: undefined,
  };

  return {
    env: new Proxy(envMock, {
      get: (target, prop: string) => {
        // Handle isProduction dynamically
        if (prop === 'isProduction') {
          return false; // Default to false for tests
        }
        return target[prop];
      },
    }),
    get isProduction() {
      return false; // Default to false for tests
    },
  };
});

// DO NOT mock safe-action.ts - use REAL middleware to test SafeActionResult structure
// This ensures we test the complete middleware chain: auth → rate limiting → logging → error handling

// DO NOT mock runRpc - use real runRpc which uses Prismocker
// This allows us to test the real RPC flow end-to-end

// Mock next/cache
const mockRevalidatePath = jest.fn();
const mockRevalidateTag = jest.fn();
jest.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
  revalidateTag: (...args: any[]) => mockRevalidateTag(...args),
}));

// Mock job hooks
jest.mock('./hooks/job-hooks.ts', () => ({
  onJobCreated: jest.fn(),
}));

describe('jobs-crud', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();

    // 5. Set up $queryRawUnsafe for RPC testing (if needed)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    // This is what runRpc → BasePrismaService.callRpc → prisma.$queryRawUnsafe calls
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);

    // Note: safemocker automatically provides auth context:
    // - ctx.userId = 'test-user-id'
    // - ctx.userEmail = 'test@example.com'
    // - ctx.authToken = 'test-token'
    // No manual auth mocks needed!
  });

  describe('createJob', () => {
    describe('input validation', () => {
      it('should return fieldErrors for missing required tier and plan fields', async () => {
        const { createJob } = await import('./jobs-crud.ts');

        // Call action - now returns SafeActionResult structure
        const result = await createJob({
          // tier and plan missing
        } as any);

        // Verify SafeActionResult structure
        const safeResult = result as SafeActionResult<CreateJobWithPaymentReturns>;
        expect(safeResult.data).toBeUndefined();
        expect(safeResult.serverError).toBeUndefined();
        expect(safeResult.fieldErrors).toBeDefined();
        // tier and plan are required, so fieldErrors should include them
        expect(safeResult.fieldErrors?.tier || safeResult.fieldErrors?.plan).toBeDefined();
      });

      it('should accept all optional fields', async () => {
        const { createJob } = await import('./jobs-crud.ts');

        // Mock result must match CreateJobWithPaymentReturns structure
        const mockResult: CreateJobWithPaymentReturns = {
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          company_id: '223e4567-e89b-12d3-a456-426614174001',
          payment_amount: null,
          requires_payment: null,
          tier: 'standard' as const,
          plan: 'one-time' as const,
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        // Use valid enum values from Prisma
        const validTier = Object.values(job_tier)[0] as string;
        const validPlan = Object.values(job_plan)[0] as string;
        const validWorkplace = Object.values(workplace_type)[0] as string | null | undefined;

        // Call action - now returns SafeActionResult structure
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

        // Verify SafeActionResult structure
        const safeResult = result as SafeActionResult<CreateJobWithPaymentReturns>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();
        expect(safeResult.fieldErrors).toBeUndefined();

        expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
        expect(safeResult.data).toMatchObject(mockResult);
      });
    });

    describe('RPC call', () => {
      it('should call create_job_with_payment RPC with correct parameters', async () => {
        const { createJob } = await import('./jobs-crud.ts');

        const mockResult: CreateJobWithPaymentReturns = {
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          company_id: 'company-123',
          payment_amount: null,
          requires_payment: null,
          tier: 'standard' as const,
          plan: 'one-time' as const,
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        // Call action - now returns SafeActionResult structure
        const result = await createJob({
          tier: 'standard',
          plan: 'one-time',
          title: 'Test Job',
          company: 'Test Company',
        });

        // Verify SafeActionResult structure
        const safeResult = result as SafeActionResult<CreateJobWithPaymentReturns>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();
        expect(safeResult.fieldErrors).toBeUndefined();

        // Verify RPC was called with correct SQL and parameters
        // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
        // Parameters are passed as individual arguments (not an object)
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('create_job_with_payment'),
          'test-user-id', // p_user_id (from safemocker's authedAction context)
          expect.objectContaining({
            title: 'Test Job',
            company: 'Test Company',
          }), // p_job_data
          'standard', // p_tier
          'one-time' // p_plan
        );
      });

      it('should return serverError when RPC throws error', async () => {
        const { createJob } = await import('./jobs-crud.ts');
        const { logActionFailure } = await import('../errors.ts');

        const mockError = new Error('Database error');
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(mockError);

        // Call action - now returns SafeActionResult structure
        const result = await createJob({
          tier: 'standard',
          plan: 'one-time',
        });

        // Verify SafeActionResult structure
        const safeResult = result as SafeActionResult<CreateJobWithPaymentReturns>;
        expect(safeResult.data).toBeUndefined();
        expect(safeResult.fieldErrors).toBeUndefined();
        expect(safeResult.serverError).toBeDefined();
        expect(safeResult.serverError).toContain('Database error');

        // The error propagates through the middleware, which calls logActionFailure
        expect(logActionFailure).toHaveBeenCalledWith(
          'createJob',
          expect.any(Error),
          expect.any(Object)
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { createJob } = await import('./jobs-crud.ts');

        // Mock result must match CreateJobWithPaymentReturns structure
        const mockResult: CreateJobWithPaymentReturns = {
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          company_id: '223e4567-e89b-12d3-a456-426614174001',
          payment_amount: null,
          requires_payment: null,
          tier: 'standard' as const,
          plan: 'one-time' as const,
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        // Call action - now returns SafeActionResult structure
        const result = await createJob({
          tier: 'standard',
          plan: 'one-time',
        });

        // Verify SafeActionResult structure
        const safeResult = result as SafeActionResult<CreateJobWithPaymentReturns>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();

        // Verify cache invalidation
        expect(mockRevalidatePath).toHaveBeenCalledWith('/jobs');
        expect(mockRevalidatePath).toHaveBeenCalledWith('/account/jobs');
        expect(mockRevalidateTag).toHaveBeenCalledWith('job-123e4567-e89b-12d3-a456-426614174000', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('company-223e4567-e89b-12d3-a456-426614174001', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('company-id-223e4567-e89b-12d3-a456-426614174001', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('jobs', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });

    describe('hooks', () => {
      it('should call onJobCreated hook', async () => {
        const { createJob } = await import('./jobs-crud.ts');
        const { onJobCreated } = await import('./hooks/job-hooks.ts');

        const mockResult: CreateJobWithPaymentReturns = {
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          company_id: 'company-123',
          payment_amount: null,
          requires_payment: false,
          tier: 'standard' as const,
          plan: 'one-time' as const,
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);
        // onJobCreated returns Promise<void>, so mock it to resolve
        // Type assertion needed because jest.Mock's mockResolvedValue is typed strictly
        jest.mocked(onJobCreated).mockResolvedValue(undefined as any);

        // Call action - now returns SafeActionResult structure
        const result = await createJob({
          tier: 'standard',
          plan: 'one-time',
        });

        // Verify SafeActionResult structure
        const safeResult = result as SafeActionResult<CreateJobWithPaymentReturns>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();

        expect(onJobCreated).toHaveBeenCalled();
      });
    });
  });

  describe('updateJob', () => {
    describe('input validation', () => {
      it('should return fieldErrors for missing job_id', async () => {
        const { updateJob } = await import('./jobs-crud.ts');

        // Call action - now returns SafeActionResult structure
        const result = await updateJob({
          // job_id missing
          updates: {},
        } as any);

        // Verify SafeActionResult structure
        const safeResult = result as SafeActionResult<UpdateJobReturns>;
        expect(safeResult.data).toBeUndefined();
        expect(safeResult.serverError).toBeUndefined();
        expect(safeResult.fieldErrors).toBeDefined();
        expect(safeResult.fieldErrors?.job_id).toBeDefined();
      });

      it('should accept updates object', async () => {
        const { updateJob } = await import('./jobs-crud.ts');

        // Mock result must match UpdateJobReturns structure
        const mockResult: UpdateJobReturns = {
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          message: null,
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        // Call action - now returns SafeActionResult structure
        const result = await updateJob({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          updates: { title: 'Updated Title' },
        });

        // Verify SafeActionResult structure
        const safeResult = result as SafeActionResult<UpdateJobReturns>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();
        expect(safeResult.fieldErrors).toBeUndefined();

        expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
        expect(safeResult.data).toMatchObject(mockResult);
      });
    });

    describe('RPC call', () => {
      it('should call update_job RPC with correct parameters', async () => {
        const { updateJob } = await import('./jobs-crud.ts');

        // Mock result must match UpdateJobReturns structure
        const mockResult: UpdateJobReturns = {
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          message: null,
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        // Call action - now returns SafeActionResult structure
        const result = await updateJob({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          updates: { title: 'New Title' },
        });

        // Verify SafeActionResult structure
        const safeResult = result as SafeActionResult<UpdateJobReturns>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();
        expect(safeResult.fieldErrors).toBeUndefined();

        // Verify RPC was called with correct SQL and parameters
        // Parameters are passed as individual arguments (not an object)
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('update_job'),
          '123e4567-e89b-12d3-a456-426614174000', // p_job_id
          'test-user-id', // p_user_id (from safemocker's authedAction context)
          { title: 'New Title' } // p_updates
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { updateJob } = await import('./jobs-crud.ts');

        // Mock result must match UpdateJobReturns structure
        const mockResult: UpdateJobReturns = {
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          message: null,
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        // Call action - now returns SafeActionResult structure
        const result = await updateJob({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          updates: {},
        });

        // Verify SafeActionResult structure
        const safeResult = result as SafeActionResult<UpdateJobReturns>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();

        // Verify cache invalidation
        expect(mockRevalidatePath).toHaveBeenCalledWith('/account/jobs');
        expect(mockRevalidatePath).toHaveBeenCalledWith('/account/jobs/123e4567-e89b-12d3-a456-426614174000/edit');
        expect(mockRevalidatePath).toHaveBeenCalledWith('/jobs');
        // Tags: ['job-${job_id}', 'jobs', 'companies']
        expect(mockRevalidateTag).toHaveBeenCalledWith('job-123e4567-e89b-12d3-a456-426614174000', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('jobs', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });
  });

  describe('deleteJob', () => {
    describe('input validation', () => {
      it('should return fieldErrors for missing job_id', async () => {
        const { deleteJob } = await import('./jobs-crud.ts');

        // Call action - now returns SafeActionResult structure
        const result = await deleteJob({
          // job_id missing
        } as any);

        // Verify SafeActionResult structure
        const safeResult = result as SafeActionResult<DeleteJobReturns>;
        expect(safeResult.data).toBeUndefined();
        expect(safeResult.serverError).toBeUndefined();
        expect(safeResult.fieldErrors).toBeDefined();
        expect(safeResult.fieldErrors?.job_id).toBeDefined();
      });
    });

    describe('RPC call', () => {
      it('should call delete_job RPC with correct parameters', async () => {
        const { deleteJob } = await import('./jobs-crud.ts');

        // Mock result must match DeleteJobReturns structure
        const mockResult: DeleteJobReturns = {
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          message: null,
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        // Call action - now returns SafeActionResult structure
        const result = await deleteJob({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
        });

        // Verify SafeActionResult structure
        const safeResult = result as SafeActionResult<DeleteJobReturns>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();
        expect(safeResult.fieldErrors).toBeUndefined();

        // Verify RPC was called with correct SQL and parameters
        // Parameters are passed as individual arguments (not an object)
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('delete_job'),
          '123e4567-e89b-12d3-a456-426614174000', // p_job_id
          'test-user-id' // p_user_id (from safemocker's authedAction context)
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { deleteJob } = await import('./jobs-crud.ts');

        // Mock result must match DeleteJobReturns structure
        const mockResult: DeleteJobReturns = {
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          message: null,
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        // Call action - now returns SafeActionResult structure
        const result = await deleteJob({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
        });

        // Verify SafeActionResult structure
        const safeResult = result as SafeActionResult<DeleteJobReturns>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();

        // Verify cache invalidation
        expect(mockRevalidatePath).toHaveBeenCalledWith('/jobs');
        expect(mockRevalidatePath).toHaveBeenCalledWith('/account/jobs');
        // Tags: ['job-${job_id}', 'jobs', 'companies']
        expect(mockRevalidateTag).toHaveBeenCalledWith('job-123e4567-e89b-12d3-a456-426614174000', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('jobs', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });
  });
});
