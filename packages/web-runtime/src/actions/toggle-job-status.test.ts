import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { job_status } from '@prisma/client';
// Import SafeActionResult type from safemocker for proper typing in tests
import type { SafeActionResult } from '@jsonbored/safemocker';

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

// Mock logger (used by safe-action middleware and hooks)
jest.mock('../logger.ts', () => ({
  logger: {
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
const mockOnJobStatusToggled = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined);
jest.mock('./hooks/job-hooks.ts', () => ({
  onJobStatusToggled: (...args: any[]) => mockOnJobStatusToggled(...args),
}));

describe('toggleJobStatus', () => {
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

    // Reset hook mock
    mockOnJobStatusToggled.mockResolvedValue(undefined as void);

    // Note: safemocker automatically provides auth context:
    // - ctx.userId = 'test-user-id'
    // - ctx.userEmail = 'test@example.com'
    // - ctx.authToken = 'test-token'
    // No manual auth mocks needed!
  });

  describe('input validation', () => {
    it('should return fieldErrors for invalid UUID job_id', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');

      // Call with invalid UUID
      const result = await toggleJobStatus({
        job_id: 'invalid-uuid',
        new_status: 'active',
      } as any);

      // Verify SafeActionResult structure with fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();
      
      // Verify field errors for invalid UUID
      expect(safeResult.fieldErrors?.job_id).toBeDefined();
    });

    it('should return fieldErrors for invalid new_status enum', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');

      // Call with invalid status
      const result = await toggleJobStatus({
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        new_status: 'invalid-status' as any,
      });

      // Verify SafeActionResult structure with fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.fieldErrors?.new_status).toBeDefined();
    });

    it('should accept valid input', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');

      // Mock result must match toggleJobStatusReturnsSchema structure
      const mockResult = {
        success: true,
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: 'Job status updated successfully',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await toggleJobStatus({
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        new_status: 'active',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
    });
  });

  describe('RPC call', () => {
    it('should call toggle_job_status RPC with correct parameters', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');

      // Mock result must match toggleJobStatusReturnsSchema structure
      const mockResult = {
        success: true,
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: 'Job status updated successfully',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await toggleJobStatus({
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        new_status: 'active',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Verify RPC was called with correct SQL and parameters
      // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
      // Args object: { p_job_id, p_user_id, p_new_status }
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('toggle_job_status'),
        '123e4567-e89b-12d3-a456-426614174000', // p_job_id
        'test-user-id', // p_user_id (from ctx.userId in authedAction middleware)
        'active' // p_new_status
      );

      // Verify result data structure (wrapped in SafeActionResult.data)
      expect(safeResult.data?.success).toBe(true);
      expect(safeResult.data?.job_id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(safeResult.data?.old_status).toBe('draft');
      expect(safeResult.data?.new_status).toBe('active');
    });

    it('should return serverError when RPC fails', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');

      // Mock RPC to throw error
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const result = await toggleJobStatus({
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        new_status: 'active',
      });

      // Verify SafeActionResult structure with serverError
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
    });
  });

  describe('hooks', () => {
    it('should call onJobStatusToggled hook after successful RPC', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');

      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResult = {
        success: true,
        job_id: jobId,
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: null,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await toggleJobStatus({
        job_id: jobId,
        new_status: 'active',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify hook was called with correct parameters
      expect(mockOnJobStatusToggled).toHaveBeenCalledWith(
        expect.objectContaining({
          job_id: jobId,
          new_status: 'active',
        }),
        expect.objectContaining({
          userId: 'test-user-id',
          userEmail: 'test@example.com',
          authToken: 'test-token',
        }),
        expect.objectContaining({
          job_id: jobId,
          new_status: 'active',
        })
      );
    });

    it('should log hook errors but not fail the action', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');
      const { logger } = await import('../logger.ts');

      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResult = {
        success: true,
        job_id: jobId,
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: null,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      // Mock hook to throw error
      mockOnJobStatusToggled.mockRejectedValueOnce(new Error('Hook error') as never);

      const result = await toggleJobStatus({
        job_id: jobId,
        new_status: 'active',
      });

      // Verify SafeActionResult structure - action should still succeed
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify hook error was logged
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          hookName: 'onJobStatusToggled',
          actionName: 'toggleJobStatus',
          userId: 'test-user-id',
        }),
        'Post-action hook onJobStatusToggled failed'
      );
    });
  });

  describe('cache invalidation', () => {
    it('should revalidate paths and tags', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');

      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResult = {
        success: true,
        job_id: jobId,
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: null,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await toggleJobStatus({
        job_id: jobId,
        new_status: 'active',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify cache invalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/jobs');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/jobs');
      expect(mockRevalidateTag).toHaveBeenCalledWith(`job-${jobId}`, 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('jobs', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('companies', 'default');
    });
  });

  describe('authentication', () => {
    it('should inject auth context from safemocker', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');

      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResult = {
        success: true,
        job_id: jobId,
        old_status: 'draft' as const,
        new_status: 'active' as const,
        message: null,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await toggleJobStatus({
        job_id: jobId,
        new_status: 'active',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.validationErrors).toBeUndefined();

      // Verify auth context was injected (ctx.userId = 'test-user-id' from safemocker)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('toggle_job_status'),
        jobId,
        'test-user-id', // From safemocker's authedAction context (this is what gets passed to RPC)
        'active'
      );
    });
  });

  describe('output validation', () => {
    it('should return validationErrors for invalid RPC output', async () => {
      const { toggleJobStatus } = await import('./toggle-job-status.ts');

      // Mock result that doesn't match toggleJobStatusReturnsSchema
      // (missing required fields or wrong types)
      const invalidResult = {
        success: true,
        // Missing job_id, old_status, new_status, message
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([invalidResult]);

      const result = await toggleJobStatus({
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        new_status: 'active',
      });

      // Verify SafeActionResult structure with validationErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.validationErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
    });
  });
});
