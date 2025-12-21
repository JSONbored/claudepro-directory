import { describe, expect, it, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { headers } from 'next/headers';
import { authedAction, optionalAuthAction, rateLimitedAction, actionClient } from './safe-action';

// Mock Next.js headers
const mockHeadersGet = vi.fn();
vi.mock('next/headers', () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: mockHeadersGet,
    })
  ),
}));

// Mock Supabase client and auth
const mockGetAuthenticatedUserFromClient = vi.fn();
const mockCreateSupabaseServerClient = vi.fn();
const mockGetSession = vi.fn();

vi.mock('../supabase/server.ts', () => ({
  createSupabaseServerClient: () => mockCreateSupabaseServerClient(),
}));

vi.mock('../auth/get-authenticated-user.ts', () => ({
  getAuthenticatedUserFromClient: mockGetAuthenticatedUserFromClient,
}));

// Mock logger - must define functions inline to avoid hoisting issues
vi.mock('../logger.ts', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  toLogContextValue: (val: unknown) => val,
}));

// Mock errors
vi.mock('../errors.ts', () => ({
  normalizeError: (error: unknown, fallback?: string) => {
    if (error instanceof Error) return error;
    return new Error(fallback || String(error));
  },
  logActionFailure: vi.fn((name, error) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
}));

// Mock environment - use a getter to allow dynamic changes
let mockIsProduction = false;
vi.mock('@heyclaude/shared-runtime/schemas/env', () => ({
  get isProduction() {
    return mockIsProduction;
  },
}));

describe('safe-action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateSupabaseServerClient.mockReturnValue({
      auth: {
        getSession: mockGetSession,
      },
    });
  });

  describe('actionClient', () => {
    it('should handle server errors and return default message in production', async () => {
      mockIsProduction = true;
      mockHeadersGet.mockReturnValue('test-user-agent');

      const testAction = actionClient
        .metadata({ actionName: 'testAction', category: 'user' })
        .schema(z.object({}))
        .action(async () => {
          throw new Error('Test error');
        });

      const result = await testAction({});

      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('Something went wrong');
      const { logger } = await import('../logger.ts');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return detailed error message in development', async () => {
      mockIsProduction = false;
      mockHeadersGet.mockReturnValue('test-user-agent');

      const testAction = actionClient
        .metadata({ actionName: 'testAction', category: 'user' })
        .schema(z.object({}))
        .action(async () => {
          throw new Error('Test error message');
        });

      const result = await testAction({});

      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('Test error message');
    });
  });

  describe('rateLimitedAction', () => {
    it('should pass through valid metadata', async () => {
      mockHeadersGet.mockReturnValue('test-user-agent');

      const testAction = rateLimitedAction
        .metadata({ actionName: 'testAction', category: 'user' })
        .schema(z.object({}))
        .action(async () => {
          return { success: true };
        });

      const result = await testAction({});

      expect(result?.data).toEqual({ success: true });
    });

    it('should throw error for invalid metadata', async () => {
      mockHeadersGet.mockReturnValue('test-user-agent');

      const testAction = rateLimitedAction
        .metadata({ actionName: '' } as any) // Invalid: empty actionName
        .schema(z.object({}))
        .action(async () => {
          return { success: true };
        });

      const result = await testAction({});
      expect(result?.serverError).toBeDefined();
      // next-safe-action returns a different error message for invalid metadata
      expect(result?.serverError).toMatch(/Invalid metadata|Invalid action configuration/);
      const { logger } = await import('../logger.ts');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('authedAction', () => {
    it('should pass through authenticated user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockGetAuthenticatedUserFromClient.mockResolvedValue({
        user: mockUser,
        isAuthenticated: true,
      });

      mockGetSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'token-123',
          },
        },
      });

      mockHeadersGet.mockReturnValue('test-user-agent');

      const testAction = authedAction
        .metadata({ actionName: 'testAction', category: 'user' })
        .schema(z.object({}))
        .action(async ({ ctx }) => {
          expect(ctx.userId).toBe('user-123');
          expect(ctx.userEmail).toBe('test@example.com');
          expect(ctx.authToken).toBe('token-123');
          return { success: true };
        });

      const result = await testAction({});

      expect(result?.data).toEqual({ success: true });
      expect(mockGetAuthenticatedUserFromClient).toHaveBeenCalledWith(
        expect.anything(),
        { context: 'testAction' }
      );
    });

    it('should throw error for unauthenticated user', async () => {
      mockGetAuthenticatedUserFromClient.mockResolvedValue({
        user: null,
        isAuthenticated: false,
        error: new Error('No valid session'),
      });

      mockHeadersGet.mockImplementation((key: string) => {
        if (key === 'cf-connecting-ip') return '1.2.3.4';
        if (key === 'referer') return 'https://example.com/page';
        return null;
      });

      const testAction = authedAction
        .metadata({ actionName: 'testAction', category: 'user' })
        .schema(z.object({}))
        .action(async () => {
          return { success: true };
        });

      const result = await testAction({});
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('Unauthorized. Please sign in to continue.');
    });

    it('should log security event for auth failure', async () => {
      mockGetAuthenticatedUserFromClient.mockResolvedValue({
        user: null,
        isAuthenticated: false,
        error: new Error('No valid session'),
      });

      mockHeadersGet.mockImplementation((key: string) => {
        if (key === 'cf-connecting-ip') return '1.2.3.4';
        if (key === 'referer') return 'https://example.com/page';
        return null;
      });

      const testAction = authedAction
        .metadata({ actionName: 'testAction', category: 'user' })
        .schema(z.object({}))
        .action(async () => {
          return { success: true };
        });

      const result = await testAction({});
      expect(result?.serverError).toBeDefined();

      const { logger } = await import('../logger.ts');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          securityEvent: true,
          clientIP: '1.2.3.4',
          path: 'https://example.com/page',
          actionName: 'testAction',
          reason: 'No valid session',
          errorCode: 'Error',
        }),
        'Auth failure - Unauthorized action attempt'
      );
    });

    it('should handle missing email gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: null,
      };

      mockGetAuthenticatedUserFromClient.mockResolvedValue({
        user: mockUser,
        isAuthenticated: true,
      });

      mockGetSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'token-123',
          },
        },
      });

      mockHeadersGet.mockReturnValue('test-user-agent');

      const testAction = authedAction
        .metadata({ actionName: 'testAction', category: 'user' })
        .schema(z.object({}))
        .action(async ({ ctx }) => {
          expect(ctx.userId).toBe('user-123');
          expect(ctx.userEmail).toBeUndefined();
          expect(ctx.authToken).toBe('token-123');
          return { success: true };
        });

      const result = await testAction({});

      expect(result?.data).toEqual({ success: true });
    });

    it('should handle missing auth token gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockGetAuthenticatedUserFromClient.mockResolvedValue({
        user: mockUser,
        isAuthenticated: true,
      });

      mockGetSession.mockResolvedValue({
        data: {
          session: null,
        },
      });

      mockHeadersGet.mockReturnValue('test-user-agent');

      const testAction = authedAction
        .metadata({ actionName: 'testAction', category: 'user' })
        .schema(z.object({}))
        .action(async ({ ctx }) => {
          expect(ctx.userId).toBe('user-123');
          expect(ctx.userEmail).toBe('test@example.com');
          expect(ctx.authToken).toBeUndefined();
          return { success: true };
        });

      const result = await testAction({});

      expect(result?.data).toEqual({ success: true });
    });
  });

  describe('optionalAuthAction', () => {
    it('should pass through authenticated user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockGetAuthenticatedUserFromClient.mockResolvedValue({
        user: mockUser,
        isAuthenticated: true,
      });

      mockGetSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'token-123',
          },
        },
      });

      mockHeadersGet.mockReturnValue('test-user-agent');

      const testAction = optionalAuthAction
        .metadata({ actionName: 'testAction', category: 'user' })
        .schema(z.object({}))
        .action(async ({ ctx }) => {
          expect(ctx.user).toBeDefined();
          expect(ctx.user?.id).toBe('user-123');
          expect(ctx.userId).toBe('user-123');
          expect(ctx.userEmail).toBe('test@example.com');
          expect(ctx.authToken).toBe('token-123');
          return { success: true };
        });

      const result = await testAction({});

      expect(result?.data).toEqual({ success: true });
    });

    it('should allow unauthenticated user', async () => {
      mockGetAuthenticatedUserFromClient.mockResolvedValue({
        user: null,
        isAuthenticated: false,
      });

      mockGetSession.mockResolvedValue({
        data: {
          session: null,
        },
      });

      mockHeadersGet.mockReturnValue('test-user-agent');

      const testAction = optionalAuthAction
        .metadata({ actionName: 'testAction', category: 'user' })
        .schema(z.object({}))
        .action(async ({ ctx }) => {
          expect(ctx.user).toBeNull();
          expect(ctx.userId).toBeUndefined();
          expect(ctx.userEmail).toBeUndefined();
          expect(ctx.authToken).toBeUndefined();
          return { success: true };
        });

      const result = await testAction({});

      expect(result?.data).toEqual({ success: true });
    });

    it('should handle partial user data', async () => {
      const mockUser = {
        id: 'user-123',
        email: null,
      };

      mockGetAuthenticatedUserFromClient.mockResolvedValue({
        user: mockUser,
        isAuthenticated: true,
      });

      mockGetSession.mockResolvedValue({
        data: {
          session: null,
        },
      });

      mockHeadersGet.mockReturnValue('test-user-agent');

      const testAction = optionalAuthAction
        .metadata({ actionName: 'testAction', category: 'user' })
        .schema(z.object({}))
        .action(async ({ ctx }) => {
          expect(ctx.user).toBeDefined();
          expect(ctx.userId).toBe('user-123');
          expect(ctx.userEmail).toBeUndefined();
          expect(ctx.authToken).toBeUndefined();
          return { success: true };
        });

      const result = await testAction({});

      expect(result?.data).toEqual({ success: true });
    });
  });
});

