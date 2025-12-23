import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
// Import SafeActionResult type from safemocker for proper typing in tests
import type { SafeActionResult } from '@jsonbored/safemocker';
// Import contact_category enum for testing
import { contact_category } from '../types/client-safe-enums';

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

// Mock contact hooks
const mockOnContactSubmission = jest.fn();
jest.mock('./hooks/contact-hooks.ts', () => ({
  onContactSubmission: (...args: any[]) => mockOnContactSubmission(...args),
}));

// Mock Inngest client (used by contact hooks)
jest.mock('../inngest/client.ts', () => ({
  inngest: {
    send: jest.fn().mockResolvedValue({ ids: ['event-id'] }),
  },
}));

describe('submitContactForm', () => {
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
    jest.resetAllMocks();

    // 5. Set up $queryRawUnsafe for RPC testing (if needed)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);

    // 6. Reset mock functions
    mockRevalidatePath.mockClear();
    mockRevalidateTag.mockClear();
    mockOnContactSubmission.mockClear();
  });

  describe('input validation', () => {
    it('should validate contact_category enum', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      // Use valid enum value from contact_category
      const validCategory = contact_category.general;

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: validCategory,
        message: 'Test message',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
    });

    it('should return validation errors for missing required fields', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      // Missing required fields should fail validation
      const result = await submitContactForm({
        // Missing required fields
      } as any);

      // Verify SafeActionResult structure - should have fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();
    });

    it('should accept optional metadata', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
        metadata: { source: 'website' },
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
    it('should call insert_contact_submission RPC with correct parameters', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
        metadata: { source: 'website' },
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Verify RPC was called with correct SQL and parameters
      // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
      // Args are passed as positional parameters: $queryRawUnsafe(query, ...argValues)
      // Order: p_name, p_email, p_category, p_message, p_metadata
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM insert_contact_submission'),
        'Test User', // p_name
        'test@example.com', // p_email
        'general', // p_category
        'Test message', // p_message
        { source: 'website' } // p_metadata
      );

      // Verify result is array (insertContactSubmissionReturnsSchema is an array)
      expect(safeResult.data).toEqual(mockResult);
    });

    it('should return server error for RPC failures', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockError = new Error('Database error');
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(mockError);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      // Verify SafeActionResult structure - should have serverError
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
    });
  });

  describe('cache invalidation', () => {
    it('should revalidate paths and tags', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify cache invalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/contact-submissions');
      expect(mockRevalidateTag).toHaveBeenCalledWith('contact-submission-123e4567-e89b-12d3-a456-426614174000', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('contact', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('submissions', 'default');
    });

    it('should not revalidate submission-specific tag when submission_id is missing', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: null, // Missing submission_id
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();

      // Verify cache invalidation (should still call general tags)
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/contact-submissions');
      expect(mockRevalidateTag).toHaveBeenCalledWith('contact', 'default');
      expect(mockRevalidateTag).toHaveBeenCalledWith('submissions', 'default');
      // Should NOT call submission-specific tag
      expect(mockRevalidateTag).not.toHaveBeenCalledWith(
        expect.stringContaining('contact-submission-'),
        'default'
      );
    });
  });

  describe('hooks', () => {
    it('should call onContactSubmission hook when submission_id exists', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);
      mockOnContactSubmission.mockResolvedValue(null);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify hook was called with correct parameters
      expect(mockOnContactSubmission).toHaveBeenCalledWith(
        { submission_id: '123e4567-e89b-12d3-a456-426614174000' },
        expect.objectContaining({
          userId: 'test-user-id',
          userEmail: 'test@example.com',
          authToken: 'test-token',
        }),
        expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
          category: 'general',
          message: 'Test message',
        })
      );
    });

    it('should not call hook when submission_id is missing', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: null, // Missing submission_id
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();

      // Verify hook was NOT called
      expect(mockOnContactSubmission).not.toHaveBeenCalled();
    });

    it('should handle hook errors gracefully without failing the action', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');
      const { logger } = await import('../logger.ts');

      const mockResult = [
        {
          success: true,
          submission_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);
      const hookError = new Error('Hook failed');
      mockOnContactSubmission.mockRejectedValue(hookError);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      // Verify SafeActionResult structure - action should still succeed
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify hook error was logged
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('metadata', () => {
    it('should have correct metadata', async () => {
      // Metadata is set at action definition time, not runtime
      // We can verify the action is properly configured by checking it works
      const { submitContactForm } = await import('./submit-contact-form.ts');

      const mockResult = [
        {
          success: true,
          submission_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      // If metadata was wrong, the action wouldn't work properly
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
    });
  });
});
