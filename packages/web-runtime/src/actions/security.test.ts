import { describe, expect, it, jest, beforeEach } from '@jest/globals';
// Import SafeActionResult type from safemocker for proper typing in tests
import type { SafeActionResult } from '@jsonbored/safemocker';

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

// Mock logger (used by safe-action middleware and actions)
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

// Mock environment (used by safe-action error handling)
jest.mock('@heyclaude/shared-runtime/schemas/env', () => {
  const envMock: Record<string, string | undefined> = {
    NODE_ENV: 'test',
    POSTGRES_PRISMA_URL: undefined,
    DIRECT_URL: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
    VERCEL: undefined,
    VITEST: undefined,
  };

  return {
    env: new Proxy(envMock, {
      get: (target, prop: string) => {
        if (prop === 'isProduction') {
          return false;
        }
        return target[prop];
      },
    }),
    get isProduction() {
      return false;
    },
  };
});

// DO NOT mock safe-action.ts - use REAL middleware to test SafeActionResult structure
// This ensures we test the complete middleware chain: auth → rate limiting → logging → error handling
// security.ts uses authedAction which is automatically handled by safemocker

// Mock Supabase client (security actions need Supabase Auth)
// Supabase auth methods return promises that resolve to { data, error } objects
const mockSignInWithPassword = jest.fn();
const mockUpdateUser = jest.fn();
const mockGetSession = jest.fn();
const mockSignOut = jest.fn();

const mockSupabase = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
    updateUser: mockUpdateUser,
    getSession: mockGetSession,
    signOut: mockSignOut,
  },
};

// Set default implementations (can be overridden in tests)
mockGetSession.mockResolvedValue({
  data: { session: null },
  error: null,
});

jest.mock('../supabase/server.ts', () => ({
  createSupabaseServerClient: jest.fn().mockResolvedValue(mockSupabase),
}));

// Mock next/cache
const mockRevalidatePath = jest.fn();
jest.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
}));

describe('changePassword', () => {
  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Clear all mocks (but don't reset implementations - tests will override)
    jest.clearAllMocks();

    // 3. Reset mock call history
    mockSignInWithPassword.mockClear();
    mockUpdateUser.mockClear();
    mockRevalidatePath.mockClear();
  });

  describe('input validation', () => {
    it('should validate password requirements', async () => {
      const { changePassword } = await import('./security.ts');

      // Password too short should fail validation
      const result = await changePassword({
        currentPassword: 'oldpass123',
        newPassword: 'short', // Too short
        confirmPassword: 'short',
      });

      // Verify SafeActionResult structure - should have fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();
    });

    it('should validate password confirmation match', async () => {
      const { changePassword } = await import('./security.ts');

      // Passwords don't match should fail validation
      const result = await changePassword({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'differentpass123', // Doesn't match
      });

      // Verify SafeActionResult structure - should have fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.fieldErrors?.confirmPassword).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();
    });

    it('should validate required fields', async () => {
      const { changePassword } = await import('./security.ts');

      // Missing required fields should fail validation
      const result = await changePassword({
        // Missing required fields
      } as any);

      // Verify SafeActionResult structure - should have fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();
    });
  });

  describe('password change flow', () => {
    it('should successfully change password when current password is correct', async () => {
      const { changePassword } = await import('./security.ts');

      // Mock successful sign-in (current password verification)
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'test-user-id' }, session: { access_token: 'token' } },
        error: null,
      });

      // Mock successful password update
      mockUpdateUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });

      const result = await changePassword({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<{ success: boolean }>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.data?.success).toBe(true);
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Verify Supabase calls
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com', // From safemocker auth context (ctx.userEmail)
        password: 'oldpass123',
      });
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'newpass123',
      });

      // Verify cache invalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/settings/security');
    });

    it('should return serverError when current password is incorrect', async () => {
      const { changePassword } = await import('./security.ts');

      // Mock failed sign-in (incorrect current password)
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 },
      });

      const result = await changePassword({
        currentPassword: 'wrongpassword',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });

      // Verify SafeActionResult structure - should have serverError
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.serverError).toContain('Current password is incorrect');
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Verify sign-in was called but update was not
      expect(mockSignInWithPassword).toHaveBeenCalled();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should return serverError when password update fails', async () => {
      const { changePassword } = await import('./security.ts');

      // Mock successful sign-in (current password verification)
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'test-user-id' }, session: { access_token: 'token' } },
        error: null,
      });

      // Mock failed password update
      mockUpdateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password update failed', status: 500 },
      });

      const result = await changePassword({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });

      // Verify SafeActionResult structure - should have serverError
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Verify both calls were made
      expect(mockSignInWithPassword).toHaveBeenCalled();
      expect(mockUpdateUser).toHaveBeenCalled();
    });
  });

  describe('cache invalidation', () => {
    it('should revalidate security settings path after successful password change', async () => {
      const { changePassword } = await import('./security.ts');

      // Mock successful password change
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'test-user-id' }, session: { access_token: 'token' } },
        error: null,
      });
      mockUpdateUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });

      const result = await changePassword({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<{ success: boolean }>;
      expect(safeResult.data).toBeDefined();

      // Verify cache invalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/settings/security');
    });
  });
});

describe('signOutSession', () => {
  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Clear all mocks (but don't reset implementations - tests will override)
    jest.clearAllMocks();

    // 3. Reset mock call history
    mockGetSession.mockClear();
    mockSignOut.mockClear();
    mockRevalidatePath.mockClear();

    // Reset default implementation
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  describe('input validation', () => {
    it('should validate sessionId is a valid UUID', async () => {
      const { signOutSession } = await import('./security.ts');

      // Invalid UUID should fail validation
      const result = await signOutSession({
        sessionId: 'invalid-uuid',
      });

      // Verify SafeActionResult structure - should have fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();
    });

    it('should validate required fields', async () => {
      const { signOutSession } = await import('./security.ts');

      // Missing required fields should fail validation
      const result = await signOutSession({
        // Missing required fields
      } as any);

      // Verify SafeActionResult structure - should have fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();
    });
  });

  describe('session sign out flow', () => {
    it('should successfully sign out current session', async () => {
      const { signOutSession } = await import('./security.ts');

      const currentSessionId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock current session matches the sessionId being signed out
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            id: currentSessionId,
            access_token: 'token',
            user: { id: 'test-user-id' },
          },
        },
        error: null,
      });

      // Mock successful sign out
      mockSignOut.mockResolvedValue({
        error: null,
      });

      const result = await signOutSession({
        sessionId: currentSessionId,
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<{
        success: boolean;
        signedOutCurrent: boolean;
      }>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.data?.success).toBe(true);
      expect(safeResult.data?.signedOutCurrent).toBe(true);
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Verify Supabase calls
      expect(mockGetSession).toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalled();

      // Verify cache invalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/settings/security');
    });

    it('should handle non-current session sign out (limitation noted)', async () => {
      const { signOutSession } = await import('./security.ts');

      const currentSessionId = '123e4567-e89b-12d3-a456-426614174000';
      const otherSessionId = '223e4567-e89b-12d3-a456-426614174000';

      // Mock current session does NOT match the sessionId being signed out
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            id: currentSessionId,
            access_token: 'token',
            user: { id: 'test-user-id' },
          },
        },
        error: null,
      });

      const result = await signOutSession({
        sessionId: otherSessionId,
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<{
        success: boolean;
        signedOutCurrent: boolean;
        note?: string;
      }>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.data?.success).toBe(true);
      expect(safeResult.data?.signedOutCurrent).toBe(false);
      expect(safeResult.data?.note).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Verify getSession was called but signOut was not (non-current session limitation)
      expect(mockGetSession).toHaveBeenCalled();
      expect(mockSignOut).not.toHaveBeenCalled();

      // Verify cache invalidation still happens
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/settings/security');
    });

    it('should return serverError when sign out fails', async () => {
      const { signOutSession } = await import('./security.ts');

      const currentSessionId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock current session matches
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            id: currentSessionId,
            access_token: 'token',
            user: { id: 'test-user-id' },
          },
        },
        error: null,
      });

      // Mock failed sign out
      mockSignOut.mockResolvedValue({
        error: { message: 'Sign out failed', status: 500 },
      });

      const result = await signOutSession({
        sessionId: currentSessionId,
      });

      // Verify SafeActionResult structure - should have serverError
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<unknown>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Verify both calls were made
      expect(mockGetSession).toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should handle case when no current session exists', async () => {
      const { signOutSession } = await import('./security.ts');

      const sessionId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock no current session (default from beforeEach)
      // mockGetSession already returns null session from beforeEach

      const result = await signOutSession({
        sessionId,
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<{
        success: boolean;
        signedOutCurrent: boolean;
        note?: string;
      }>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.data?.success).toBe(true);
      expect(safeResult.data?.signedOutCurrent).toBe(false);
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Verify getSession was called but signOut was not (no current session)
      expect(mockGetSession).toHaveBeenCalled();
      expect(mockSignOut).not.toHaveBeenCalled();
    });
  });

  describe('cache invalidation', () => {
    it('should revalidate security settings path after session sign out', async () => {
      const { signOutSession } = await import('./security.ts');

      const currentSessionId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock successful sign out
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            id: currentSessionId,
            access_token: 'token',
            user: { id: 'test-user-id' },
          },
        },
        error: null,
      });
      mockSignOut.mockResolvedValue({
        error: null,
      });

      const result = await signOutSession({
        sessionId: currentSessionId,
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<{
        success: boolean;
        signedOutCurrent: boolean;
      }>;
      expect(safeResult.data).toBeDefined();

      // Verify cache invalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/settings/security');
    });
  });
});
