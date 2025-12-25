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

// DO NOT mock job hooks - use REAL implementation
// onJobCreated and onJobUpdated call Inngest (real client)
// Using real hooks tests: action → hook → Inngest (real client) → Inngest function execution
// This provides true integration testing where Inngest functions are actually executed

// Mock Polar integration (needed for onJobCreated hook)
jest.mock('../integrations/polar.ts', () => {
  const mockCreatePolarCheckout = jest.fn().mockResolvedValue({
    url: 'https://polar.sh/checkout/session-123',
    sessionId: 'session-123',
  });
  const mockGetPolarProductPriceId = jest.fn().mockReturnValue('price-123');
  return {
    createPolarCheckout: mockCreatePolarCheckout,
    getPolarProductPriceId: mockGetPolarProductPriceId,
    __mockCreatePolarCheckout: mockCreatePolarCheckout,
    __mockGetPolarProductPriceId: mockGetPolarProductPriceId,
  };
});

// Mock Resend integration (needed for Inngest function execution)
jest.mock('../integrations/resend', () => {
  const mockSendEmail = jest.fn();
  return {
    sendEmail: mockSendEmail,
    __mockSendEmail: mockSendEmail,
  };
});

// Mock email template rendering (needed for Inngest function execution)
jest.mock('../email/base-template', () => {
  const mockRenderEmailTemplate = jest.fn().mockResolvedValue('<html>Mock Email</html>');
  return {
    renderEmailTemplate: mockRenderEmailTemplate,
    __mockRenderEmailTemplate: mockRenderEmailTemplate,
  };
});

// Mock logging/server (needed for Inngest function execution and action middleware)
jest.mock('../logging/server', () => {
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => ({
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    })),
  };
  const mockCreateWebAppContextWithId = jest.fn(() => ({
    requestId: 'test-request-id',
    operation: 'sendJobLifecycleEmail',
    route: '/inngest/email/job-lifecycle',
  }));
  return {
    logger: mockLogger,
    createWebAppContextWithId: mockCreateWebAppContextWithId,
    __mockLogger: mockLogger,
    __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
  };
});

// Mock shared-runtime (needed for Inngest function execution)
jest.mock('@heyclaude/shared-runtime', () => {
  const mockNormalizeError = jest.fn((error: unknown, fallbackMessage?: string) => {
    if (error instanceof Error) return error;
    return new Error(fallbackMessage || String(error || 'Unknown error'));
  });
  const mockEscapeHtml = jest.fn((str: string) => str);
  return {
    normalizeError: mockNormalizeError,
    escapeHtml: mockEscapeHtml,
    __mockNormalizeError: mockNormalizeError,
    __mockEscapeHtml: mockEscapeHtml,
  };
});

// DO NOT mock service factory - use REAL service factory which returns real services that use Prismocker
// This allows us to test: action → hook → real service factory → real JobsService → Prismocker
// This provides true integration testing where the full service layer is tested

// Mock monitoring (needed for Inngest function execution)
jest.mock('../inngest/utils/monitoring', () => ({
  sendCronSuccessHeartbeat: jest.fn(),
  sendCriticalFailureHeartbeat: jest.fn(),
  sendBetterStackHeartbeat: jest.fn(),
  sendApiEndpointHeartbeat: jest.fn(),
  isBetterStackMonitoringEnabled: jest.fn(() => false),
  isInngestMonitoringEnabled: jest.fn(() => false),
  isCriticalFailureMonitoringEnabled: jest.fn(() => false),
  isCronSuccessMonitoringEnabled: jest.fn(() => false),
  isApiEndpointMonitoringEnabled: jest.fn(() => false),
}));

// DO NOT mock Inngest client - use REAL client with integration spy
// Import test helpers to intercept inngest.send() and actually execute Inngest functions
import {
  createInngestIntegrationSpy,
  registerInngestFunction,
  expectInngestEvent,
  clearInngestFunctionRegistry,
} from '../inngest/utils/test-helpers';
import { sendJobLifecycleEmail } from '../inngest/functions/email/job-lifecycle';
import { jobPostingDripCampaign } from '../inngest/functions/email/drip-campaigns';
// Import setup functions from Inngest test utilities (eliminates duplication)
import {
  setupJobLifecycleEmailMocks,
  setupJobPostingDripCampaignMocks,
} from '../inngest/utils/test-setup';

describe('jobs-crud', () => {
  let prismocker: PrismaClient;
  let inngestSendSpy: ReturnType<typeof jest.spyOn>;
  // Mocks for Inngest function execution (set up via setup functions in beforeEach)
  let jobLifecycleMocks: ReturnType<typeof setupJobLifecycleEmailMocks>;
  let jobPostingMocks: ReturnType<typeof setupJobPostingDripCampaignMocks>;
  // Polar mocks
  const { __mockCreatePolarCheckout: mockCreatePolarCheckout } = jest.requireMock(
    '../integrations/polar.ts'
  ) as {
    __mockCreatePolarCheckout: ReturnType<typeof jest.fn>;
  };

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
    jest.resetAllMocks();

    // 5. Set up $queryRawUnsafe for RPC testing (if needed)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    // This is what runRpc → BasePrismaService.callRpc → prisma.$queryRawUnsafe calls
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);

    // 6. Set up Inngest function mocks using shared setup functions (eliminates duplication)
    jobLifecycleMocks = setupJobLifecycleEmailMocks(
      'sendJobLifecycleEmail',
      '/inngest/email/job-lifecycle'
    );
    jobPostingMocks = setupJobPostingDripCampaignMocks(
      'jobPostingDripCampaign',
      '/inngest/email/drip-campaigns/job-posting'
    );

    // 7. Reset Polar mocks
    mockCreatePolarCheckout.mockReset();
    mockCreatePolarCheckout.mockResolvedValue({
      url: 'https://polar.sh/checkout/session-123',
      sessionId: 'session-123',
    });

    // 8. Register Inngest functions for integration testing
    // When hooks send events, these functions will actually execute
    registerInngestFunction('email/job-lifecycle', sendJobLifecycleEmail);
    registerInngestFunction('job/published', jobPostingDripCampaign);

    // 9. Create integration spy that intercepts inngest.send() and executes functions
    const { inngest } = await import('../inngest/client.ts');
    inngestSendSpy = createInngestIntegrationSpy(inngest);

    // 10. Reset cache mocks
    mockRevalidatePath.mockClear();
    mockRevalidateTag.mockClear();

    // Note: safemocker automatically provides auth context:
    // - ctx.userId = 'test-user-id'
    // - ctx.userEmail = 'test@example.com'
    // - ctx.authToken = 'test-token'
    // No manual auth mocks needed!
  });

  /**
   * Cleanup after each test to prevent hanging and open handles
   */
  afterEach(async () => {
    // Clear all timers (prevents setTimeout/setInterval from keeping tests alive)
    jest.clearAllTimers();

    // Ensure all pending promises are resolved
    await new Promise((resolve) => setImmediate(resolve));

    // Clear the Inngest function registry to prevent function persistence between tests
    clearInngestFunctionRegistry();

    // Clear the integration spy to prevent event history from persisting
    if (inngestSendSpy) {
      inngestSendSpy.mockClear();
    }
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
        // Error message is normalized by middleware, so it may not contain exact error text

        // The error propagates through the middleware, which calls logActionFailure
        // First call is for the RPC error ('createJob.rpc'), second call is for the action error ('createJob')
        // The second call has undefined error (error was already logged in first call)
        // Verify it was called with 'createJob' (the action name) - check the second call
        expect(logActionFailure).toHaveBeenCalledTimes(2);
        expect(logActionFailure).toHaveBeenNthCalledWith(
          2, // Second call
          'createJob',
          undefined, // Error is undefined in second call (already logged in first call)
          expect.objectContaining({
            input: expect.any(Object),
            userId: expect.any(String),
          })
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
        expect(mockRevalidateTag).toHaveBeenCalledWith(
          'job-123e4567-e89b-12d3-a456-426614174000',
          'default'
        );
        expect(mockRevalidateTag).toHaveBeenCalledWith(
          'company-223e4567-e89b-12d3-a456-426614174001',
          'default'
        );
        expect(mockRevalidateTag).toHaveBeenCalledWith(
          'company-id-223e4567-e89b-12d3-a456-426614174001',
          'default'
        );
        expect(mockRevalidateTag).toHaveBeenCalledWith('jobs', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });

    describe('hooks', () => {
      it('should call onJobCreated hook and send Inngest event', async () => {
        const { createJob } = await import('./jobs-crud.ts');

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

        // Wait a bit for async hook to complete (hook sends Inngest event asynchronously)
        await new Promise((resolve) => setTimeout(resolve, 100));

        // First verify that inngest.send() was called (hook sent the event)
        expect(inngestSendSpy).toHaveBeenCalled();

        // Verify Inngest event was sent via real hook implementation
        expectInngestEvent(inngestSendSpy, 'email/job-lifecycle', {
          action: 'job-submitted', // Must match JOB_EMAIL_CONFIGS keys in job-lifecycle.ts
          jobId: '123e4567-e89b-12d3-a456-426614174000',
          jobTitle: 'Test Job',
          company: 'Test Company',
          employerEmail: 'test@example.com',
          requiresPayment: false,
        });

        // Verify Inngest function actually executed (true integration!)
        // The function should have attempted to send email via the mocked sendEmail
        // Note: The function executes asynchronously via InngestTestEngine, so we check if it was called
        expect(jobLifecycleMocks.mockSendEmail).toHaveBeenCalled();
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
        expect(mockRevalidatePath).toHaveBeenCalledWith(
          '/account/jobs/123e4567-e89b-12d3-a456-426614174000/edit'
        );
        expect(mockRevalidatePath).toHaveBeenCalledWith('/jobs');
        // Tags: ['job-${job_id}', 'jobs', 'companies']
        expect(mockRevalidateTag).toHaveBeenCalledWith(
          'job-123e4567-e89b-12d3-a456-426614174000',
          'default'
        );
        expect(mockRevalidateTag).toHaveBeenCalledWith('jobs', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });

    describe('hooks', () => {
      it('should call onJobUpdated hook and send Inngest event when title is in updates', async () => {
        const { updateJob } = await import('./jobs-crud.ts');

        // Mock result must match UpdateJobReturns structure
        const mockResult: UpdateJobReturns = {
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          message: null,
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        // Seed Prismocker with job data for Inngest function (jobPostingDripCampaign)
        // The function uses getJobStatsById and getJobStatusById which query Prismocker
        if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
          (prismocker as any).setData('jobs', [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              title: 'Updated Title',
              status: 'active',
              view_count: 100,
              click_count: 10,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ]);
        }

        // Call action - now returns SafeActionResult structure
        // onJobUpdated hook only sends event when status === 'active' (job published after payment)
        // When title is in updates, hook uses it directly (doesn't call getJobTitleById)
        const result = await updateJob({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          updates: { status: 'active', title: 'Updated Title' },
        });

        // Verify SafeActionResult structure
        const safeResult = result as SafeActionResult<UpdateJobReturns>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();

        // Verify Inngest event was sent via real hook implementation
        // onJobUpdated sends 'job/published' event (handled by jobPostingDripCampaign)
        // Hook uses title from updates, so jobTitle should be 'Updated Title'
        expectInngestEvent(inngestSendSpy, 'job/published', {
          jobId: '123e4567-e89b-12d3-a456-426614174000',
          jobTitle: 'Updated Title',
        });

        // Verify Inngest function actually executed (true integration!)
        // The function should have attempted to send email via the mocked sendEmail
        expect(jobPostingMocks.mockSendEmail).toHaveBeenCalled();
      });

      it('should call onJobUpdated hook and fetch job title from database when title is missing', async () => {
        const { updateJob } = await import('./jobs-crud.ts');

        // Mock result must match UpdateJobReturns structure (no title in result)
        const mockResult: UpdateJobReturns = {
          success: true,
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          message: null,
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        // Seed Prismocker with job data so getJobTitleById can find it
        // onJobUpdated hook calls getService('jobs') → JobsService.getJobTitleById → Prismocker
        // This tests the full integration: action → hook → real service factory → real JobsService → Prismocker
        // Also seed data for Inngest function (jobPostingDripCampaign) which uses getJobStatsById and getJobStatusById
        if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
          (prismocker as any).setData('jobs', [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              title: 'Job Title From Database',
              status: 'active',
              view_count: 100,
              click_count: 10,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ]);
        }

        // Call action - now returns SafeActionResult structure
        // onJobUpdated hook only sends event when status === 'active' (job published after payment)
        // When title is missing from result and updates, hook calls getJobTitleById
        const result = await updateJob({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          updates: { status: 'active' }, // No title in updates
        });

        // Verify SafeActionResult structure
        const safeResult = result as SafeActionResult<UpdateJobReturns>;
        expect(safeResult.data).toBeDefined();
        expect(safeResult.serverError).toBeUndefined();

        // Verify Inngest event was sent via real hook implementation
        // onJobUpdated sends 'job/published' event (handled by jobPostingDripCampaign)
        // Hook calls getJobTitleById which queries Prismocker, so jobTitle should be from database
        expectInngestEvent(inngestSendSpy, 'job/published', {
          jobId: '123e4567-e89b-12d3-a456-426614174000',
          jobTitle: 'Job Title From Database',
        });

        // Verify Inngest function actually executed (true integration!)
        // The function should have attempted to send email via the mocked sendEmail
        expect(jobPostingMocks.mockSendEmail).toHaveBeenCalled();
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
        expect(mockRevalidateTag).toHaveBeenCalledWith(
          'job-123e4567-e89b-12d3-a456-426614174000',
          'default'
        );
        expect(mockRevalidateTag).toHaveBeenCalledWith('jobs', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });
  });
});
