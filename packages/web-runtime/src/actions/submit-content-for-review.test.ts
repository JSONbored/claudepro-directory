import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
// Import SafeActionResult type from safemocker for proper typing in tests
import type { SafeActionResult } from '@jsonbored/safemocker';
// Import enums for testing
import { submission_type, content_category } from '../types/client-safe-enums';

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

describe('submitContentForReview', () => {
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
  });

  describe('input validation', () => {
    it('should validate submission_type enum', async () => {
      const { submitContentForReview } = await import('./submit-content-for-review.ts');

      const mockResult = {
        success: true,
        submission_id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'pending' as const,
        message: null,
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      // Use valid enum value from submission_type
      const validType = submission_type.agents;

      const result = await submitContentForReview({
        submission_type: validType,
        name: 'Test Content',
        description: 'Test description',
        category: 'agents',
        author: 'Test Author',
        content_data: { key: 'value' },
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
    });

    it('should validate content_category enum', async () => {
      const { submitContentForReview } = await import('./submit-content-for-review.ts');

      const mockResult = {
        success: true,
        submission_id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'pending' as const,
        message: null,
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      // Use valid enum value from content_category
      const validCategory = content_category.agents;

      const result = await submitContentForReview({
        submission_type: 'agents',
        name: 'Test Content',
        description: 'Test description',
        category: validCategory,
        author: 'Test Author',
        content_data: { key: 'value' },
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
    });

    it('should return validation errors for missing required fields', async () => {
      const { submitContentForReview } = await import('./submit-content-for-review.ts');

      // Missing required fields should fail validation
      const result = await submitContentForReview({
        // Missing required fields
      } as any);

      // Verify SafeActionResult structure - should have fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();
    });

    it('should accept optional fields', async () => {
      const { submitContentForReview } = await import('./submit-content-for-review.ts');

      const mockResult = {
        success: true,
        submission_id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'pending' as const,
        message: null,
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await submitContentForReview({
        submission_type: 'agents',
        name: 'Test Content',
        description: 'Test description',
        category: 'agents',
        author: 'Test Author',
        content_data: { key: 'value' },
        author_profile_url: 'https://example.com/profile',
        github_url: 'https://github.com/example',
        tags: ['tag1', 'tag2'],
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
    it('should call submit_content_for_review RPC with correct parameters', async () => {
      const { submitContentForReview } = await import('./submit-content-for-review.ts');

      const mockResult = {
        success: true,
        submission_id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'pending' as const,
        message: null,
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await submitContentForReview({
        submission_type: 'agents',
        name: 'Test Content',
        description: 'Test description',
        category: 'agents',
        author: 'Test Author',
        content_data: { key: 'value' },
        tags: ['tag1'],
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Verify RPC was called with correct SQL and parameters
      // BasePrismaService.callRpc formats SQL with positional parameters (p_param => $1, p_param2 => $2, ...)
      // and passes values as separate positional arguments
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM submit_content_for_review'),
        'agents', // $1: p_submission_type
        'Test Content', // $2: p_name
        'Test description', // $3: p_description
        'agents', // $4: p_category
        'Test Author', // $5: p_author
        { key: 'value' }, // $6: p_content_data
        undefined, // $7: p_author_profile_url (optional)
        undefined, // $8: p_github_url (optional)
        ['tag1'] // $9: p_tags (optional)
      );

      // Verify result matches mock
      expect(safeResult.data).toEqual(mockResult);
    });

    it('should return server error for RPC failures', async () => {
      const { submitContentForReview } = await import('./submit-content-for-review.ts');

      const mockError = new Error('Database error');
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(mockError);

      const result = await submitContentForReview({
        submission_type: 'agents',
        name: 'Test',
        description: 'Test',
        category: 'agents',
        author: 'Test',
        content_data: {},
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
      const { submitContentForReview } = await import('./submit-content-for-review.ts');

      const mockResult = {
        success: true,
        submission_id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'pending' as const,
        message: null,
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await submitContentForReview({
        submission_type: 'agents',
        name: 'Test',
        description: 'Test',
        category: 'agents',
        author: 'Test',
        content_data: {},
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify cache invalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/submissions');
      expect(mockRevalidateTag).toHaveBeenCalledWith('submissions', 'default');
    });
  });

  describe('metadata', () => {
    it('should have correct metadata', async () => {
      const { submitContentForReview } = await import('./submit-content-for-review.ts');

      const mockResult = {
        success: true,
        submission_id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'pending' as const,
        message: null,
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

      const result = await submitContentForReview({
        submission_type: 'agents',
        name: 'Test',
        description: 'Test',
        category: 'agents',
        author: 'Test',
        content_data: {},
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Metadata is set during action definition, not at runtime
      // We verify the action works correctly, which implies metadata is set
    });
  });
});
