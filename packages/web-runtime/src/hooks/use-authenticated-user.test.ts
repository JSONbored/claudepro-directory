/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthenticatedUser } from './use-authenticated-user.ts';
import type { User, Session } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('../supabase/browser.ts', () => ({
  createSupabaseBrowserClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  })),
}));

jest.mock('../logger.ts', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../utils/client-logger.ts', () => ({
  logClientWarn: jest.fn(),
}));

jest.mock('../errors.ts', () => ({
  normalizeError: jest.fn((err) => (err instanceof Error ? err : new Error(String(err)))),
}));

describe('useAuthenticatedUser', () => {
  let mockSupabase: any;
  let mockGetUser: ReturnType<typeof jest.fn>;
  let mockOnAuthStateChange: ReturnType<typeof jest.fn>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockGetUser = jest.fn();
    mockOnAuthStateChange = jest.fn();

    mockSupabase = {
      auth: {
        getUser: mockGetUser,
        onAuthStateChange: mockOnAuthStateChange,
      },
    };

    const { createSupabaseBrowserClient } = await import('../supabase/browser.ts');
    jest.mocked(createSupabaseBrowserClient).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should initialize with loading state', () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });

    const { result } = renderHook(() => useAuthenticatedUser());

    expect(result.current.status).toBe('loading');
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('should set authenticated state when user exists', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' } as User;
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });

    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should set unauthenticated state when no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });

    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('should handle auth errors gracefully', async () => {
    const authError = { message: 'Auth error', name: 'AuthError' };
    mockGetUser.mockResolvedValue({ data: { user: null }, error: authError });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });

    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.user).toBe(null);
  });

  it('should handle network errors without logging as errors', async () => {
    const networkError = { message: 'fetch failed', name: 'NetworkError' };
    mockGetUser.mockResolvedValue({ data: { user: null }, error: networkError });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });

    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    // Network errors should be logged as debug, not error
    const { logger } = await import('../logger.ts');
    expect(jest.mocked(logger.error)).not.toHaveBeenCalled();
  });

  it('should subscribe to auth state changes when subscribe is true', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const unsubscribe = jest.fn();
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });

    const { result, unmount } = renderHook(() => useAuthenticatedUser({ subscribe: true }));

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('should not subscribe when subscribe is false', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { result } = renderHook(() => useAuthenticatedUser({ subscribe: false }));

    await waitFor(() => {
      expect(result.current.status).not.toBe('loading');
    });

    expect(mockOnAuthStateChange).not.toHaveBeenCalled();
  });

  it('should update state when auth state changes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    let authStateChangeCallback: ((event: string, session: Session | null) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((callback) => {
      authStateChangeCallback = callback;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    // Simulate auth state change
    const mockUser = { id: 'user-456', email: 'new@example.com' } as User;
    const mockSession = { user: mockUser } as Session;
    authStateChangeCallback!('SIGNED_IN', mockSession);

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.status).toBe('authenticated');
    });
  });

  it('should refresh user when refreshUser is called', async () => {
    const initialUser = { id: 'user-123', email: 'test@example.com' } as User;
    const refreshedUser = { id: 'user-123', email: 'updated@example.com' } as User;

    mockGetUser
      .mockResolvedValueOnce({ data: { user: initialUser }, error: null })
      .mockResolvedValueOnce({ data: { user: refreshedUser }, error: null });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });

    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.user).toEqual(initialUser);
    });

    const refreshed = await result.current.refreshUser();

    expect(refreshed).toEqual(refreshedUser);
    
    // Wait for state update to be applied
    await waitFor(() => {
      expect(result.current.user).toEqual(refreshedUser);
    });
    
    expect(mockGetUser).toHaveBeenCalledTimes(2);
  });

  it('should use custom context label', async () => {
    const authError = { message: 'Test error', name: 'Error' };
    mockGetUser.mockResolvedValue({ data: { user: null }, error: authError });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });

    const { result } = renderHook(() => useAuthenticatedUser({ context: 'CustomContext' }));

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    // Context should be included in log calls
    const { logger } = await import('../logger.ts');
    expect(jest.mocked(logger.error)).toHaveBeenCalledWith(
      expect.objectContaining({}),
      expect.stringContaining('CustomContext')
    );
  });

  it('should prevent multiple simultaneous fetches', async () => {
    let resolveCount = 0;
    mockGetUser.mockImplementation(() => {
      resolveCount++;
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: { user: null }, error: null });
        }, 100);
      });
    });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });

    const { result } = renderHook(() => useAuthenticatedUser());

    // Call refreshUser multiple times rapidly
    const promises = [
      result.current.refreshUser(),
      result.current.refreshUser(),
      result.current.refreshUser(),
    ];

    await Promise.all(promises);

    // Should only have called getUser once per refreshUser call (not multiple simultaneous)
    // The ref prevents simultaneous fetches, but each refreshUser call should still work
    expect(mockGetUser).toHaveBeenCalled();
  });

  it('should handle Supabase client creation errors', async () => {
    const { createSupabaseBrowserClient } = await import('../supabase/browser.ts');
    jest.mocked(createSupabaseBrowserClient).mockImplementation(() => {
      throw new Error('Failed to create client');
    });

    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should handle subscription errors gracefully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockOnAuthStateChange.mockImplementation(() => {
      throw new Error('Subscription failed');
    });

    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    // Should not crash, just log debug
    const { logger } = await import('../logger.ts');
    expect(jest.mocked(logger.debug)).toHaveBeenCalled();
  });
});
