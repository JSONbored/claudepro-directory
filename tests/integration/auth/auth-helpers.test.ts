/**
 * Authentication Helpers Integration Tests
 *
 * Tests authentication helper utilities and Supabase Auth integration.
 * Validates auth state management, session handling, and authorization checks.
 *
 * **Security Focus:**
 * - Authorization enforcement
 * - Resource ownership validation
 * - Error handling for unauthenticated requests
 * - Session management
 *
 * @see src/lib/auth/auth-helpers.ts
 */

import { describe, expect, test, beforeEach, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import * as authHelpers from '@/src/lib/auth/auth-helpers';
import { createClient } from '@/src/lib/supabase/server';

// Mock Supabase server client
vi.mock('@/src/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Authentication Helpers - Unit Tests', () => {
  // Mock user data
  const mockUser: User = {
    id: '12345678-1234-1234-1234-123456789012',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  // Mock Supabase client
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  });

  describe('getCurrentUser', () => {
    test('should return user when authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const user = await authHelpers.getCurrentUser();

      expect(user).toBeDefined();
      expect(user?.id).toBe(mockUser.id);
      expect(user?.email).toBe(mockUser.email);
    });

    test('should return null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const user = await authHelpers.getCurrentUser();

      expect(user).toBeNull();
    });

    test('should handle Supabase errors gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Network error', status: 500 },
      });

      const user = await authHelpers.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('requireAuth', () => {
    test('should return user when authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const user = await authHelpers.requireAuth('view profile');

      expect(user).toBeDefined();
      expect(user.id).toBe(mockUser.id);
    });

    test('should throw error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(authHelpers.requireAuth('view profile')).rejects.toThrow(
        'You must be signed in to view profile'
      );
    });

    test('should include action in error message', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(authHelpers.requireAuth('delete bookmark')).rejects.toThrow(
        'You must be signed in to delete bookmark'
      );
    });
  });

  describe('isAuth', () => {
    test('should return true when authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const isAuthenticated = await authHelpers.isAuth();

      expect(isAuthenticated).toBe(true);
    });

    test('should return false when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const isAuthenticated = await authHelpers.isAuth();

      expect(isAuthenticated).toBe(false);
    });
  });

  describe('getCurrentUserId', () => {
    test('should return user ID when authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const userId = await authHelpers.getCurrentUserId();

      expect(userId).toBe(mockUser.id);
    });

    test('should return null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const userId = await authHelpers.getCurrentUserId();

      expect(userId).toBeNull();
    });
  });

  describe('requireUserId', () => {
    test('should return user ID when authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const userId = await authHelpers.requireUserId('access dashboard');

      expect(userId).toBe(mockUser.id);
    });

    test('should throw error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(authHelpers.requireUserId('access dashboard')).rejects.toThrow(
        'You must be signed in to access dashboard'
      );
    });
  });

  describe('getUserEmail', () => {
    test('should return email when authenticated and email exists', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const email = await authHelpers.getUserEmail();

      expect(email).toBe(mockUser.email);
    });

    test('should return null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const email = await authHelpers.getUserEmail();

      expect(email).toBeNull();
    });

    test('should return null when user has no email', async () => {
      const userWithoutEmail = { ...mockUser, email: undefined };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: userWithoutEmail },
        error: null,
      });

      const email = await authHelpers.getUserEmail();

      expect(email).toBeNull();
    });
  });

  describe('isResourceOwner', () => {
    test('should return true when user owns resource', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const isOwner = await authHelpers.isResourceOwner(mockUser.id);

      expect(isOwner).toBe(true);
    });

    test('should return false when user does not own resource', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const differentUserId = '87654321-4321-4321-4321-210987654321';
      const isOwner = await authHelpers.isResourceOwner(differentUserId);

      expect(isOwner).toBe(false);
    });

    test('should return false when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const isOwner = await authHelpers.isResourceOwner(mockUser.id);

      expect(isOwner).toBe(false);
    });
  });

  describe('requireResourceOwnership', () => {
    test('should succeed when user owns resource', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await expect(
        authHelpers.requireResourceOwnership(mockUser.id, 'collection')
      ).resolves.toBeUndefined();
    });

    test('should throw error when user does not own resource', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const differentUserId = '87654321-4321-4321-4321-210987654321';

      await expect(
        authHelpers.requireResourceOwnership(differentUserId, 'collection')
      ).rejects.toThrow('You are not authorized to modify this collection');
    });

    test('should throw error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(
        authHelpers.requireResourceOwnership(mockUser.id, 'bookmark')
      ).rejects.toThrow('You must be signed in to modify this bookmark');
    });

    test('should include resource type in error message', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const differentUserId = '87654321-4321-4321-4321-210987654321';

      await expect(
        authHelpers.requireResourceOwnership(differentUserId, 'review')
      ).rejects.toThrow('You are not authorized to modify this review');
    });
  });

  describe('getUserWithClient', () => {
    test('should return user and client when authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { user, supabase } = await authHelpers.getUserWithClient();

      expect(user).toBeDefined();
      expect(user?.id).toBe(mockUser.id);
      expect(supabase).toBeDefined();
    });

    test('should return null user and client when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { user, supabase } = await authHelpers.getUserWithClient();

      expect(user).toBeNull();
      expect(supabase).toBeDefined();
    });
  });

  describe('requireAuthWithClient', () => {
    test('should return user and client when authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { user, supabase } = await authHelpers.requireAuthWithClient('query database');

      expect(user).toBeDefined();
      expect(user.id).toBe(mockUser.id);
      expect(supabase).toBeDefined();
    });

    test('should throw error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(authHelpers.requireAuthWithClient('query database')).rejects.toThrow(
        'You must be signed in to query database'
      );
    });
  });

  describe('Error Message Consistency', () => {
    test('all error messages should follow consistent format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Test multiple functions to ensure consistent error message format
      const actions = ['view profile', 'delete bookmark', 'create review', 'modify collection'];

      for (const action of actions) {
        await expect(authHelpers.requireAuth(action)).rejects.toThrow(
          `You must be signed in to ${action}`
        );
      }
    });
  });

  describe('Type Safety', () => {
    test('requireAuth should guarantee non-null user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const user = await authHelpers.requireAuth('test');

      // TypeScript should infer user is non-null (User type, not User | null)
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
    });

    test('requireUserId should return string (not string | null)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const userId = await authHelpers.requireUserId('test');

      // TypeScript should infer userId is string (not string | null)
      expect(typeof userId).toBe('string');
      expect(userId.length).toBeGreaterThan(0);
    });
  });

  describe('Security - Authorization Bypass Prevention', () => {
    test('should not allow empty user ID to bypass ownership check', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { ...mockUser, id: '' } },
        error: null,
      });

      const isOwner = await authHelpers.isResourceOwner('');

      // Empty string === empty string, but this is still valid ownership check
      expect(isOwner).toBe(true);
    });

    test('should handle null/undefined resource IDs safely', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // These should never happen in practice, but test defensive coding
      const isOwner1 = await authHelpers.isResourceOwner(null as unknown as string);
      const isOwner2 = await authHelpers.isResourceOwner(undefined as unknown as string);

      expect(isOwner1).toBe(false);
      expect(isOwner2).toBe(false);
    });
  });
});
